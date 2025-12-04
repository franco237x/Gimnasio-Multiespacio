import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import LoginPage from './pages/LoginPage.jsx'
import RegisterPage from './pages/RegisterPage.jsx'
import DashboardPage from './pages/DashboardPage.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import { ProtectedRoute, RoleProtectedRoute, ROLES } from './components/auth/RoleProtectedRoute.jsx'

// Página temporal para rutas en desarrollo
const ComingSoon = ({ title }) => (
  <div style={{ 
    padding: '40px', 
    textAlign: 'center', 
    color: '#9ca3af' 
  }}>
    <h2 style={{ color: '#ffffff', marginBottom: '16px' }}>{title}</h2>
    <p>Esta sección está en desarrollo.</p>
  </div>
);

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <Router>
        <Routes>
          {/* Rutas públicas */}
          <Route path="/" element={<App />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          
          {/* Dashboard - Ruta protegida con subrutas */}
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }>
            {/* Rutas de Administrador */}
            <Route path="usuarios" element={
              <RoleProtectedRoute allowedRoles={[ROLES.ADMINISTRADOR]}>
                <ComingSoon title="Gestionar Usuarios" />
              </RoleProtectedRoute>
            } />
            <Route path="profesores" element={
              <RoleProtectedRoute allowedRoles={[ROLES.ADMINISTRADOR]}>
                <ComingSoon title="Gestionar Profesores" />
              </RoleProtectedRoute>
            } />
            <Route path="reportes" element={
              <RoleProtectedRoute allowedRoles={[ROLES.ADMINISTRADOR]}>
                <ComingSoon title="Reportes" />
              </RoleProtectedRoute>
            } />
            <Route path="configuracion" element={
              <RoleProtectedRoute allowedRoles={[ROLES.ADMINISTRADOR]}>
                <ComingSoon title="Configuración" />
              </RoleProtectedRoute>
            } />

            {/* Rutas compartidas Admin/Recepcionista */}
            <Route path="cuotas" element={
              <RoleProtectedRoute allowedRoles={[ROLES.ADMINISTRADOR, ROLES.RECEPCIONISTA]}>
                <ComingSoon title="Gestión de Cuotas" />
              </RoleProtectedRoute>
            } />
            <Route path="alta-cuotas" element={
              <RoleProtectedRoute allowedRoles={[ROLES.ADMINISTRADOR, ROLES.RECEPCIONISTA]}>
                <ComingSoon title="Alta de Cuotas" />
              </RoleProtectedRoute>
            } />
            <Route path="comprobantes" element={
              <RoleProtectedRoute allowedRoles={[ROLES.ADMINISTRADOR, ROLES.RECEPCIONISTA]}>
                <ComingSoon title="Generar Comprobante" />
              </RoleProtectedRoute>
            } />
            <Route path="consultas" element={
              <RoleProtectedRoute allowedRoles={[ROLES.ADMINISTRADOR, ROLES.RECEPCIONISTA]}>
                <ComingSoon title="Consultas" />
              </RoleProtectedRoute>
            } />

            {/* Rutas compartidas Admin/Recepcionista/Profesor */}
            <Route path="actividades" element={
              <RoleProtectedRoute allowedRoles={[ROLES.ADMINISTRADOR, ROLES.PROFESOR]}>
                <ComingSoon title="Gestionar Actividades" />
              </RoleProtectedRoute>
            } />
            <Route path="alquileres" element={
              <RoleProtectedRoute allowedRoles={[ROLES.ADMINISTRADOR, ROLES.RECEPCIONISTA, ROLES.PROFESOR]}>
                <ComingSoon title="Alquileres y Reservas" />
              </RoleProtectedRoute>
            } />

            {/* Rutas de Profesor */}
            <Route path="mis-clases" element={
              <RoleProtectedRoute allowedRoles={[ROLES.PROFESOR]}>
                <ComingSoon title="Mis Clases" />
              </RoleProtectedRoute>
            } />
            <Route path="alumnos" element={
              <RoleProtectedRoute allowedRoles={[ROLES.PROFESOR]}>
                <ComingSoon title="Mis Alumnos" />
              </RoleProtectedRoute>
            } />

            {/* Rutas de Alumno */}
            <Route path="mis-cuotas" element={
              <RoleProtectedRoute allowedRoles={[ROLES.ALUMNO]}>
                <ComingSoon title="Mis Cuotas" />
              </RoleProtectedRoute>
            } />
            <Route path="mis-reservas" element={
              <RoleProtectedRoute allowedRoles={[ROLES.ALUMNO]}>
                <ComingSoon title="Mis Reservas" />
              </RoleProtectedRoute>
            } />
            <Route path="informacion" element={
              <RoleProtectedRoute allowedRoles={[ROLES.ALUMNO]}>
                <ComingSoon title="Ver Información" />
              </RoleProtectedRoute>
            } />

            {/* Perfil - Todos los usuarios autenticados */}
            <Route path="perfil" element={<ComingSoon title="Mi Perfil" />} />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  </StrictMode>,
)
