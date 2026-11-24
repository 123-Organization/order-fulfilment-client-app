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
  let code = queryParams.get('code');
  let accessToken = queryParams.get('access_token');
  let shop = queryParams.get('shop');
  const hmac = queryParams.get('hmac');
  const timestamp = queryParams.get('timestamp');

  // Fallback to saved parameters if URL parameters were lost (e.g. after login redirect)
  if ((!code && !accessToken) || !shop) {
    try {
      const savedAuth = sessionStorage.getItem('pending_shopify_auth') || localStorage.getItem('pending_shopify_auth');
      if (savedAuth) {
        const parsed = JSON.parse(savedAuth);
        if (parsed.shop && (parsed.authCode || parsed.code || parsed.accessToken)) {
          code = code || parsed.authCode || parsed.code;
          accessToken = accessToken || parsed.accessToken;
          shop = shop || parsed.shop;
          console.log('🔄 Restored Shopify auth parameters from storage:', { shop, code, accessToken });
        }
      }
    } catch (e) {
      console.error('Failed to parse saved Shopify auth:', e);
    }
  }

  useEffect(() => {
    // If valid parameters exist, save them in storage
    if (shop && (code || accessToken)) {
      const currentUrl = window.location.href;
      sessionStorage.setItem('pending_shopify_auth_url', currentUrl);
      localStorage.setItem('pending_shopify_auth_url', currentUrl);
      const authData = JSON.stringify({ shop, authCode: code, accessToken });
      sessionStorage.setItem('pending_shopify_auth', authData);
      localStorage.setItem('pending_shopify_auth', authData);
    }
  }, [shop, code, accessToken]);

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
  }, [code, accessToken, shop, navigate, hmac, timestamp]);

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







