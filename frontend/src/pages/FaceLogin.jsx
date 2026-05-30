import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { validateEmail } from '../utils/validation';
import FaceScanner from '../components/FaceScanner';

const FaceLogin = () => {
  const navigate = useNavigate();
  const { faceLogin } = useAuth();
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [showScanner, setShowScanner] = useState(false);

  const handleStartScan = (e) => {
    e.preventDefault();
    const error = validateEmail(email);
    if (error) {
      setEmailError(error);
      return;
    }
    setShowScanner(true);
  };

  const handleFaceSuccess = async ({ descriptor, livenessData }) => {
    const result = await faceLogin({ email, descriptor, livenessData });
    toast.success(`Face login successful! Match: ${result.matchAccuracy}%`);
    navigate('/profile');
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12">
      <div className="card w-full max-w-2xl">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold">Face Scan Login</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Verify your identity using facial recognition
          </p>
        </div>

        {!showScanner ? (
          <form onSubmit={handleStartScan} className="space-y-5 max-w-md mx-auto">
            <div>
              <label htmlFor="email" className="label">Email</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setEmailError(''); }}
                className="input-field"
                placeholder="Enter your registered email"
              />
              {emailError && <p className="error-text">{emailError}</p>}
            </div>
            <button type="submit" className="btn-primary w-full">
              Continue to Face Scan
            </button>
          </form>
        ) : (
          <FaceScanner
            mode="login"
            email={email}
            onSuccess={handleFaceSuccess}
            onCancel={() => setShowScanner(false)}
          />
        )}

        <p className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
          <Link to="/login" className="text-primary-600 hover:text-primary-700">← Back to password login</Link>
        </p>
      </div>
    </div>
  );
};

export default FaceLogin;
