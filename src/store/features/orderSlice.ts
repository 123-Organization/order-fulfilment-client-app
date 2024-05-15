import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import config  from "../../config/configs";
// https://github.com/vahid-nejad/redux-toolkit-example/blob/master/src/components/Add.tsx
const BASE_URL = config.SERVER_BASE_URL;

export interface Order {
  id: number;
  name: string;
}

interface OrderState {
  orders: any;
  product_details: any;
  company_info: any;
  myCompanyInfoFilled: any;
}

const initialState: OrderState = {
  orders: [],
  product_details: [],
  company_info: {},
  myCompanyInfoFilled:{}
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

export const updateCompanyInfo = createAsyncThunk(
  "company/update",
  async (postData: any,thunkAPI) => {
    
   let accountKey = {
      "account_key":"81de5dba-0300-4988-a1cb-df97dfa4e372",
      // "billing_info": {
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
  async (name: string, thunkAPI) => {
    const response = await fetch(BASE_URL+"upload-order-excel", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(

        {
          "accountId":22,
            "orders": [
              {
              "order_po": "beee-004",
              "order_key": null,
              "recipient": {
                "first_name": "Dan",
                "last_name": "Desantis",
                "company_name": "Marriott International HQ",
                "address_1": "The Westin Edmonton",
                "address_2": "10135 100 St NW",
                "address_3": null,
                "city": "Edmonton",
                "state_code": null,
                "province": "AB",
                "zip_postal_code": "T5J 0N7",
                "country_code": "ca",
                "phone": "780-426-3636",
                "email": null
              },
              "order_items": [
                {
                  
                  "product_qty": 1,
                  "product_sku": "AP1556P58353",
                  "product_image": {
                    "pixel_width": 0,
                    "pixel_height": 0,
                    "product_url_file": null,
                    "product_url_thumbnail": null
                  },
                  "title": null
                }
              ],
              "shipping_code": "GD",
              "test_mode": true
            }
          ]
          }
      ),
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
    }
  },
  extraReducers: (builder) => {
    builder.addCase(fetchOrder.fulfilled, (state, action) => {
      state.orders = action.payload;
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
  },
});

export default OrderSlice.reducer;
export const { addOrder, updateCompany } = OrderSlice.actions;