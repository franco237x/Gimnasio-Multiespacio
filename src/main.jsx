import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import LoginPage from './pages/LoginPage.jsx'
import RegisterPage from './pages/RegisterPage.jsx'
import VerifyEmail from './pages/VerifyEmail.jsx'
import ForgotPassword from './pages/ForgotPassword.jsx'
import ResetPassword from './pages/ResetPassword.jsx'
import DashboardPage from './pages/DashboardPage.jsx'
import GestionPagos from './pages/GestionPagos.jsx'
import GestionUsuarios from './pages/GestionUsuarios.jsx'
import GestionActividades from './pages/GestionActividades.jsx'
import AlquileresReservas from './pages/AlquileresReservas.jsx'
import Reportes from './pages/Reportes.jsx'
import Configuracion from './pages/Configuracion.jsx'
import MisClases from './pages/MisClases.jsx'
import MisAlumnos from './pages/MisAlumnos.jsx'
import MisCuotas from './pages/MisCuotas.jsx'
import MisReservas from './pages/MisReservas.jsx'
import MiPerfil from './pages/MiPerfil.jsx'
import Consultas from './pages/Consultas.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import { ProtectedRoute, RoleProtectedRoute, ROLES } from './components/auth/RoleProtectedRoute.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <Router>
        <Routes>
          {/* Rutas públicas */}
          <Route path="/" element={<App />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          {/* Dashboard - Ruta protegida con subrutas */}
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }>
            {/* Rutas de Administrador */}
            <Route path="usuarios" element={
              <RoleProtectedRoute allowedRoles={[ROLES.ADMINISTRADOR, ROLES.RECEPCIONISTA]}>
                <GestionUsuarios />
              </RoleProtectedRoute>
            } />
            <Route path="reportes" element={
              <RoleProtectedRoute allowedRoles={[ROLES.ADMINISTRADOR]}>
                <Reportes />
              </RoleProtectedRoute>
            } />
            <Route path="configuracion" element={
              <RoleProtectedRoute allowedRoles={[ROLES.ADMINISTRADOR]}>
                <Configuracion />
              </RoleProtectedRoute>
            } />

            {/* Rutas compartidas Admin/Recepcionista */}
            <Route path="pagos" element={
              <RoleProtectedRoute allowedRoles={[ROLES.ADMINISTRADOR, ROLES.RECEPCIONISTA]}>
                <GestionPagos />
              </RoleProtectedRoute>
            } />
            <Route path="consultas" element={
              <RoleProtectedRoute allowedRoles={[ROLES.ADMINISTRADOR, ROLES.RECEPCIONISTA]}>
                <Consultas />
              </RoleProtectedRoute>
            } />

            {/* Rutas compartidas Admin/Recepcionista/Profesor */}
            <Route path="alquileres" element={
              <RoleProtectedRoute allowedRoles={[ROLES.ADMINISTRADOR, ROLES.RECEPCIONISTA, ROLES.PROFESOR]}>
                <AlquileresReservas />
              </RoleProtectedRoute>
            } />
            <Route path="actividades" element={
              <RoleProtectedRoute allowedRoles={[ROLES.ADMINISTRADOR, ROLES.RECEPCIONISTA]}>
                <GestionActividades />
              </RoleProtectedRoute>
            } />
            {/* Rutas de Profesor */}
            <Route path="mis-clases" element={
              <RoleProtectedRoute allowedRoles={[ROLES.PROFESOR]}>
                <MisClases />
              </RoleProtectedRoute>
            } />
            <Route path="alumnos" element={
              <RoleProtectedRoute allowedRoles={[ROLES.PROFESOR]}>
                <MisAlumnos />
              </RoleProtectedRoute>
            } />

            {/* Rutas de Alumno */}
            <Route path="mis-cuotas" element={
              <RoleProtectedRoute allowedRoles={[ROLES.ALUMNO]}>
                <MisCuotas />
              </RoleProtectedRoute>
            } />
            <Route path="mis-reservas" element={
              <RoleProtectedRoute allowedRoles={[ROLES.ALUMNO]}>
                <MisReservas />
              </RoleProtectedRoute>
            } />

            {/* Perfil - Todos los usuarios autenticados */}
            <Route path="perfil" element={<MiPerfil />} />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  </StrictMode>,
)

