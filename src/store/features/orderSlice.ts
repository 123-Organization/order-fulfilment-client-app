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
  refreshOrderStatus: "idle" | "loading" | "succeeded" | "failed";
  refreshOrderResponse: any;

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
  refreshOrderStatus: "idle",
  refreshOrderResponse: null,
};

export const fetchOrder = createAsyncThunk(
  "order/fetch",
  async (accountId: number, thunkAPI) => {
    const response = await fetch(BASE_URL + "view-all-orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ account_key: accountId, page: 1, limit: 50 })
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
    if (postData?.orders && (postData?.accountId || postData?.account_key)) {
      // Direct format: { orders: [...], accountId, account_key }
      Data = postData;
    } else if (Array.isArray(postData) && postData.length > 1 && postData[1].customerId) {
      // Format from BottomIcon.tsx: [updatedValues, {customerId: id, account_key: ...}]
      const orderData = postData[0];
      const customerId = postData[1].customerId;
      const accountKey = postData[1].account_key;

      // If orderData is already an array of orders
      if (Array.isArray(orderData)) {
        Data = {
          "accountId": customerId,
          "account_key": accountKey,
          "orders": orderData
        };
      }
      // If orderData is a single order object
      else {
        Data = {
          "accountId": customerId,
          "account_key": accountKey,
          "orders": [orderData]
        };
      }
    }
    // Format from EditOrder.tsx / ImportList.tsx where we send {updatedValues: [...], customerId: ..., account_key: ...}
    else if (postData.updatedValues && postData.customerId) {
      Data = {
        "accountId": postData.customerId,
        "account_key": postData.account_key,
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
          "account_key": postData[1]?.account_key,
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




const uploadInBatches = async (endpoint: string, postData: any, batchSize = 5) => {
  const orders = postData?.orders;

  if (Array.isArray(orders) && orders.length > batchSize) {
    const batches: any[][] = [];
    for (let i = 0; i < orders.length; i += batchSize) {
      batches.push(orders.slice(i, i + batchSize));
    }

    const batchPromises = batches.map(async (batchOrders) => {
      const payload = {
        ...postData,
        orders: batchOrders,
      };
      const response = await fetch(`https://fa-ls.finerworks.com/api/` + endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      const batchData = await response.json();
      return batchData;
    });

    const results = await Promise.all(batchPromises);

    // Aggregate counts across all batches so the notification reflects totals,
    // not just the last response (which the old spread-merge returned).
    const allImported: string[] = [];
    const allSkippedSubmitted: string[] = [];
    const allSkippedPending: string[] = [];

    results.forEach((r: any) => {
      if (Array.isArray(r?.imported_order_pos)) allImported.push(...r.imported_order_pos);
      if (Array.isArray(r?.skipped_already_submitted_order_pos)) allSkippedSubmitted.push(...r.skipped_already_submitted_order_pos);
      if (Array.isArray(r?.skipped_already_pending_order_pos)) allSkippedPending.push(...r.skipped_already_pending_order_pos);
    });

    const combinedMessage = `Orders processed: ${allImported.length} imported, ${allSkippedSubmitted.length} skipped (already a submitted order), ${allSkippedPending.length} skipped (already pending)`;

    const merged = {
      // Keep batchResults for any legacy consumers
      batchResults: results,
      // Expose aggregated fields at the top level so getUploadedCount /
      // getUploadDescription can read them the same way as a single response.
      imported_order_pos: allImported,
      skipped_already_submitted_order_pos: allSkippedSubmitted,
      skipped_already_pending_order_pos: allSkippedPending,
      message: combinedMessage,
      status: results.some((r: any) => r?.status === true),
      statusCode: 200,
    };

    return merged;
  }

  const response = await fetch(BASE_URL + endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(postData),
  });
  const data = await response.json();
  return data;
};

export const saveOrder = createAsyncThunk(
  "order/save",
  async (postData: any, thunkAPI) => {
    return await uploadInBatches("upload-orders", postData, 5);
  },
);

export const saveShopifyOrder = createAsyncThunk(
  "order/save/shopify",
  async (postData: any, thunkAPI) => {
    return await uploadInBatches("upload-orders-shopify", postData, 5);
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
  async (postData: { orderFullFillmentId: string | string[], accountId: number, account_key?: string }, thunkAPI) => {

    const sendData = {
      "orderFullFillmentId": postData.orderFullFillmentId,
      "accountId": postData.accountId,
      "account_key": postData.account_key
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
        BASE_URL + `squarespace/orders`,
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
      const response = await fetch(BASE_URL + 'squarespace/order-by-number', {
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
      let url = BASE_URL + `wix/orders?account_key=${postData.account_key}&access_token=${postData.access_token}&start_date=${postData.start_date}&end_date=${postData.end_date}`;
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
      const url = BASE_URL + `wix/order-by-number?account_key=${postData.account_key}&access_token=${postData.access_token}&order_number=${orderNumbersEncoded}`;
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
      startDate?: string;
      endDate?: string;
    },
    thunkAPI
  ) => {
    console.log('Fetching Shippo orders with:', postData);
    try {
      const body: Record<string, any> = {
        account_key: postData.account_key,
        status: postData.status || 'PAID',
        page: postData.page || 1,
        results: postData.results || 25,
      };
      if (postData.startDate) body.startDate = postData.startDate;
      if (postData.endDate) body.endDate = postData.endDate;

      const response = await fetch(
        BASE_URL + `shippo/orders`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
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

// ── Shippo / Etsy – single order by ID ───────────────────────────────────────
export const fetchShippoOrderById = createAsyncThunk(
  "order/fetch/shippo-by-id",
  async (
    postData: {
      account_key: string;
      order_numbers: string[];
    },
    thunkAPI
  ) => {
    console.log('Fetching Shippo order by ID with:', postData);
    try {
      const response = await fetch(
        BASE_URL + `shippo/order-by-id`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            account_key: postData.account_key,
            order_numbers: postData.order_numbers,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        console.error('API error in fetchShippoOrderById:', data);
        return thunkAPI.rejectWithValue(data);
      }

      return data;
    } catch (error) {
      console.error('API call failed in fetchShippoOrderById:', error);
      return thunkAPI.rejectWithValue('Failed to fetch Shippo order by ID');
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
        BASE_URL + `square/orders`,
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
      "accountId": postData.accountId,
      "account_key": postData.account_key
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

/**
 * Calls PUT update-orders with updated product_image fields.
 * Dispatched in parallel with updateProductValidSKU when replacing a non-AP product SKU.
 *
 * postData: {
 *   accountId: number,
 *   account_key: string,
 *   order: any,              // full order object from Redux state
 *   productSku: string,      // old SKU to match in order_items (used to find the right item)
 *   newProductSku: string,   // new product code/SKU to set
 *   product_url_file: string,
 *   product_url_thumbnail: string,
 *   pixel_width: number,
 *   pixel_height: number,
 * }
 */
export const updateOrderWithImage = createAsyncThunk(
  "order/updateOrderWithImage",
  async (postData: {
    accountId: number;
    account_key: string;
    order: any;
    productSku: string;
    newProductSku: string;
    product_url_file: string;
    product_url_thumbnail: string;
    pixel_width: number;
    pixel_height: number;
  }, thunkAPI) => {
    try {
      const oldSku = (postData.productSku || '').toString().toLowerCase();
      const oldGuid = oldSku.replace(/-/g, '');

      const updatedItems = (postData.order?.order_items || []).map((item: any) => {
        const itemSku = (item.product_sku || '').toString().toLowerCase();
        const itemGuid = (item.product_guid || '').toString().toLowerCase().replace(/-/g, '');
        const isMatch =
          (itemSku && oldSku && itemSku === oldSku) ||
          (itemGuid && oldGuid && itemGuid === oldGuid) ||
          (postData.order?.order_items?.length === 1);

        if (isMatch) {
          return {
            ...item,
            product_sku: postData.newProductSku || item.product_sku,
            product_image: {
              ...(item.product_image || {}),
              product_url_file: postData.product_url_file,
              product_url_thumbnail: postData.product_url_thumbnail,
              pixel_width: postData.pixel_width,
              pixel_height: postData.pixel_height,
            },
          };
        }
        return item;
      });

      const payload = {
        accountId: postData.accountId,
        account_key: postData.account_key,
        orders: [
          {
            ...postData.order,
            order_items: updatedItems,
          },
        ],
      };

      console.log("[updateOrderWithImage] Sending payload:", payload);

      const response = await fetch(BASE_URL + "update-orders", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("[updateOrderWithImage] API error:", errorData);
        return thunkAPI.rejectWithValue(errorData);
      }

      return await response.json();
    } catch (error) {
      console.error("[updateOrderWithImage] Failed:", error);
      return thunkAPI.rejectWithValue("Failed to update order with image");
    }
  }
);

export const submitOrders = createAsyncThunk("order/submit", async (postData: any, thunkAPI) => {
  const response = await fetch(`https://fa-ls.finerworks.com/api/` + "submit-orders-v2", {
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

export const refreshSingleOrder = createAsyncThunk(
  "order/refreshSingle",
  async (postData: { account_key: string; orderFullFillmentId: string | number }, thunkAPI) => {
    try {
      const response = await fetch(
        BASE_URL + "order-submit-status-bulk",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            account_key: postData.account_key,
            orderIds: [String(postData.orderFullFillmentId)],
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        return thunkAPI.rejectWithValue(errorData);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Failed to refresh order status:", error);
      return thunkAPI.rejectWithValue("Failed to refresh order status");
    }
  }
);

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

    // Remove a list of submitted orders from orders.data by order_po
    // so the import list updates instantly without a full re-fetch.
    removeSubmittedOrders: (state, action: PayloadAction<string[]>) => {
      const submittedPos = new Set(action.payload);
      if (state.orders?.data && Array.isArray(state.orders.data)) {
        state.orders.data = state.orders.data.filter(
          (order: any) => !submittedPos.has(order.order_po)
        );
      }
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
    },
    resetRefreshOrderStatus: (state) => {
      state.refreshOrderStatus = "idle";
      state.refreshOrderResponse = null;
    },
    /**
     * Optimistically update a single order-item's quantity in Redux state
     * without triggering a full fetchOrder re-fetch.
     * Payload: { orderFullFillmentId: string, product_guid: string, new_quantity: number }
     */
    patchOrderItemQuantity: (
      state,
      action: PayloadAction<{ orderFullFillmentId: string; product_guid: string; new_quantity: number }>
    ) => {
      const { orderFullFillmentId, product_guid, new_quantity } = action.payload;
      if (!state.orders?.data) return;
      const order = state.orders.data.find(
        (o: any) => o.orderFullFillmentId === orderFullFillmentId
      );
      if (!order) return;
      const item = order.order_items?.find(
        (i: any) => i.product_guid === product_guid
      );
      if (item) {
        item.product_qty = new_quantity;
      }
    },
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
      // Remove the deleted order(s) directly from state.orders.data using the
      // orderFullFillmentId that was already supplied to the thunk.
      // This avoids a follow-up fetchOrder (view-all-orders) call entirely.
      if (state.orders?.data) {
        const deletedIds = Array.isArray(action.meta.arg.orderFullFillmentId)
          ? action.meta.arg.orderFullFillmentId
          : [action.meta.arg.orderFullFillmentId];
        state.orders.data = state.orders.data.filter(
          (order: any) => !deletedIds.includes(order.orderFullFillmentId)
        );
      }
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
    // ── Shippo / Etsy – single order by ID ─────────────────────────────────
    builder.addCase(fetchShippoOrderById.pending, (state) => {
      state.shippoImportStatus = 'loading';
    });
    builder.addCase(fetchShippoOrderById.fulfilled, (state, action) => {
      state.shippoOrdersResponse = action.payload;
      state.shippoImportStatus = 'succeeded';
    });
    builder.addCase(fetchShippoOrderById.rejected, (state, action) => {
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

    // ── Single order status refresh ────────────────────────────────────────
    builder.addCase(refreshSingleOrder.pending, (state) => {
      state.refreshOrderStatus = 'loading';
    });
    builder.addCase(refreshSingleOrder.fulfilled, (state, action) => {
      state.refreshOrderStatus = 'succeeded';
      state.refreshOrderResponse = action.payload;
    });
    builder.addCase(refreshSingleOrder.rejected, (state, action) => {
      state.refreshOrderStatus = 'failed';
      state.error = action.payload as string;
    });

  }

});

export default OrderSlice.reducer;
export const { addOrder, updateImport, updateCheckedOrders, updateOrderStatus, setUpdatedValues, resetOrderStatus, setShippingLoading, setCurrentOrderFullFillmentId, resetProductDataStatus, resetRecipientStatus, updateWporder, resetDeleteOrderStatus, updateSubmitedOrders, resetSubmitedOrders, resetImport, removeSubmittedOrders, updateIframe, updateApp, updateOpenSheet, updateExcludedOrders, resetExcludedOrders, updateValidSKU, resetValidSKU, updateReplacingCode, resetReplacingCode, resetReplaceCodeResult, resetReplaceCodeStatus, resetSubmitStatus, resetSendOrderInfoStatus, resetSubmitOrdersResponse, resetShopifyOrdersResponse, resetSaveOrderInfo, resetUpdateImageStatus, resetSquarespaceOrdersResponse, resetSquarespaceImportStatus, resetWixOrdersResponse, resetWixImportStatus, resetShippoOrdersResponse, resetShippoImportStatus, resetSquareOrdersResponse, resetSquareImportStatus, patchOrderItemQuantity, resetRefreshOrderStatus } = OrderSlice.actions;