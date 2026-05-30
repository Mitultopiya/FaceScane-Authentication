import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Home = () => {
  const { isAuthenticated } = useAuth();

  return (
    <div className="max-w-7xl mx-auto px-4 py-16">
      {/* Hero Section */}
      <div className="text-center mb-8">
        <h1 className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6">
          Secure Authentication with{' '}
          <span className="text-[#004BAD]">Face Scan</span>
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto mb-8">
          Production-ready authentication system with password login, facial recognition,
          liveness detection, and enterprise-grade security.
        </p>
        <div className="flex gap-4 justify-center">
          {isAuthenticated ? (
            <>
              <Link to="/profile" className="text-[#004BAD] bg-white px-8 py-3 rounded-md transition-colors">
                My Profile
              </Link>
              <Link to="/face-login" className="text-[#004BAD] bg-white px-8 py-3 rounded-md transition-colors">
                Face Login
              </Link>
            </>
          ) : (
            <>
              <Link to="/register" className="text-white bg-[#004BAD] px-8 py-3 rounded-md transition-colors">
                Get Started
              </Link>
              <Link to="/login" className="text-white bg-[#004BAD] px-8 py-3 rounded-md transition-colors">
                Sign In
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Features Grid */}
      <div className="grid md:grid-cols-3 gap-8 ">
        {[
          {
            title: 'Face Scan Auth',
            desc: 'Login with your face using face-api.js with liveness detection and anti-spoof protection.',
            icon: '👤',
          },
          {
            title: 'JWT Security',
            desc: 'Secure token-based authentication with refresh tokens, httpOnly cookies, and session management.',
            icon: '🔐',
          },
          {
            title: 'Multi-Device',
            desc: 'Track and manage active sessions across devices. Revoke access remotely.',
            icon: '📱',
          },
          {
            title: 'Password Reset',
            desc: 'Secure forgot password flow with SMTP email delivery and token expiry.',
            icon: '📧',
          },
          {
            title: 'Admin Panel',
            desc: 'Role-based access control with user management and login activity monitoring.',
            icon: '📊',
          },
          {
            title: 'Enterprise Security',
            desc: 'Helmet, rate limiting, CORS, input validation, and bcrypt password hashing.',
            icon: '🛡️',
          },
        ].map((feature) => (
          <div key={feature.title} className="card hover:shadow-xl transition-shadow">
            <div className="text-3xl mb-4">{feature.icon}</div>
            <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">{feature.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Home;
