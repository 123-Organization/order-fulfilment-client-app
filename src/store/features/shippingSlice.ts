import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import config from "../../config/configs";
const BASE_URL = config.SERVER_BASE_URL;

interface ShippingState {
        shippingOptions: any;
        shipping_preferences: any;

}

const initialState: ShippingState = {
        shippingOptions: [],
        shipping_preferences: [],
};


export const fetchShippingOption = createAsyncThunk(
        "shipping/option",
        async (postData: any, thunkAPI) => {
                let userAccount: UserAccount = {
                        orders: postData.map((order: Order) => ({
                                order_po: order.order_po,
                                order_key: null,
                                recipient: {
                                        first_name: "Bob",
                                        last_name: "Ross",
                                        company_name: "Happy Little Trees, Inc",
                                        address_1: "742 Evergreen Terrace",
                                        city: "Mountain Scene",
                                        state_code: "AK",
                                        zip_postal_code: "88888",
                                        country_code: "us",
                                        phone: "555-555-5555",
                                        address_order_po: order.order_po
                                },
                                order_items: order.order_items,
                                shipping_code: "SD"
                        }))
                };

                interface UserAccount {
                        orders: Order[];
                }

                interface Order {
                        order_po: string;
                        order_key: string | null;
                        recipient: Recipient;
                        order_items: any;
                        shipping_code: string;
                }

                interface Recipient {
                        first_name: string;
                        last_name: string;
                        company_name: string;
                        address_1: string;
                        city: string;
                        state_code: string;
                        zip_postal_code: string;
                        country_code: string;
                        phone: string;
                        address_order_po: string;
                }

                console.log('postData...', userAccount);

                const response = await fetch(BASE_URL + "shipping-options", {
                        method: "POST",
                        headers: {
                                "Content-Type": "application/json",
                        },
                        body: JSON.stringify(userAccount),
                });
                const data = await response.json();
                console.log('data...', data)
                return data;
        });

export const shipping = createSlice({
        name: "shipping",
        initialState,
        reducers: {
                updateShipping: (state, action: PayloadAction) => {
                        state.shipping_preferences = action.payload;
                },
        },
        extraReducers: (builder) => {
                builder.addCase(fetchShippingOption.fulfilled, (state, action) => {
                        state.shippingOptions.push(action.payload.data);
                });
        },
});

export const { updateShipping } = shipping.actions;
export default shipping