
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

// ✅ IMPORTANT: rename to capital
import { smart_chainfundProvider as SmartProvider } from "./context/Smart_chainfund";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <SmartProvider>
      <App />
    </SmartProvider>
  </React.StrictMode>
);