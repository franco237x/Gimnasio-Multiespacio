import { useState, useCallback } from 'react';

/**
 * Custom hook para manejo centralizado de llamadas API.
 * Elimina la duplicación de estados loading/error/notification en cada página.
 * 
 * @example
 * const { loading, error, execute, notification, showNotification } = useApi();
 * 
 * const loadData = () => execute(
 *   () => usersAPI.getAll(),
 *   (data) => setUsers(data),
 *   'Error al cargar usuarios'
 * );
 */
const useApi = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [notification, setNotification] = useState({ show: false, message: '', type: '' });

    const showNotification = useCallback((message, type = 'info') => {
        setNotification({ show: true, message, type });
        setTimeout(() => setNotification({ show: false, message: '', type: '' }), 3500);
    }, []);

    /**
     * Ejecuta una llamada API con manejo automático de loading/error/notificación.
     * @param {Function} apiCall - La función API a ejecutar (debe retornar una Promise)
     * @param {Function} onSuccess - Callback con los datos en caso de éxito
     * @param {string} errorMessage - Mensaje de error por defecto
     * @param {object} options - Opciones adicionales
     * @param {string} options.successMessage - Mensaje de éxito a mostrar
     * @param {boolean} options.showLoading - Si debe mostrar el estado de carga (default: true)
     */
    const execute = useCallback(async (apiCall, onSuccess, errorMessage = 'Error en la operación', options = {}) => {
        const { successMessage, showLoading = true } = options;

        try {
            if (showLoading) setLoading(true);
            setError(null);

            const result = await apiCall();

            if (result.success !== false) {
                if (onSuccess) onSuccess(result.data || result);
                if (successMessage) showNotification(successMessage, 'success');
                return result;
            } else {
                throw new Error(result.message || errorMessage);
            }
        } catch (err) {
            const msg = err.message || errorMessage;
            setError(msg);
            showNotification(`❌ ${msg}`, 'error');
            return null;
        } finally {
            if (showLoading) setLoading(false);
        }
    }, [showNotification]);

    /**
     * Ejecuta múltiples llamadas API en paralelo.
     * @param {Array} calls - Array de { apiCall, onSuccess, errorMessage }
     */
    const executeAll = useCallback(async (calls) => {
        try {
            setLoading(true);
            setError(null);

            const results = await Promise.all(
                calls.map(({ apiCall }) => apiCall().catch(err => ({ success: false, error: err })))
            );

            results.forEach((result, index) => {
                const { onSuccess } = calls[index];
                if (result && result.success !== false && onSuccess) {
                    onSuccess(result.data || result);
                }
            });

            return results;
        } catch (err) {
            setError('Error al cargar datos');
            showNotification('❌ Error al cargar datos', 'error');
            return null;
        } finally {
            setLoading(false);
        }
    }, [showNotification]);

    return {
        loading,
        error,
        notification,
        execute,
        executeAll,
        showNotification,
        setLoading,
        setError
    };
};

export default useApi;
