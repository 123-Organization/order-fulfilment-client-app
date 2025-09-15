import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import config from "../../config/configs";

const BASE_URL = config.SERVER_BASE_URL;

interface ShippingState {
  shippingOptions: any[];
  shipping_preferences: any[];
  currentOption: any;
}

const initialState: ShippingState = {
  shippingOptions: [],
  shipping_preferences: [],
  currentOption: null,
};

export const fetchShippingOption = createAsyncThunk(
  "shipping/option",
  async (postData: any, thunkAPI) => {
    console.log("pdpd...", postData);
    const userAccount = {
      account_key: postData.account_key,
      orders: postData.orders.map((order: any) => ({
        order_po: order.order_po,
        order_key: null,
        recipient: order.recipient,
        order_items: order.order_items,
        shipping_code: order.shipping_code,
      })),
    };

    console.log("postData...", userAccount);

    const response = await fetch(`${BASE_URL}shipping-options`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(userAccount),
    });

    if (!response.ok) {
      throw new Error("Failed to fetch shipping options");
    }

    const data = await response.json();
    console.log("API Response Data:", data);
    return data;
  }
);

export const shipping = createSlice({
  name: "shipping",
  initialState,
  reducers: {
    updateShipping: (state, action: PayloadAction<any[]>) => {
      state.shipping_preferences = action.payload;
    },
    updateCurrentOption: (state, action: PayloadAction<any>) => {
      state.currentOption = action.payload;
    },
    removeCurrentOption: (state) => {
      state.currentOption = null;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(fetchShippingOption.fulfilled, (state, action) => {
      console.log("Fulfilled action payload:", action.payload);
      // Validate and update shipping options
      state.shippingOptions = action.payload.data || []; // Replace instead of push
    });

    builder.addCase(fetchShippingOption.rejected, (state, action) => {
      console.error("Shipping options fetch rejected:", action.error.message);
    });
  },
});

export const { updateShipping, updateCurrentOption, removeCurrentOption } = shipping.actions;
export default shipping;
