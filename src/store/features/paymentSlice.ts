import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import config from "../../config/configs";
const BASE_URL = config.SERVER_BASE_URL;

interface PaymentState {
        payment_methods: any;
        createCustomerInfo: any;
        selectedCard: any;
}

const initialState: PaymentState = {
        payment_methods: {},
        createCustomerInfo: {},
        selectedCard: {},
}

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
                const data = await response.json();
                console.log('data...', data)
                return data;
        },
);

export const getPaymentMethods = createAsyncThunk(
        //Get all the cards linked with customer

        //curl --location 'https://v59dq0jx2e.execute-api.us-east-1.amazonaws.com/Prod/api/get-customer-details?customerId=49515013953'

        "payment/methods",
        async (customerId: number, thunkAPI) => {
                // Get the current state using thunkAPI.getState()

                // Access company_info from the current state, not from initialState
                const state = await thunkAPI.getState() as any;

                // Access company_info from the current state, not from initialState
                const companyInfo = state.company.company_info 

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

export const PaymentSlice = createSlice({
        name: "payment",
        initialState: initialState,
        reducers: {
                setSelectedCard: (state, action: PayloadAction<any>) => {
                        state.selectedCard = action.payload;
                },
        },
        extraReducers: (builder) => {
                builder.addCase(getPaymentMethods.fulfilled, (state, action) => {
                        state.payment_methods = action.payload;
                });

                builder.addCase(createCustomer.fulfilled, (state, action) => {
                        state.createCustomerInfo = action.payload;
                });

        },
});

export default PaymentSlice;

export const { setSelectedCard } = PaymentSlice.actions;