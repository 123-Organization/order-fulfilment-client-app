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

### 2. Backend API Integration ✅ IMPLEMENTED

The Shopify authentication now makes a real API call to:

**Endpoint:** `https://ijbsrphg08.execute-api.us-east-1.amazonaws.com/Prod/api/shopify/callback`

**Request Format:**
```json
{
  "shop": "store-name.myshopify.com",
  "access_token": "shpua_xxx...",
  "account_key": "04129d94-10b5-4d85-b584-584d936c8e73"
}
```

**Parameters:**
- `shop`: Extracted from URL query parameter
- `access_token`: Extracted from URL query parameter (or `code` if access_token not present)
- `account_key`: Retrieved from Redux store (`customerInfo.data.account_key`)

**Response Expected:**
```json
{
  "success": true,
  "message": "Shop connected successfully"
}
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

## Backend Requirements ✅ CONFIGURED

**API Endpoint:** `https://ijbsrphg08.execute-api.us-east-1.amazonaws.com/Prod/api/shopify/callback`

The backend should:

1. **Receive Parameters**: Accept `shop`, `access_token`, and `account_key` from the frontend
2. **Validate Token**: Verify the access token with Shopify
3. **Store Connection**: Save the Shopify store connection linked to the account_key
4. **Return Success**: Return success status

### Request (from Frontend):
```json
{
  "shop": "finerworks-dev-store.myshopify.com",
  "access_token": "shpua_24a839fa41ed2c3e391bc5abfe357e1f",
  "account_key": "04129d94-10b5-4d85-b584-584d936c8e73"
}
```

### Expected Response:
```json
{
  "success": true,
  "message": "Shop connected successfully"
}
```

### Error Response:
```json
{
  "success": false,
  "error": "Error message here",
  "message": "Detailed error description"
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

### Local Testing (Development):
```
http://localhost:3000/auth/shopify?access_token=shpua_xxx&shop=finerworks-dev-store.myshopify.com
```

### Production Testing:
```
https://fa.finerworks.com/auth/shopify?access_token=shpua_xxx&shop=finerworks-dev-store.myshopify.com
```

**Note:** Make sure CloudFront is configured with custom error page (404 → /index.html) for production routing to work.

### Complete Flow:
1. Click Shopify on Landing page
2. Backend redirects user to Shopify OAuth
3. User authorizes the app
4. Shopify redirects to `/auth/shopify?access_token=XXX&shop=YYY`
5. Waiting screen appears with animations
6. API call is made to backend with shop, access_token, and account_key
7. On success: Redirects to Landing page with `?type=shopify&connected=true`
8. On error: Shows error message and redirects to Landing with `?type=shopify&error=auth_failed`

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






