import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import config from "../../config/configs";
const BASE_URL = config.SERVER_BASE_URL;

interface PaymentState {
        payment_methods: any;
        createCustomerInfo: any;
        selectedCard: any;
        paymentToken: any;
        status: "idle" | "loading" | "succeeded" | "failed"; // ✅ Add status here
        tokenStatus: "idle" | "loading" | "succeeded" | "failed";
        error: string | null;
}

const initialState: PaymentState = {
        payment_methods: {},
        createCustomerInfo: {},
        selectedCard: "",
        paymentToken: {},
        status: "idle",
        tokenStatus: "idle",
        error: null,
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



export const getPaymentToken = createAsyncThunk(


        "payment/token",
        async (postData: any, thunkAPI) => {
                const paymentProfileId = postData.paymentProfileId;
                const response = await fetch(BASE_URL + `get-user-payment-tokens?payment_profile_id=${paymentProfileId}`, {
                        method: "GET",
                        headers: {
                                "Content-Type": "application/json",
                        },

                });
                const data = await response.json();
                return data;         
        },              
);      


export const processVaultedPayment = createAsyncThunk(
        "payment/process",
        async (postData: any, thunkAPI) => {
                const Data = {
                        paymentToken: postData.paymentToken,
                        amount: postData.amount.toFixed(2),
                        customerId: postData.customerId,
                }
                const response = await fetch(BASE_URL + "process-vaulted-payment", {
                        method: "POST",
                        headers: {
                                "Content-Type": "application/json",
                        },
                        body: JSON.stringify(Data)
                });
                const data = await response.json();
                if(data.success){
                        return data;
                }else{
                        return thunkAPI.rejectWithValue(data.message);
                }
        },
);

export const removeSelectedCard = createAsyncThunk(
        "payment/remove",
        async (postData: any, thunkAPI) => {
                const response = await fetch(BASE_URL + "remove-card", {
                        method: "POST",
                        headers: {
                                "Content-Type": "application/json",
                        },
                        body: JSON.stringify(postData)
                });
                const data = await response.json();
                if(data.success){
                        return data;
                }else{
                        return thunkAPI.rejectWithValue(data.message);
                }
        },
);

export const PaymentSlice = createSlice({
        name: "payment",
        initialState: initialState,
        reducers: {
                setSelectedCard: (state, action: PayloadAction<any>) => {
                        state.selectedCard = action.payload;
                },
                resetPaymentStatus: (state) => {
                        state.status = "idle"; // ✅ Reset status
                        state.error = null;
                    },
                    clearPaymentMethods: (state) => {
                        state.payment_methods = {};
                        state.createCustomerInfo = {};
                        state.paymentToken = {};
                        state.status = "idle";
                        state.tokenStatus = "idle";
                    },
        },
        extraReducers: (builder) => {
                builder.addCase(getPaymentMethods.fulfilled, (state, action) => {
                        state.payment_methods = action.payload;
                });

                builder.addCase(createCustomer.fulfilled, (state, action) => {
                        state.createCustomerInfo = action.payload;
                });
                
                builder.addCase(getPaymentToken.pending, (state) => {
                        state.tokenStatus = "loading";
                });
                
                builder.addCase(getPaymentToken.fulfilled, (state, action) => {
                        state.paymentToken = action.payload;
                        state.tokenStatus = "succeeded";
                });
                
                builder.addCase(getPaymentToken.rejected, (state) => {
                        state.tokenStatus = "failed";
                });
                
                builder.addCase(processVaultedPayment.pending, (state) => {
                        state.status = "loading";
                });
                
                builder.addCase(processVaultedPayment.fulfilled, (state, action) => {
                        state.status = "succeeded";
                        console.log("action.payload", action.payload);
                        // state.paymentToken = action.payload;
                });
               
                builder.addCase(processVaultedPayment.rejected, (state, action) => {
                        state.status = 'failed';
                        state.error = action.payload as string;
                });
                
                builder.addCase(removeSelectedCard.fulfilled, (state, action) => {
                        // state.status = "succeeded";
                        // console.log("action.payload", action.payload);
                });
                
                builder.addCase(removeSelectedCard.rejected, (state, action) => {
                        state.error = action.payload as string;
                });

        },
});

export default PaymentSlice;

export const { setSelectedCard, resetPaymentStatus, clearPaymentMethods } = PaymentSlice.actions;