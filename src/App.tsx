import React from 'react'
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { UserProvider } from './context/useAuth'
import { useAuth } from './hooks/useAuth'
import Login from './pages/Login'
import Register from './pages/Register'
import Layout from './components/Layout'
import Whatsapp from './pages/Whatsapp'
import Users from './pages/Users'
import AiConfig from './pages/AiConfig'
import { ChatsTab } from './pages/Chat'
import Tables from './pages/Tables'
import CreateTable from './pages/CreateTable'
import TableRecords from './pages/TableRecords'
import RecordForm from './pages/RecordForm'
import EditTable from './pages/EditTable'
import UserProfile from './pages/UserProfile'
import Metrics from './pages/Metrics'
import QuickLearningDashboard from './pages/QuickLearningDashboard'
import { DynamicDashboard } from './components/DynamicDashboard';
import DateFieldDebugger from './components/DateFieldDebugger';

// Tools System imports
import ToolsDashboard from './pages/ToolsDashboard'
import ToolsList from './pages/ToolsList'
import ToolForm from './pages/ToolForm'
import ToolTester from './pages/ToolTester'
import ToolsTest from './pages/ToolsTest'
import Messenger from './pages/Messenger'

function ProtectedRoute({ children }: React.PropsWithChildren) {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  return <>{children}</>
}

function QuickLearningProtectedRoute({ children }: React.PropsWithChildren) {
  const user = JSON.parse(localStorage.getItem('user') || '{}')
  console.log('QuickLearningProtectedRoute - User:', user)
  console.log('QuickLearningProtectedRoute - companySlug:', user.companySlug)
  if (user.companySlug !== 'quicklearning') {
    console.log('QuickLearningProtectedRoute - Redirecting to /')
    return <Navigate to="/" replace />
  }
  console.log('QuickLearningProtectedRoute - Rendering children')
  return <>{children}</>
}

function Dashboard() {
  const navigate = useNavigate();

  const handleTableClick = (tableSlug: string) => {
    navigate(`/tablas/${tableSlug}`);
  };

  const handleCreateTable = () => {
    navigate('/crear-tabla');
  };

  return (
    <DynamicDashboard 
      companySlug={localStorage.getItem('companySlug')!}
      onTableClick={handleTableClick}
      onCreateTable={handleCreateTable}
    />
  );
}

function EquiposPage() {
  return (
    <div>
      <h1>Equipos</h1>
      <p>Gestión de equipos</p>
    </div>
  )
}

export default function App() {
  const user = JSON.parse(localStorage.getItem('user') || '{}')
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
            <Route index element={<Metrics />} />
            <Route path="metricas" element={<Metrics />} />
            <Route path="usuarios" element={<Users />} />
            <Route path="ia" element={<AiConfig />} />
            <Route path="equipos" element={<EquiposPage />} />
            <Route path="whatsapp" element={<Whatsapp />} />
            <Route path="userProfile" element={<UserProfile />} />
            <Route path="tablas" element={<Tables />} />
            <Route path="tablas/nueva" element={<CreateTable />} />
            <Route path="tablas/:tableSlug" element={<TableRecords />} />
            <Route path="tablas/:tableSlug/editar" element={<EditTable />} />
            <Route path="tablas/:tableSlug/nuevo" element={<RecordForm />} />
            <Route path="tablas/:tableSlug/editar/:recordId" element={<RecordForm />} />
            <Route path="debug/date-field" element={<DateFieldDebugger />} />

            {/* Tools System Routes */}
            <Route path="herramientas-dashboard" element={<ToolsDashboard />} />
            <Route path="herramientas" element={<ToolsList />} />
            <Route path="herramientas/nueva" element={<ToolForm />} />
            <Route path="herramientas/:toolId/editar" element={<ToolForm />} />
            <Route path="herramientas/:toolId/test" element={<ToolTester />} />
            <Route path="herramientas/tester" element={<ToolTester />} />
            <Route path="herramientas-test" element={<ToolsTest />} />

            <Route path="chats" element={<ChatsTab />} />
            <Route path="messenger" element={<Messenger />} />
            <Route path="quicklearning/whatsapp" element={
              <QuickLearningProtectedRoute>
                <QuickLearningDashboard />
              </QuickLearningProtectedRoute>
            } />
          </Route>
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </UserProvider>
    </BrowserRouter>
  )
}
