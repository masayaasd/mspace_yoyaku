import { useState, useEffect } from "react";
import axios from "axios";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Layout } from "./components/Layout/Layout";
import { Login } from "./pages/Login";
import { Dashboard } from "./pages/Dashboard";
import { Reservations } from "./pages/Reservations";
import { CreateReservation } from "./pages/CreateReservation";
import { Tables } from "./pages/Tables";
import { LineSettings } from "./pages/LineSettings";
import { Templates } from "./pages/Templates";
import { Customers } from "./pages/Customers";

const apiBase = import.meta.env.VITE_API_BASE || "/api";

const client = axios.create({
    baseURL: apiBase,
});

function App() {
    const [token, setToken] = useState<string | null>(localStorage.getItem("adminToken"));
    const [user, setUser] = useState<any>(JSON.parse(localStorage.getItem("adminUser") || "null"));

    useEffect(() => {
        if (token) {
            client.defaults.headers.common["Authorization"] = `Bearer ${token}`;
            axios.defaults.headers.common["Authorization"] = `Bearer ${token}`; // Global axios
        }
    }, [token]);

    const handleLogin = (newToken: string, newUser: any) => {
        setToken(newToken);
        setUser(newUser);
        localStorage.setItem("adminToken", newToken);
        localStorage.setItem("adminUser", JSON.stringify(newUser));
    };

    const handleLogout = () => {
        setToken(null);
        setUser(null);
        localStorage.removeItem("adminToken");
        localStorage.removeItem("adminUser");
    };

    if (!token) {
        return <Login onLoginSuccess={handleLogin} />;
    }

    return (
        <BrowserRouter>
            <Layout onLogout={handleLogout} user={user}>
                <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/reservations" element={<Reservations />} />
                    <Route path="/reservations/new" element={<CreateReservation />} />
                    <Route path="/tables" element={<Tables />} />
                    <Route path="/settings" element={<LineSettings />} />
                    <Route path="/templates" element={<Templates />} />
                    <Route path="/customers" element={<Customers />} />
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </Layout>
        </BrowserRouter>
    );
}

export default App;
