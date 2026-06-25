import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { tokenStore } from "./api/client";
import { Layout } from "./components/Layout";
import { Alerts } from "./pages/Alerts";
import { Dashboard } from "./pages/Dashboard";
import { Devices } from "./pages/Devices";
import { History } from "./pages/History";
import { Login } from "./pages/Login";
import { Reports } from "./pages/Reports";
import { Tracking } from "./pages/Tracking";
import { Users } from "./pages/Users";
import "./styles/app.css";

function PrivateRoute() {
  return tokenStore.get() ? <Layout /> : <Navigate to="/login" replace />;
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route element={<PrivateRoute />}>
          <Route index element={<Dashboard />} />
          <Route path="/users" element={<Users />} />
          <Route path="/devices" element={<Devices />} />
          <Route path="/tracking" element={<Tracking />} />
          <Route path="/alerts" element={<Alerts />} />
          <Route path="/history" element={<History />} />
          <Route path="/reports" element={<Reports />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
