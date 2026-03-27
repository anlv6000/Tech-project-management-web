import React from 'react';
import { Link, useNavigate } from 'react-router';
import { CheckCircle, Users, BarChart3, Zap } from 'lucide-react';

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold">Tech-Task Friendly</span>
            </div>
            
            <nav className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-gray-600 hover:text-gray-900">Features</a>
              <a href="#about" className="text-gray-600 hover:text-gray-900">About</a>
              <a href="#contact" className="text-gray-600 hover:text-gray-900">Contact</a>
            </nav>

            <div className="flex items-center gap-4">
              <Link to="/login">
                <button className="px-4 py-2 text-blue-600 hover:text-blue-700 font-medium">
                  Login
                </button>
              </Link>
              <Link to="/register">
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium">
                  Register
                </button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4 text-center">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            Project Management Made Simple
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Track backlog, sprints, tasks, and reports. Built for teams with roles like Admin, PM, Member, and Guest.
          </p>
          <Link to="/register">
            <button className="px-8 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-lg font-medium">
              Get Started Free
            </button>
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            Key Features
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-6 border rounded-lg hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <Zap className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold mb-2">Agile Backlog</h3>
              <p className="text-gray-600">
                Plan sprints, manage tasks, and adapt workflows with ease.
              </p>
            </div>

            <div className="p-6 border rounded-lg hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                <Users className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-xl font-bold mb-2">Role Management</h3>
              <p className="text-gray-600">
                Invite members, assign roles, and control permissions.
              </p>
            </div>

            <div className="p-6 border rounded-lg hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                <BarChart3 className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="text-xl font-bold mb-2">Reports & Dashboard</h3>
              <p className="text-gray-600">
                Get clear insights with progress reports and system dashboards.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-20 px-4 text-center">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">About Tech-Task Friendly</h2>
          <p className="text-lg text-gray-600 mb-4">
            A modern project management platform designed for small teams. 
            Supports authentication, backlog, tasks, notifications, dashboards, and admin reports.
          </p>
          <p className="text-lg text-gray-600">
            Built to help teams deliver faster and smarter.
          </p>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-20 px-4 bg-white text-center">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Contact Us</h2>
          <p className="text-lg text-gray-600 mb-8">
            Questions or feedback? We’d love to hear from you.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <div className="text-gray-600">
              <strong>Email:</strong> contact@tech-task-friendly.demo
            </div>
            <div className="text-gray-600">
              <strong>Phone:</strong> (+84) 123-456-789
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8 px-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center">
              <CheckCircle className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold">Tech-Task Friendly</span>
          </div>
          
          <div className="text-gray-600 text-sm">
            © 2026 Tech-Task Friendly. All rights reserved.
          </div>

          <div className="flex gap-6">
            <a href="#" className="text-gray-600 hover:text-gray-900 text-sm">Privacy</a>
            <a href="#" className="text-gray-600 hover:text-gray-900 text-sm">Terms</a>
            <a href="#contact" className="text-gray-600 hover:text-gray-900 text-sm">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
