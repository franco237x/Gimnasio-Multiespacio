import { useState, useEffect } from 'react';
import { contactAPI } from '../services/apiService';
import { useToast } from '../components/ui/Toast';
import Pagination from '../components/ui/Pagination';
import './PanelConsultasWeb.css';

const PanelConsultasWeb = () => {
    const { addToast } = useToast();
    const [inquiries, setInquiries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    useEffect(() => {
        loadInquiries();
    }, []);

    const loadInquiries = async () => {
        try {
            setLoading(true);
            const res = await contactAPI.getAll();
            if (res.success) {
                setInquiries(res.data);
            }
        } catch (error) {
            addToast('Error al cargar los mensajes: ' + (error.message || ''), 'error');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleStatusChange = async (id, newStatus) => {
        try {
            const res = await contactAPI.updateStatus(id, newStatus);
            if (res.success) {
                addToast('Estado actualizado', 'success');
                // Update local state without refetching
                setInquiries(prev => prev.map(inq => inq.id === id ? { ...inq, status: newStatus } : inq));
            }
        } catch (error) {
            addToast('Error al actualizar el estado: ' + (error.message || ''), 'error');
        }
    };

    const getStatusLabel = (status) => {
        switch(status) {
            case 'pending': return 'Pendiente';
            case 'in_progress': return 'En Atención';
            case 'resolved': return 'Respondida';
            default: return status;
        }
    };

    const filteredInquiries = filterStatus === 'all' 
        ? inquiries 
        : inquiries.filter(inq => inq.status === filterStatus);

    useEffect(() => { setCurrentPage(1); }, [filterStatus]);

    const totalPages = Math.ceil(filteredInquiries.length / itemsPerPage);
    const paginatedInquiries = filteredInquiries.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    if (loading) return <div className="loading-state">Cargando mensajes...</div>;

    return (
        <div className="panel-consultas-web">
            <div className="page-header">
                <h2><i className='bx bx-envelope'></i> Mensajes Web</h2>
                <p>Gestiona las consultas recibidas desde la landing page</p>
            </div>

            <div className="filters-section">
                <label>Filtrar por estado:</label>
                <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                    <option value="all">Todos</option>
                    <option value="pending">Pendientes</option>
                    <option value="in_progress">En Atención</option>
                    <option value="resolved">Respondidas</option>
                </select>
                <button className="btn-refresh" onClick={loadInquiries}>
                    <i className='bx bx-refresh'></i> Actualizar
                </button>
            </div>

            <div className="inquiries-list">
                {filteredInquiries.length === 0 ? (
                    <div className="empty-state">No hay mensajes para mostrar.</div>
                ) : (
                    <>
                    <div className="table-responsive">
                        <table className="inquiries-table">
                            <thead>
                                <tr>
                                    <th>Fecha</th>
                                    <th>Nombre</th>
                                    <th>Email</th>
                                    <th>Mensaje</th>
                                    <th>Estado</th>
                                    <th>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {paginatedInquiries.map(inquiry => (
                                    <tr key={inquiry.id} className={`status-${inquiry.status}`}>
                                        <td>{new Date(inquiry.created_at).toLocaleDateString()}</td>
                                        <td>{inquiry.name}</td>
                                        <td><a href={`mailto:${inquiry.email}`}>{inquiry.email}</a></td>
                                        <td className="message-cell">{inquiry.message}</td>
                                        <td>
                                            <span className={`status-badge ${inquiry.status}`}>
                                                {getStatusLabel(inquiry.status)}
                                            </span>
                                        </td>
                                        <td>
                                            <select 
                                                value={inquiry.status} 
                                                onChange={(e) => handleStatusChange(inquiry.id, e.target.value)}
                                                className="status-select"
                                            >
                                                <option value="pending">Pendiente</option>
                                                <option value="in_progress">En Atención</option>
                                                <option value="resolved">Respondida</option>
                                            </select>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={setCurrentPage}
                        totalItems={filteredInquiries.length}
                        itemsPerPage={itemsPerPage}
                        onItemsPerPageChange={(val) => { setItemsPerPage(val); setCurrentPage(1); }}
                    />
                    </>
                )}
            </div>
        </div>
    );
};

export default PanelConsultasWeb;
