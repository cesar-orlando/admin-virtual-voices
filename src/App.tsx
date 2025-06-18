import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { UserProvider } from "./context/useAuth";
import { useAuth } from "./hooks/useAuth";
import Login from "./pages/Login";
import Register from "./pages/Register"; // <-- Import your Register page
import Layout from "./components/Layout";
import Whatsapp from "./pages/Whatsapp";
import Users from "./pages/Users";
import { AiConfigTab } from "./components/AiConfigTab";
import { UserProfileTab } from "./components/UserProfileTab"

function ProtectedRoute({ children }: React.PropsWithChildren) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function DashboardPage() {
  return (
    <div style={{ padding: 40 }}>
      <h2>Bienvenido al Dashboard</h2>
      <p>Estadísticas rápidas:</p>
      <ul>
        <li>Usuarios activos: <b>12</b></li>
        <li>IA disponibles: <b>3</b></li>
        <li>Equipos registrados: <b>5</b></li>
      </ul>
    </div>
  );
}
function EquiposPage() {
  return (
    <div style={{ padding: 40 }}>
      <h2>Equipos</h2>
      <ul>
        <li>Equipo Alpha</li>
        <li>Equipo Beta</li>
        <li>Equipo Gamma</li>
      </ul>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <UserProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} /> {/* <-- Add this line */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<DashboardPage />} />
            <Route path="usuarios" element={<Users />} />
            <Route path="ia" element={<AiConfigTab />} />
            <Route path="equipos" element={<EquiposPage />} />
            <Route path="whatsapp" element={<Whatsapp />} />
            <Route path="/userProfile" element={<UserProfileTab />} />
          </Route>
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </UserProvider>
    </BrowserRouter>
  );
}
