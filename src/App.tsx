import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { UserProvider } from "./context/useAuth";
import { useAuth } from "./hooks/useAuth";
import Login from "./pages/Login";
import Register from "./pages/Register"; // <-- Import your Register page
import Layout from "./components/Layout";
import { WhatsappTab } from "./components/WhatsappTab";
import { UsersTab } from "./components/UsersTab"

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

/*function UsuariosPage() {
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
}*/
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
            <Route path="usuarios" element={<UsersTab />} />
            <Route path="ia" element={<IAPage />} />
            <Route path="equipos" element={<EquiposPage />} />
            <Route path="whatsapp" element={<WhatsappTab />} />
          </Route>
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </UserProvider>
    </BrowserRouter>
  );
}
