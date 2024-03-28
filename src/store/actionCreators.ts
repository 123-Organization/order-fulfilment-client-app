import * as actionTypes from "./actionTypes"
//https://www.freecodecamp.org/news/how-to-use-redux-in-your-react-typescript-app/
type DispatchType = (args: actionTypes.ArticleAction) => actionTypes.ArticleAction
export function addArticle(article: actionTypes.IArticle) {
  const action: actionTypes.ArticleAction = {
    type: actionTypes.ADD_ARTICLE,
    article,
  }
  return simulateHttpRequest(action)
}

export function removeArticle(article: actionTypes.IArticle) {
  const action: actionTypes.ArticleAction = {
    type: actionTypes.REMOVE_ARTICLE,
    article,
  }
  return simulateHttpRequest(action)
}

export function simulateHttpRequest(action: actionTypes.ArticleAction) {
  return (dispatch: DispatchType) => {
    setTimeout(() => {
      dispatch(action)
    }, 500)
  }
}