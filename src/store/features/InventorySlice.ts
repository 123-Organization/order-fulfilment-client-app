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
                const response = await fetch(BASE_URL + "list-virtual-inventory", {
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
        async (args: { data: any }, thunkAPI: any) => {
                const state = await thunkAPI.getState() as any;
                args.data = {

                        "domainName": "artsafenet.com",
                        "auth_code": "f8df5ecd-6c85-4d2c-a402-676b0556c156",
                        "productsList": args.data
                }
                const response = await fetch(`https://v59dq0jx2e.execute-api.us-east-1.amazonaws.com/Prod/api/export-to-woocommerce`, {
                        method: "POST",
                        headers: {
                                "Content-Type": "application/json",
                        },
                        body: JSON.stringify(args.data)
                });
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
                                }
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
                builder.addCase(updateVirtualInventory.fulfilled, (state, action) => {
                        state.exportResponse = action.payload
                });
        },
});



export default InventorySlice;
export const { inventorySelectionUpdate, inventorySelectionClean, inventorySelectionDelete, updateFilterVirtualInventory, resetStatus } = InventorySlice.actions;
