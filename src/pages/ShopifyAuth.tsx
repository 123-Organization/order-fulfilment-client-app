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
  const shop = queryParams.get('shop');
  const hmac = queryParams.get('hmac');
  const timestamp = queryParams.get('timestamp');

  useEffect(() => {
    // If no code or shop, redirect to landing
    if (!code || !shop) {
      console.error('Missing Shopify auth parameters');
      navigate('/?type=shopify&error=missing_params');
    }
  }, [code, shop, navigate]);

  const handleAuthComplete = () => {
    // Update connection status in Redux
    dispatch(setConnectionVerificationStatus('connected'));
  };

  return (
    <ShopifyAuthWaiting 
      authCode={code || undefined}
      shop={shop || undefined}
      onAuthComplete={handleAuthComplete}
    />
  );
};

export default ShopifyAuth;






