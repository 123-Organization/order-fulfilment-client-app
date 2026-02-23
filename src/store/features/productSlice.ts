import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import config from "../../config/configs";

const BASE_URL = config.SERVER_BASE_URL;

interface ProductState {
        product_details: any;
        status: "idle" | "loading" | "succeeded" | "failed";
        error: string | null;
        quantityUpdated: boolean;
        SelectedImage: any;
        productData: any;
        images: any;
}

const initialState: ProductState = {
        product_details: [],
        status: "idle",
        error: null,
        quantityUpdated: false,
        SelectedImage: [],
        productData: null,
        images: []
};

const getCookie = (name: string) => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop()?.split(';').shift();
    return null;
};

export const fetchProductDetails = createAsyncThunk(
        "product/details",
        async (postData: any, thunkAPI) => {
                console.log('postData...', postData)
                const sendData = {
                        "products":[...postData],
                        "account_key": getCookie("AccountGUID") || "default-key"
                }
                const response = await fetch(BASE_URL + "get-product-details", {
                        method: "POST",
                        headers: {
                                "Content-Type": "application/json",
                        },
                        body: JSON.stringify(sendData)
                });
                const data = response.json();
                return data;
        },
);

export const increaseProductQuantity = createAsyncThunk(
        "product/increaseQuantity",
        async (postData: any, thunkAPI) => {
                console.log('postData...', postData)
                postData = {
                        "orderFullFillmentId": postData.orderFullFillmentId,
                        "product_guid": postData.product_guid,
                        "new_quantity": postData.new_quantity
                }
                const response = await fetch(BASE_URL + "increase-product-quantity", {
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

export const getAllImages = createAsyncThunk(
        "product/getAllImages",
        async (thunkAPI) => {
                const postData = {

                        "libraryName": "temporary",
                        "librarySessionId": "vhgetkqbwatywv3fucs4z2xk",
                        "libraryAccountKey": getCookie("AccountGUID") || "default-key",
                        "librarySiteId": "2",
                        "filterSearchFilter": "",
                        "filterPageNumber": "1",
                        "filterPerPage": "12",
                        "filterUploadFrom": "",
                        "filterUploadTo": "",
                        "filterSortField": "id",
                        "filterSortDirection": "DESC",
                        "filterUpdate": "1",
                        "GAID": "",
                        "guidPreSelected": "",
                        "libraryOptions": [
                                "temporary",
                                "inventory"
                        ],
                        "multiselectOptions": true,
                        "domain": "",
                        "terms_of_service_url": "/terms.aspx",
                        "button_text": "Create Print",
                        "account_id": 12

                }
                const accountKey = getCookie("AccountGUID") || "default-key";
                const response = await fetch("https://prod3-api.finerworks.com/api/getallimages?libraryAccountKey="+accountKey, {
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
                setQuantityUpdated: (state, action) => {
                        state.quantityUpdated = action.payload;
                },
                setSelectedImage: (state, action) => {
                        state.SelectedImage = action.payload;
                },
                clearSelectedImage: (state) => {
                        state.SelectedImage = [];
                },
                setProductData: (state, action) => {
                        state.productData = action.payload;
                },
                clearProductData: (state) => {
                        state.productData = null;
                },
                resetProductStatus: (state) => {
                        state.status = "idle";
                }
        },
	extraReducers: (builder) => {
		builder.addCase(fetchProductDetails.fulfilled, (state, action) => {
			// Merge new product details with existing ones instead of replacing
			if (state.product_details?.data?.product_list && action.payload?.data?.product_list) {
				const existingProducts = state.product_details.data.product_list;
				const newProducts = action.payload.data.product_list;
				
				// Create a map of existing products by SKU for quick lookup
				const existingSkuMap = new Map();
				existingProducts.forEach((product: any) => {
					const key = product.sku || product.product_code || product.product_guid;
					if (key) existingSkuMap.set(key, product);
				});
				
				// Add only new products that don't already exist
				newProducts.forEach((product: any) => {
					const key = product.sku || product.product_code || product.product_guid;
					if (key && !existingSkuMap.has(key)) {
						existingProducts.push(product);
					} else if (key && existingSkuMap.has(key)) {
						// Update existing product with new data
						const index = existingProducts.findIndex((p: any) => 
							(p.sku || p.product_code || p.product_guid) === key
						);
						if (index !== -1) {
							existingProducts[index] = { ...existingProducts[index], ...product };
						}
					}
				});
				
				state.product_details = {
					...action.payload,
					data: {
						...action.payload.data,
						product_list: existingProducts
					}
				};
			} else {
				// If no existing data, just set the new payload
				state.product_details = action.payload;
			}
			state.status = "succeeded";
		});
		builder.addCase(fetchProductDetails.pending, (state, action) => {
			state.status = "loading";
			// Don't overwrite product_details during pending state
		});
		builder.addCase(fetchProductDetails.rejected, (state, action) => {
			state.status = "failed";
			state.error = action.payload as string;
		});
                builder.addCase(increaseProductQuantity.fulfilled, (state, action) => {
                        state.product_details = action.payload;
                        
                        state.status = "succeeded";
                });
                builder.addCase(increaseProductQuantity.rejected, (state, action) => {
                        state.status = "failed";
                        state.error = action.payload as string;
                });
                builder.addCase(getAllImages.fulfilled, (state, action) => {
                        state.images = action.payload;
                        state.status = "succeeded";
                });
                builder.addCase(getAllImages.pending, (state, action) => {
                        state.status = "loading";
                });
               


        },
});

export const { setQuantityUpdated, setSelectedImage, setProductData, clearProductData, clearSelectedImage , resetProductStatus} = ProductSlice.actions;
export default ProductSlice;