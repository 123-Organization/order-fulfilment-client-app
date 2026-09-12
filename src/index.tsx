import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { HashRouter } from 'react-router-dom';
import { Provider } from "react-redux";
import { store, persistor } from "./store"; // Import persistor
import { PersistGate } from "redux-persist/integration/react"; // Import PersistGate
import posthog from 'posthog-js';

// Initialize PostHog for click tracking, session recording, and heatmaps
posthog.init('phc_uA934YCooKjshsxyYmFsneBxeUJWVixD8SxcnTTk7h5r', {
  api_host: 'https://us.i.posthog.com',
  defaults: '2026-05-30',
  person_profiles: 'identified_only',
  autocapture: true,          // Automatically captures clicks, inputs, and form submissions
  capture_pageview: true,     // Tracks every page/route change
  session_recording: {
    maskAllInputs: false,     // Set to true if you want to hide sensitive input values
  },
});

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
// persistor.purge()// Clear the persisted state
root.render(
  <Provider store={store}>
    <PersistGate loading={null} persistor={persistor}>
      <HashRouter basename="/">
        <App />
      </HashRouter>
    </PersistGate>
  </Provider>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
