import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import squarespaceLogo from '../assets/images/store-squarespace.svg';
import { useAppSelector } from '../store';

interface SquarespaceAuthWaitingProps {
  token?: string;
  onAuthComplete?: () => void;
}

const SquarespaceAuthWaiting: React.FC<SquarespaceAuthWaitingProps> = ({
  token,
  onAuthComplete,
}) => {
  const navigate = useNavigate();
  const customerInfo = useAppSelector((state) => state.Customer.customer_info);
  const [status, setStatus] = useState<'authenticating' | 'success' | 'error'>('authenticating');
  const [message, setMessage] = useState('Connecting to Squarespace...');
  const [progress, setProgress] = useState(0);

  // Animate progress bar while authenticating
  useEffect(() => {
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + 10;
      });
    }, 300);
    return () => clearInterval(progressInterval);
  }, []);

  useEffect(() => {
    const authenticate = async () => {
      try {
        setMessage('Verifying your credentials...');

        const accountKey = customerInfo?.data?.account_key;
        console.log('🔑 [Squarespace] Account Key:', accountKey);

        if (!accountKey) {
          throw new Error('Account key not found. Please log in again.');
        }

        if (!token) {
          throw new Error('No authentication token received from Squarespace.');
        }

        console.log('🔐 [Squarespace] Saving token for account:', accountKey);

        // POST the token back to the backend to persist the connection
        const response = await fetch(
          'https://d7z22w3j4h.execute-api.us-east-1.amazonaws.com/Prod/api/squarespace/callback',
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ account_key: accountKey, token }),
          }
        );

        const data = await response.json().catch(() => ({}));
        console.log('📦 [Squarespace] Callback response:', data);

        if (response.ok) {
          setProgress(100);
          setStatus('success');
          setMessage('Successfully connected to Squarespace! Redirecting...');

          // Persist token in localStorage so Landing can read it
          localStorage.setItem('squarespace_token', token);
          localStorage.setItem('squarespace_account_key', accountKey);

          setTimeout(() => {
            if (onAuthComplete) onAuthComplete();
            navigate('/?type=squarespace&connected=true');
          }, 2000);
        } else {
          throw new Error(data.message || data.error || 'Authentication failed');
        }
      } catch (error: any) {
        console.error('❌ [Squarespace] Auth error:', error);
        setStatus('error');
        setMessage(error.message || 'Failed to connect to Squarespace. Please try again.');
        setProgress(0);

        setTimeout(() => {
          navigate('/?type=squarespace&error=auth_failed');
        }, 3000);
      }
    };

    if (token) {
      authenticate();
    }
  }, [token, customerInfo, navigate, onAuthComplete]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-indigo-50">
      {/* Animated background blobs */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-indigo-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-slate-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-2000" />
        <div className="absolute top-40 left-40 w-80 h-80 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-4000" />
      </div>

      {/* Main card */}
      <div className="relative z-10 max-w-md w-full mx-4">
        <div className="bg-white rounded-3xl shadow-2xl p-8 backdrop-blur-lg bg-opacity-90">

          {/* Logo */}
          <div className="flex justify-center mb-8">
            <div className={`relative ${
              status === 'authenticating' ? 'animate-pulse' :
              status === 'success' ? 'animate-bounce' : 'animate-shake'
            }`}>
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-400 to-slate-500 rounded-full blur-xl opacity-50" />
              <img
                src={squarespaceLogo}
                alt="Squarespace"
                className="relative w-24 h-24 object-contain"
              />
            </div>
          </div>

          {/* Status icon */}
          <div className="flex justify-center mb-6">
            {status === 'authenticating' && (
              <svg className="animate-spin h-16 w-16 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            )}
            {status === 'success' && (
              <svg className="h-16 w-16 text-green-500 animate-scale-in" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
            {status === 'error' && (
              <svg className="h-16 w-16 text-red-500 animate-shake" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
          </div>

          {/* Title */}
          <h2 className={`text-2xl font-bold text-center mb-4 transition-colors duration-300 ${
            status === 'authenticating' ? 'text-gray-800' :
            status === 'success' ? 'text-green-600' : 'text-red-600'
          }`}>
            {status === 'authenticating' && 'Authenticating...'}
            {status === 'success' && 'Connected!'}
            {status === 'error' && 'Connection Failed'}
          </h2>

          <p className="text-gray-600 text-center mb-8 text-sm">{message}</p>

          {/* Progress bar */}
          <div className="w-full bg-gray-200 rounded-full h-3 mb-6 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ease-out ${
                status === 'success' ? 'bg-gradient-to-r from-green-400 to-green-600' :
                status === 'error' ? 'bg-gradient-to-r from-red-400 to-red-600' :
                'bg-gradient-to-r from-indigo-400 to-slate-500'
              }`}
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Bouncing dots */}
          {status === 'authenticating' && (
            <div className="flex justify-center space-x-2 mt-6">
              <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
              <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
              <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
            </div>
          )}
        </div>

        <p className="text-center text-gray-500 text-xs mt-4">
          Powered by FinerWorks Order Fulfillment
        </p>
      </div>

      <style>{`
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        @keyframes scale-in {
          0% { transform: scale(0); opacity: 0; }
          50% { transform: scale(1.2); }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
          20%, 40%, 60%, 80% { transform: translateX(5px); }
        }
        .animate-blob { animation: blob 7s infinite; }
        .animation-delay-2000 { animation-delay: 2s; }
        .animation-delay-4000 { animation-delay: 4s; }
        .animate-scale-in { animation: scale-in 0.5s ease-out; }
        .animate-shake { animation: shake 0.5s ease-in-out; }
      `}</style>
    </div>
  );
};

export default SquarespaceAuthWaiting;
