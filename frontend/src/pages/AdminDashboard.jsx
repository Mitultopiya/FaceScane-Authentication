import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { authService } from '../services/authService';
import LoadingSpinner from '../components/LoadingSpinner';

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [loginLogs, setLoginLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, usersRes, logsRes] = await Promise.all([
          authService.getAdminStats(),
          authService.getAdminUsers(),
          authService.getAdminLoginLogs(),
        ]);
        setStats(statsRes.data.data);
        setUsers(usersRes.data.data.users || []);
        setLoginLogs(logsRes.data.data || []);
      } catch (error) {
        toast.error('Failed to load admin data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const statCards = [
    { label: 'Total Users', value: stats?.total_users || 0, color: 'bg-blue-500' },
    { label: 'Face Registered', value: stats?.face_registered || 0, color: 'bg-green-500' },
    { label: 'Logins (24h)', value: stats?.logins_24h || 0, color: 'bg-purple-500' },
    { label: 'Active Sessions', value: stats?.active_sessions || 0, color: 'bg-orange-500' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {statCards.map((stat) => (
          <div key={stat.label} className="card">
            <div className={`w-10 h-10 ${stat.color} rounded-lg flex items-center justify-center mb-3`}>
              <span className="text-white font-bold text-lg">{stat.value}</span>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-gray-200 dark:border-gray-700">
        {['overview', 'users', 'logs'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium capitalize transition-colors ${
              activeTab === tab
                ? 'text-primary-600 border-b-2 border-primary-600'
                : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Users Table */}
      {(activeTab === 'overview' || activeTab === 'users') && (
        <div className="card mb-6">
          <h2 className="text-lg font-semibold mb-4">Users</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-2 px-3">Name</th>
                  <th className="text-left py-2 px-3">Email</th>
                  <th className="text-left py-2 px-3">Role</th>
                  <th className="text-left py-2 px-3">Face</th>
                  <th className="text-left py-2 px-3">Joined</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-b border-gray-100 dark:border-gray-800">
                    <td className="py-2 px-3">{user.name}</td>
                    <td className="py-2 px-3">{user.email}</td>
                    <td className="py-2 px-3 capitalize">{user.role}</td>
                    <td className="py-2 px-3">
                      {user.face_registered_at ? (
                        <span className="text-green-600 text-xs">Yes</span>
                      ) : (
                        <span className="text-gray-400 text-xs">No</span>
                      )}
                    </td>
                    <td className="py-2 px-3">{new Date(user.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Login Logs */}
      {(activeTab === 'overview' || activeTab === 'logs') && (
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Login Activity Logs</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-2 px-3">User</th>
                  <th className="text-left py-2 px-3">Method</th>
                  <th className="text-left py-2 px-3">IP</th>
                  <th className="text-left py-2 px-3">Status</th>
                  <th className="text-left py-2 px-3">Date</th>
                </tr>
              </thead>
              <tbody>
                {loginLogs.map((log) => (
                  <tr key={log.id} className="border-b border-gray-100 dark:border-gray-800">
                    <td className="py-2 px-3">{log.user_name || log.email || '—'}</td>
                    <td className="py-2 px-3 capitalize">{log.login_method?.replace('_', ' ')}</td>
                    <td className="py-2 px-3">{log.ip_address || '—'}</td>
                    <td className="py-2 px-3">
                      <span className={`px-2 py-0.5 rounded text-xs ${log.success ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {log.success ? 'Success' : 'Failed'}
                      </span>
                    </td>
                    <td className="py-2 px-3">{new Date(log.created_at).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
