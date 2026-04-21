import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import SquarespaceAuthWaiting from '../components/SquarespaceAuthWaiting';

const SquarespaceAuth: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const queryParams = new URLSearchParams(location.search);

  // The backend/Squarespace will redirect back with a token (or code)
  // Common param names — capture all likely variants
  const token = queryParams.get('token') || queryParams.get('access_token') || queryParams.get('code');
  const error = queryParams.get('error');

  useEffect(() => {
    console.log('🔍 [SquarespaceAuth] URL params:', {
      token,
      error,
      fullURL: window.location.href,
    });

    if (error) {
      console.error('❌ [SquarespaceAuth] Error from Squarespace:', error);
      navigate(`/?type=squarespace&error=${error}`);
      return;
    }

    if (!token) {
      console.error('❌ [SquarespaceAuth] No token in callback URL');
      navigate('/?type=squarespace&error=missing_token');
    }
  }, [token, error, navigate]);

  if (error || !token) {
    return null; // useEffect will redirect
  }

  return (
    <SquarespaceAuthWaiting
      token={token}
      onAuthComplete={() => {
        console.log('✅ [SquarespaceAuth] Auth complete');
      }}
    />
  );
};

export default SquarespaceAuth;
