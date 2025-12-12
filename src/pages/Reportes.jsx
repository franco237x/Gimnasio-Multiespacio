import { useState } from 'react';
import './Reportes.css';

const Reportes = () => {
    const [periodoSeleccionado, setPeriodoSeleccionado] = useState('mes');
    const [notification, setNotification] = useState({ show: false, message: '', type: '' });

    const showNotification = (message, type) => {
        setNotification({ show: true, message, type });
        setTimeout(() => setNotification({ show: false, message: '', type: '' }), 3000);
    };

    const handleExportar = (tipo) => {
        showNotification(`📊 Reporte exportado en formato ${tipo.toUpperCase()}`, 'success');
    };

    // Datos simulados
    const estadisticas = {
        ingresosMes: 245000,
        ingresosAnterior: 220000,
        alumnosActivos: 156,
        nuevosAlumnos: 12,
        clasesRealizadas: 180,
        ocupacionPromedio: 78
    };

    const ingresosPorConcepto = [
        { concepto: 'Mensualidades', monto: 180000, porcentaje: 73 },
        { concepto: 'Inscripciones', monto: 25000, porcentaje: 10 },
        { concepto: 'Alquileres', monto: 30000, porcentaje: 12 },
        { concepto: 'Otros', monto: 10000, porcentaje: 5 }
    ];

    const topClases = [
        { nombre: 'CrossFit', inscritos: 45, valoracion: 4.8 },
        { nombre: 'Spinning', inscritos: 38, valoracion: 4.6 },
        { nombre: 'Yoga', inscritos: 35, valoracion: 4.9 },
        { nombre: 'Zumba', inscritos: 32, valoracion: 4.5 },
        { nombre: 'Funcional', inscritos: 28, valoracion: 4.7 }
    ];

    const calcularCambio = (actual, anterior) => {
        const cambio = ((actual - anterior) / anterior * 100).toFixed(1);
        return cambio > 0 ? `+${cambio}%` : `${cambio}%`;
    };

    return (
        <div className="reportes-page">
            {notification.show && (
                <div className={`notification notification-${notification.type}`}>
                    {notification.message}
                </div>
            )}

            <div className="page-header">
                <div className="header-content">
                    <h2><i className='bx bx-bar-chart-alt-2'></i> Reportes</h2>
                    <p>Análisis y estadísticas del gimnasio</p>
                </div>
                <div className="header-actions">
                    <select
                        className="periodo-select"
                        value={periodoSeleccionado}
                        onChange={(e) => setPeriodoSeleccionado(e.target.value)}
                    >
                        <option value="semana">Esta Semana</option>
                        <option value="mes">Este Mes</option>
                        <option value="trimestre">Trimestre</option>
                        <option value="anio">Este Año</option>
                    </select>
                    <div className="export-buttons">
                        <button className="btn-export" onClick={() => handleExportar('pdf')}>
                            <i className='bx bxs-file-pdf'></i> PDF
                        </button>
                        <button className="btn-export" onClick={() => handleExportar('excel')}>
                            <i className='bx bxs-file-export'></i> Excel
                        </button>
                    </div>
                </div>
            </div>

            {/* Stats Overview */}
            <div className="stats-overview">
                <div className="stat-card primary">
                    <div className="stat-header">
                        <div className="stat-icon">
                            <i className='bx bx-dollar'></i>
                        </div>
                        <span className={`stat-change ${estadisticas.ingresosMes > estadisticas.ingresosAnterior ? 'positive' : 'negative'}`}>
                            {calcularCambio(estadisticas.ingresosMes, estadisticas.ingresosAnterior)}
                        </span>
                    </div>
                    <div className="stat-value">${estadisticas.ingresosMes.toLocaleString()}</div>
                    <div className="stat-label">Ingresos del Mes</div>
                </div>

                <div className="stat-card">
                    <div className="stat-header">
                        <div className="stat-icon green">
                            <i className='bx bx-group'></i>
                        </div>
                        <span className="stat-change positive">+{estadisticas.nuevosAlumnos}</span>
                    </div>
                    <div className="stat-value">{estadisticas.alumnosActivos}</div>
                    <div className="stat-label">Alumnos Activos</div>
                </div>

                <div className="stat-card">
                    <div className="stat-header">
                        <div className="stat-icon purple">
                            <i className='bx bx-calendar-check'></i>
                        </div>
                    </div>
                    <div className="stat-value">{estadisticas.clasesRealizadas}</div>
                    <div className="stat-label">Clases Realizadas</div>
                </div>

                <div className="stat-card">
                    <div className="stat-header">
                        <div className="stat-icon cyan">
                            <i className='bx bx-trending-up'></i>
                        </div>
                    </div>
                    <div className="stat-value">{estadisticas.ocupacionPromedio}%</div>
                    <div className="stat-label">Ocupación Promedio</div>
                </div>
            </div>

            <div className="reports-grid">
                {/* Ingresos por Concepto */}
                <div className="report-card">
                    <div className="card-header">
                        <h3><i className='bx bx-pie-chart-alt-2'></i> Ingresos por Concepto</h3>
                    </div>
                    <div className="card-body">
                        {ingresosPorConcepto.map((item, index) => (
                            <div key={index} className="income-item">
                                <div className="income-info">
                                    <span className="income-label">{item.concepto}</span>
                                    <span className="income-amount">${item.monto.toLocaleString()}</span>
                                </div>
                                <div className="progress-bar">
                                    <div
                                        className="progress-fill"
                                        style={{ width: `${item.porcentaje}%` }}
                                    ></div>
                                </div>
                                <span className="income-percentage">{item.porcentaje}%</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Top Clases */}
                <div className="report-card">
                    <div className="card-header">
                        <h3><i className='bx bx-trophy'></i> Clases Más Populares</h3>
                    </div>
                    <div className="card-body">
                        <div className="top-classes">
                            {topClases.map((clase, index) => (
                                <div key={index} className="class-item">
                                    <div className="class-rank">{index + 1}</div>
                                    <div className="class-info">
                                        <span className="class-name">{clase.nombre}</span>
                                        <span className="class-inscritos">{clase.inscritos} inscritos</span>
                                    </div>
                                    <div className="class-rating">
                                        <i className='bx bxs-star'></i>
                                        <span>{clase.valoracion}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Gráfico de Ingresos (simulado) */}
                <div className="report-card full-width">
                    <div className="card-header">
                        <h3><i className='bx bx-line-chart'></i> Tendencia de Ingresos</h3>
                    </div>
                    <div className="card-body">
                        <div className="chart-placeholder">
                            <div className="chart-bars">
                                <div className="chart-bar" style={{ height: '60%' }}><span>Ene</span></div>
                                <div className="chart-bar" style={{ height: '75%' }}><span>Feb</span></div>
                                <div className="chart-bar" style={{ height: '65%' }}><span>Mar</span></div>
                                <div className="chart-bar" style={{ height: '80%' }}><span>Abr</span></div>
                                <div className="chart-bar" style={{ height: '70%' }}><span>May</span></div>
                                <div className="chart-bar" style={{ height: '85%' }}><span>Jun</span></div>
                                <div className="chart-bar" style={{ height: '90%' }}><span>Jul</span></div>
                                <div className="chart-bar" style={{ height: '78%' }}><span>Ago</span></div>
                                <div className="chart-bar" style={{ height: '82%' }}><span>Sep</span></div>
                                <div className="chart-bar" style={{ height: '88%' }}><span>Oct</span></div>
                                <div className="chart-bar" style={{ height: '95%' }}><span>Nov</span></div>
                                <div className="chart-bar active" style={{ height: '100%' }}><span>Dic</span></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Reportes;
