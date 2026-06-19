import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import config from "../../config/configs";

const BASE_URL = config.SERVER_BASE_URL;

interface ShippingState {
  shippingOptions: any[];
  shipping_preferences: any[];
  currentOption: any;
  /** Map of order_po → { fieldName: string[] } for recipient validation errors */
  recipientErrors: Record<string, Record<string, string[]>>;
  /** Map of order_po → string[] for order_items level errors (e.g. product_qty) */
  itemErrors: Record<string, string[]>;
}

const STORAGE_KEY = "fw_recipientErrors";

// Rehydrate from localStorage so errors survive page refresh
const loadPersistedErrors = (): { recipientErrors: Record<string, Record<string, string[]>>; itemErrors: Record<string, string[]> } => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { recipientErrors: {}, itemErrors: {} };
};

const persisted = loadPersistedErrors();

const initialState: ShippingState = {
  shippingOptions: [],
  shipping_preferences: [],
  currentOption: null,
  recipientErrors: persisted.recipientErrors,
  itemErrors: persisted.itemErrors,
};

export const fetchShippingOption = createAsyncThunk(
  "shipping/option",
  async (postData: any, thunkAPI) => {
    console.log("pdpd...", postData);
    // Keep an ordered list of order_pos so we can map array index → order_po
    const orderPos: string[] = postData.orders.map((o: any) => o.order_po);
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
      // Parse 400 ModelState errors so we can highlight fields per order
      try {
        const errData = await response.json();
        const modelState: Record<string, string[]> = errData?.error?.ModelState || {};

        // recipientErrors: order_po → { fieldName → messages[] }
        const recipientErrors: Record<string, Record<string, string[]>> = {};
        // itemErrors: order_po → messages[]  (any order_items level error)
        const itemErrors: Record<string, string[]> = {};

        Object.entries(modelState).forEach(([key, msgs]) => {
          const orderIdxMatch = key.match(/request\.orders\[(\d+)\]/);
          if (!orderIdxMatch) return;
          const idx = parseInt(orderIdxMatch[1], 10);
          const orderPo = orderPos[idx];
          if (!orderPo) return;

          // Recipient field errors — e.g. request.orders[N].recipient.state_code
          const recipientMatch = key.match(/request\.orders\[\d+\]\.recipient\.([\w_]+)/);
          if (recipientMatch) {
            const field = recipientMatch[1];
            if (!recipientErrors[orderPo]) recipientErrors[orderPo] = {};
            recipientErrors[orderPo][field] = msgs as string[];
            return;
          }

          // Order-items level errors — e.g. request.orders[N].order_items[M].product_qty
          const itemMatch = key.match(/request\.orders\[\d+\]\.order_items\[\d+\]\.([\w_]+)/);
          if (itemMatch) {
            if (!itemErrors[orderPo]) itemErrors[orderPo] = [];
            (msgs as string[]).forEach(m => {
              if (!itemErrors[orderPo].includes(m)) itemErrors[orderPo].push(m);
            });
          }
        });

        console.log("[shipping] recipientErrors:", recipientErrors);
        console.log("[shipping] itemErrors:", itemErrors);
        return thunkAPI.fulfillWithValue({ data: [], recipientErrors, itemErrors });
      } catch {
        return thunkAPI.rejectWithValue("Failed to fetch shipping options");
      }
    }

    const data = await response.json();
    console.log("API Response Data:", data);
    return { data: data.data || [], recipientErrors: {}, itemErrors: {} };
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
    clearOrderErrors: (state, action: PayloadAction<string>) => {
      const orderPo = action.payload;
      if (state.recipientErrors[orderPo]) {
        delete state.recipientErrors[orderPo];
      }
      if (state.itemErrors[orderPo]) {
        delete state.itemErrors[orderPo];
      }
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({
          recipientErrors: state.recipientErrors,
          itemErrors: state.itemErrors,
        }));
      } catch {}
    },
  },
  extraReducers: (builder) => {
    builder.addCase(fetchShippingOption.fulfilled, (state, action: any) => {
      console.log("Fulfilled action payload:", action.payload);
      state.shippingOptions = action.payload.data || [];
      state.recipientErrors = action.payload.recipientErrors || {};
      state.itemErrors = action.payload.itemErrors || {};
      // Persist so errors survive page refresh
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({
          recipientErrors: state.recipientErrors,
          itemErrors: state.itemErrors,
        }));
      } catch {}
    });

    builder.addCase(fetchShippingOption.rejected, (state, action) => {
      console.error("Shipping options fetch rejected:", action.error.message);
    });
  },
});

export const { updateShipping, updateCurrentOption, removeCurrentOption, clearOrderErrors } = shipping.actions;
export default shipping;
