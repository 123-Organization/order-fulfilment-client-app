import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import config from "../../config/configs";
const BASE_URL = config.SERVER_BASE_URL;

interface CompanyState {
        company_info: any;
        myCompanyInfoFilled: any;
        myBillingInfoFilled: any;
        iframeState: any;

}

const initialState: CompanyState = {
        company_info: {},
        myCompanyInfoFilled: {},
        myBillingInfoFilled: {},
        iframeState: false,
};

const getCookie = (name: string) => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop()?.split(';').shift();
    return null;
};

export const updateCompanyInfo = createAsyncThunk(
        "company/update",
        async (postData: any, thunkAPI) => {

                let accountKey = {
                        "account_key": getCookie("AccountGUID") || "default-key",
                        // "business_info": {
                        //   "first_name": "Jamess",
                        //   "last_name": "Theopistos",
                        //   "company_name": "FINERWORKS",
                        //   "address_1": "15851 COLTON WL",
                        //   "address_2": "",
                        //   "address_3": null,
                        //   "city": "San Antonio",
                        //   "state_code": "TX",
                        //   "province": "",
                        //   "zip_postal_code": "78247",
                        //   "country_code": "us",
                        //   "phone": "2106027088",
                        //   "email": "james@gmail.com",
                        //   "address_order_po": "this is test"
                        // }
                };
                postData = { ...accountKey, ...postData }
                console.log('postData...', postData)
                const response = await fetch(BASE_URL + "update-company-information", {
                        method: "PUT",
                        headers: {
                                "Content-Type": "application/json",
                        },
                        body: JSON.stringify(postData)
                });
                const data = response.json();
                return data;
        },
);


export const Company = createSlice({
        name: "company",
        initialState,
        reducers: {
                updateCompany: (state, action: PayloadAction) => {
                        console.log('updateCompanyAction', state)
                        state.myCompanyInfoFilled = action.payload;
                },
                updateBilling: (state, action: PayloadAction<any>) => {
                        state.myBillingInfoFilled = action.payload;
                },
                updateIframeState: (state, action: PayloadAction) => {
                        state.iframeState = action.payload;
                }
        },
        extraReducers: (builder) => {
                builder.addCase(updateCompanyInfo.fulfilled, (state, action) => {
                        state.company_info = action.payload;
                });
        },
});

export const { updateCompany, updateBilling, updateIframeState } = Company.actions;

