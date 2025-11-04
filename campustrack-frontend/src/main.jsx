import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "./index.css";
import { Routes, Route } from "react-router-dom";
import ChatWindow from "./components/ChatWindow";
import AdminPage from './pages/AdminPage';

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/chat" element={<ChatWindow />} />
        <Route path="/admin" element={<AdminPage />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);

// Register service worker (PWA) when in production build
if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js').then((reg) => {
      // console.log('Service worker registered.', reg);
    }).catch((err) => {
      console.warn('Service worker registration failed:', err);
    });
  });
}
