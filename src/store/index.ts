import { OrderSlice } from "./features/orderSlice";
import { configureStore } from "@reduxjs/toolkit";
import { TypedUseSelectorHook, useDispatch, useSelector } from "react-redux";
import storage from "redux-persist/lib/storage"; // defaults to localStorage for web
import { persistReducer, persistStore } from "redux-persist";
import { combineReducers } from "redux";
import { Company } from "./features/companySlice";
import ProductSlice from "./features/productSlice";
import EcommerceSlice from "./features/ecommerceSlice";
import PaymentSlice from "./features/paymentSlice";
import customerSlice from "./features/customerSlice";
import InventorySlice from "./features/InventorySlice";
import ShippingSlice from "./features/shippingSlice";

// Create a persist configuration
const persistConfig = {
  key: 'root',  // key to store the persisted data
  storage,
  blacklist: ['order'], // Exclude 'order' slice from persistence
};

// Combine your reducers (if you have multiple slices)
const rootReducer = combineReducers({
  order: OrderSlice.reducer,
  company : Company.reducer,
  ProductSlice: ProductSlice.reducer,
  Ecommerce: EcommerceSlice.reducer,
  Payment: PaymentSlice.reducer,
  Customer: customerSlice.reducer,
  Inventory: InventorySlice.reducer,
  Shipping: ShippingSlice.reducer,
});

// Create a persisted reducer
const persistedReducer = persistReducer(persistConfig, rootReducer);

// Configure the store with the persisted reducer
export const store = configureStore({
  reducer: persistedReducer,
});

// Persistor
export const persistor = persistStore(store);

// Redux types
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
export const useAppDispatch: () => typeof store.dispatch = useDispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;