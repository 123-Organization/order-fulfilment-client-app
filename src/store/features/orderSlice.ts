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
  Wporder: any;
  appLunched: boolean;
  iframeOpened: boolean;
  currentOrderFullFillmentId: any;
  openSheet: boolean;
  excludedOrders: any;
  replacingCode: any;
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
  validSKU: [],
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
};

export const fetchOrder = createAsyncThunk(
  "order/fetch",
  async (accountId: number, thunkAPI) => {
    const response = await fetch(BASE_URL + "view-all-orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ accountId: accountId, page: 1, limit: 10 })
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
      "product_url_thumbnail": postData.product_url_thumbnail
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
  async (postData: any, thunkAPI) => {

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
  const response = await fetch( BASE_URL + "submit-orders-v2", {
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
      state.myImport = action.payload;
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
      state.orders = {
        data: Array.isArray(action.payload?.data) ? action.payload.data : []
      };
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
    })
    builder.addCase(submitOrders.rejected, (state, action) => {
      state.submitStatus = 'failed';
      state.error = action.payload as string;
    })
    builder.addCase(submitOrders.pending, (state, action) => {
      state.submitStatus = 'loading';
    })
  }

});

export default OrderSlice.reducer;
export const { addOrder, updateImport, updateCheckedOrders, updateOrderStatus, setUpdatedValues, resetOrderStatus, setCurrentOrderFullFillmentId, resetProductDataStatus, resetRecipientStatus, updateWporder, resetDeleteOrderStatus, updateSubmitedOrders, resetSubmitedOrders, resetImport, updateIframe, updateApp, updateOpenSheet, updateExcludedOrders, resetExcludedOrders, updateValidSKU, resetValidSKU, updateReplacingCode, resetReplacingCode, resetReplaceCodeResult, resetReplaceCodeStatus, resetSubmitStatus } = OrderSlice.actions;