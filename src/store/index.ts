import { configureStore } from "@reduxjs/toolkit";
import ArticleReducer from "./ArticleReducer";
export const store = configureStore({
    reducer: {
        // article: ArticleReducer
    }
})
export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch