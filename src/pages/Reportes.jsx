import { useState, useEffect } from 'react';
import { reportsAPI, paymentsAPI } from '../services/apiService';
import './Reportes.css';

const Reportes = () => {
    const [periodo, setPeriodo] = useState('month');
    const [notification, setNotification] = useState({ show: false, message: '', type: '' });
    const [loading, setLoading] = useState(true);

    const [stats, setStats] = useState({
        income: 0,
        activeStudents: 0,
        totalClasses: 0,
        pendingReservations: 0
    });

    const [incomeByConceptStats, setIncomeByConceptStats] = useState([]);
    const [activitiesStats, setActivitiesStats] = useState({ popular: [], byDay: [] });

    useEffect(() => {
        loadData();
    }, [periodo]);

    const loadData = async () => {
        try {
            setLoading(true);
            const [dashRes, incomeRes, actRes] = await Promise.all([
                reportsAPI.getDashboard(),
                reportsAPI.getIncome(periodo),
                reportsAPI.getActivities()
            ]);

            if (dashRes.success) setStats(dashRes.data);
            if (incomeRes.success) setIncomeByConceptStats(incomeRes.data.byConceptStats || []);
            if (actRes.success) setActivitiesStats({
                popular: actRes.data.popular || [],
                byDay: actRes.data.byDay || []
            });
        } catch (error) {
            showNotification('❌ Error al cargar reportes', 'error');
        } finally {
            setLoading(false);
        }
    };

    const showNotification = (message, type) => {
        setNotification({ show: true, message, type });
        setTimeout(() => setNotification({ show: false, message: '', type: '' }), 3000);
    };

    const handleExport = (format) => {
        showNotification(`📥 Exportando reporte en formato ${format.toUpperCase()}...`, 'success');
        // En el futuro, implementar exportación real
    };

    const getConceptLabel = (concept) => {
        const labels = {
            mensualidad: 'Mensualidades',
            inscripcion: 'Inscripciones',
            clase_especial: 'Clases Especiales',
            alquiler: 'Alquileres',
            otro: 'Otros'
        };
        return labels[concept] || concept;
    };

    const getDayLabel = (day) => {
        const labels = {
            lunes: 'Lun',
            martes: 'Mar',
            miercoles: 'Mié',
            jueves: 'Jue',
            viernes: 'Vie',
            sabado: 'Sáb',
            domingo: 'Dom'
        };
        return labels[day] || day;
    };

    if (loading) {
        return (
            <div className="reportes loading-state">
                <i className='bx bx-loader-alt bx-spin'></i>
                <p>Cargando reportes...</p>
            </div>
        );
    }

    return (
        <div className="reportes">
            {notification.show && (
                <div className={`notification notification-${notification.type}`}>
                    {notification.message}
                </div>
            )}

            <div className="page-header">
                <h1><i className='bx bx-bar-chart-alt-2'></i> Reportes y Estadísticas</h1>
                <div className="header-actions">
                    <select className="periodo-select" value={periodo} onChange={(e) => setPeriodo(e.target.value)}>
                        <option value="week">Última Semana</option>
                        <option value="month">Este Mes</option>
                        <option value="year">Este Año</option>
                    </select>
                    <button className="btn-secondary" onClick={() => handleExport('pdf')}>
                        <i className='bx bxs-file-pdf'></i> PDF
                    </button>
                    <button className="btn-secondary" onClick={() => handleExport('excel')}>
                        <i className='bx bxs-file-export'></i> Excel
                    </button>
                </div>
            </div>

            {/* Tarjetas de Resumen */}
            <div className="stats-grid">
                <div className="stat-card income">
                    <div className="stat-icon"><i className='bx bx-dollar-circle'></i></div>
                    <div className="stat-content">
                        <h3>Ingresos Totales</h3>
                        <p className="stat-value">${(stats.income || 0).toLocaleString('es-AR')}</p>
                    </div>
                </div>
                <div className="stat-card students">
                    <div className="stat-icon"><i className='bx bx-group'></i></div>
                    <div className="stat-content">
                        <h3>Alumnos Activos</h3>
                        <p className="stat-value">{stats.activeStudents || 0}</p>
                    </div>
                </div>
                <div className="stat-card classes">
                    <div className="stat-icon"><i className='bx bx-calendar-check'></i></div>
                    <div className="stat-content">
                        <h3>Clases Activas</h3>
                        <p className="stat-value">{stats.totalClasses || 0}</p>
                    </div>
                </div>
                <div className="stat-card reservations">
                    <div className="stat-icon"><i className='bx bx-calendar'></i></div>
                    <div className="stat-content">
                        <h3>Reservas Pendientes</h3>
                        <p className="stat-value">{stats.pendingReservations || 0}</p>
                    </div>
                </div>
            </div>

            <div className="reports-grid">
                {/* Ingresos por Concepto */}
                <div className="report-card">
                    <h3 className="report-title"><i className='bx bx-pie-chart-alt-2'></i> Ingresos por Concepto</h3>
                    <div className="concept-list">
                        {incomeByConceptStats.length === 0 ? (
                            <p className="no-data">No hay datos de ingresos</p>
                        ) : (
                            incomeByConceptStats.map((item, index) => (
                                <div key={index} className="concept-item">
                                    <span className="concept-name">{getConceptLabel(item.concept)}</span>
                                    <span className="concept-count">({item.count} pagos)</span>
                                    <span className="concept-amount">${(item.total || 0).toLocaleString('es-AR')}</span>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Actividades Populares */}
                <div className="report-card">
                    <h3 className="report-title"><i className='bx bx-trophy'></i> Actividades Más Populares</h3>
                    <div className="popular-list">
                        {activitiesStats.popular.length === 0 ? (
                            <p className="no-data">No hay actividades registradas</p>
                        ) : (
                            activitiesStats.popular.slice(0, 5).map((act, index) => (
                                <div key={index} className="popular-item">
                                    <span className="rank">#{index + 1}</span>
                                    <div className="activity-info">
                                        <span className="activity-name">{act.name}</span>
                                        <span className="activity-teacher">{act.teacher_name}</span>
                                    </div>
                                    <div className="activity-stats">
                                        <span className="enrolled">{act.enrolled_count}/{act.capacity}</span>
                                        <div className="progress-bar">
                                            <div
                                                className="progress"
                                                style={{ width: `${act.occupancy_percent || 0}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Clases por Día */}
                <div className="report-card">
                    <h3 className="report-title"><i className='bx bx-calendar-week'></i> Clases por Día</h3>
                    <div className="day-chart">
                        {activitiesStats.byDay.length === 0 ? (
                            <p className="no-data">No hay datos de clases</p>
                        ) : (
                            activitiesStats.byDay.map((day, index) => (
                                <div key={index} className="day-bar-container">
                                    <span className="day-label">{getDayLabel(day.day_of_week)}</span>
                                    <div className="bar-container">
                                        <div
                                            className="bar"
                                            style={{
                                                width: `${Math.min((day.count / Math.max(...activitiesStats.byDay.map(d => d.count), 1)) * 100, 100)}%`
                                            }}
                                        ></div>
                                    </div>
                                    <span className="day-count">{day.count}</span>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Suscripciones */}
                <div className="report-card">
                    <h3 className="report-title"><i className='bx bx-user-check'></i> Estado de Suscripciones</h3>
                    <div className="subscription-stats">
                        <div className="sub-stat active">
                            <span className="sub-label">Activas</span>
                            <span className="sub-value">{stats.subscriptions?.active_count || 0}</span>
                        </div>
                        <div className="sub-stat pending">
                            <span className="sub-label">Pendientes</span>
                            <span className="sub-value">{stats.subscriptions?.pending_count || 0}</span>
                        </div>
                        <div className="sub-stat expired">
                            <span className="sub-label">Vencidas</span>
                            <span className="sub-value">{stats.subscriptions?.expired_count || 0}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Reportes;
