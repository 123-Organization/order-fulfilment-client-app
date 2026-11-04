import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import config from "../../config/configs";
import posthog from "posthog-js";

const BASE_URL = config.SERVER_BASE_URL;
interface CustomerState {
        customer_info: any;

}

const initialState: CustomerState = {
        customer_info: {},
}

// Helper function to get cookie value by name
const getCookie = (name: string) => {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop()?.split(';').shift();
        return null;
};

export const getCustomerInfo = createAsyncThunk(
        "customer/info",
        async (_, thunkAPI) => {
                // Get the current state using thunkAPI.getState()
                const state = await thunkAPI.getState() as any;

                // Access company_info from the current state, not from initialState
                const companyInfo = state.company.company_info// Replace 'order' with the actual slice name if different

                // If companyInfo is not available, handle it (e.g., return a default value or throw an error)
                if (!companyInfo) {
                        
                        return thunkAPI.rejectWithValue("Company info is missing.");
                }

                // Get cookie value directly instead of using the hook
                const accountKey = getCookie("AccountGUID") || "default-key";
                
                

                // Fetch customer info using the account key
                const response = await fetch(BASE_URL + `get-info?account_key=${accountKey}`, {
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
                
                return data;
        }
);

export const CustomerSlice = createSlice({

        name: "customer",
        initialState,
        reducers: {
                clearCustomerInfo: (state) => {
                        state.customer_info = {};
                }
        },
        extraReducers: (builder) => {
                builder.addCase(getCustomerInfo.fulfilled, (state, action) => {
                        state.customer_info = action.payload;

                        // Identify the user in PostHog using their account_key so events
                        // are searchable and filterable by account instead of anonymous ID.
                        const data = action.payload?.data;
                        if (data?.account_key) {
                                posthog.identify(
                                        data.account_key,
                                        {
                                                account_key:  data.account_key,
                                                account_id:   data.account_id   ?? null,
                                                company_name: data.company_name  ?? null,
                                                email:        data.email         ?? null,
                                        }
                                );
                        }
                });
        },
});

export default CustomerSlice;
export const { clearCustomerInfo } = CustomerSlice.actions;