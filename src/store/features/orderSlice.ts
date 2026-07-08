import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";

import config from "../../config/configs";
import ShippingPreference from "../../pages/ShippingPreference";
import { remove, find } from "lodash";

import { click } from "@testing-library/user-event/dist/click";
import { action } from "easy-peasy";

// https://github.com/vahid-nejad/redux-toolkit-example/blob/master/src/components/Add.tsx
const BASE_URL = config.SERVER_BASE_URL;
const TEST_BASE_URL = "prod3-api.finerworks.com/api/";

export interface Order {
  id: number;
  name: string;
}


interface OrderState {
  orders: any;
  order: any;
  productCode: any;
  updatedValues: any;
  myImport: any;
  saveOrderInfo: any;
  checkedOrders: any;
  orderEdited: any;
  submitedOrders: any;
  submitOrdersResponse: any;
  shopifyOrdersResponse: any;
  squarespaceOrdersResponse: any;
  squarespaceImportStatus: "idle" | "loading" | "succeeded" | "failed" | "token_expired";
  wixOrdersResponse: any;
  wixImportStatus: "idle" | "loading" | "succeeded" | "failed";
  shippoOrdersResponse: any;
  shippoImportStatus: "idle" | "loading" | "succeeded" | "failed";
  squareOrdersResponse: any;
  squareImportStatus: "idle" | "loading" | "succeeded" | "failed";
  Wporder: any;
  appLunched: boolean;
  iframeOpened: boolean;
  currentOrderFullFillmentId: any;
  openSheet: boolean;
  excludedOrders: any;
  replacingCode: any;
  validatedOrders: any;
  validSKU: any;
  status: "idle" | "loading" | "succeeded" | "failed"; // ✅ Add status here
  error: string | null;
  deleteOrderStatus: "idle" | "loading" | "succeeded" | "failed";
  productDataStatus: "idle" | "loading" | "succeeded" | "failed";
  recipientStatus: "idle" | "loading" | "succeeded" | "failed";
  importStatus: "idle" | "loading" | "succeeded" | "failed";
  replaceCodeResult: any;
  uploadStatus: "idle" | "loading" | "succeeded" | "failed";
  replaceCodeStatus: "idle" | "loading" | "succeeded" | "failed";
  submitStatus: "idle" | "loading" | "succeeded" | "failed";
  sendOrderInfoStatus: "idle" | "loading" | "succeeded" | "failed";
  updateImageStatus: "idle" | "loading" | "succeeded" | "failed";
  isShippingLoading: boolean;

}


const initialState: OrderState = {
  orders: [],
  order: [],
  productCode: [],
  updatedValues: [],
  checkedOrders: [],
  saveOrderInfo: {},
  Wporder: [],
  myImport: {},
  appLunched: false,
  iframeOpened: false,
  orderEdited: { status: false, clicked: false, },
  status: "idle",
  submitedOrders: [],
  submitOrdersResponse: null,
  shopifyOrdersResponse: null,
  squarespaceOrdersResponse: null,
  squarespaceImportStatus: "idle",
  wixOrdersResponse: null,
  wixImportStatus: "idle",
  shippoOrdersResponse: null,
  shippoImportStatus: "idle",
  squareOrdersResponse: null,
  squareImportStatus: "idle",
  validSKU: [],
  validatedOrders: {},
  error: null,
  currentOrderFullFillmentId: null,
  replacingCode: false,
  excludedOrders: [],
  productDataStatus: "idle",
  recipientStatus: "idle",
  deleteOrderStatus: "idle",
  importStatus: "idle",
  openSheet: false,
  replaceCodeResult: [],
  uploadStatus: "idle",
  replaceCodeStatus: "idle",
  submitStatus: "idle",
  sendOrderInfoStatus: "idle",
  updateImageStatus: "idle",
  isShippingLoading: false,
};

export const fetchOrder = createAsyncThunk(
  "order/fetch",
  async (accountId: number, thunkAPI) => {
    const response = await fetch(BASE_URL + "view-all-orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ accountId: accountId, page: 1, limit: 50 })
    });
    const data = response.json();

    console.log('data...', data)
    return data;
  },
);

export const fetchSingleOrderDetails = createAsyncThunk(
  "order/fetch/single",
  async (postData: any, thunkAPI) => {
    console.log('postData...', postData)

    const response = await fetch(BASE_URL + "view-order-details", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(postData)
    });
    const data = response.json();
    return data;
  },
);

export const updateOrdersInfo = createAsyncThunk(
  "order/update",
  async (postData: any, thunkAPI) => {
    console.log('pospos', postData)

    // Fix the data structure to properly handle the input format
    let Data;

    // Check what format the data is coming in
    if (Array.isArray(postData) && postData.length > 1 && postData[1].customerId) {
      // Format from BottomIcon.tsx: [updatedValues, {customerId: id}]
      const orderData = postData[0];
      const customerId = postData[1].customerId;

      // If orderData is already an array of orders
      if (Array.isArray(orderData)) {
        Data = {
          "accountId": customerId,
          "orders": orderData
        };
      }
      // If orderData is a single order object
      else {
        Data = {
          "accountId": customerId,
          "orders": [orderData]
        };
      }
    }
    // Format from EditOrder.tsx where we send {updatedValues: [...], customerId: ...}
    else if (postData.updatedValues && postData.customerId) {
      Data = {
        "accountId": postData.customerId,
        "orders": postData.updatedValues
      };
    }
    // If the format doesn't match any expected pattern, log an error and use as is
    else {
      console.error("Unexpected data format for updateOrdersInfo:", postData);
      // Try to adapt to whatever format is provided
      if (Array.isArray(postData) && postData.length > 0) {
        Data = {
          "accountId": postData[1]?.customerId,
          "orders": Array.isArray(postData[0]) ? postData[0] : [postData[0]]
        };
      } else {
        Data = postData;
      }
    }

    // Ensure state_code is always a string — the backend schema rejects null
    if (Data?.orders && Array.isArray(Data.orders)) {
      Data.orders = Data.orders.map((o: any) => {
        if (o?.recipient) {
          return {
            ...o,
            recipient: {
              ...o.recipient,
              state_code: o.recipient.state_code ?? "",
            },
          };
        }
        return o;
      });
    }

    console.log('Sending to API:', Data);

    try {
      const response = await fetch(BASE_URL + "update-orders", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(Data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('API error:', errorData);
        return thunkAPI.rejectWithValue(errorData);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('API call failed:', error);
      return thunkAPI.rejectWithValue('Failed to update orders');
    }
  },
);

export const AddProductToOrder = createAsyncThunk(
  "order/addProduct",
  async (postData: any, thunkAPI) => {
    postData = {
      "orderFullFillmentId": postData.orderFullFillmentId,
      "productCode": postData.productCode,
      "skuCode": postData.skuCode,
      "pixel_width": postData.pixel_width,
      "pixel_height": postData.pixel_height,
      "product_url_file": postData.product_url_file,
      "product_url_thumbnail": postData.product_url_thumbnail,
      "account_key": postData.account_key,
      "product_guid": postData.product_guid,

    }
    console.log('pepee', postData)
    try {
      const response = await fetch(BASE_URL + "update-order-by-product", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(postData),
      });
      if (!response.ok) {
        const error = await response.json()
        return thunkAPI.rejectWithValue(error)
      }
      const data = await response.json();
      return data;
    } catch (error) {
      return thunkAPI.rejectWithValue(error)
    }

  },
);

export const CreateOrder = createAsyncThunk(
  "order/create",
  async (postData: any, thunkAPI) => {
    console.log('postData...', postData)

    const SendData = {
      ...postData?.data[0],
      "recipient": postData?.recipient,
      "thumbnailUrl": postData?.data[0].thumbnail_url,
      "shipping_code": "GD",
      "accountId": 1556
    }
    const response = await fetch(BASE_URL + "create-new-order", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(SendData),
    });
    const data = await response.json();
    return data;
  },
);




export const saveOrder = createAsyncThunk(
  "order/save",
  async (postData: any, thunkAPI) => {
    const response = await fetch(BASE_URL + "upload-orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(postData),
    });
    const data = await response.json();
    return data;
  },
);

export const saveShopifyOrder = createAsyncThunk(
  "order/save/shopify",
  async (postData: any, thunkAPI) => {
    const response = await fetch(BASE_URL + "upload-orders-shopify", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(postData),
    });
    const data = await response.json();
    return data;
  },
);

export const saveUserProfile = createAsyncThunk(
  "user/save",
  async (postData: any, thunkAPI) => {
    const response = await fetch(BASE_URL + "upload-orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(postData),
    });
    const data = await response.json();
    return data;
  },
);

export const deleteOrder = createAsyncThunk(
  "order/delete",
  async (postData: { orderFullFillmentId: string | string[], accountId: number }, thunkAPI) => {

    const sendData = {
      "orderFullFillmentId": postData.orderFullFillmentId,
      "accountId": postData.accountId
    }
    const response = await fetch(BASE_URL + "delete-order", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(sendData),
    });
    const data = await response.json();
    return data;
  },
);


export const fetchWporder = createAsyncThunk(
  "order/fetch/wporder",
  async (postData: any, thunkAPI) => {
    const sendData = {
      "orderIds": Array.isArray(postData?.orderId) ? postData?.orderId : [postData?.orderId],
      "accountId": postData?.accountId,
      "domainName": postData?.domainName
    }
    console.log('Sending to API for fetchWporder:', sendData, 'platformName:', postData.platformName);
    try {
      const response = await fetch(BASE_URL + `get-order-details-by-id?platformName=${postData.platformName}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(sendData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('API error in fetchWporder:', errorData);
        return thunkAPI.rejectWithValue(errorData);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('API call failed in fetchWporder:', error);
      return thunkAPI.rejectWithValue('Failed to fetch WP order');
    }
  },
);

export const fetchShopifyOrders = createAsyncThunk(
  "order/fetch/shopify",
  async (postData: { shop: string; access_token: string; startDate: string; endDate: string; status?: string }, thunkAPI) => {
    console.log('Fetching Shopify orders with:', postData);
    try {
      const response = await fetch('https://dwe8rzhebf.execute-api.us-east-1.amazonaws.com/Prod/api/shopify/orders', {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(postData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('API error in fetchShopifyOrders:', errorData);
        return thunkAPI.rejectWithValue(errorData);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('API call failed in fetchShopifyOrders:', error);
      return thunkAPI.rejectWithValue('Failed to fetch Shopify orders');
    }
  },
);

export const fetchShopifyOrderByName = createAsyncThunk(
  "order/fetch/shopify/byname",
  async (postData: { shop: string; access_token: string; orderName: string }, thunkAPI) => {
    console.log('Fetching Shopify order by name:', postData);
    try {
      const response = await fetch('https://dwe8rzhebf.execute-api.us-east-1.amazonaws.com/Prod/api/shopify/order-by-name', {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(postData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('API error in fetchShopifyOrderByName:', errorData);
        return thunkAPI.rejectWithValue(errorData);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('API call failed in fetchShopifyOrderByName:', error);
      return thunkAPI.rejectWithValue('Failed to fetch Shopify order by name');
    }
  },
);


export const fetchSquarespaceOrders = createAsyncThunk(
  "order/fetch/squarespace",
  async (
    postData: {
      access_token: string;
      startDate: string;
      endDate: string;
      fulfillmentStatus?: string;
    },
    thunkAPI
  ) => {
    console.log('Fetching Squarespace orders with:', postData);
    try {
      const response = await fetch(
        'https://d7z22w3j4h.execute-api.us-east-1.amazonaws.com/Prod/api/squarespace/orders',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(postData),
        }
      );

      const data = await response.json();

      // Detect token expiry: HTTP 401 or explicit error indicators
      if (
        response.status === 401 ||
        data?.error === 'AUTHENTICATION_ERROR' ||
        data?.message?.toLowerCase().includes('unauthorized') ||
        data?.message?.toLowerCase().includes('token') ||
        data?.code === 'AUTHENTICATION_ERROR'
      ) {
        console.warn('⚠️ [Squarespace] Access token expired or invalid.');
        return thunkAPI.rejectWithValue({ tokenExpired: true, message: data?.message || 'Token expired' });
      }

      if (!response.ok) {
        console.error('API error in fetchSquarespaceOrders:', data);
        return thunkAPI.rejectWithValue(data);
      }

      return data;
    } catch (error) {
      console.error('API call failed in fetchSquarespaceOrders:', error);
      return thunkAPI.rejectWithValue('Failed to fetch Squarespace orders');
    }
  }
);

export const fetchSquarespaceOrderByNumber = createAsyncThunk(
  "order/fetch/squarespace/bynumber",
  async (postData: { access_token: string; orderNumber: string }, thunkAPI) => {
    console.log('Fetching Squarespace order by number:', postData);
    try {
      const response = await fetch('https://d7z22w3j4h.execute-api.us-east-1.amazonaws.com/Prod/api/squarespace/order-by-number', {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(postData)
      });

      const data = await response.json();

      if (
        response.status === 401 ||
        data?.error === 'AUTHENTICATION_ERROR' ||
        data?.message?.toLowerCase().includes('unauthorized') ||
        data?.message?.toLowerCase().includes('token') ||
        data?.code === 'AUTHENTICATION_ERROR'
      ) {
        console.warn('⚠️ [Squarespace] Access token expired or invalid.');
        return thunkAPI.rejectWithValue({ tokenExpired: true, message: data?.message || 'Token expired' });
      }

      if (!response.ok) {
        console.error('API error in fetchSquarespaceOrderByNumber:', data);
        return thunkAPI.rejectWithValue(data);
      }

      return data;
    } catch (error) {
      console.error('API call failed in fetchSquarespaceOrderByNumber:', error);
      return thunkAPI.rejectWithValue('Failed to fetch Squarespace order by number');
    }
  },
);

export const fetchWixOrders = createAsyncThunk(
  "order/fetch/wix",
  async (
    postData: {
      account_key: string;
      access_token: string;
      start_date: string;
      end_date: string;
      fulfillmentStatus?: string;
    },
    thunkAPI
  ) => {
    console.log('Fetching Wix orders with:', postData);
    try {
      let url = `https://d7z22w3j4h.execute-api.us-east-1.amazonaws.com/Prod/api/wix/orders?account_key=${postData.account_key}&access_token=${postData.access_token}&start_date=${postData.start_date}&end_date=${postData.end_date}`;
      if (postData.fulfillmentStatus) {
        url += `&fulfillment_status=${postData.fulfillmentStatus}`;
      }
      const response = await fetch(url, { method: 'POST' });
      const data = await response.json();

      if (!response.ok) {
        console.error('API error in fetchWixOrders:', data);
        return thunkAPI.rejectWithValue(data);
      }

      return data;
    } catch (error) {
      console.error('API call failed in fetchWixOrders:', error);
      return thunkAPI.rejectWithValue('Failed to fetch Wix orders');
    }
  }
);

export const fetchWixOrderByNumber = createAsyncThunk(
  "order/fetch/wix/bynumber",
  async (
    postData: {
      account_key: string;
      access_token: string;
      order_numbers: string[];
    },
    thunkAPI
  ) => {
    console.log('Fetching Wix order by number:', postData);
    try {
      const orderNumbersEncoded = encodeURIComponent(JSON.stringify(postData.order_numbers));
      const url = `https://d7z22w3j4h.execute-api.us-east-1.amazonaws.com/Prod/api/wix/order-by-number?account_key=${postData.account_key}&access_token=${postData.access_token}&order_number=${orderNumbersEncoded}`;
      const response = await fetch(url, { method: 'POST' });
      const data = await response.json();

      if (!response.ok) {
        console.error('API error in fetchWixOrderByNumber:', data);
        return thunkAPI.rejectWithValue(data);
      }

      return data;
    } catch (error) {
      console.error('API call failed in fetchWixOrderByNumber:', error);
      return thunkAPI.rejectWithValue('Failed to fetch Wix order by number');
    }
  }
);

// ── Shippo / Etsy orders ──────────────────────────────────────────────────────
export const fetchShippoOrders = createAsyncThunk(
  "order/fetch/shippo",
  async (
    postData: {
      account_key: string;
      status?: string;
      page?: number;
      results?: number;
    },
    thunkAPI
  ) => {
    console.log('Fetching Shippo orders with:', postData);
    try {
      const response = await fetch(
        'https://d7z22w3j4h.execute-api.us-east-1.amazonaws.com/Prod/api/shippo/orders',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            account_key: postData.account_key,
            status: postData.status || 'PAID',
            page: postData.page || 1,
            results: postData.results || 25,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        console.error('API error in fetchShippoOrders:', data);
        return thunkAPI.rejectWithValue(data);
      }

      return data;
    } catch (error) {
      console.error('API call failed in fetchShippoOrders:', error);
      return thunkAPI.rejectWithValue('Failed to fetch Shippo orders');
    }
  }
);

// ── Square orders ─────────────────────────────────────────────────────────────
export const fetchSquareOrders = createAsyncThunk(
  "order/fetch/square",
  async (
    postData: {
      account_key: string;
      start_date?: string;
      end_date?: string;
      status?: string;
      limit?: number;
    },
    thunkAPI
  ) => {
    console.log('Fetching Square orders with:', postData);
    try {
      const response = await fetch(
        'https://d7z22w3j4h.execute-api.us-east-1.amazonaws.com/Prod/api/square/orders',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(postData),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        console.error('API error in fetchSquareOrders:', data);
        return thunkAPI.rejectWithValue(data);
      }

      return data;
    } catch (error) {
      console.error('API call failed in fetchSquareOrders:', error);
      return thunkAPI.rejectWithValue('Failed to fetch Square orders');
    }
  }
);


export const DeleteAllOrders = createAsyncThunk(
  "order/delete/all",
  async (postData: any, thunkAPI) => {
    postData = {
      "accountId": postData.accountId
    }
    const response = await fetch(BASE_URL + "soft-delete-after-payment", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(postData),
    });
    const data = await response.json();
    return data;
  },

);

export const UploadOrdersExcel = createAsyncThunk("order/upload", async (postdata: any, thunkAPI) => {
  const response = await fetch(BASE_URL + "upload-orders-from-excel", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(postdata),

  });
  const data = await response.json()
  return data

})

export const updateProductValidSKU = createAsyncThunk("order/update/validSKU", async (postData: any, thunkAPI) => {
  const response = await fetch(BASE_URL + "update-order-by-valid-product-sku", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(postData),
  })
  const data = await response.json()
  return data
},
);

export const submitOrders = createAsyncThunk("order/submit", async (postData: any, thunkAPI) => {
  const response = await fetch(BASE_URL + "submit-orders-v2", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(postData),
  })
  if (!response.ok) {
    const errorData = await response.json()
    return thunkAPI.rejectWithValue(errorData)
  }
  const data = await response.json()
  return data
})

export const submitShopifyOrders = createAsyncThunk("order/submit/shopify", async (postData: any, thunkAPI) => {
  try {
    const response = await fetch("https://dwe8rzhebf.execute-api.us-east-1.amazonaws.com/Prod/api/fulfill-order", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(postData),
    })

    if (!response.ok) {
      const errorData = await response.json()
      return thunkAPI.rejectWithValue(errorData)
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error('Failed to submit Shopify orders:', error);
    return thunkAPI.rejectWithValue('Failed to submit Shopify orders');
  }
})

export const sendOrderInformation = createAsyncThunk(
  "order/sendOrderInformation",
  async (postData: {
    domainName: string;
    account_key: string;
    webhook_order_status_url: string;
    orders: Array<{
      order_po: string;
      order_id: number;
      order_confirmation_id: number;
      orderFullFillmentId: number;
      datetime: string;
    }>
  }, thunkAPI) => {
    try {
      const response = await fetch("https://dwe8rzhebf.execute-api.us-east-1.amazonaws.com/Prod/api/send-order-information", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(postData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        return thunkAPI.rejectWithValue(errorData);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Failed to send order information:', error);
      return thunkAPI.rejectWithValue('Failed to send order information');
    }
  }
)

export const updateOrderItemImage = createAsyncThunk(
  "order/updateOrderItemImage",
  async (postData: {
    order_po: string;
    orderFullFillmentId: number;
    product_sku: string;
    product_image: {
      pixel_width: number;
      pixel_height: number;
      product_url_file: string;
      product_url_thumbnail: string;
    };
    account_key: string;
    accountId: number;
  }, thunkAPI) => {
    try {
      const response = await fetch("https://dwe8rzhebf.execute-api.us-east-1.amazonaws.com/Prod/api/update-order-item-image", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(postData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        return thunkAPI.rejectWithValue(errorData);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Failed to update order item image:', error);
      return thunkAPI.rejectWithValue('Failed to update order item image');
    }
  }
)


// curl --location 'https://ijbsrphg08.execute-api.us-east-1.amazonaws.com/Prod/api/validate-orders' \
export const validateOrders = createAsyncThunk(
  "order/validate",
  async (postData: any, thunkAPI) => {
    try {
      const response = await fetch(BASE_URL + "validate-orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(postData),
      });

      const data = await response.json();
      console.log("datdasdsadsadasda", data);

      if (data.status === false) {
        // return full response body, not just a string
        return thunkAPI.rejectWithValue(data);
      }

      return data;

    } catch (error: any) {
      return thunkAPI.rejectWithValue({
        message: error.message || "Something went wrong",
      });
    }
  }
);

export const OrderSlice = createSlice({
  name: "order",
  initialState,
  reducers: {
    addOrder: (state, action: PayloadAction<{ name: string }>) => {
      state.orders.push({
        id: state.orders.length,
        name: action.payload.name,
      })
    },
    setCurrentOrderFullFillmentId: (state, action: PayloadAction<string>) => {
      state.currentOrderFullFillmentId = action.payload;
    },
    resetOrderStatus: (state) => {
      state.status = "idle";
    },
    setShippingLoading: (state, action: PayloadAction<boolean>) => {
      state.isShippingLoading = action.payload;
    },
    resetProductDataStatus: (state) => {
      state.productDataStatus = "idle";
    },
    resetRecipientStatus: (state) => {
      state.recipientStatus = "idle";
    },
    setUpdatedValues: (state, action: PayloadAction) => {
      state.updatedValues = action.payload;
    },
    updateImport: (state, action: PayloadAction) => {
      // Merge into the existing import filter so that selecting a status
      // doesn't wipe a previously-chosen date range and vice-versa.
      state.myImport = { ...state.myImport, ...action.payload };
    },
    resetImport: (state) => {
      state.myImport = {};
    },

    updateCheckedOrders: (state, action: PayloadAction) => {
      state.checkedOrders = action.payload;
    },
    updateOrderStatus: (state: OrderState, action: PayloadAction<{ status: boolean, clicked: boolean }>) => {
      state.orderEdited = action.payload;
      console.log('state.orderEdited', state.orderEdited)
    },
    updateWporder: (state, action: PayloadAction) => {
      state.Wporder = action.payload;

    },
    resetDeleteOrderStatus: (state) => {
      state.deleteOrderStatus = "idle";
    },
    updateSubmitedOrders: (state, action: PayloadAction) => {
      state.submitedOrders = action.payload;
    },
    resetSubmitedOrders: (state) => {
      state.submitedOrders = [];
    },
    updateIframe: (state) => {
      state.iframeOpened = true
    },
    updateApp: (state, action) => {
      state.appLunched = action.payload
    },
    updateOpenSheet: (state, action) => {
      state.openSheet = action.payload
    },
    updateExcludedOrders: (state, action) => {
      state.excludedOrders = action.payload
    },
    resetExcludedOrders: (state) => {
      state.excludedOrders = []
    },
    updateValidSKU: (state, action) => {
      state.validSKU = action.payload
    },
    resetValidSKU: (state) => {
      state.validSKU = []
    },
    updateReplacingCode: (state, action) => {
      state.replacingCode = true
    },
    resetReplacingCode: (state) => {
      state.replacingCode = false
    },
    resetReplaceCodeResult: (state) => {
      state.replaceCodeResult = []
    },
    resetReplaceCodeStatus: (state) => {
      state.replaceCodeStatus = "idle"
    },
    resetSubmitStatus: (state) => {
      state.submitStatus = "idle"
    },
    resetSendOrderInfoStatus: (state) => {
      state.sendOrderInfoStatus = "idle"
    },
    resetSubmitOrdersResponse: (state) => {
      state.submitOrdersResponse = null
    },
    resetShopifyOrdersResponse: (state) => {
      state.shopifyOrdersResponse = null
    },
    resetSquarespaceOrdersResponse: (state) => {
      state.squarespaceOrdersResponse = null;
    },
    resetSquarespaceImportStatus: (state) => {
      state.squarespaceImportStatus = 'idle';
    },
    resetWixOrdersResponse: (state) => {
      state.wixOrdersResponse = null;
    },
    resetWixImportStatus: (state) => {
      state.wixImportStatus = 'idle';
    },
    resetShippoOrdersResponse: (state) => {
      state.shippoOrdersResponse = null;
    },
    resetShippoImportStatus: (state) => {
      state.shippoImportStatus = 'idle';
    },
    resetSquareOrdersResponse: (state) => {
      state.squareOrdersResponse = null;
    },
    resetSquareImportStatus: (state) => {
      state.squareImportStatus = 'idle';
    },
    resetSaveOrderInfo: (state) => {
      state.saveOrderInfo = {}
    },
    resetUpdateImageStatus: (state) => {
      state.updateImageStatus = "idle"
    }
  },
  extraReducers: (builder) => {
    builder.addCase(fetchOrder.fulfilled, (state, action) => {
      state.orders = action.payload;
      state.status = 'succeeded';
    });
    builder.addCase(fetchOrder.pending, (state, action) => {
      state.status = 'loading';
    });
    builder.addCase(fetchOrder.rejected, (state, action) => {
      state.status = 'failed';
      state.error = action.payload as string;
    });

    builder.addCase(updateOrdersInfo.fulfilled, (state, action) => {
      console.log("updateOrdersInfo.fulfilled called with:", action.payload);
      state.productCode = action.payload;
      state.orders = action.payload;
      state.recipientStatus = "succeeded";
    }
    );
    builder.addCase(updateOrdersInfo.rejected, (state, action) => {
      console.log("updateOrdersInfo.pending called with:", action.payload);
      state.recipientStatus = "failed";
    }
    );

    builder.addCase(CreateOrder.fulfilled, (state, action) => {
      state.orders = action.payload;
    }
    );

    builder.addCase(AddProductToOrder.fulfilled, (state, action) => {
      state.productDataStatus = 'succeeded';
      // Only update orders if the payload actually contains order data.
      // If the response is empty we keep the existing orders in place so the
      // list doesn't flash to the empty-state before the follow-up fetchOrder fires.
      const payloadData = action.payload?.data;
      if (Array.isArray(payloadData) && payloadData.length > 0) {
        state.orders = { data: payloadData };
      }
      // Otherwise leave state.orders unchanged — fetchOrder will refresh it shortly.
    });

    builder.addCase(AddProductToOrder.rejected, (state, action) => {
      state.productDataStatus = 'failed';
      state.error = action.payload as string;
    }
    );


    builder.addCase(saveOrder.fulfilled, (state, action) => {
      state.saveOrderInfo = action.payload;
    });

    builder.addCase(saveOrder.pending, (state, action) => {
      state.saveOrderInfo = action.payload;
    });

    builder.addCase(saveShopifyOrder.fulfilled, (state, action) => {
      state.saveOrderInfo = action.payload;
    });

    builder.addCase(saveShopifyOrder.pending, (state, action) => {
      state.saveOrderInfo = action.payload;
    });
    builder.addCase(fetchSingleOrderDetails.fulfilled, (state, action) => {
      state.order = action.payload;
    }
    );
    builder.addCase(deleteOrder.pending, (state, action) => {
      state.deleteOrderStatus = 'loading';
    }
    );
    builder.addCase(deleteOrder.fulfilled, (state, action) => {
      state.deleteOrderStatus = 'succeeded';
      state.orders = action.payload;
    }
    );

    builder.addCase(deleteOrder.rejected, (state, action) => {
      state.deleteOrderStatus = 'failed';
      state.error = action.payload as string;
    }
    );

    builder.addCase(fetchWporder.fulfilled, (state, action) => {
      state.Wporder = action.payload;
      state.importStatus = 'succeeded';
    }
    );

    builder.addCase(fetchWporder.rejected, (state, action) => {
      state.importStatus = 'failed';
      state.error = action.payload as string;
    }
    );

    builder.addCase(fetchShopifyOrders.pending, (state, action) => {
      state.importStatus = 'loading';
    }
    );

    builder.addCase(fetchShopifyOrders.fulfilled, (state, action) => {
      state.Wporder = action.payload;
      state.importStatus = 'succeeded';
    }
    );

    builder.addCase(fetchShopifyOrders.rejected, (state, action) => {
      state.importStatus = 'failed';
      state.error = action.payload as string;
    }
    );
    builder.addCase(DeleteAllOrders.fulfilled, (state, action) => {
      state.orders = action.payload;
    }
    );
    builder.addCase(UploadOrdersExcel.fulfilled, (state, action) => {
      state.orders = action.payload
      state.uploadStatus = 'succeeded';
    })
    builder.addCase(UploadOrdersExcel.pending, (state, action) => {
      state.uploadStatus = 'loading';
    })
    builder.addCase(UploadOrdersExcel.rejected, (state, action) => {
      state.uploadStatus = 'failed';
      state.error = action.payload as string;
    })
    builder.addCase(updateProductValidSKU.fulfilled, (state, action) => {
      state.orders = {
        data: Array.isArray(action.payload?.data)
          ? action.payload.data
          : Array.isArray(action.payload)
            ? action.payload
            : []
      };

      state.replaceCodeResult = action.payload;
      console.log('state.replaceCodeResult', state.replaceCodeResult)
      state.replaceCodeStatus = 'succeeded';
    })
    builder.addCase(updateProductValidSKU.rejected, (state, action) => {
      state.error = action.payload as string
      console.log('state.error', state.error)
      state.replaceCodeStatus = 'failed';
    })
    builder.addCase(submitOrders.fulfilled, (state, action) => {
      state.submitStatus = 'succeeded';
      state.submitOrdersResponse = action.payload;
    })
    builder.addCase(submitOrders.rejected, (state, action) => {
      state.submitStatus = 'failed';
      state.error = action.payload as string;
    })
    builder.addCase(submitOrders.pending, (state, action) => {
      state.submitStatus = 'loading';
    })
    builder.addCase(submitShopifyOrders.fulfilled, (state, action) => {
      state.submitStatus = 'succeeded';
      state.shopifyOrdersResponse = action.payload;
    })
    builder.addCase(submitShopifyOrders.rejected, (state, action) => {
      state.submitStatus = 'failed';
      state.error = action.payload as string;
    })
    builder.addCase(submitShopifyOrders.pending, (state, action) => {
      state.submitStatus = 'loading';
    })

    // ── Squarespace orders ──────────────────────────────────────────────────
    builder.addCase(fetchSquarespaceOrders.pending, (state) => {
      state.squarespaceImportStatus = 'loading';
    });
    builder.addCase(fetchSquarespaceOrders.fulfilled, (state, action) => {
      state.squarespaceOrdersResponse = action.payload;
      state.squarespaceImportStatus = 'succeeded';
    });
    builder.addCase(fetchSquarespaceOrders.rejected, (state, action) => {
      const payload = action.payload as any;
      if (payload?.tokenExpired) {
        state.squarespaceImportStatus = 'token_expired';
      } else {
        state.squarespaceImportStatus = 'failed';
      }
      state.error = payload?.message || (action.payload as string);
    });
    // ── Wix orders ─────────────────────────────────────────────────────────
    builder.addCase(fetchWixOrders.pending, (state) => {
      state.wixImportStatus = 'loading';
    });
    builder.addCase(fetchWixOrders.fulfilled, (state, action) => {
      state.wixOrdersResponse = action.payload;
      state.wixImportStatus = 'succeeded';
    });
    builder.addCase(fetchWixOrders.rejected, (state, action) => {
      state.wixImportStatus = 'failed';
      state.error = (action.payload as any)?.message || (action.payload as string);
    });
    // ── Shippo / Etsy orders ────────────────────────────────────────────────
    builder.addCase(fetchShippoOrders.pending, (state) => {
      state.shippoImportStatus = 'loading';
    });
    builder.addCase(fetchShippoOrders.fulfilled, (state, action) => {
      state.shippoOrdersResponse = action.payload;
      state.shippoImportStatus = 'succeeded';
    });
    builder.addCase(fetchShippoOrders.rejected, (state, action) => {
      state.shippoImportStatus = 'failed';
      state.error = (action.payload as any)?.message || (action.payload as string);
    });
    // ── Square orders ────────────────────────────────────────────────────────
    builder.addCase(fetchSquareOrders.pending, (state) => {
      state.squareImportStatus = 'loading';
    });
    builder.addCase(fetchSquareOrders.fulfilled, (state, action) => {
      state.squareOrdersResponse = action.payload;
      state.squareImportStatus = 'succeeded';
    });
    builder.addCase(fetchSquareOrders.rejected, (state, action) => {
      state.squareImportStatus = 'failed';
      state.error = (action.payload as any)?.message || (action.payload as string);
    });

    builder.addCase(sendOrderInformation.fulfilled, (state, action) => {
      state.sendOrderInfoStatus = 'succeeded';
    })
    builder.addCase(sendOrderInformation.rejected, (state, action) => {
      state.sendOrderInfoStatus = 'failed';
      state.error = action.payload as string;
    })
    builder.addCase(sendOrderInformation.pending, (state, action) => {
      state.sendOrderInfoStatus = 'loading';
    })
    builder.addCase(validateOrders.fulfilled, (state, action) => {
      state.validatedOrders = action.payload;
    })
    builder.addCase(validateOrders.rejected, (state, action) => {
      state.validatedOrders = action.payload as any;
      state.error = action.payload as string;
    })
    builder.addCase(updateOrderItemImage.pending, (state, action) => {
      state.updateImageStatus = 'loading';
    })
    builder.addCase(updateOrderItemImage.fulfilled, (state, action) => {
      state.updateImageStatus = 'succeeded';
    })
    builder.addCase(updateOrderItemImage.rejected, (state, action) => {
      state.updateImageStatus = 'failed';
      state.error = action.payload as string;
    })

  }

});

export default OrderSlice.reducer;
export const { addOrder, updateImport, updateCheckedOrders, updateOrderStatus, setUpdatedValues, resetOrderStatus, setShippingLoading, setCurrentOrderFullFillmentId, resetProductDataStatus, resetRecipientStatus, updateWporder, resetDeleteOrderStatus, updateSubmitedOrders, resetSubmitedOrders, resetImport, updateIframe, updateApp, updateOpenSheet, updateExcludedOrders, resetExcludedOrders, updateValidSKU, resetValidSKU, updateReplacingCode, resetReplacingCode, resetReplaceCodeResult, resetReplaceCodeStatus, resetSubmitStatus, resetSendOrderInfoStatus, resetSubmitOrdersResponse, resetShopifyOrdersResponse, resetSaveOrderInfo, resetUpdateImageStatus, resetSquarespaceOrdersResponse, resetSquarespaceImportStatus, resetWixOrdersResponse, resetWixImportStatus, resetShippoOrdersResponse, resetShippoImportStatus, resetSquareOrdersResponse, resetSquareImportStatus } = OrderSlice.actions;