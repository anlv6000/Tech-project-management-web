import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { useAuth } from '../../contexts/AuthContext';
import { CheckCircle, AlertCircle } from 'lucide-react';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, user } = useAuth();
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    const success = await login(formData.email, formData.password);
    
    if (success) {
      // Check if user is admin after successful login
      setTimeout(() => {
        if (user?.role === 'admin') {
          navigate('/admin');
        } else {
          navigate('/app');
        }
      }, 100);
    } else {
      setError('Invalid credentials. Please check your email and password.');
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError('');
    setFieldErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleBlur = (field: string) => {
    const tempErrors: Record<string, string> = {};
    
    if (field === 'email') {
      if (!formData.email.trim()) {
        tempErrors.email = '*Email là bắt buộc';
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        tempErrors.email = '*Định dạng email không hợp lệ';
      }
    }
    
    if (field === 'password') {
      if (!formData.password) {
        tempErrors.password = '*Mật khẩu là bắt buộc';
      }
    }
    
    setFieldErrors(prev => ({ ...prev, [field]: tempErrors[field] || '' }));
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
              <span className="text-xl font-bold">ProjectFlow</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome Back</h1>
            <p className="text-gray-600">Login to your ProjectFlow account</p>
          </div>

          {/* Demo accounts info */}
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-blue-900 font-medium mb-2">Demo Accounts:</p>
            <div className="text-sm text-blue-800 space-y-1">
              <p><strong>User:</strong> john@demo.com / demo123</p>
              <p><strong>Admin:</strong> admin@demo.com / admin123</p>
            </div>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-red-800">{error}</p>
            </div>
          )}

          <div className="bg-white p-8 rounded-lg shadow-lg border">
            <form onSubmit={handleSubmit} className="space-y-5">
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
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    fieldErrors.email ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="nguyenvana@example.com"
                  required
                />
                {fieldErrors.email && (
                  <p className="mt-1 text-sm text-red-600">{fieldErrors.email}</p>
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
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    fieldErrors.password ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="••••••••"
                  required
                />
                {fieldErrors.password && (
                  <p className="mt-1 text-sm text-red-600">{fieldErrors.password}</p>
                )}
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="remember"
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="remember" className="ml-2 text-sm text-gray-600">
                    Remember me
                  </label>
                </div>
                <Link to="/forgot-password" className="text-sm text-blue-600 hover:text-blue-700">
                  Forgot password?
                </Link>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:bg-blue-400"
                disabled={isLoading}
              >
                {isLoading ? 'Logging in...' : 'Login'}
              </button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-gray-600">
                Don't have an account?{' '}
                <Link to="/register" className="text-blue-600 hover:text-blue-700 font-medium">
                  Register
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
