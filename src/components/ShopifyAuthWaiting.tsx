import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import shopifyLogo from '../assets/images/store-shopify.svg';

interface ShopifyAuthWaitingProps {
  onAuthComplete?: () => void;
  authCode?: string;
  shop?: string;
}

const ShopifyAuthWaiting: React.FC<ShopifyAuthWaitingProps> = ({ 
  onAuthComplete,
  authCode,
  shop 
}) => {
  const navigate = useNavigate();
  const [status, setStatus] = useState<'authenticating' | 'success' | 'error'>('authenticating');
  const [message, setMessage] = useState('Connecting to Shopify...');
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Simulate progress bar
    const progressInterval = setInterval(() => {
      setProgress(prev => {
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
    const authenticateWithShopify = async () => {
      try {
        setMessage('Verifying your credentials...');
        
        // TODO: Replace 'YOUR_BACKEND_API_ENDPOINT' with your actual backend URL
        const response = await fetch('YOUR_BACKEND_API_ENDPOINT/shopify/auth', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            code: authCode,
            shop: shop,
            // Add any other required parameters from your backend
            // account_key: customerInfo?.data?.account_key,
          }),
        });

        const data = await response.json();
        
        if (response.ok && data.success) {
          setProgress(100);
          setStatus('success');
          setMessage('Successfully connected to Shopify!');
          
          // Store connection info in Redux/localStorage if needed
          // dispatch(updateShopifyConnection(data));
          
          // Wait 2 seconds to show success message then redirect
          setTimeout(() => {
            if (onAuthComplete) {
              onAuthComplete();
            }
            navigate('/?type=shopify&connected=true');
          }, 2000);
        } else {
          throw new Error(data.message || 'Authentication failed');
        }
        
      } catch (error) {
        console.error('Shopify authentication error:', error);
        setStatus('error');
        setMessage('Failed to connect to Shopify. Please try again.');
        setProgress(0);
        
        // Redirect to landing after error
        setTimeout(() => {
          navigate('/?type=shopify&error=auth_failed');
        }, 3000);
      }
    };

    if (authCode && shop) {
      authenticateWithShopify();
    }
  }, [authCode, shop, navigate, onAuthComplete]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-green-50 via-white to-blue-50">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-green-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-2000"></div>
        <div className="absolute top-40 left-40 w-80 h-80 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-4000"></div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 max-w-md w-full mx-4">
        <div className="bg-white rounded-3xl shadow-2xl p-8 backdrop-blur-lg bg-opacity-90">
          {/* Logo Animation */}
          <div className="flex justify-center mb-8">
            <div className={`relative ${
              status === 'authenticating' ? 'animate-pulse' : 
              status === 'success' ? 'animate-bounce' : 
              'animate-shake'
            }`}>
              <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-blue-500 rounded-full blur-xl opacity-50"></div>
              <img 
                src={shopifyLogo} 
                alt="Shopify" 
                className="relative w-24 h-24 object-contain"
              />
            </div>
          </div>

          {/* Status Icon */}
          <div className="flex justify-center mb-6">
            {status === 'authenticating' && (
              <div className="relative">
                <svg className="animate-spin h-16 w-16 text-green-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </div>
            )}
            
            {status === 'success' && (
              <div className="animate-scale-in">
                <svg className="h-16 w-16 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            )}
            
            {status === 'error' && (
              <div className="animate-shake">
                <svg className="h-16 w-16 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            )}
          </div>

          {/* Status Message */}
          <h2 className={`text-2xl font-bold text-center mb-4 transition-colors duration-300 ${
            status === 'authenticating' ? 'text-gray-800' :
            status === 'success' ? 'text-green-600' :
            'text-red-600'
          }`}>
            {status === 'authenticating' && 'Authenticating...'}
            {status === 'success' && 'Connected!'}
            {status === 'error' && 'Connection Failed'}
          </h2>

          <p className="text-gray-600 text-center mb-8 text-sm">
            {message}
          </p>

          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-3 mb-6 overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all duration-500 ease-out ${
                status === 'success' ? 'bg-gradient-to-r from-green-400 to-green-600' :
                status === 'error' ? 'bg-gradient-to-r from-red-400 to-red-600' :
                'bg-gradient-to-r from-green-400 to-blue-500'
              }`}
              style={{ width: `${progress}%` }}
            ></div>
          </div>

          {/* Additional Info */}
          {shop && (
            <div className="text-center text-sm text-gray-500">
              <p>Store: <span className="font-semibold text-gray-700">{shop}</span></p>
            </div>
          )}

          {/* Loading Dots Animation */}
          {status === 'authenticating' && (
            <div className="flex justify-center space-x-2 mt-6">
              <div className="w-2 h-2 bg-green-600 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
              <div className="w-2 h-2 bg-green-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              <div className="w-2 h-2 bg-green-600 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
            </div>
          )}
        </div>

        {/* Footer Text */}
        <p className="text-center text-gray-500 text-xs mt-4">
          Powered by FinerWorks Order Fulfillment
        </p>
      </div>

      {/* Custom Animations */}
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
        
        .animate-blob {
          animation: blob 7s infinite;
        }
        
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        
        .animation-delay-4000 {
          animation-delay: 4s;
        }
        
        .animate-scale-in {
          animation: scale-in 0.5s ease-out;
        }
        
        .animate-shake {
          animation: shake 0.5s ease-in-out;
        }
      `}</style>
    </div>
  );
};

export default ShopifyAuthWaiting;

