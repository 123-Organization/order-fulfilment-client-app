import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import config from "../../config/configs";

const BASE_URL = config.SERVER_BASE_URL;
interface CustomerState {
        customer_info: any;

}

const initialState: CustomerState = {
        customer_info: {},
}

export const getCustomerInfo = createAsyncThunk(
        "customer/info",
        async (_, thunkAPI) => {
                // Get the current state using thunkAPI.getState()
                const state = await thunkAPI.getState() as any;

                // Access company_info from the current state, not from initialState
                const companyInfo = state.company.company_info// Replace 'order' with the actual slice name if different

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

export const CustomerSlice = createSlice({

        name: "customer",
        initialState,
        reducers: {
        },
        extraReducers: (builder) => {
                builder.addCase(getCustomerInfo.fulfilled, (state, action) => {
                        state.customer_info = action.payload;
                });
        },
});

export default CustomerSlice;