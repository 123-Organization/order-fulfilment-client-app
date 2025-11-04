# Shopify Authentication Integration Guide

## Overview
A modern, animated waiting screen has been implemented for Shopify OAuth authentication with smooth transitions and real-time status updates.

## Files Created/Modified

### New Files:
1. **`src/components/ShopifyAuthWaiting.tsx`** - Beautiful waiting screen component with animations
2. **`src/pages/ShopifyAuth.tsx`** - Page that handles Shopify OAuth callback
3. **`SHOPIFY_AUTH_INTEGRATION.md`** - This documentation

### Modified Files:
1. **`src/routes/Router.tsx`** - Added `/auth/shopify` route
2. **`src/pages/Landing.tsx`** - Added Shopify connection status and handling

## How It Works

### 1. User Flow
```
Landing Page → User clicks Shopify → Redirects to Shopify OAuth
→ Shopify redirects back to `/auth/shopify?code=XXX&shop=YYY`
→ Shows waiting screen while authenticating
→ Success/Error notification
→ Redirects to Landing Page with connection status
```

### 2. Backend API Integration

You need to create an endpoint for authenticating Shopify. Update the `ShopifyAuthWaiting.tsx` file:

```typescript
// In src/components/ShopifyAuthWaiting.tsx around line 38-50

const authenticateWithShopify = async () => {
  try {
    setMessage('Verifying your credentials...');
    
    // **REPLACE THIS WITH YOUR ACTUAL API ENDPOINT**
    const response = await fetch('YOUR_BACKEND_API_ENDPOINT/shopify/auth', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        code: authCode,
        shop: shop,
        // Add any other required parameters from your backend
        account_key: customerInfo?.data?.account_key,
      }),
    });

    const data = await response.json();
    
    if (response.ok && data.success) {
      setProgress(100);
      setStatus('success');
      setMessage('Successfully connected to Shopify!');
      
      // Store connection info in Redux/localStorage if needed
      // dispatch(updateShopifyConnection(data));
      
      // Redirect after success
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
    // ... rest of error handling
  }
};
```

### 3. Shopify OAuth URL Setup

In `src/pages/Landing.tsx`, update the Shopify click handler (around line 654-670):

```typescript
// Shopify integration
if (imgname === "Shopify") {
  // Check if user is logged in
  if (!customerInfo?.data?.account_key && !cookies.AccountGUID) {
    window.location.href = `https://finerworks.com/login.aspx?mode=login&returnurl=${window.location.href}`;
    return;
  }

  // If already connected, navigate to import filter
  if (shopifyConnectionStatus === 'connected') {
    navigate("/importfilter?type=Shopify");
  } else {
    // **REPLACE WITH YOUR SHOPIFY OAUTH URL**
    const shopifyOAuthUrl = 'YOUR_SHOPIFY_APP_INSTALL_URL';
    const redirectUri = `${window.location.origin}/auth/shopify`;
    
    // Redirect to Shopify OAuth
    window.location.href = `${shopifyOAuthUrl}?redirect_uri=${encodeURIComponent(redirectUri)}`;
  }
}
```

## Backend Requirements

Your backend API should:

1. **Receive OAuth Code**: Accept `code`, `shop`, and `account_key` from the frontend
2. **Exchange for Access Token**: Exchange the code with Shopify for an access token
3. **Store Connection**: Save the Shopify store connection details linked to the user account
4. **Return Success**: Return success status and any relevant connection data

### Example Backend Response:
```json
{
  "success": true,
  "message": "Shopify store connected successfully",
  "data": {
    "shop": "store-name.myshopify.com",
    "access_token": "encrypted_or_hashed_token",
    "connection_id": "unique_connection_id",
    "isConnected": true
  }
}
```

## Features Implemented

✨ **Visual Features:**
- Animated blob background
- Spinning loader during authentication
- Success checkmark animation
- Error shake animation
- Smooth progress bar
- Bounce effect on Shopify logo

🎨 **Status Display:**
- "Authenticating..." with spinner
- "Connected!" with green checkmark
- "Connection Failed" with red X
- Real-time progress bar (0-100%)

📱 **Connection Status Tags on Landing:**
- **Verifying...** (Blue, pulsing)
- **Connected** (Green)
- **Disconnected** (Red)

## Testing

To test the complete flow:
1. Update the backend API endpoint in `ShopifyAuthWaiting.tsx` (line 42)
2. Click Shopify on Landing page
3. User will be redirected to Shopify OAuth
4. After authorization, Shopify redirects to `/auth/shopify?code=XXX&shop=YYY`
5. Waiting screen appears and calls your API
6. On success, user is redirected back to Landing page with connection status

## Environment Variables

Add to your `.env` file:
```
REACT_APP_SHOPIFY_OAUTH_URL=your_shopify_app_install_url
REACT_APP_BACKEND_API_URL=your_backend_api_base_url
```

## Next Steps

1. ✅ Provide the Shopify OAuth installation URL
2. ✅ Provide the backend authentication API endpoint
3. ✅ Test the complete OAuth flow
4. ✅ Implement connection persistence (save to database)
5. ✅ Add disconnect functionality (similar to WooCommerce)

## Redux State Management

If you want to store Shopify connection state in Redux (recommended), add to `companySlice.ts`:

```typescript
// Add to state
shopifyConnectionId: string | null;
shopifyConnectionStatus: 'idle' | 'verifying' | 'connected' | 'disconnected';

// Add reducers
setShopifyConnection: (state, action) => {
  state.shopifyConnectionId = action.payload.id;
  state.shopifyConnectionStatus = 'connected';
},
```

## Support

For any issues or questions, contact the development team.

---

**Note**: The redirect URL for Shopify OAuth should be: `https://your-domain.com/auth/shopify`
Make sure to whitelist this URL in your Shopify App settings.






