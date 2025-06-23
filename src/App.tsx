import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { UserProvider } from "./context/useAuth";
import { useAuth } from "./hooks/useAuth";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Layout from "./components/Layout";
import Whatsapp from "./pages/Whatsapp";
import Users from "./pages/Users";
import AiConfig from "./pages/AiConfig";
import { UserProfileTab } from "./components/UserProfileTab";
import { ChatsTab } from "./pages/Chat";
import Tables from "./pages/Tables";
import CreateTable from "./pages/CreateTable";
import TableRecords from "./pages/TableRecords";
import RecordForm from "./pages/RecordForm";
import EditTable from './pages/EditTable';

// Tools System imports
import ToolsDashboard from "./pages/ToolsDashboard";
import ToolsList from "./pages/ToolsList";
import ToolForm from "./pages/ToolForm";
import ToolTester from "./pages/ToolTester";

function ProtectedRoute({ children }: React.PropsWithChildren) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function DashboardPage() {
  return (
    <div>
      <h1>Dashboard</h1>
      <p>Bienvenido al dashboard de Virtual Voices</p>
    </div>
  );
}

function EquiposPage() {
  return (
    <div>
      <h1>Equipos</h1>
      <p>Gestión de equipos</p>
    </div>
  );
}

export default function App() {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  return (
    <BrowserRouter>
      <UserProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
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
            <Route path="ia" element={<AiConfig />} />
            <Route path="equipos" element={<EquiposPage />} />
            <Route path="whatsapp" element={<Whatsapp />} />
            <Route path="userProfile" element={<UserProfileTab />} />
            <Route path="tablas" element={<Tables />} />
            <Route path="tablas/nueva" element={<CreateTable />} />
            <Route path="tablas/:tableSlug" element={<TableRecords />} />
            <Route path="tablas/:tableSlug/editar" element={<EditTable />} />
            <Route path="tablas/:tableSlug/nuevo" element={<RecordForm />} />
            <Route path="tablas/:tableSlug/editar/:recordId" element={<RecordForm />} />
            
            {/* Tools System Routes */}
            <Route path="herramientas-dashboard" element={<ToolsDashboard />} />
            <Route path="herramientas" element={<ToolsList />} />
            <Route path="herramientas/nueva" element={<ToolForm />} />
            <Route path="herramientas/:toolId/editar" element={<ToolForm />} />
            <Route path="herramientas/:toolId/test" element={<ToolTester />} />
            <Route path="herramientas/tester" element={<ToolTester />} />
            
            {user.role === "Admin" && (
              <Route path="chats" element={<ChatsTab />} />
            )}
          </Route>
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </UserProvider>
    </BrowserRouter>
  );
}