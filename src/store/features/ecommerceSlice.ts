import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import config from "../../config/configs";
const ECOMMERCE_CONNCET_URL = "https://artsafenet.com/wp-json/finerworks-med/";

interface EcommerceState {
        ecommerceConnectorgetOrderWoocommerce: any;
        ecommerceConnectorImportOrderWoocommerce: any;
        ecommerceConnectorInfo: any;
        ecommerceConnectorImportInfo: any;
        ecommerceConnectorExportInfo: any;
        ecommerceGetImportOrders: any;

}


const initialState: EcommerceState = {
        ecommerceConnectorInfo: {},
        ecommerceConnectorImportInfo: {},
        ecommerceConnectorExportInfo: {},
        ecommerceConnectorgetOrderWoocommerce: {},
        ecommerceConnectorImportOrderWoocommerce: {},
        ecommerceGetImportOrders: {},
};

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

export const getImportOrders = createAsyncThunk(
        "import/order",
        async (postData: any, thunkAPI) => {
                console.log('postData...', postData)

                const response = await fetch(" https://artsafenet.com/wp-json/finerworks-media/v1/get-orders", {
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

const ecommerceSlice = createSlice({
        name: "ecommerce",
        initialState,
        reducers: {
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

        },
});

export default ecommerceSlice;