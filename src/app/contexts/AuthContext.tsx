import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, UserRole } from '../types';

const API_BASE_URL = 'http://localhost:5000/api';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (fullName: string, email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
  isAdmin: boolean;
  updateUser: (updates: Partial<User>) => Promise<boolean>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Load user from sessionStorage on mount
  useEffect(() => {
    const savedUser = sessionStorage.getItem('currentUser');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (error) {
        console.error('Failed to parse saved user:', error);
      }
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const response = await fetch(`${API_BASE_URL}/users/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        return false;
      }

      const data = await response.json();
      if (data.user && data.token) {
        // Convert MongoDB _id to id for consistency
        const userData = { ...data.user, id: data.user._id || data.user.id };
        setUser(userData as User);
        sessionStorage.setItem('currentUser', JSON.stringify(userData));
        sessionStorage.setItem('token', data.token);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const register = async (fullName: string, email: string, password: string): Promise<boolean> => {
    try {
      const response = await fetch(`${API_BASE_URL}/users/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ fullName, email, password }),
      });

      if (!response.ok) {
        return false;
      }

      const data = await response.json();
      if (data.user) {
        const userData = { ...data.user, id: data.user._id || data.user.id };
        setUser(userData as User);
        sessionStorage.setItem('currentUser', JSON.stringify(userData));
        return true;
      }
      return false;
    } catch (error) {
      console.error('Register error:', error);
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    sessionStorage.removeItem('currentUser');
    sessionStorage.removeItem('token');
  };

  const updateUser = async (updates: Partial<User>): Promise<boolean> => {
    if (!user) return false;

    try {
      // ép luôn thành string từ _id
      const userId = user.id ? user.id.toString() : user._id?.toString();
      const token = sessionStorage.getItem('token');

      console.log("UpdateUser request →");
      console.log("userId:", userId);
      console.log("token:", token);
      console.log("updates:", updates);

      const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(updates),
      });

      console.log("Response status:", response.status);

      if (!response.ok) {
        if (response.status === 409) {
          throw new Error("Email đã tồn tại, vui lòng chọn email khác");
        }
        if (response.status === 404) {
          throw new Error("User không tồn tại");
        }
        if (response.status === 403) {
          throw new Error("Bạn không có quyền cập nhật hồ sơ này");
        }
        throw new Error("Cập nhật thất bại");
      }

      const updatedData = await response.json();
      console.log("Updated data from server:", updatedData);

      // chuẩn hóa lại user object, chỉ giữ id dạng string
      const updatedUser = {
        ...updatedData,
        id: updatedData._id?.toString() || updatedData.id
      };

      setUser(updatedUser as User);
      sessionStorage.setItem('currentUser', JSON.stringify(updatedUser));
      return true;
    } catch (error: any) {
      console.error('Update user error:', error);
      throw error;
    }
  };


  const value: AuthContextType = {
    user,
    login,
    register,
    logout,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
    updateUser,
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};


export const registerUser = async (
  fullName: string,
  email: string,
  password: string
) => {
  const res = await fetch(`${API_BASE_URL}/users/auth/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      fullName,
      email,
      password,
    }),
  });

  return res.json();
};

export const createUser = async (
  fullName: string,
  email: string,
  password: string
) => {
  const res = await fetch(`${API_BASE_URL}/users/auth/create-user`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      fullName,
      email,
      password,
    }),
  });

  return res.json();
};

export const verifyOtp = async (email: string, otp: string) => {
  const res = await fetch(`${API_BASE_URL}/users/auth/verify-otp`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email,
      otp,
    }),
  });

  return res.json();
};

export const resendOtp = async (email: string) => {
  const res = await fetch(`${API_BASE_URL}/users/auth/resend-otp`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email,
    }),
  });

  return res.json();
};
