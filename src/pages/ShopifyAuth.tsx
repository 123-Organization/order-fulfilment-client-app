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
    // If no code/access_token or shop, redirect to landing
    if ((!code && !accessToken) || !shop) {
      console.error('Missing Shopify auth parameters');
      navigate('/?type=shopify&error=missing_params');
    }
  }, [code, accessToken, shop, navigate]);

  const handleAuthComplete = () => {
    // Update connection status in Redux
    dispatch(setConnectionVerificationStatus('connected'));
  };

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







