import User from "../models/User.js";
import Otp from "../models/Otp.js";
import nodemailer from "nodemailer";
import mongoose from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { createAuditLogFromRequest } from "../utils/auditLogger.js";

export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password").lean();
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password").lean();
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createUser = async (req, res) => {
  const { email, fullName, password, role, avatar } = req.body;

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already exists" });
    }

    const user = new User({
      _id: new mongoose.Types.ObjectId(),
      email,
      fullName,
      password,
      role: role || "user",
      avatar: avatar || null,
      isActive: true,
    });

    const savedUser = await user.save();
    const userResponse = savedUser.toObject();
    delete userResponse.password;

    res.status(201).json({ success: true, user: userResponse });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const updateUser = async (req, res) => {
  try {
    const currentUserId = String(
      req.user?.userId || req.user?._id || req.user?.id || "",
    );
    const targetUserId = String(req.params.id);
    const isAdmin = req.user?.role === "admin";
    const isSelf = currentUserId === targetUserId;

    if (!isAdmin && !isSelf) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const { fullName, avatar, isActive, email } = req.body;

    const updateData = {};
    if (fullName !== undefined) updateData.fullName = fullName;
    if (avatar !== undefined) updateData.avatar = avatar;

    if (email !== undefined) {
      const existingUser = await User.findOne({
        email,
        _id: { $ne: req.params.id },
      });
      if (existingUser) {
        return res.status(409).json({ message: "Email already exists" });
      }
      updateData.email = email;
    }

    if (isAdmin && isActive !== undefined) {
      updateData.isActive = isActive;
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true },
    )
      .select("-password")
      .lean();

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    await createAuditLogFromRequest(req, {
      action: "update",
      entity: "user",
      entityId: updatedUser._id,
      details: `${req.user?.fullName || "User"} updated user ${updatedUser.fullName}`,
    });

    res.json(updatedUser);
  } catch (error) {
    console.error("Update user error:", error);
    res.status(400).json({ message: error.message });
  }
};



export const deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    await createAuditLogFromRequest(req, {
      action: "delete",
      entity: "user",
      entityId: user._id,
      details: `${req.user?.fullName || "User"} deleted user ${user.fullName}`,
    });

    res.json({ message: "User deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "Email không tồn tại" });
    }

    // Kiểm tra trạng thái trước khi kiểm tra mật khẩu
    if (!user.isActive) {
      return res.status(403).json({ message: "Tài khoản đã bị khóa" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Sai mật khẩu" });
    }

    const token = jwt.sign(
      { userId: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "24h" },
    );
    console.log("Login success, userId in token:", user._id.toString());

    const userResponse = user.toObject();
    delete userResponse.password;

    await createAuditLogFromRequest(req, {
      userId: user._id,
      action: "login",
      entity: "auth",
      entityId: user._id,
      details: `${user.fullName} logged in`,
    });

    res.json({ success: true, user: userResponse, token });
  } catch (error) {
    res.status(500).json({ message: "Không kết nối được với server" });
  }
};

export const registerUser = async (req, res) => {
  try {
    const { email, fullName, password } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      if (existingUser.isActive) {
        return res.status(400).json({ message: "Email already exists" });
      } else {
        // User exists but not active, resend OTP
        const existingOtp = await Otp.findOne({ email });
        if (existingOtp && existingOtp.resendAfter > Date.now()) {
          return res.status(429).json({
            message: "Please wait 30 seconds before requesting another OTP",
          });
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        await Otp.deleteMany({ email });
        await Otp.create({
          email,
          otp,
          attempts: 0,
          resendAfter: new Date(Date.now() + 30 * 1000),
          expiresAt: new Date(Date.now() + 5 * 60 * 1000),
        });

        // Update user expiresAt
        await User.updateOne(
          { email },
          { expiresAt: new Date(Date.now() + 15 * 60 * 1000) }
        );

        const transporter = nodemailer.createTransport({
          service: "gmail",
          auth: { user: process.env.EMAIL, pass: process.env.EMAIL_PASS },
        });

        await transporter.sendMail({
          from: process.env.EMAIL,
          to: email,
          subject: "OTP Verification",
          text: `Your OTP code is: ${otp}`,
        });

        return res.json({ success: true, message: "OTP resent to email" });
      }
    }

    const existingOtp = await Otp.findOne({ email });
    if (existingOtp && existingOtp.resendAfter > Date.now()) {
      return res.status(429).json({
        message: "Please wait 30 seconds before requesting another OTP",
      });
    }

    // Hash password
    // const hashedPassword = await bcrypt.hash(password, 10); // Removed, model handles hashing

    // Create user with isActive = false and expiresAt = 15 minutes
    const user = new User({
      _id: new mongoose.Types.ObjectId(),
      email,
      fullName,
      password, // Model will hash it
      role: "user",
      avatar: null,
      isActive: false,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
    });

    await user.save();

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    await Otp.deleteMany({ email });
    await Otp.create({
      email,
      otp,
      attempts: 0,
      resendAfter: new Date(Date.now() + 30 * 1000),
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
    });

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user: process.env.EMAIL, pass: process.env.EMAIL_PASS },
    });

    await transporter.sendMail({
      from: process.env.EMAIL,
      to: email,
      subject: "OTP Verification",
      text: `Your OTP code is: ${otp}`,
    });

    res.json({ success: true, message: "OTP sent to email" });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};


export const verifyOtp = async (req, res) => {
  try {

    const { email, otp } = req.body;

    const record = await Otp.findOne({ email });

    if (!record) {
      return res.status(400).json({
        message: "OTP expired or not found"
      });
    }

    if (record.attempts >= 5) {
      await Otp.deleteOne({ email });

      return res.status(403).json({
        message: "Too many incorrect attempts"
      });
    }

    if (record.otp !== otp) {

      record.attempts += 1;
      await record.save();

      return res.status(400).json({
        message: `Incorrect OTP (${record.attempts}/5)`
      });
    }

    // OTP đúng → kích hoạt user
    await User.updateOne(
      { email },
      { isActive: true, expiresAt: null }
    );

    // Get the activated user
    const activatedUser = await User.findOne({ email }).select("-password");


    await Otp.deleteOne({ email });

    res.json({
      success: true,
      message: "Email verified successfully",
      user: activatedUser,
    });

  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const resendOtp = async (req, res) => {
  try {

    const { email } = req.body;

    const record = await Otp.findOne({ email });

    if (!record) {
      return res.status(404).json({
        message: "OTP not found. Please register again."
      });
    }

    if (record.resendAfter > Date.now()) {
      return res.status(429).json({
        message: "Please wait 30 seconds before requesting another OTP"
      });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    await Otp.deleteMany({ email });

    await Otp.create({
      email,
      otp,
      attempts: 0,
      resendAfter: new Date(Date.now() + 30 * 1000),
      expiresAt: new Date(Date.now() + 5 * 60 * 1000)
    });

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL,
        pass: process.env.EMAIL_PASS
      }
    });

    await transporter.sendMail({
      from: process.env.EMAIL,
      to: email,
      subject: "Resend OTP Verification",
      text: `Your new OTP code is: ${otp}`
    });

    res.json({
      success: true,
      message: "OTP resent successfully"
    });

  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};


export const searchUsers = async (req, res) => {
  try {
    const { email, fullName } = req.query;
    let query = {};

    if (email) {
      query = { email: { $regex: email, $options: "i" } };
    } else if (fullName) {
      query = { fullName: { $regex: fullName, $options: "i" } };
    }

    const users = await User.find(query).select("-password").limit(10).lean();
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const changePassword = async (req, res) => {
  try {
    console.log("req.user:", req.user); // log toàn bộ user từ middleware
    console.log("req.user.id:", req.user?.id);
    console.log("req.params.id:", req.params.id);

    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Current password incorrect" });
    }

    // Chỉ gán plain password, middleware sẽ tự hash
    user.password = newPassword;
    await user.save();

    await createAuditLogFromRequest(req, {
      action: "update",
      entity: "user",
      entityId: user._id,
      details: `${req.user?.fullName || "User"} changed password`,
    });

    res.json({ message: "Password updated successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Admin reset mật khẩu cho user
export const resetPassword = async (req, res) => {
  try {
    const { newPassword } = req.body;
    const user = await User.findById(req.params.id);

    if (!user) return res.status(404).json({ message: "User not found" });

    user.password = newPassword; // middleware sẽ tự hash
    await user.save();

    await createAuditLogFromRequest(req, {
      action: "update",
      entity: "user",
      entityId: user._id,
      details: `${req.user?.fullName || "Admin"} reset password for ${user.fullName}`,
    });

    res.json({ message: "Password reset successfully by admin" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Gửi OTP cho forgot password
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "Email không tồn tại" });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    await Otp.deleteMany({ email });
    await Otp.create({
      email,
      otp,
      attempts: 0,
      resendAfter: new Date(Date.now() + 30 * 1000),
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
    });

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user: process.env.EMAIL, pass: process.env.EMAIL_PASS },
    });

    await transporter.sendMail({
      from: process.env.EMAIL,
      to: email,
      subject: "Forgot Password OTP",
      text: `Your OTP code is: ${otp}`,
    });

    res.json({ success: true, message: "OTP sent to email" });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Verify OTP cho forgot password
export const verifyResetOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const record = await Otp.findOne({ email });

    if (!record)
      return res.status(400).json({ message: "OTP expired or not found" });
    if (record.otp !== otp) {
      record.attempts += 1;
      await record.save();
      return res.status(400).json({ message: "Incorrect OTP" });
    }

    await Otp.deleteOne({ email });
    res.json({ success: true, message: "OTP verified" });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Reset mật khẩu sau khi verify OTP
export const forgotResetPassword = async (req, res) => {
  try {
    const { email, newPassword } = req.body;
    const user = await User.findOne({ email });

    if (!user) return res.status(404).json({ message: "User not found" });

    user.password = newPassword; // middleware sẽ tự hash
    await user.save();

    res.json({ success: true, message: "Password reset successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
