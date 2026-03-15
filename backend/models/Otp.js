import mongoose from "mongoose";

const otpSchema = new mongoose.Schema({
  email: String,
  otp: String,

  attempts: {
    type: Number,
    default: 0
  },

  resendAfter: Date,

  expiresAt: {
    type: Date,
    expires: 0
  }
});

export default mongoose.model("Otp", otpSchema);
