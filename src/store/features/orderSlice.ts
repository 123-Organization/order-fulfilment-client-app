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

}


const initialState: OrderState = {
  orders: [],
  order: [],
  productCode: [],
  updatedValues: [],
  checkedOrders: [],
  saveOrderInfo: {},
  myImport: {},
  orderEdited: { status: false, clicked: false, },

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
    const Data = {
      "accountId": "1556",
      "orders":
        [...postData]
    }

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
      "skuCode": postData.skuCode
    }
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

  const SendData = {
    ...postData?.data[0],
    "recipient": postData?.recipient,
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

    setUpdatedValues: (state, action: PayloadAction) => {
      state.updatedValues = action.payload;
    },
    updateImport: (state, action: PayloadAction) => {
      state.myImport = action.payload;
    },

    updateCheckedOrders: (state, action: PayloadAction) => {
      state.checkedOrders = action.payload;
    },
    updateOrderStatus: (state: OrderState, action: PayloadAction<boolean>) => {
      state.orderEdited = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(fetchOrder.fulfilled, (state, action) => {
      state.orders = action.payload;
    });
    builder.addCase(updateOrdersInfo.fulfilled, (state, action) => {
      state.productCode = action.payload;
      state.orders = action.payload;
    }
    );

    builder.addCase(CreateOrder.fulfilled, (state, action) => {
      state.orders = action.payload;
    }
    );

    builder.addCase(AddProductToOrder.fulfilled, (state, action) => {
      state.orders = action.payload;
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

  }

});

export default OrderSlice.reducer;
export const { addOrder, updateImport, updateCheckedOrders, updateOrderStatus, setUpdatedValues } = OrderSlice.actions;