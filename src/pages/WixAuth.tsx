import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAppSelector } from '../store';
import wixLogo from '../assets/images/store-wix.svg';
import config from '../config/configs';

const BASE_URL = config.SERVER_BASE_URL;

const WixAuth: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const customerInfo = useAppSelector((state) => state.Customer.customer_info);
  const queryParams = new URLSearchParams(location.search);

  // Wix may return token, code, or access_token
  const token = queryParams.get('token') || queryParams.get('access_token') || queryParams.get('code');
  const error = queryParams.get('error');

  const [status, setStatus] = useState<'authenticating' | 'success' | 'error'>('authenticating');
  const [message, setMessage] = useState('Connecting to Wix...');
  const [progress, setProgress] = useState(0);

  // Animate progress bar
  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) { clearInterval(interval); return 90; }
        return prev + 10;
      });
    }, 300);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (error) {
      navigate(`/?type=wix&error=${error}`);
      return;
    }
    if (!token) {
      navigate('/?type=wix&error=missing_token');
      return;
    }

    const authenticate = async () => {
      try {
        setMessage('Verifying your Wix credentials...');
        const accountKey = customerInfo?.data?.account_key;

        if (!accountKey) throw new Error('Account key not found. Please log in again.');

        const response = await fetch(
          `${BASE_URL}wix/oauth/callback`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ account_key: accountKey, token }),
          }
        );

        const data = await response.json().catch(() => ({}));
        console.log('📦 [Wix] Callback response:', data);

        if (response.ok) {
          setProgress(100);
          setStatus('success');
          setMessage('Successfully connected to Wix! Redirecting...');
          localStorage.setItem('wix_token', token);
          localStorage.setItem('wix_account_key', accountKey);
          setTimeout(() => navigate('/?type=wix&connected=true'), 2000);
        } else {
          throw new Error(data.message || data.error || 'Authentication failed');
        }
      } catch (err: any) {
        setStatus('error');
        setMessage(err.message || 'Failed to connect to Wix. Please try again.');
        setProgress(0);
        setTimeout(() => navigate('/?type=wix&error=auth_failed'), 3000);
      }
    };

    if (token && customerInfo?.data?.account_key) {
      authenticate();
    }
  }, [token, error, customerInfo, navigate]);

  const brandColor = '#00B5B5'; // Wix teal

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #f0fafa 0%, #ffffff 50%, #e8f8f8 100%)' }}>
      <div style={{ position: 'relative', maxWidth: 420, width: '100%', margin: '0 16px' }}>
        <div style={{ background: '#fff', borderRadius: 28, boxShadow: '0 40px 100px rgba(0,181,181,.18), 0 8px 30px rgba(0,0,0,.08)', padding: 40, textAlign: 'center' }}>

          {/* Logo */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 28 }}>
            <div style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', inset: -8, background: `radial-gradient(circle, ${brandColor}33 0%, transparent 70%)`, borderRadius: '50%' }} />
              <img src={wixLogo} alt="Wix" style={{ width: 96, height: 96, objectFit: 'contain', position: 'relative', animation: status === 'authenticating' ? 'wix-pulse 2s ease-in-out infinite' : 'none' }} />
            </div>
          </div>

          {/* Status icon */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
            {status === 'authenticating' && (
              <svg style={{ animation: 'wix-spin 1s linear infinite', width: 56, height: 56, color: brandColor }} viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.25" />
                <path d="M12 2a10 10 0 0110 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
              </svg>
            )}
            {status === 'success' && (
              <svg style={{ width: 56, height: 56, color: '#22c55e' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
            {status === 'error' && (
              <svg style={{ width: 56, height: 56, color: '#ef4444' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
          </div>

          {/* Title */}
          <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8, color: status === 'success' ? '#16a34a' : status === 'error' ? '#dc2626' : '#111827' }}>
            {status === 'authenticating' ? 'Authenticating…' : status === 'success' ? 'Connected!' : 'Connection Failed'}
          </h2>
          <p style={{ color: '#6b7280', fontSize: 14, marginBottom: 28 }}>{message}</p>

          {/* Progress bar */}
          <div style={{ height: 8, background: '#f3f4f6', borderRadius: 999, overflow: 'hidden' }}>
            <div style={{ height: '100%', borderRadius: 999, transition: 'width .5s ease', width: `${progress}%`, background: status === 'success' ? 'linear-gradient(90deg,#4ade80,#16a34a)' : status === 'error' ? 'linear-gradient(90deg,#f87171,#dc2626)' : `linear-gradient(90deg,${brandColor},#009090)` }} />
          </div>

          {status === 'authenticating' && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginTop: 20 }}>
              {[0, 0.2, 0.4].map((delay, i) => (
                <div key={i} style={{ width: 8, height: 8, borderRadius: '50%', background: brandColor, animation: `wix-bounce 1.2s ease-in-out ${delay}s infinite` }} />
              ))}
            </div>
          )}
        </div>
        <p style={{ textAlign: 'center', color: '#9ca3af', fontSize: 12, marginTop: 14 }}>Powered by FinerWorks Order Fulfillment</p>
      </div>

      <style>{`
        @keyframes wix-spin   { to { transform: rotate(360deg); } }
        @keyframes wix-pulse  { 0%,100% { opacity:1; transform:scale(1); } 50% { opacity:.7; transform:scale(1.05); } }
        @keyframes wix-bounce { 0%,100% { transform:translateY(0); } 50% { transform:translateY(-8px); } }
      `}</style>
    </div>
  );
};

export default WixAuth;
