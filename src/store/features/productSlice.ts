import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import config from "../../config/configs";

const BASE_URL = config.SERVER_BASE_URL;

interface ProductState {
        product_details: any;

}

const initialState: ProductState = {
        product_details: [],
};


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

export const ProductSlice = createSlice({
        name: "product",
        initialState,
        reducers: {
        },
        extraReducers: (builder) => {
                builder.addCase(fetchProductDetails.fulfilled, (state, action) => {
                        state.product_details = action.payload;
                });
        },
});

export default ProductSlice;