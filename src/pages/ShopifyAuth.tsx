import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import ShopifyAuthWaiting from '../components/ShopifyAuthWaiting';
import { useAppDispatch } from '../store';
import { setConnectionVerificationStatus } from '../store/features/companySlice';

const ShopifyAuth: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const queryParams = new URLSearchParams(location.search);
  
  // Extract Shopify parameters from URL
  const code = queryParams.get('code');
  const accessToken = queryParams.get('access_token');
  const shop = queryParams.get('shop');
  const hmac = queryParams.get('hmac');
  const timestamp = queryParams.get('timestamp');

  useEffect(() => {
    console.log('🔍 ShopifyAuth - URL Parameters:', {
      code,
      accessToken,
      shop,
      hmac,
      timestamp,
      fullURL: window.location.href
    });

    // If no code/access_token or shop, redirect to landing
    if ((!code && !accessToken) || !shop) {
      console.error('❌ Missing Shopify auth parameters - redirecting to landing');
      navigate('/?type=shopify&error=missing_params');
    } else {
      console.log('✅ Parameters found, rendering auth waiting screen...');
    }
  }, [code, accessToken, shop, navigate]);

  const handleAuthComplete = () => {
    // Update connection status in Redux
    dispatch(setConnectionVerificationStatus('connected'));
  };

  // Don't render if parameters are missing
  if ((!code && !accessToken) || !shop) {
    return null; // Will redirect via useEffect
  }

  return (
    <ShopifyAuthWaiting 
      authCode={code || undefined}
      accessToken={accessToken || undefined}
      shop={shop || undefined}
      onAuthComplete={handleAuthComplete}
    />
  );
};

export default ShopifyAuth;







