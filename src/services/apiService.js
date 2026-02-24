/**
 * Servicio API centralizado para el Gimnasio Multiespacio
 * Maneja todas las llamadas al backend
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Helper para hacer peticiones
const fetchAPI = async (endpoint, options = {}) => {
    const url = `${API_BASE_URL}${endpoint}`;

    const config = {
        headers: {
            'Content-Type': 'application/json',
            ...options.headers,
        },
        ...options,
    };

    // Añadir token de autenticación si existe
    const token = localStorage.getItem('authToken');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    try {
        const response = await fetch(url, config);
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Error en la petición');
        }

        return data;
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
};

// ============= USUARIOS =============
export const usersAPI = {
    getAll: (filters = {}) => {
        const params = new URLSearchParams(filters).toString();
        return fetchAPI(`/users${params ? `?${params}` : ''}`);
    },
    getById: (id) => fetchAPI(`/users/${id}`),
    create: (userData) => fetchAPI('/users', { method: 'POST', body: JSON.stringify(userData) }),
    update: (id, userData) => fetchAPI(`/users/${id}`, { method: 'PUT', body: JSON.stringify(userData) }),
    delete: (id) => fetchAPI(`/users/${id}`, { method: 'DELETE' }),
    changeRole: (id, roleId) => fetchAPI(`/users/${id}/role`, { method: 'PATCH', body: JSON.stringify({ role_id: roleId }) }),
    getByRole: (roleName) => fetchAPI(`/users/role/${roleName}`),
};

// ============= ACTIVIDADES =============
export const activitiesAPI = {
    getAll: (day = null) => fetchAPI(`/activities${day ? `?day=${day}` : ''}`),
    getById: (id) => fetchAPI(`/activities/${id}`),
    getByTeacher: (teacherId) => fetchAPI(`/activities/teacher/${teacherId}`),
    getTeachers: () => fetchAPI('/activities/teachers'),
    create: (activityData) => fetchAPI('/activities', { method: 'POST', body: JSON.stringify(activityData) }),
    update: (id, activityData) => fetchAPI(`/activities/${id}`, { method: 'PUT', body: JSON.stringify(activityData) }),
    delete: (id) => fetchAPI(`/activities/${id}`, { method: 'DELETE' }),
    enrollStudent: (activityId, userId) => fetchAPI(`/activities/${activityId}/enroll`, { method: 'POST', body: JSON.stringify({ user_id: userId }) }),
    unenrollStudent: (activityId, userId) => fetchAPI(`/activities/${activityId}/enroll/${userId}`, { method: 'DELETE' }),
    getStudents: (activityId) => fetchAPI(`/activities/${activityId}/students`),
};

// ============= PAGOS =============
export const paymentsAPI = {
    getAll: (filters = {}) => {
        const params = new URLSearchParams(filters).toString();
        return fetchAPI(`/payments${params ? `?${params}` : ''}`);
    },
    getByUser: (userId) => fetchAPI(`/payments/user/${userId}`),
    getStats: (period = 'month') => fetchAPI(`/payments/stats?period=${period}`),
    getMonthlyIncome: () => fetchAPI('/payments/monthly'),
    create: (paymentData) => fetchAPI('/payments', { method: 'POST', body: JSON.stringify(paymentData) }),

    // Planes de suscripción
    getPlans: () => fetchAPI('/payments/plans'),
    createPlan: (planData) => fetchAPI('/payments/plans', { method: 'POST', body: JSON.stringify(planData) }),

    // Suscripciones de usuarios
    getSubscription: (userId) => fetchAPI(`/payments/subscription/${userId}`),
    createSubscription: (data) => fetchAPI('/payments/subscription', { method: 'POST', body: JSON.stringify(data) }),
    renewSubscription: (userId, planId) => fetchAPI(`/payments/subscription/${userId}/renew`, { method: 'POST', body: JSON.stringify({ plan_id: planId }) }),
};

// ============= ESPACIOS Y RESERVAS =============
export const reservationsAPI = {
    // Espacios
    getSpaces: (available = false) => fetchAPI(`/reservations/spaces${available ? '?available=true' : ''}`),
    createSpace: (spaceData) => fetchAPI('/reservations/spaces', { method: 'POST', body: JSON.stringify(spaceData) }),
    updateSpace: (id, spaceData) => fetchAPI(`/reservations/spaces/${id}`, { method: 'PUT', body: JSON.stringify(spaceData) }),
    checkAvailability: (spaceId, date, startTime, endTime) =>
        fetchAPI(`/reservations/spaces/${spaceId}/availability?date=${date}&startTime=${startTime}&endTime=${endTime}`),

    // Reservas
    getAll: (filters = {}) => {
        const params = new URLSearchParams(filters).toString();
        return fetchAPI(`/reservations${params ? `?${params}` : ''}`);
    },
    getById: (id) => fetchAPI(`/reservations/${id}`),
    getByDate: (date) => fetchAPI(`/reservations/date/${date}`),
    getPending: () => fetchAPI('/reservations/pending'),
    getUpcoming: (days = 7) => fetchAPI(`/reservations/upcoming?days=${days}`),
    create: (reservationData) => fetchAPI('/reservations', { method: 'POST', body: JSON.stringify(reservationData) }),
    confirm: (id) => fetchAPI(`/reservations/${id}/confirm`, { method: 'PATCH' }),
    cancel: (id) => fetchAPI(`/reservations/${id}/cancel`, { method: 'PATCH' }),
    delete: (id) => fetchAPI(`/reservations/${id}`, { method: 'DELETE' }),
};

// ============= CONFIGURACIÓN =============
export const configAPI = {
    getAll: () => fetchAPI('/config'),
    update: (configData) => fetchAPI('/config', { method: 'PUT', body: JSON.stringify(configData) }),
    get: (key) => fetchAPI(`/config/${key}`),
};

// ============= REPORTES =============
export const reportsAPI = {
    getDashboard: () => fetchAPI('/reports/dashboard'),
    getIncome: (period = 'month') => fetchAPI(`/reports/income?period=${period}`),
    getActivities: () => fetchAPI('/reports/activities'),
    getAttendance: (startDate, endDate) =>
        fetchAPI(`/reports/attendance?startDate=${startDate}&endDate=${endDate}`),
};

// ============= AUTH (Perfil) =============
export const authAPI = {
    getProfile: () => fetchAPI('/auth/profile'),
    updateProfile: (data) => fetchAPI('/auth/profile', { method: 'PUT', body: JSON.stringify(data) }),
    changePassword: (data) => fetchAPI('/auth/change-password', { method: 'PUT', body: JSON.stringify(data) }),
};

// Export por defecto con todos los servicios
export default {
    users: usersAPI,
    activities: activitiesAPI,
    payments: paymentsAPI,
    reservations: reservationsAPI,
    config: configAPI,
    reports: reportsAPI,
    auth: authAPI,
};
