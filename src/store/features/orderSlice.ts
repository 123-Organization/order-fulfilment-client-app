import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import config  from "../../config/configs";
// https://github.com/vahid-nejad/redux-toolkit-example/blob/master/src/components/Add.tsx
const BASE_URL = config.SERVER_BASE_URL;
const ECOMMERCE_CONNCET_URL = "https://artsafenet.com/wp-json/finerworks-media/v1/";

export interface Order {
  id: number;
  name: string;
}

interface OrderState {
  orders: any;
  product_details: any;
  company_info: any;
  myCompanyInfoFilled: any;
  myBillingInfoFilled: any;
  shippingOptions: any;
  createCustomerInfo: any;
  ecommerceConnectorgetOrderWoocommerce: any;
  ecommerceConnectorImportOrderWoocommerce: any;
  ecommerceConnectorInfo: any;
  ecommerceConnectorImportInfo: any;
  ecommerceConnectorExportInfo: any;
  ecommerceGetImportOrders: any;
  listVirtualInventory: any;
  
}

const initialState: OrderState = {
  orders: [],
  product_details: [],
  shippingOptions: [],
  company_info: {},
  myCompanyInfoFilled: {},
  myBillingInfoFilled:{},
  createCustomerInfo: {},
  ecommerceConnectorInfo: {},
  ecommerceConnectorImportInfo: {},
  ecommerceConnectorExportInfo: {},
  ecommerceConnectorgetOrderWoocommerce: {},
  ecommerceConnectorImportOrderWoocommerce: {},
  ecommerceGetImportOrders:{},
  listVirtualInventory:{},
};

export const fetchOrder = createAsyncThunk(
  "order/fetch",
  async (accountId: number,thunkAPI) => {
    const response = await fetch(BASE_URL+"view-all-orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({accountId})
    });
    const data = response.json();
    return data;
  },
);

export const fetchProductDetails = createAsyncThunk(
  "product/details",
  async (postData: any,thunkAPI) => {
    console.log('postData...',postData)
    const response = await fetch(BASE_URL+"get-product-details", {
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
  async (postData: any,thunkAPI) => {
    console.log('postData...',postData)
    
    const response = await fetch(ECOMMERCE_CONNCET_URL+"get-orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    });
    const data = response.json();
    return data;
  },
);

export const ecommerceConnector = createAsyncThunk(
  "ecommerce/connector",
  async (postData: any,thunkAPI) => {
    console.log('postData...',postData)
    
    const response = await fetch(ECOMMERCE_CONNCET_URL+"authorize?client_id="+postData.account_key, {
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
  async (postData: any,thunkAPI) => {
    console.log('postData...',postData)
    
    const response = await fetch(ECOMMERCE_CONNCET_URL+"import-products", {
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
  async (postData: any,thunkAPI) => {
    console.log('postData...',postData)
    
    const response = await fetch(ECOMMERCE_CONNCET_URL+"get-orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    });

    const data = response.json();
    return data;
  },
);

export const createCustomer = createAsyncThunk(
  "create/customer",
  async (postData: any,thunkAPI) => {
    console.log('postData...',postData)
    const response = await fetch(BASE_URL+"create-customer", {
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
  async (postData: any,thunkAPI) => {
    console.log('postData...',postData)
    const response = await fetch(BASE_URL+"list-virtual-inventory", {
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
  async (postData: any,thunkAPI) => {
    let userAccount = {
        "orders": [
            {
                "order_po": "PO_0001",
                "order_key": null,
                "recipient": {
                    "first_name": "Bob",
                    "last_name": "Ross",
                    "company_name": "Happy Little Trees, Inc",
                    "address_1": "742 Evergreen Terrace",
                    "address_2": null,
                    "address_3": null,
                    "city": "Mountain Scene",
                    "state_code": "AK",
                    "province": null,
                    "zip_postal_code": "88888",
                    "country_code": "us",
                    "phone": "555-555-5555",
                    "email": null,
                    "address_order_po": "PO_0001"
                },
                "order_items": [
                    {
                        "product_order_po": "PO_0001",
                        "product_qty": 1,
                        "product_sku": "AP1234P1234",
                        "product_image": null,
                        "product_title": "The Big Blue Mountain",
                        "template": null,
                        "product_guid": "00000000-0000-0000-0000-000000000000",
                        "custom_data_1": null,
                        "custom_data_2": null,
                        "custom_data_3": null
                    }
                ],
                "shipping_code": "SD",
                "ship_by_date": null,
                "customs_tax_info": null,
                "gift_message": null,
                "test_mode": false,
                "webhook_order_status_url": null,
                "document_url": null,
                "acct_number_ups": null,
                "acct_number_fedex": null,
                "custom_data_1": null,
                "custom_data_2": null,
                "custom_data_3": null,
                ...postData
            }
        ]
    };
    postData = {...userAccount,...{}}
    console.log('postData...',postData)
    const response = await fetch(BASE_URL+"shipping-options", {
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

export const updateCompanyInfo = createAsyncThunk(
  "company/update",
  async (postData: any,thunkAPI) => {
    
   let accountKey = {
      "account_key":"81de5dba-0300-4988-a1cb-df97dfa4e372",
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
    postData = {...accountKey,...postData}
    console.log('postData...',postData)
    const response = await fetch(BASE_URL+"update-company-information", {
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
    const response = await fetch(BASE_URL+"upload-order-excel", {
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
      });
    },
    updateCompany: (state, action: PayloadAction) => {
      state.myCompanyInfoFilled = action.payload;
    },
    updateBilling: (state, action: PayloadAction) => {
      state.myBillingInfoFilled = action.payload;
    }
  },
  extraReducers: (builder) => {
    builder.addCase(fetchOrder.fulfilled, (state, action) => {
      state.orders = action.payload;
    });

    builder.addCase(fetchShippingOption.fulfilled, (state, action) => {
      state.shippingOptions.push({[action.payload.data?.orders[0].order_po] : action.payload.data?.orders[0]});
    });

    builder.addCase(saveOrder.fulfilled, (state, action) => {
      state.orders.push(action.payload);
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

    builder.addCase(listVirtualInventory.fulfilled, (state, action) => {
      state.listVirtualInventory = action.payload;
    });

  },
});

export default OrderSlice.reducer;
export const { addOrder, updateCompany, updateBilling } = OrderSlice.actions;