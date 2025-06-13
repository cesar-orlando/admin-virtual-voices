import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Login from "./pages/Login";
import Layout from "./components/Layout";

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
function UsuariosPage() {
  return (
    <div style={{ padding: 40 }}>
      <h2>Usuarios</h2>
      <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 16 }}>
        <thead>
          <tr style={{ background: '#F4F6FB' }}>
            <th>Nombre</th>
            <th>Email</th>
            <th>Rol</th>
          </tr>
        </thead>
        <tbody>
          <tr><td>Orlando</td><td>orlando@virtualvoices.com</td><td>Admin</td></tr>
          <tr><td>Ana</td><td>ana@virtualvoices.com</td><td>Usuario</td></tr>
        </tbody>
      </table>
    </div>
  );
}
function IAPage() {
  return (
    <div style={{ padding: 40 }}>
      <h2>IA</h2>
      <ul>
        <li>ChatBot Ventas</li>
        <li>Asistente de Soporte</li>
        <li>Analizador de Sentimientos</li>
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
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<DashboardPage />} />
            <Route path="usuarios" element={<UsuariosPage />} />
            <Route path="ia" element={<IAPage />} />
            <Route path="equipos" element={<EquiposPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
