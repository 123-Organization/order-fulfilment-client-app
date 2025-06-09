import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { HashRouter } from 'react-router-dom';
import { Provider } from "react-redux";
import { store, persistor } from "./store"; // Import persistor
import { PersistGate } from "redux-persist/integration/react"; // Import PersistGate

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
// persistor.purge()// Clear the persisted state
root.render(
  <React.StrictMode>
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <HashRouter basename="/">
          <App />
        </HashRouter>
      </PersistGate>
    </Provider>
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
