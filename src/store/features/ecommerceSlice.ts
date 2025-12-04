import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import config from "../../config/configs";
const ECOMMERCE_CONNCET_URL = "https://artsafenet.com/wp-json/finerworks-media/v1/";
const BASE_URL = config.SERVER_BASE_URL;

interface EcommerceState {
        ecommerceConnectorgetOrderWoocommerce: any;
        ecommerceConnectorImportOrderWoocommerce: any;
        ecommerceConnectorInfo: any;
        ecommerceConnectorImportInfo: any;
        ecommerceConnectorExportInfo: any;
        ecommerceGetImportOrders: any;
        ecommerceDisconnectInfo: any;
        status: "idle" | "loading" | "succeeded" | "failed";
}


const initialState: EcommerceState = {
        ecommerceConnectorInfo: {},
        ecommerceConnectorImportInfo: {},
        ecommerceConnectorExportInfo: {},
        ecommerceConnectorgetOrderWoocommerce: {},
        ecommerceConnectorImportOrderWoocommerce: {},
        ecommerceGetImportOrders: {},
        ecommerceDisconnectInfo: {},
        status: "idle",
};

export const ecommerceConnector = createAsyncThunk(
        "ecommerce/connector",
        async (postData: any, thunkAPI) => {
                console.log('postData...', postData)

                const response = await fetch(ECOMMERCE_CONNCET_URL + `authorize?client_id=${postData.account_key}&redirect_uri=${"artsafenet.com"}`, {
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

export const getImportOrders = createAsyncThunk(
        "import/order",
        async (postData: any, thunkAPI) => {
                console.log('pos...', postData.domainName)

                // Ensure the domain has proper protocol
                const domainWithProtocol = postData.domainName.startsWith('http') 
                        ? postData.domainName 
                        : `https://${postData.domainName}`;

                const response = await fetch(`${domainWithProtocol}/wp-json/finerworks-media/v1/get-orders`, {
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

export const disconnectEcommerce = createAsyncThunk(
        "ecommerce/disconnect",
        async (postData: any, thunkAPI) => {
                console.log('postData...', postData)
                try {
                        const response = await fetch(BASE_URL + "disconnect", {
                                method: "POST",
                                headers: {
                                "Content-Type": "application/json",
                        },
                        body: JSON.stringify(postData)
                });
                if(!response.ok){
                        const error = await response.json()
                        return thunkAPI.rejectWithValue(error)
                }
                const data = response.json();
                return data;
                } catch (error) {
                        return thunkAPI.rejectWithValue(error);
                }
        },
);

const ecommerceSlice = createSlice({
        name: "ecommerce",
        initialState,
        reducers: {
                setStatus: (state, action) => {
                        state.status = action.payload;
                },
                resetStatus: (state) => {
                        state.status = "idle";
                },
                resetEcommerceGetImportOrders: (state) => {
                        state.ecommerceGetImportOrders = {};
                },
        },
        extraReducers: (builder) => {
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

                builder.addCase(disconnectEcommerce.fulfilled, (state, action) => {
                        state.ecommerceDisconnectInfo = action.payload;
                        state.status = "succeeded";
                });

                builder.addCase(disconnectEcommerce.rejected, (state, action) => {
                        state.ecommerceDisconnectInfo = { data: { status: 500 } };
                        state.status = "failed";
                });

        },
});

export default ecommerceSlice;
export const { resetStatus, resetEcommerceGetImportOrders } = ecommerceSlice.actions;