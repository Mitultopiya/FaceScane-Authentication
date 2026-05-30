import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { authService } from '../services/authService';
import FaceScanner from '../components/FaceScanner';
import LoadingSpinner from '../components/LoadingSpinner';

const Profile = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showFaceRegister, setShowFaceRegister] = useState(false);

  const fetchProfile = async () => {
    try {
      const response = await authService.getProfile();
      setProfile(response.data.data);
    } catch (error) {
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleFaceRegister = async ({ descriptor, livenessData }) => {
    await authService.registerFace({ descriptor, livenessData });
    toast.success('Face registered successfully!');
    setShowFaceRegister(false);
    fetchProfile();
  };

  const handleRevokeSession = async (sessionId) => {
    try {
      await authService.revokeSession(sessionId);
      toast.success('Session revoked');
      fetchProfile();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to revoke session');
    }
  };

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">My Profile</h1>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Account</h2>
          <dl className="space-y-3">
            <div>
              <dt className="text-sm text-gray-500 dark:text-gray-400">Name</dt>
              <dd className="font-medium">{profile?.user?.name}</dd>
            </div>
            <div>
              <dt className="text-sm text-gray-500 dark:text-gray-400">Email</dt>
              <dd className="font-medium">{profile?.user?.email}</dd>
            </div>
            <div>
              <dt className="text-sm text-gray-500 dark:text-gray-400">Role</dt>
              <dd>
                <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 capitalize">
                  {profile?.user?.role}
                </span>
              </dd>
            </div>
            <div>
              <dt className="text-sm text-gray-500 dark:text-gray-400">Face Auth</dt>
              <dd className="font-medium">
                {profile?.user?.faceRegistered ? (
                  <span className="text-green-600">Registered</span>
                ) : (
                  <span className="text-yellow-600">Not registered</span>
                )}
              </dd>
            </div>
          </dl>

          {!profile?.user?.faceRegistered && !showFaceRegister && (
            <button onClick={() => setShowFaceRegister(true)} className="btn-primary mt-6 w-full">
              Register Face for Login
            </button>
          )}
        </div>

        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Active Sessions</h2>
          {profile?.sessions?.length > 0 ? (
            <ul className="space-y-3">
              {profile.sessions.map((session) => (
                <li key={session.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div>
                    <p className="font-medium text-sm">{session.device_name}</p>
                    <p className="text-xs text-gray-500">
                      {session.ip_address} · {new Date(session.last_active_at).toLocaleString()}
                    </p>
                  </div>
                  <button onClick={() => handleRevokeSession(session.id)} className="btn-danger text-xs">
                    Revoke
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500 text-sm">No active sessions</p>
          )}
        </div>

        <div className="card md:col-span-2">
          <h2 className="text-lg font-semibold mb-4">Recent Login Activity</h2>
          {profile?.recentLogins?.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-2 px-3">Method</th>
                    <th className="text-left py-2 px-3">IP</th>
                    <th className="text-left py-2 px-3">Status</th>
                    <th className="text-left py-2 px-3">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {profile.recentLogins.map((log, i) => (
                    <tr key={i} className="border-b border-gray-100 dark:border-gray-800">
                      <td className="py-2 px-3 capitalize">{log.login_method?.replace('_', ' ')}</td>
                      <td className="py-2 px-3">{log.ip_address || '—'}</td>
                      <td className="py-2 px-3">
                        <span
                          className={`px-2 py-0.5 rounded text-xs ${
                            log.success
                              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                              : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                          }`}
                        >
                          {log.success ? 'Success' : 'Failed'}
                        </span>
                      </td>
                      <td className="py-2 px-3">{new Date(log.created_at).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-500 text-sm">No login activity yet</p>
          )}
        </div>
      </div>

      {showFaceRegister && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="card max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Register Your Face</h2>
            <FaceScanner
              mode="register"
              onSuccess={handleFaceRegister}
              onCancel={() => setShowFaceRegister(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
