import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import config from "../../config/configs";
import { remove, find } from "lodash";
const BASE_URL = config.SERVER_BASE_URL;


interface IFileExport {
        hasSelected: boolean,
        fileSelected: string[]
        filterCount: string
}

interface InventoryState {
        listVirtualInventory: any;
        listVirtualInventoryLoader: boolean;
        filterVirtualInventory: any;
        filterVirtualInventoryOption: any;
        inventorySelection: any;
        referrer: IFileExport;
        inventoryImages: any;
        status: "idle" | "loading" | "success" | "error"
        exportResponse: any;
        deleteStatus: "idle" | "loading" | "success" | "error";
        deleteError: string | null;
}

const referrer: IFileExport = {
        "hasSelected": false,
        "fileSelected": [],
        'filterCount': "100"
};

const initialState: InventoryState = {
        listVirtualInventoryLoader: false,
        listVirtualInventory: {},
        filterVirtualInventory: {},
        filterVirtualInventoryOption: {},
        inventorySelection: [],
        referrer: referrer,
        inventoryImages: {},
        status: "idle",
        exportResponse: {},
        deleteStatus: "idle",
        deleteError: null,
};
const getCookie = (name: string) => {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop()?.split(';').shift();
        return null;
};

export const OrderAddSlice = createSlice({
        name: "order",
        initialState,

        reducers: (create) => ({
                updateFilterVirtualInventoryOption: create.preparedReducer(
                        (requestPayload: any) => {
                                return { payload: requestPayload }
                        },
                        // action type is inferred from prepare callback
                        (state, action) => {
                                state.filterVirtualInventory = { ...state.filterVirtualInventoryOption, ...action.payload };
                        }),
        })
});

export const listVirtualInventory = createAsyncThunk(
        "list/virtual/inventory",
        async (postData: any, thunkAPI) => {
                console.log('postData...', postData)
                // OrderAddSlice.reducer.updateFilterVirtualInventoryOption(postData);
                const sendData = {
                        ...postData,
                        account_key: getCookie("AccountGUID")
                }
                const response = await fetch(BASE_URL + "list-virtual-inventory", {
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

export const getInventoryImages = createAsyncThunk(
        "inventory/images",
        async (args: { library: string, Page?: number }, thunkAPI: any) => {
                const state = await thunkAPI.getState() as any;

                const companyInfo = state?.order?.company_info; // Replace 'order' with the actual slice name if different
                console.log('cookie...', document.cookie.split('AccountGUID='))
                const updatedPostData = {
                        libraryName: args.library,
                        librarySessionId: document.cookie.split('Session=')[1].split(';')[0],
                        libraryAccountKey: document.cookie.split('AccountGUID=')[1].split(';')[0],
                        librarySiteId: "2",
                        filterSearchFilter: "",
                        filterPageNumber: args.Page ? args.Page : "1",
                        filterPerPage: "12",
                        filterUploadFrom: "",
                        filterUploadTo: "",
                        filterSortField: "id",
                        filterSortDirection: "DESC",
                        filterUpdate: "1",
                        GAID: "",
                        guidPreSelected: "",
                        libraryOptions: ["temporary", "inventory"],
                        multiselectOptions: true,
                        domain: "",
                        terms_of_service_url: "/terms.aspx",
                        button_text: "Create Print",
                        account_id: 12,
                };
                const response = await fetch(`https://prod3-api.finerworks.com/api/getallimages`, {
                        method: "POST",
                        headers: {
                                "Content-Type": "application/json",
                        },
                        body: JSON.stringify(updatedPostData)
                });
                const data = await response.json();
                console.log('data...', data)
                return data;
        },
);
//export orders from virtual inv https://v59dq0jx2e.execute-api.us-east-1.amazonaws.com/Prod/api/export-to-woocommerce
export const exportOrders = createAsyncThunk(
	"export/orders",
	async (args: { data: any, domainName: string }, thunkAPI: any) => {
		const state = await thunkAPI.getState() as any;
		args.data = {

			"domainName": args.domainName,
			"auth_code": "f8df5ecd-6c85-4d2c-a402-676b0556c156",
			"productsList": args.data
		}
		const response = await fetch(`${BASE_URL}export-to-woocommerce`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
		
			body: JSON.stringify(args.data)
		});
		if (!response.ok) {
			throw new Error('Failed to export orders');
		}
		const data = await response.json();
		return data;
	},
);

// Shopify API base URL
const SHOPIFY_API_URL = "https://d7z22w3j4h.execute-api.us-east-1.amazonaws.com/Prod/api/";

// Export products to Shopify
export const exportToShopify = createAsyncThunk(
	"export/shopify",
	async (args: { productsList: any[], storeName: string, accessToken: string, accountKey: string }, thunkAPI: any) => {
		const payload = {
			account_key: args.accountKey,
			productsList: args.productsList,
			storeName: args.storeName,
			access_token: args.accessToken
		};
		
		const response = await fetch(`${SHOPIFY_API_URL}shopify/sync-products`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				"Accept": "*/*",
			},
			body: JSON.stringify(payload)
		});
		
		if (!response.ok) {
			throw new Error('Failed to export products to Shopify');
		}
		
		const data = await response.json();
		return data;
	},
);

export const updateVirtualInventory = createAsyncThunk(
        "update/virtual/inventory",
        async (args: { data: any }, thunkAPI: any) => {
                console.log('args...', args)
                const info = {
                    virtual_inventory: args.data.map((data) => ({
                        "sku": data.sku,
                        "asking_price": data.asking_price,
                                "name": data.name,
                                "description": data.description,
                                "quantity_in_stock": data.quantity_in_stock,
                                "track_inventory": true,
                                "third_party_integrations": {
                                },
                                ...(data.updated && { "updated": data.updated })
                        }
                ))
                
        }
                const response = await fetch(BASE_URL + "update-virtual-inventory", {
                        method: "PUT",
                        headers: {
                                "Content-Type": "application/json",
                        },
                        body: JSON.stringify(info)
                });
                const data = await response.json();
                return data;
        },
);
export const disconnectInventory = createAsyncThunk(
        "disconnect/inventory",
        async (args: { data: any }, thunkAPI: any) => {
                const response = await fetch(BASE_URL + "disconnect-products-virtualInventory", {
                        method: "POST",
                        headers: {
                                "Content-Type": "application/json",
                        },
                        body: JSON.stringify(args.data)
                });
                if (!response.ok) {
                        throw new Error('Failed to disconnect inventory');
                }
                const data = await response.json();
                return data;
        },

);

// Delete single product from virtual inventory
export const deleteVirtualInventoryProduct = createAsyncThunk(
        "delete/virtual/inventory",
        async (args: { skus: string[], account_key?: string }, thunkAPI: any) => {
                const accountKey = args.account_key || getCookie("AccountGUID");
                const payload = {
                        skus: args.skus,
                        account_key: accountKey
                };
                
                const response = await fetch(BASE_URL + "delete-virtual-inventory", {
                        method: "DELETE",
                        headers: {
                                "Content-Type": "application/json",
                        },
                        body: JSON.stringify(payload)
                });
                
                if (!response.ok) {
                        const errorData = await response.json().catch(() => ({}));
                        throw new Error(errorData.message || 'Failed to delete product from virtual inventory');
                }
                
                const data = await response.json();
                return { ...data, deletedSkus: args.skus };
        },
);

export const InventorySlice = createSlice({
        name: "inventory",
        initialState,
	reducers: {
                inventorySelectionUpdate: (state, action: PayloadAction) => {
                        console.log('inventorySelectionUpdateAction', action)
                        if (!find(state.inventorySelection, { sku: action?.payload?.sku })) {
                                state.inventorySelection.push(action.payload);
                        }
                },
                inventorySelectionClean: (state, action: PayloadAction) => {
                        state.inventorySelection = [];
                },
                inventorySelectionDelete: (state, action: PayloadAction) => {
                        console.log('inventorySelectionDeleteAction', action)
                        remove(state.inventorySelection, { sku: action.payload?.sku })
                },
                updateFilterVirtualInventory: (state, action) => {
                        state.filterVirtualInventory = { ...state.filterVirtualInventory, ...action.payload };
                },
                resetStatus:(state) =>{
                        state.status = "idle"
                },
                resetDeleteStatus: (state) => {
                        state.deleteStatus = "idle";
                        state.deleteError = null;
                },
        },
        extraReducers: (builder) => {
                builder.addCase(listVirtualInventory.fulfilled, (state, action) => {
                        state.listVirtualInventoryLoader = false;
                        state.listVirtualInventory = action.payload;
                });

                builder.addCase(listVirtualInventory.pending, (state, action) => {
                        state.listVirtualInventoryLoader = true;
                });

                builder.addCase(getInventoryImages.fulfilled, (state, action) => {
                        state.inventoryImages = action.payload

                });
                //getInventoryImages loading
                builder.addCase(getInventoryImages.pending, (state, action) => {
                        state.inventoryImages = { loading: true }
                });
			builder.addCase(exportOrders.fulfilled, (state, action) => {
				state.status = "success"
				state.inventorySelection = action.payload
				state.exportResponse = action.payload
			});
			builder.addCase(exportOrders.pending, (state, action) => {
				state.status = "loading"
			});
			builder.addCase(exportOrders.rejected, (state, action) => {
				state.status = "error"
				state.exportResponse = action.payload
			});
			// Shopify export handlers
			builder.addCase(exportToShopify.fulfilled, (state, action) => {
				state.status = "success"
				state.exportResponse = action.payload
			});
			builder.addCase(exportToShopify.pending, (state, action) => {
				state.status = "loading"
			});
			builder.addCase(exportToShopify.rejected, (state, action) => {
				state.status = "error"
				state.exportResponse = action.payload
			});
                builder.addCase(updateVirtualInventory.fulfilled, (state, action) => {
                        state.exportResponse = action.payload
                });
                builder.addCase(disconnectInventory.fulfilled, (state, action) => {
                        state.exportResponse = action.payload
                });
                builder.addCase(disconnectInventory.pending, (state, action) => {
                        state.status = "loading"
                });
                builder.addCase(disconnectInventory.rejected, (state, action) => {
                        state.status = "error"
                        state.exportResponse = action.payload
                });
                // Delete virtual inventory product handlers
                builder.addCase(deleteVirtualInventoryProduct.fulfilled, (state, action) => {
                        state.deleteStatus = "success";
                        state.deleteError = null;
                });
                builder.addCase(deleteVirtualInventoryProduct.pending, (state, action) => {
                        state.deleteStatus = "loading";
                        state.deleteError = null;
                });
                builder.addCase(deleteVirtualInventoryProduct.rejected, (state, action) => {
                        state.deleteStatus = "error";
                        state.deleteError = action.error.message || "Failed to delete product";
                });
                        
        },

});



export default InventorySlice;
export const { inventorySelectionUpdate, inventorySelectionClean, inventorySelectionDelete, updateFilterVirtualInventory, resetStatus, resetDeleteStatus } = InventorySlice.actions;
