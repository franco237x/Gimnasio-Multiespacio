import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { usersAPI } from '../services/apiService';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import './MiProgreso.css';

const MiProgreso = () => {
    const { user } = useAuth();
    const [progressLogs, setProgressLogs] = useState([]);
    const [medicalData, setMedicalData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user?.id) {
            loadData();
        }
    }, [user]);

    const loadData = async () => {
        try {
            setLoading(true);
            const [progressRes, userRes] = await Promise.all([
                usersAPI.getProgress(user.id),
                usersAPI.getById(user.id)
            ]);

            if (progressRes.success) {
                setProgressLogs(progressRes.data || []);
            }

            if (userRes.success) {
                setMedicalData({
                    medical_notes: userRes.data.medical_notes,
                    is_fit: userRes.data.is_fit !== false && userRes.data.is_fit !== 0
                });
            }
        } catch (error) {
            console.error('Error al cargar datos:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="mi-progreso-page">
            <div className="page-header">
                <div className="header-content">
                    <h2><i className='bx bx-line-chart'></i> Mi Progreso y Salud</h2>
                    <p>Sigue de cerca tus avances y notas recomendadas por los profesores</p>
                </div>
            </div>

            {loading ? (
                <div className="loading-state" style={{ textAlign: 'center', padding: '50px 0', color: '#0891b2' }}>
                    <i className='bx bx-loader-alt bx-spin' style={{ fontSize: '3rem' }}></i>
                    <p>Cargando información...</p>
                </div>
            ) : (
                <div className="progreso-content">
                    {/* Tarjeta de Ficha Médica */}
                    <div className="ficha-medica-card">
                        <h3><i className='bx bx-plus-medical'></i> Mi Ficha Médica</h3>
                        {medicalData && (
                            <div className="medical-info">
                                <div className={`status-badge ${medicalData.is_fit ? 'fit' : 'not-fit'}`}>
                                    {medicalData.is_fit ? (
                                        <><i className='bx bx-check-shield'></i> Apto para realizar actividad física</>
                                    ) : (
                                        <><i className='bx bx-error-alt'></i> Requiere precaución (ver anotaciones)</>
                                    )}
                                </div>
                                <div className="notes-box">
                                    <h4>Mis Anotaciones / Precauciones:</h4>
                                    <p>{medicalData.medical_notes || 'No hay anotaciones médicas registradas. Sigue entrenando cuidando tu cuerpo.'}</p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Historial de Progreso */}
                    <div className="historial-progreso-card">
                        <h3><i className='bx bx-history'></i> Historial de Avances y Rutina</h3>
                        {progressLogs.length === 0 ? (
                            <div className="empty-logs" style={{ textAlign: 'center', padding: '30px', color: '#9ca3af' }}>
                                <i className='bx bx-sleepy' style={{ fontSize: '4rem', marginBottom: '10px', display: 'block' }}></i>
                                Aún no hay registros de progreso.<br />
                                ¡A entrenar duro en tus próximas clases para empezar a medirlos!
                            </div>
                        ) : (
                            <div className="logs-timeline">
                                {progressLogs.map(log => (
                                    <div key={log.id} className="log-item">
                                        <div className="log-header">
                                            <div className="log-date">
                                                <i className='bx bx-calendar'></i>
                                                {format(new Date(log.date), "d 'de' MMMM, yyyy", { locale: es })}
                                            </div>
                                            <div className="log-teacher">
                                                <i className='bx bx-user'></i> Prof. {log.teacher_name}
                                            </div>
                                        </div>
                                        <div className="log-body">
                                            {log.weight && (
                                                <div className="log-weight">
                                                    <strong>Peso Registrado:</strong> {log.weight} kg
                                                </div>
                                            )}
                                            <div className="log-notes">
                                                {log.notes}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default MiProgreso;
