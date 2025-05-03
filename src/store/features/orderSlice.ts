import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";

import config from "../../config/configs";
import ShippingPreference from "../../pages/ShippingPreference";
import { remove, find } from "lodash";

import { click } from "@testing-library/user-event/dist/click";

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
  Wporder: any;
  currentOrderFullFillmentId: any;
  status: "idle" | "loading" | "succeeded" | "failed"; // ✅ Add status here
  error: string | null;
  deleteOrderStatus: "idle" | "loading" | "succeeded" | "failed";
  productDataStatus: "idle" | "loading" | "succeeded" | "failed";
  recipientStatus: "idle" | "loading" | "succeeded" | "failed";

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
  orderEdited: { status: false, clicked: false, },
  status: "idle",
  error: null,
  currentOrderFullFillmentId: null,
  productDataStatus: "idle",
  recipientStatus: "idle",
  deleteOrderStatus: "idle",
};

export const fetchOrder = createAsyncThunk(
  "order/fetch",
  async (accountId: number, thunkAPI) => {
    const response = await fetch(BASE_URL + "view-all-orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ accountId })
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
    const Data = {
      "accountId": "1556",
      "orders":
        [...postData]
    }
    console.log('dedeee', Data)
    const response = await fetch(BASE_URL + "update-orders", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(Data),
    });
    const data = await response.json();
    return data;
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
    const response = await fetch(BASE_URL + "update-order-by-product", {
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
      "orderFullFillmentId": postData,
      "accountId": 1556
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
    const response = await fetch(BASE_URL + `get-order-details-by-id?orderId=${postData.orderId}&platformName=${postData.platformName}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      }
    });
    const data = await response.json();
    return data;
  },
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

    updateCheckedOrders: (state, action: PayloadAction) => {
      state.checkedOrders = action.payload;
    },
    updateOrderStatus: (state: OrderState, action: PayloadAction<{status: boolean, clicked: boolean}>) => {
      state.orderEdited = action.payload;
      console.log('state.orderEdited', state.orderEdited)
    },
    updateWporder: (state, action: PayloadAction) => {
      state.Wporder = action.payload;
    },
    resetDeleteOrderStatus: (state) => {
      state.deleteOrderStatus = "idle";
    }
  },
  extraReducers: (builder) => {
    builder.addCase(fetchOrder.fulfilled, (state, action) => {
      state.orders = action.payload;
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
      state.orders = action.payload;
    }
    );

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
    }
    );

    builder.addCase(fetchWporder.rejected, (state, action) => {
      state.status = 'failed';
      state.error = action.payload as string;
    }
    );

  }

});

export default OrderSlice.reducer;
export const { addOrder, updateImport, updateCheckedOrders, updateOrderStatus, setUpdatedValues, resetOrderStatus, setCurrentOrderFullFillmentId, resetProductDataStatus, resetRecipientStatus, updateWporder, resetDeleteOrderStatus } = OrderSlice.actions;