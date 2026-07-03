import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { REHYDRATE } from "redux-persist";
import config from "../../config/configs";

const BASE_URL = config.SERVER_BASE_URL;

/** Per-order cached shipping result. */
interface ShippingCacheEntry {
  /** Fingerprint built from recipient + order_items + shipping_code. */
  fingerprint: string;
  data: any[];
  recipientErrors: Record<string, Record<string, string[]>>;
  itemErrors: Record<string, string[]>;
}

interface ShippingState {
  shippingOptions: any[];
  shipping_preferences: any[];
  currentOption: any;
  /** Map of order_po → { fieldName: string[] } for recipient validation errors */
  recipientErrors: Record<string, Record<string, string[]>>;
  /** Map of order_po → string[] for order_items level errors (e.g. product_qty) */
  itemErrors: Record<string, string[]>;
  /** In-memory cache of shipping results keyed by order_po. Resets on page refresh. */
  shippingCache: Record<string, ShippingCacheEntry>;
}

const STORAGE_KEY = "fw_recipientErrors";

// Rehydrate from localStorage so errors AND cache survive page refresh
const loadPersistedErrors = (): { 
  recipientErrors: Record<string, Record<string, string[]>>; 
  itemErrors: Record<string, string[]>;
  shippingCache: Record<string, ShippingCacheEntry>;
} => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        recipientErrors: parsed.recipientErrors || {},
        itemErrors: parsed.itemErrors || {},
        shippingCache: parsed.shippingCache || {}
      };
    }
  } catch {}
  return { recipientErrors: {}, itemErrors: {}, shippingCache: {} };
};

const persisted = loadPersistedErrors();

// Derive shippingOptions from the cache at startup so the initial state is
// consistent even before redux-persist fires its REHYDRATE action.
const initialShippingOptions = Object.values(persisted.shippingCache).flatMap(
  (e: ShippingCacheEntry) => e.data
);

const initialState: ShippingState = {
  shippingOptions: initialShippingOptions,
  shipping_preferences: [],
  currentOption: null,
  recipientErrors: persisted.recipientErrors,
  itemErrors: persisted.itemErrors,
  shippingCache: persisted.shippingCache,
};

// ---------------------------------------------------------------------------
// Legacy thunk — sends ALL orders in one request (kept for compatibility)
// ---------------------------------------------------------------------------
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

// ---------------------------------------------------------------------------
// Per-order thunk — sends ONE order per request.
// Results are MERGED into state (not replaced) so batched calls accumulate.
// ---------------------------------------------------------------------------
export const fetchShippingOptionSingle = createAsyncThunk(
  "shipping/optionSingle",
  async (postData: { order: any; account_key: string }, thunkAPI) => {
    const { order, account_key } = postData;
    const orderPo: string = order.order_po;

    const userAccount = {
      account_key,
      orders: [
        {
          order_po: order.order_po,
          order_key: null,
          recipient: order.recipient,
          order_items: order.order_items,
          shipping_code: order.shipping_code,
        },
      ],
    };

    console.log(`[shipping/single] Fetching order ${orderPo}`, userAccount);

    const response = await fetch(`${BASE_URL}shipping-options`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(userAccount),
    });

    if (!response.ok) {
      try {
        const errData = await response.json();
        const modelState: Record<string, string[]> = errData?.error?.ModelState || {};

        // Since there is exactly one order at index [0], mapping is trivial
        const recipientErrors: Record<string, Record<string, string[]>> = {};
        const itemErrors: Record<string, string[]> = {};

        Object.entries(modelState).forEach(([key, msgs]) => {
          // Recipient field errors — e.g. request.orders[0].recipient.state_code
          const recipientMatch = key.match(/request\.orders\[0\]\.recipient\.([\w_]+)/);
          if (recipientMatch) {
            const field = recipientMatch[1];
            if (!recipientErrors[orderPo]) recipientErrors[orderPo] = {};
            recipientErrors[orderPo][field] = msgs as string[];
            return;
          }

          // Order-items level errors — e.g. request.orders[0].order_items[M].product_qty
          const itemMatch = key.match(/request\.orders\[0\]\.order_items\[\d+\]\.([\w_]+)/);
          if (itemMatch) {
            if (!itemErrors[orderPo]) itemErrors[orderPo] = [];
            (msgs as string[]).forEach(m => {
              if (!itemErrors[orderPo].includes(m)) itemErrors[orderPo].push(m);
            });
          }
        });

        console.log(`[shipping/single] errors for ${orderPo}:`, { recipientErrors, itemErrors });
        // fulfillWithValue so the MERGE reducer still runs (and accumulates errors)
        return thunkAPI.fulfillWithValue({ data: [], recipientErrors, itemErrors });
      } catch {
        return thunkAPI.rejectWithValue(`Failed to fetch shipping options for order ${orderPo}`);
      }
    }

    const data = await response.json();
    console.log(`[shipping/single] success for ${orderPo}:`, data);
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
    /** Call this once before starting a new batch to clear stale results. */
    clearShippingOptions: (state) => {
      state.shippingOptions = [];
      state.recipientErrors = {};
      state.itemErrors = {};
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch {}
    },
    /**
     * Single synchronous action to commit ALL aggregated batch results at once.
     * Use this instead of N individual fetchShippingOptionSingle dispatches so
     * shipping_option only changes ONCE, avoiding cascading render loops.
     * (Legacy — kept for backward compat; new code uses updateShippingCacheEntries.)
     */
    setBatchShippingResults: (
      state,
      action: PayloadAction<{
        data: any[];
        recipientErrors: Record<string, Record<string, string[]>>;
        itemErrors: Record<string, string[]>;
      }>
    ) => {
      state.shippingOptions = action.payload.data;
      state.recipientErrors = action.payload.recipientErrors;
      state.itemErrors = action.payload.itemErrors;
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({
          recipientErrors: state.recipientErrors,
          itemErrors: state.itemErrors,
          shippingCache: state.shippingCache,
        }));
      } catch {}
    },
    /**
     * Merge one or more per-order shipping results into the cache, then rebuild
     * the derived shippingOptions / recipientErrors / itemErrors from the full
     * cache so the rest of the app sees a consistent view in one update.
     */
    updateShippingCacheEntries: (
      state,
      action: PayloadAction<Array<{
        order_po: string;
        fingerprint: string;
        data: any[];
        recipientErrors: Record<string, Record<string, string[]>>;
        itemErrors: Record<string, string[]>;
      }>>
    ) => {
      // Write each entry into the cache
      action.payload.forEach(entry => {
        state.shippingCache[entry.order_po] = {
          fingerprint: entry.fingerprint,
          data: entry.data,
          recipientErrors: entry.recipientErrors,
          itemErrors: entry.itemErrors,
        };
      });
      // Rebuild derived slices from the full cache
      const allEntries = Object.values(state.shippingCache);
      state.shippingOptions = allEntries.flatMap(e => e.data);
      state.recipientErrors = allEntries.reduce(
        (acc, e) => ({ ...acc, ...e.recipientErrors }),
        {} as Record<string, Record<string, string[]>>
      );
      state.itemErrors = allEntries.reduce(
        (acc, e) => ({ ...acc, ...e.itemErrors }),
        {} as Record<string, string[]>
      );
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({
          recipientErrors: state.recipientErrors,
          itemErrors: state.itemErrors,
          shippingCache: state.shippingCache,
        }));
      } catch {}
    },
    /**
     * Remove specific orders from the cache (e.g. after a product is added/removed).
     * Triggers a rebuild of all derived shipping state.
     */
    invalidateShippingCacheEntries: (state, action: PayloadAction<string[]>) => {
      action.payload.forEach(order_po => {
        delete state.shippingCache[order_po];
      });
      // Rebuild derived slices
      const allEntries = Object.values(state.shippingCache);
      state.shippingOptions = allEntries.flatMap(e => e.data);
      state.recipientErrors = allEntries.reduce(
        (acc, e) => ({ ...acc, ...e.recipientErrors }),
        {} as Record<string, Record<string, string[]>>
      );
      state.itemErrors = allEntries.reduce(
        (acc, e) => ({ ...acc, ...e.itemErrors }),
        {} as Record<string, string[]>
      );
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({
          recipientErrors: state.recipientErrors,
          itemErrors: state.itemErrors,
          shippingCache: state.shippingCache,
        }));
      } catch {}
    },
    /** Wipe the entire cache and reset all derived shipping state. */
    clearAllShippingCache: (state) => {
      state.shippingCache = {};
      state.shippingOptions = [];
      state.recipientErrors = {};
      state.itemErrors = {};
      try { localStorage.removeItem(STORAGE_KEY); } catch {}
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
          shippingCache: state.shippingCache,
        }));
      } catch {}
    });

    builder.addCase(fetchShippingOption.rejected, (state, action) => {
      console.error("Shipping options fetch rejected:", action.error.message);
    });

    // Per-order thunk — MERGE results so batched calls accumulate
    builder.addCase(fetchShippingOptionSingle.fulfilled, (state, action: any) => {
      const { data = [], recipientErrors = {}, itemErrors = {} } = action.payload;
      // Append shipping option rows
      state.shippingOptions = [...state.shippingOptions, ...data];
      // Merge errors by order_po (later calls can overwrite if same order retried)
      state.recipientErrors = { ...state.recipientErrors, ...recipientErrors };
      state.itemErrors      = { ...state.itemErrors,      ...itemErrors };
      // Persist so errors survive page refresh
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({
          recipientErrors: state.recipientErrors,
          itemErrors: state.itemErrors,
        }));
      } catch {}
    });

    builder.addCase(fetchShippingOptionSingle.rejected, (state, action) => {
      console.error("[shipping/single] rejected:", action.error.message);
    });

    // When redux-persist rehydrates the store it restores shippingCache but
    // leaves shippingOptions as [] (we no longer persist it directly).
    // Rebuild shippingOptions immediately so the UI never sees an empty array
    // while valid cache data exists.
    builder.addCase(REHYDRATE, (state, action: any) => {
      if (action.key === 'shipping' && action.payload?.shippingCache) {
        const cache: Record<string, ShippingCacheEntry> = action.payload.shippingCache;
        state.shippingCache = cache;
        state.shippingOptions = Object.values(cache).flatMap(e => e.data);
      }
    });
  },
});

export const {
  updateShipping,
  updateCurrentOption,
  removeCurrentOption,
  clearOrderErrors,
  clearShippingOptions,
  setBatchShippingResults,
  updateShippingCacheEntries,
  invalidateShippingCacheEntries,
  clearAllShippingCache,
} = shipping.actions;
export default shipping;
