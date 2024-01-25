import * as actionTypes from "./actionTypes"
import { createSlice, PayloadAction } from "@reduxjs/toolkit"

const initialState: actionTypes.ArticleState = {
  articles: [
    {
      id: 1,
      title: "post 1",
      body:
        "Quisque cursus, metus vitae pharetra Nam libero tempore, cum soluta nobis est eligendi",
    },
    {
      id: 2,
      title: "post 2",
      body:
        "Harum quidem rerum facilis est et expedita distinctio quas molestias excepturi sint",
    },
  ],
}

const ArticleReducer = (
  state: actionTypes.ArticleState = initialState,
  action: actionTypes.ArticleAction
): actionTypes.ArticleState => {
  switch (action.type) {
    case actionTypes.ADD_ARTICLE:
      const newArticle: actionTypes.IArticle = {
        id: Math.random(), // not really unique
        title: action.article.title,
        body: action.article.body,
      }
      return {
        ...state,
        articles: state.articles.concat(newArticle),
      }
    case actionTypes.REMOVE_ARTICLE:
      const updatedArticles: actionTypes.IArticle[] = state.articles.filter(
        article => article.id !== action.article.id
      )
      return {
        ...state,
        articles: updatedArticles,
      }
  }
  return state
}

export default ArticleReducer