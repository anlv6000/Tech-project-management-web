import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router';
import { CheckCircle, AlertCircle } from 'lucide-react';
import { useAuth, registerUser, verifyOtp, resendOtp } from "../../contexts/AuthContext";
import { API_BASE_URL } from "../../config/baseApi";
export default function RegisterPage() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [step, setStep] = useState<'register' | 'otp'>('register');
  const [otp, setOtp] = useState('');
  const [emailForOtp, setEmailForOtp] = useState('');
  const [countdown, setCountdown] = useState(30);
  const [canResend, setCanResend] = useState(false);

  useEffect(() => {
    if (step !== "otp") return;

    if (countdown <= 0) {
      setCanResend(true);
      return;
    }

    const timer = setTimeout(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [countdown, step]);

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error when user types
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = '*Họ tên là bắt buộc';
    } else if (formData.fullName.trim().length < 2) {
      newErrors.fullName = '*Họ tên cần ít nhất 2 ký tự';
    }

    if (!formData.email.trim()) {
      newErrors.email = '*Email là bắt buộc';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = '*Định dạng email không hợp lệ';
    }

    if (!formData.password) {
      newErrors.password = '*Mật khẩu là bắt buộc';
    } else if (formData.password.length < 6) {
      newErrors.password = '*Mật khẩu cần ít nhất 6 ký tự';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      newErrors.password = '*Mật khẩu cần chứa chữ hoa, chữ thường và số';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = '*Xác nhận mật khẩu là bắt buộc';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = '*Mật khẩu xác nhận không khớp';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const res = await registerUser(
      formData.fullName,
      formData.email,
      formData.password
    );


    if (res.success) {
      setEmailForOtp(formData.email);
      setStep('otp');
      setCountdown(30);
      setCanResend(false);
    } else {
      setErrors({ email: res.message });
    }
  };


 const handleVerifyOtp = async () => {
  const res = await verifyOtp(emailForOtp, otp);

  if (res.success) {
    setSuccess(true);

    // sau khi verify OTP thành công, login user
    const loginRes = await fetch(`${API_BASE_URL}/api/users/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: emailForOtp, password: formData.password }),
    });
    const loginData = await loginRes.json();

    if (loginRes.ok) {
      sessionStorage.setItem("token", loginData.token);

      // kiểm tra token invitation
      const invitationToken = localStorage.getItem("invitationToken");
      if (invitationToken) {
        try {
          const acceptRes = await fetch(`${API_BASE_URL}/api/projects/accept-invitation`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${loginData.token}`,
            },
            body: JSON.stringify({ token: invitationToken }),
          });
          const acceptData = await acceptRes.json();
          if (acceptRes.ok) {
            console.log("Invitation accepted:", acceptData);
          } else {
            console.error("Invitation accept failed:", acceptData.message);
          }
        } catch (err) {
          console.error("Error accepting invitation:", err);
        } finally {
          localStorage.removeItem("invitationToken");
        }
      }
    }

    setTimeout(() => navigate("/login"), 1500);
  } else {
    alert(res.message);
  }
};



  const handleResendOtp = async () => {
    if (!canResend) return;

    const res = await resendOtp(emailForOtp);

    if (res.success) {
      setCountdown(30);
      setCanResend(false);
    } else {
      alert(res.message);
    }
  };



  const handleBlur = (field: string) => {
    // Validate individual field on blur
    const tempData = { ...formData };
    const tempErrors: Record<string, string> = {};

    if (field === 'fullName') {
      if (!tempData.fullName.trim()) {
        tempErrors.fullName = '*Họ tên là bắt buộc';
      } else if (tempData.fullName.trim().length < 2) {
        tempErrors.fullName = '*Họ tên cần ít nhất 2 ký tự';
      }
    }

    if (field === 'email') {
      if (!tempData.email.trim()) {
        tempErrors.email = '*Email là bắt buộc';
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(tempData.email)) {
        tempErrors.email = '*Định dạng email không hợp lệ';
      }
    }

    if (field === 'password') {
      if (!tempData.password) {
        tempErrors.password = '*Mật khẩu là bắt buộc';
      } else if (tempData.password.length < 6) {
        tempErrors.password = '*Mật khẩu cần ít nhất 6 ký tự';
      } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(tempData.password)) {
        tempErrors.password = '*Mật khẩu cần chứa chữ hoa, chữ thường và số';
      }
    }

    if (field === 'confirmPassword') {
      if (!tempData.confirmPassword) {
        tempErrors.confirmPassword = '*Xác nhận mật khẩu là bắt buộc';
      } else if (tempData.password !== tempData.confirmPassword) {
        tempErrors.confirmPassword = '*Mật khẩu xác nhận không khớp';
      }
    }

    setErrors(prev => ({ ...prev, [field]: tempErrors[field] || '' }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex flex-col">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold">Tech-Task friendly</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Create Account</h1>
            <p className="text-gray-600">Join Tech Task and start managing your projects</p>
          </div>

          {success && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-green-800 font-medium">Registration Successful!</p>
                <p className="text-green-700 text-sm mt-1">
                  A confirmation email has been sent to {formData.email}. Redirecting to login...
                </p>
              </div>
            </div>
          )}

          <div className="bg-white p-8 rounded-lg shadow-lg border">
            {step === "register" && (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    id="fullName"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    onBlur={() => handleBlur('fullName')}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.fullName ? 'border-red-500' : 'border-gray-300'
                      }`}
                    placeholder="Nguyễn Văn A"
                  />
                  {errors.fullName && (
                    <p className="mt-1 text-sm text-red-600">{errors.fullName}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    onBlur={() => handleBlur('email')}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.email ? 'border-red-500' : 'border-gray-300'
                      }`}
                    placeholder="nguyenvana@example.com"
                  />
                  {errors.email && (
                    <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                    Password
                  </label>
                  <input
                    type="password"
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    onBlur={() => handleBlur('password')}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.password ? 'border-red-500' : 'border-gray-300'
                      }`}
                    placeholder="••••••••"
                  />
                  {errors.password && (
                    <p className="mt-1 text-sm text-red-600">{errors.password}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    id="confirmPassword"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    onBlur={() => handleBlur('confirmPassword')}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.confirmPassword ? 'border-red-500' : 'border-gray-300'
                      }`}
                    placeholder="••••••••"
                  />
                  {errors.confirmPassword && (
                    <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
                  )}
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                  disabled={success}
                >
                  {success ? 'Success!' : 'Register'}
                </button>
              </form>
            )}
            {step === "otp" && (
              <div className="space-y-5">

                <p className="text-sm text-gray-600">
                  OTP đã gửi tới <b>{emailForOtp}</b>
                </p>

                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="Enter OTP"
                  className="w-full px-3 py-2 border rounded-lg"
                />

                <button
                  onClick={handleVerifyOtp}
                  disabled={otp.length !== 6}
                  className={`w-full py-3 rounded-lg text-white ${otp.length === 6
                    ? "bg-blue-600 hover:bg-blue-700"
                    : "bg-gray-400 cursor-not-allowed"
                    }`}
                >
                  Verify OTP
                </button>

                <button
                  onClick={handleResendOtp}
                  disabled={!canResend}
                  className={`w-full ${canResend ? "text-blue-600 hover:underline" : "text-gray-400 cursor-not-allowed"
                    }`}
                >
                  {canResend ? "Resend OTP" : `Resend OTP in ${countdown}s`}
                </button>


              </div>
            )}
            <div className="mt-6 text-center">
              <p className="text-gray-600">
                Already have an account?{' '}
                <Link to="/login" className="text-blue-600 hover:text-blue-700 font-medium">
                  Login
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
