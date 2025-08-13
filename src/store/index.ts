import { OrderSlice } from "./features/orderSlice";
import { configureStore } from "@reduxjs/toolkit";
import { TypedUseSelectorHook, useDispatch, useSelector } from "react-redux";
import storage from "redux-persist/lib/storage"; // defaults to localStorage for web
import { persistReducer, persistStore, FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER } from "redux-persist";
import { combineReducers } from "redux";
import { Company } from "./features/companySlice";
import ProductSlice from "./features/productSlice";
import EcommerceSlice from "./features/ecommerceSlice";
import PaymentSlice from "./features/paymentSlice";
import customerSlice from "./features/customerSlice";
import InventorySlice from "./features/InventorySlice";
import ShippingSlice from "./features/shippingSlice";

// Create a more selective persist configuration for the order slice
const orderPersistConfig = {
  key: 'order',
  storage,
  // Only persist the checkedOrders, not all orders data
  whitelist: ['checkedOrders', 'submitedOrders', 'appLunched', 'excludedOrders', 'validSKU'],
};

const shippingPersistConfig = {
  key: 'shipping',
  storage,
  whitelist: ['shippingOptions', 'currentOption',],
};

// Create a persist configuration for the company slice
const companyPersistConfig = {
  key: 'company',
  storage,
  whitelist: ['connectionVerificationStatus', 'hasVerifiedConnection', 'wordpress_connection_id'],
};

// Create a persist configuration for the root
const rootPersistConfig = {
  key: 'root',
  storage,
  blacklist: ['order', 'Shipping', "Inventory", "company","Payment","Ecommerce", ],
};

// Apply the nested persist config to the order slice
const persistedOrderReducer = persistReducer(orderPersistConfig, OrderSlice.reducer);
const persistedShippingReducer = persistReducer(shippingPersistConfig, ShippingSlice.reducer);
const persistedCompanyReducer = persistReducer(companyPersistConfig, Company.reducer);

// Combine your reducers with the persisted order reducer
const rootReducer = combineReducers({
  order: persistedOrderReducer,
  company: persistedCompanyReducer,
  ProductSlice: ProductSlice.reducer,
  Ecommerce: EcommerceSlice.reducer,
  Payment: PaymentSlice.reducer,
  Customer: customerSlice.reducer,
  Inventory: InventorySlice.reducer,
  Shipping: persistedShippingReducer,
});

// Create a persisted reducer for the root
const persistedReducer = persistReducer(rootPersistConfig, rootReducer);

// Configure the store with the persisted reducer
export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
});

// Persistor
export const persistor = persistStore(store);

// Redux types
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
export const useAppDispatch: () => typeof store.dispatch = useDispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;