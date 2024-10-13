import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import config from "../../config/configs";
import ShippingPreference from "../../pages/ShippingPreference";
import { remove, find } from "lodash";
import { click } from "@testing-library/user-event/dist/click";
// https://github.com/vahid-nejad/redux-toolkit-example/blob/master/src/components/Add.tsx
const BASE_URL = config.SERVER_BASE_URL;
const ECOMMERCE_CONNCET_URL = "https://artsafenet.com/wp-json/finerworks-media/v1/";

export interface Order {
  id: number;
  name: string;
}

interface IFileExport {
  hasSelected: boolean,
  fileSelected: string[]
  filterCount: string
}

interface OrderState {
  orders: any;
  product_details: any;
  company_info: any;
  myCompanyInfoFilled: any;
  myBillingInfoFilled: any;
  myImport: any;
  shippingOptions: any;
  createCustomerInfo: any;
  saveOrderInfo: any;
  ecommerceConnectorgetOrderWoocommerce: any;
  ecommerceConnectorImportOrderWoocommerce: any;
  ecommerceConnectorInfo: any;
  ecommerceConnectorImportInfo: any;
  ecommerceConnectorExportInfo: any;
  ecommerceGetImportOrders: any;
  listVirtualInventory: any;
  shipping_preferences: any;
  checkedOrders: any;
  orderEdited: any;
  listVirtualInventoryLoader: boolean;
  filterVirtualInventory: any;
  filterVirtualInventoryOption: any;
  inventorySelection: any;
  referrer: IFileExport;
  customer_info: any;
  payment_methods: any;
}

const referrer: IFileExport = {
  "hasSelected": false,
  "fileSelected": [],
  'filterCount': "100"
};

const initialState: OrderState = {
  orders: [],
  product_details: [],
  shippingOptions: [],
  checkedOrders: [],
  shipping_preferences: [],
  company_info: {},
  saveOrderInfo: {},
  myCompanyInfoFilled: {},
  myBillingInfoFilled: {},
  myImport: {},
  createCustomerInfo: {},
  ecommerceConnectorInfo: {},
  ecommerceConnectorImportInfo: {},
  ecommerceConnectorExportInfo: {},
  ecommerceConnectorgetOrderWoocommerce: {},
  ecommerceConnectorImportOrderWoocommerce: {},
  ecommerceGetImportOrders: {},
  listVirtualInventoryLoader: false,
  listVirtualInventory: {},
  filterVirtualInventory: {},
  filterVirtualInventoryOption: {},
  inventorySelection: [],
  referrer: referrer,
  orderEdited: { status: false, clicked: false },
  customer_info: {},
  payment_methods: {}

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
    return data;
  },
);

export const fetchProductDetails = createAsyncThunk(
  "product/details",
  async (postData: any, thunkAPI) => {
    console.log('postData...', postData)
    const response = await fetch(BASE_URL + "get-product-details", {
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

export const getImportOrders = createAsyncThunk(
  "import/order",
  async (postData: any, thunkAPI) => {
    console.log('postData...', postData)

    const response = await fetch(ECOMMERCE_CONNCET_URL + "get-orders", {
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

export const ecommerceConnector = createAsyncThunk(
  "ecommerce/connector",
  async (postData: any, thunkAPI) => {
    console.log('postData...', postData)

    const response = await fetch(ECOMMERCE_CONNCET_URL + "authorize?client_id=" + postData.account_key, {
      headers: {
        "Content-Type": "application/json",
      },
    });
    const data = response.json();
    return data;
  },
);

export const ecommerceConnectorExport = createAsyncThunk(
  "ecommerce/connector/export",
  async (postData: any, thunkAPI) => {
    console.log('postData...', postData)

    const response = await fetch(ECOMMERCE_CONNCET_URL + "import-products", {
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


export const ecommerceConnectorImport = createAsyncThunk(
  "ecommerce/connector/import",
  async (postData: any, thunkAPI) => {
    console.log('postData...', postData)

    const response = await fetch(ECOMMERCE_CONNCET_URL + "get-orders", {
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

export const createCustomer = createAsyncThunk(
  "create/customer",
  async (postData: any, thunkAPI) => {
    console.log('postData...', postData)
    const response = await fetch(BASE_URL + "create-customer", {
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

export const listVirtualInventory = createAsyncThunk(
  "list/virtual/inventory",
  async (postData: any, thunkAPI) => {
    console.log('postData...', postData)
    // OrderAddSlice.reducer.updateFilterVirtualInventoryOption(postData);
    const response = await fetch(BASE_URL + "list-virtual-inventory", {
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


export const fetchShippingOption = createAsyncThunk(
  "shipping/option",
  async (postData: any, thunkAPI) => {
    let userAccount = {

      orders: postData.map((order) => (console.log('order...', order.order_items), {
        order_po: order.order_po,
        "order_key": null,
        recipient: {
          first_name: "Bob",
          last_name: "Ross",
          company_name: "Happy Little Trees, Inc",
          address_1: "742 Evergreen Terrace",
          city: "Mountain Scene",
          state_code: "AK",
          zip_postal_code: "88888",
          country_code: "us",
          phone: "555-555-5555",
          address_order_po: order.order_po
        },
        order_items: order.order_items,
        shipping_code: "SD"
      }))
    };

    console.log('postData...', userAccount);

    const response = await fetch(BASE_URL + "shipping-options", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(userAccount),
    });
    const data = await response.json();
    console.log('data...', data)
    return data;
  });

export const updateCompanyInfo = createAsyncThunk(
  "company/update",
  async (postData: any, thunkAPI) => {

    let accountKey = {
      "account_key": "81de5dba-0300-4988-a1cb-df97dfa4e372",
      // "business_info": {
      //   "first_name": "Jamess",
      //   "last_name": "Theopistos",
      //   "company_name": "FINERWORKS",
      //   "address_1": "15851 COLTON WL",
      //   "address_2": "",
      //   "address_3": null,
      //   "city": "San Antonio",
      //   "state_code": "TX",
      //   "province": "",
      //   "zip_postal_code": "78247",
      //   "country_code": "us",
      //   "phone": "2106027088",
      //   "email": "james@gmail.com",
      //   "address_order_po": "this is test"
      // }
    };
    postData = { ...accountKey, ...postData }
    console.log('postData...', postData)
    const response = await fetch(BASE_URL + "update-company-information", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(postData)
    });
    const data = response.json();
    return data;
  },
);

export const saveOrder = createAsyncThunk(
  "order/save",
  async (postData: any, thunkAPI) => {
    const response = await fetch(BASE_URL + "upload-order-excel", {
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
    const response = await fetch(BASE_URL + "upload-order-excel", {
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

export const OrderAddSlice = createSlice({
  name: "order",
  initialState,
  reducers: (create) => ({
    updateFilterVirtualInventoryOption: create.preparedReducer(
      (requestPayload: any) => {
        return { payload: requestPayload }
      },
      // action type is inferred from prepare callback
      (state, action) => {
        state.filterVirtualInventory = { ...state.filterVirtualInventoryOption, ...action.payload };
      }),
  })
});
//get customer information curl --location 'https://v59dq0jx2e.execute-api.us-east-1.amazonaws.com/Prod/api/get-info?account_key=81de5dba-0300-4988-a1cb-df97dfa4e372' \

export const getCustomerInfo = createAsyncThunk(
  "customer/info",
  async (_, thunkAPI) => {
    // Get the current state using thunkAPI.getState()
    const state = thunkAPI.getState() as any;

    // Access company_info from the current state, not from initialState
    const companyInfo = state?.order?.company_info; // Replace 'order' with the actual slice name if different

    // If companyInfo is not available, handle it (e.g., return a default value or throw an error)
    if (!companyInfo) {
      console.log("Company info is not available in the state.");
      return thunkAPI.rejectWithValue("Company info is missing.");
    }

    // Use the account_key from company info
    const accountKey = companyInfo?.account_key || "default-key";
    console.log("Company Info:", companyInfo);
    console.log("Account Key:", accountKey);

    // Fetch customer info using the account key
    const response = await fetch(BASE_URL + `get-info?account_key=${"81de5dba-0300-4988-a1cb-df97dfa4e372"}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    // Handle response
    if (!response.ok) {
      return thunkAPI.rejectWithValue("Failed to fetch customer info.");
    }

    const data = await response.json();
    console.log("Customer Info Data:", data);
    return data;
  }
);

export const getPaymentMethods = createAsyncThunk(
  //Get all the cards linked with customer

  //curl --location 'https://v59dq0jx2e.execute-api.us-east-1.amazonaws.com/Prod/api/get-customer-details?customerId=49515013953'

  "payment/methods",
  async (customerId: number, thunkAPI) => {
    // Get the current state using thunkAPI.getState()
    const state = thunkAPI.getState() as any;

    // Access company_info from the current state, not from initialState
    const companyInfo = state?.order?.company_info; // Replace 'order' with the actual slice name if different
    console.log('companyInfo...', companyInfo)

    // If companyInfo is not available, handle it (e.g., return a default value or throw an error)
    if (!companyInfo) {
      console.log("Company info is not available in the state.");
      return thunkAPI.rejectWithValue("Company info is missing.");
    }

    // Use the account_key from company info
    const accountKey = companyInfo?.account_id || "default-key";
    console.log("Company Info:", companyInfo);
    console.log("Account Key:", accountKey);
    console.log("customerId:", customerId);
    // Fetch customer info using the account key
    const response = await fetch(BASE_URL + `get-customer-details?customerId=${customerId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    // Handle response
    if (!response.ok) {
      return thunkAPI.rejectWithValue("Failed to fetch customer info.");
    }

    const data = await response.json();
    console.log("Customer Info Data:", data);
    return data;
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
      });
    },
    updateCompany: (state, action: PayloadAction) => {
      state.myCompanyInfoFilled = action.payload;
    },
    updateBilling: (state, action: PayloadAction) => {
      state.myBillingInfoFilled = action.payload;
    },
    updateImport: (state, action: PayloadAction) => {
      state.myImport = action.payload;
    },
    updateShipping: (state, action: PayloadAction) => {
      state.shipping_preferences = action.payload;
    },
    updateCheckedOrders: (state, action: PayloadAction) => {
      state.checkedOrders = action.payload;
    },
    updateOrderStatus: (state: OrderState, action: PayloadAction<boolean>) => {
      state.orderEdited = action.payload;
    },
    inventorySelectionUpdate: (state, action: PayloadAction) => {
      console.log('inventorySelectionUpdateAction', action)
      if (!find(state.inventorySelection, { sku: action?.payload?.sku })) {
        state.inventorySelection.push(action.payload);
      }
    },
    inventorySelectionClean: (state, action: PayloadAction) => {
      state.inventorySelection = [];
    },
    inventorySelectionDelete: (state, action: PayloadAction) => {
      console.log('inventorySelectionDeleteAction', action)
      remove(state.inventorySelection, { sku: action.payload?.sku })
    },
    updateFilterVirtualInventory: (state, action) => {
      state.filterVirtualInventory = { ...state.filterVirtualInventory, ...action.payload };
    },

  },
  extraReducers: (builder) => {
    builder.addCase(fetchOrder.fulfilled, (state, action) => {
      state.orders = action.payload;
    });

    builder.addCase(fetchShippingOption.fulfilled, (state, action) => {
      state.shippingOptions.push(action.payload.data);
    });

    builder.addCase(saveOrder.fulfilled, (state, action) => {
      state.saveOrderInfo = action.payload;
    });

    builder.addCase(saveOrder.pending, (state, action) => {
      state.saveOrderInfo = action.payload;
    });

    builder.addCase(fetchProductDetails.fulfilled, (state, action) => {
      state.product_details = action.payload;
    });

    builder.addCase(updateCompanyInfo.fulfilled, (state, action) => {
      state.company_info = action.payload;
    });

    builder.addCase(createCustomer.fulfilled, (state, action) => {
      state.createCustomerInfo = action.payload;
    });

    builder.addCase(ecommerceConnector.fulfilled, (state, action) => {
      state.ecommerceConnectorInfo = action.payload;
    });

    builder.addCase(ecommerceConnectorImport.fulfilled, (state, action) => {
      state.ecommerceConnectorImportInfo = action.payload;
    });

    builder.addCase(ecommerceConnectorExport.fulfilled, (state, action) => {
      state.ecommerceConnectorExportInfo = action.payload;
    });

    builder.addCase(getImportOrders.fulfilled, (state, action) => {
      state.ecommerceGetImportOrders = action.payload;
    });

    builder.addCase(getImportOrders.rejected, (state, action) => {
      state.ecommerceGetImportOrders = { data: { status: 500 } };
    });

    builder.addCase(listVirtualInventory.fulfilled, (state, action) => {
      state.listVirtualInventoryLoader = false;
      state.listVirtualInventory = action.payload;
    });

    builder.addCase(listVirtualInventory.pending, (state, action) => {
      state.listVirtualInventoryLoader = true;
    });

    builder.addCase(getCustomerInfo.fulfilled, (state, action) => {
      state.customer_info = action.payload;
    });

    builder.addCase(getPaymentMethods.fulfilled, (state, action) => {
      state.payment_methods = action.payload;
    });
  },

});

export default OrderSlice.reducer;
export const { addOrder, updateCompany, updateBilling, updateImport, inventorySelectionUpdate, inventorySelectionDelete, inventorySelectionClean, updateShipping, updateCheckedOrders, updateOrderStatus } = OrderSlice.actions;