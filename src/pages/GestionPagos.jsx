import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { paymentsAPI, usersAPI, cashRegistersAPI, billingConceptsAPI } from '../services/apiService';
import Modal from '../components/ui/Modal';
import { ToastContainer, useToast } from '../components/ui/Toast';
import './GestionPagos.css';

// ─────────────────────────────────────────────────────────
// CONSTANTES
// ─────────────────────────────────────────────────────────
const METODOS_PAGO = [
    { value: 'efectivo',      label: 'Efectivo',        icon: 'bx-money',       color: '#10b981' },
    { value: 'tarjeta',       label: 'Tarjeta',         icon: 'bx-credit-card', color: '#3b82f6' },
    { value: 'transferencia', label: 'Transferencia',   icon: 'bx-transfer',    color: '#8b5cf6' },
    { value: 'mercadopago',   label: 'MercadoPago',     icon: 'bx-qr',          color: '#f59e0b' },
    { value: 'cuenta_cte',   label: 'Cta. Corriente',  icon: 'bx-book-open',   color: '#ef4444' },
];

const CATEGORIAS = {
    mensualidad:    { label: 'Mensualidades',    icon: 'bx-calendar-check', color: '#10b981' },
    inscripcion:    { label: 'Inscripciones',    icon: 'bx-user-plus',      color: '#3b82f6' },
    clase_especial: { label: 'Clases Especiales',icon: 'bx-dumbbell',       color: '#ef4444' },
    alquiler:       { label: 'Alquileres',       icon: 'bx-building',       color: '#06b6d4' },
    otro:           { label: 'Otros',            icon: 'bx-receipt',        color: '#6b7280' },
};

const fmt = (n) => parseFloat(n || 0).toLocaleString('es-AR', { minimumFractionDigits: 0 });

// ─────────────────────────────────────────────────────────
const GestionPagos = () => {
    const [activeTab, setActiveTab] = useState('pago');
    const [showModal, setShowModal]   = useState(false);
    const [modalType, setModalType]   = useState('pago');
    const { toasts, addToast, removeToast } = useToast();
    const { user: currentUser } = useAuth();

    // ── Datos maestros ──
    const [allUsers, setAllUsers]           = useState([]);
    const [planes, setPlanes]               = useState([]);
    const [historialPagos, setHistorialPagos] = useState([]);
    const [cajaActiva, setCajaActiva]       = useState(null);
    const [cajaSummary, setCajaSummary]     = useState([]);
    const [billingConcepts, setBillingConcepts] = useState([]);
    const [selectedPago, setSelectedPago]   = useState(null);
    const [loading, setLoading]             = useState(true);

    // ── Estado del checkout multi-ítem ──
    const [clientMode, setClientMode]     = useState('registered'); // 'registered' | 'guest'
    const [selectedUserId, setSelectedUserId] = useState('');
    const [guestName, setGuestName]       = useState('');
    const [userSearch, setUserSearch]     = useState('');
    const [paymentMethod, setPaymentMethod] = useState('efectivo');
    const [paymentStatus, setPaymentStatus] = useState('completed');
    const [paymentNotes, setPaymentNotes]   = useState('');
    const [cart, setCart]                   = useState([]); // [{id, concept, icon, color, amount, activity_id}]

    // ── Agregar ítem al carrito ──
    const [addingConceptId, setAddingConceptId] = useState('');
    const [addingAmount, setAddingAmount]       = useState('');

    // ── Otros forms ──
    const [planFormData, setPlanFormData]       = useState({ name: '', description: '', price: '', duration_days: 30 });
    const [conceptFormData, setConceptFormData] = useState({ name: '', category: 'otro', description: '', icon: 'bx-receipt', color: '#6366f1', default_amount: '', is_subscription: false, subscription_plan_id: '', sort_order: 99 });
    const [cajaFormData, setCajaFormData]       = useState({ opening_balance: 0, counted_balance: 0, notes: '' });
    const [cancelData, setCancelData]           = useState({ id: null, reason: '' });

    // ─────────────────────────────────────────────────────────
    useEffect(() => { loadData(); }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const [usersRes, plansRes, paymentsRes, cajaRes, conceptsRes] = await Promise.all([
                usersAPI.getAll(),                                                   // TODOS los usuarios
                paymentsAPI.getPlans(),
                paymentsAPI.getAll({ limit: 60 }),
                cashRegistersAPI.getCurrent().catch(() => ({ success: true, data: null })),
                billingConceptsAPI.getAll().catch(() => ({ success: true, data: [] })),
            ]);

            if (usersRes.success) setAllUsers(usersRes.data || []);
            if (plansRes.success) setPlanes(plansRes.data);
            if (paymentsRes.success) setHistorialPagos(paymentsRes.data);
            if (conceptsRes.success) setBillingConcepts(conceptsRes.data || []);
            if (cajaRes?.success && cajaRes.data?.register) {
                setCajaActiva(cajaRes.data.register);
                setCajaSummary(cajaRes.data.summary || []);
            } else {
                setCajaActiva(null);
                setCajaSummary([]);
            }
        } catch {
            addToast('Error al cargar datos', 'error');
        } finally {
            setLoading(false);
        }
    };

    // ─────────────────────────────────────────────────────────
    // Usuarios filtrados por búsqueda
    const filteredUsers = allUsers.filter(u =>
        !userSearch || u.name?.toLowerCase().includes(userSearch.toLowerCase()) ||
        u.email?.toLowerCase().includes(userSearch.toLowerCase())
    );

    // Concepto seleccionado para agregar
    const addingConceptObj = billingConcepts.find(c => String(c.id) === String(addingConceptId)) || null;

    // Total del carrito
    const cartTotal = cart.reduce((sum, item) => sum + parseFloat(item.amount || 0), 0);

    // Agrupar conceptos por categoría
    const conceptsBySet = billingConcepts.reduce((acc, c) => {
        if (!acc[c.category]) acc[c.category] = [];
        acc[c.category].push(c);
        return acc;
    }, {});

    // ─────────────────────────────────────────────────────────
    const handleOpenModal = (type, data = null) => {
        setModalType(type);
        if (type === 'pago') {
            setClientMode('registered');
            setSelectedUserId('');
            setGuestName('');
            setUserSearch('');
            setPaymentMethod('efectivo');
            setPaymentStatus('completed');
            setPaymentNotes('');
            setCart([]);
            setAddingConceptId('');
            setAddingAmount('');
        } else if (type === 'cuota') {
            if (data) {
                setPlanFormData({ ...data, description: data.description || '' });
            } else {
                setPlanFormData({ id: null, name: '', description: '', price: '', duration_days: 30 });
            }
        } else if (type === 'concepto') {
            if (data) {
                setConceptFormData({ ...data, default_amount: data.default_amount || '', subscription_plan_id: data.subscription_plan_id || '' });
            } else {
                setConceptFormData({ id: null, name: '', category: 'otro', description: '', icon: 'bx-receipt', color: '#6366f1', default_amount: '', is_subscription: false, subscription_plan_id: '', sort_order: 99 });
            }
        } else if (type === 'cancelar_pago') {
            setCancelData({ id: data?.id, reason: '' });
        } else if (type === 'ticket') {
            setSelectedPago(data);
        } else if (type === 'abrir_caja' || type === 'cerrar_caja') {
            setCajaFormData({ opening_balance: 0, counted_balance: 0, notes: '' });
        }
        setShowModal(true);
    };

    const handleToggleConcept = async (id) => {
        try {
            await billingConceptsAPI.toggle(id);
            addToast('✅ Estado del concepto actualizado', 'success');
            loadData();
        } catch (error) {
            addToast('❌ ' + error.message, 'error');
        }
    };

    const handleDeleteConcept = async (id) => {
        if (!window.confirm('¿Estás seguro de eliminar este concepto? Esto solo es posible si no tiene transacciones asociadas.')) return;
        try {
            await billingConceptsAPI.delete(id);
            addToast('✅ Concepto eliminado', 'success');
            loadData();
        } catch (error) {
            addToast('❌ No se pudo eliminar (es probable que tenga pagos asociados)', 'error');
        }
    };

    const handleDeletePlan = async (plan) => {
        if (!window.confirm(`¿Estás seguro de desactivar/eliminar el plan "${plan.name}"?`)) return;
        try {
            await paymentsAPI.deletePlan(plan.id);
            addToast('✅ Plan eliminado/desactivado correctamente', 'success');
            loadData();
        } catch (error) {
            addToast('❌ Error al eliminar plan', 'error');
        }
    };

    // ─────────────────────────────────────────────────────────
    // Agregar ítem al carrito
    const handleAddToCart = () => {
        if (!addingConceptId) { addToast('Seleccioná un concepto', 'error'); return; }
        if (!addingAmount || parseFloat(addingAmount) <= 0) { addToast('Ingresá un monto válido', 'error'); return; }

        const concept = billingConcepts.find(c => String(c.id) === String(addingConceptId));
        const cartItem = {
            _key: Date.now(),
            billing_concept_id: parseInt(addingConceptId),
            name: concept?.name || 'Concepto',
            icon: concept?.icon || 'bx-receipt',
            color: concept?.color || '#6366f1',
            category: concept?.category || 'otro',
            amount: parseFloat(addingAmount),
        };

        setCart(prev => [...prev, cartItem]);
        // Resetear selección
        setAddingConceptId('');
        setAddingAmount('');
    };

    const handleRemoveFromCart = (key) => {
        setCart(prev => prev.filter(i => i._key !== key));
    };

    // ─────────────────────────────────────────────────────────
    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (modalType === 'pago') {
                if (cart.length === 0) return addToast('⚠️ El carrito está vacío. Agregá al menos un concepto.', 'error');
                if (clientMode === 'registered' && !selectedUserId) return addToast('⚠️ Seleccioná un cliente registrado', 'error');
                if (clientMode === 'guest' && !guestName.trim()) return addToast('⚠️ Ingresá el nombre del cliente invitado', 'error');

                const result = await paymentsAPI.createBatch({
                    user_id: clientMode === 'registered' ? parseInt(selectedUserId) : null,
                    client_name_guest: clientMode === 'guest' ? guestName.trim() : null,
                    payment_method: paymentMethod,
                    status: paymentStatus,
                    notes: paymentNotes || null,
                    items: cart.map(item => ({
                        billing_concept_id: item.billing_concept_id,
                        amount: item.amount,
                        activity_id: item.activity_id || null,
                    }))
                });

                if (result.success) {
                    addToast(`✅ ${result.data.count} pago(s) registrado(s) — Total: $${fmt(result.data.total)}`, 'success');
                    // Si es subscripción, renovar
                    for (const item of cart) {
                        const concept = billingConcepts.find(c => c.id === item.billing_concept_id);
                        if (concept?.subscription_plan_id && clientMode === 'registered' && selectedUserId) {
                            await paymentsAPI.createSubscription({
                                user_id: parseInt(selectedUserId),
                                plan_id: concept.subscription_plan_id,
                                status: paymentStatus === 'completed' ? 'active' : 'pending'
                            }).catch(() => {});
                        }
                    }
                }

            } else if (modalType === 'cuota') {
                const payload = { ...planFormData, price: parseFloat(planFormData.price), duration_days: parseInt(planFormData.duration_days) || 30 };
                if (planFormData.id) {
                    await paymentsAPI.updatePlan(planFormData.id, payload);
                    addToast('✅ Plan actualizado', 'success');
                } else {
                    await paymentsAPI.createPlan(payload);
                    addToast('✅ Plan creado exitosamente', 'success');
                }

            } else if (modalType === 'concepto') {
                const payload = { ...conceptFormData, default_amount: conceptFormData.default_amount || null, subscription_plan_id: conceptFormData.subscription_plan_id || null };
                if (conceptFormData.id) {
                    await billingConceptsAPI.update(conceptFormData.id, payload);
                    addToast('✅ Concepto actualizado', 'success');
                } else {
                    await billingConceptsAPI.create(payload);
                    addToast('✅ Concepto creado', 'success');
                }

            } else if (modalType === 'abrir_caja') {
                await cashRegistersAPI.open(parseFloat(cajaFormData.opening_balance));
                addToast('✅ Caja abierta', 'success');

            } else if (modalType === 'cerrar_caja') {
                await cashRegistersAPI.close(cajaActiva.id, parseFloat(cajaFormData.counted_balance), cajaFormData.notes);
                addToast('✅ Caja cerrada', 'success');

            } else if (modalType === 'cancelar_pago') {
                if (!cancelData.reason) throw new Error('Indicá un motivo de anulación');
                await paymentsAPI.cancel(cancelData.id, cancelData.reason);
                addToast('✅ Pago anulado contablemente', 'success');
            }

            setShowModal(false);
            loadData();
        } catch (error) {
            addToast('❌ ' + error.message, 'error');
        }
    };

    // ─────────────────────────────────────────────────────────
    const getConceptoDisplay = (pago) => ({
        name: pago.billing_concept_name || ({ mensualidad: 'Mensualidad', inscripcion: 'Inscripción', clase_especial: 'Clase Especial', alquiler: 'Alquiler', otro: 'Otro' }[pago.concept] || pago.concept),
        icon: pago.billing_concept_icon || 'bx-receipt',
        color: pago.billing_concept_color || '#6b7280',
    });

    const getMetodo = (m) => METODOS_PAGO.find(x => x.value === m) || { label: m, icon: 'bx-credit-card', color: '#6b7280' };

    const printTicketWindow = () => {
        const html = document.getElementById('ticket-print-area').innerHTML;
        const w = window.open('', '_blank');
        w.document.write(`<html><body style="font-family:monospace;padding:16px">${html}</body></html>`);
        w.document.close();
        w.print();
    };

    // ─────────────────────────────────────────────────────────
    // Renderizado
    // ─────────────────────────────────────────────────────────
    return (
        <div className="gestion-pagos">
            <ToastContainer toasts={toasts} removeToast={removeToast} />

            <div className="page-header">
                <h1><i className='bx bx-money'></i> Gestión de Pagos</h1>
            </div>

            <div className="tabs-container">
                <div className="tabs">
                    {[
                        { key: 'pago',      icon: 'bx-cart-alt',     label: 'Registrar Pago' },
                        { key: 'cuota',     icon: 'bx-receipt',      label: 'Planes' },
                        { key: 'conceptos', icon: 'bx-list-ul',      label: 'Conceptos' },
                        { key: 'caja',      icon: 'bx-store-alt',    label: 'Caja' },
                        { key: 'historial', icon: 'bx-history',      label: 'Historial' },
                    ].map(t => (
                        <button key={t.key}
                            className={`tab ${activeTab === t.key ? 'active' : ''}`}
                            onClick={() => setActiveTab(t.key)}
                        >
                            <i className={`bx ${t.icon}`}></i> {t.label}
                        </button>
                    ))}
                </div>
            </div>

            {loading ? (
                <div className="loading-state">
                    <i className='bx bx-loader-alt bx-spin'></i><p>Cargando...</p>
                </div>
            ) : (
                <div className="tab-content">

                    {/* ═══════════ TAB: REGISTRAR PAGO ═══════════ */}
                    {activeTab === 'pago' && (
                        <div className="registro-pago-section">
                            <div className="quick-actions">
                                <button className="btn-primary" onClick={() => handleOpenModal('pago')}>
                                    <i className='bx bx-plus'></i> Nuevo Cobro
                                </button>
                            </div>
                            {/* Vista rápida de conceptos */}
                            <div className="concepts-overview">
                                <h3>Conceptos disponibles</h3>
                                {Object.keys(CATEGORIAS).map(cat => {
                                    const items = conceptsBySet[cat];
                                    if (!items?.length) return null;
                                    const meta = CATEGORIAS[cat];
                                    return (
                                        <div key={cat} className="concept-category-group">
                                            <div className="concept-category-title">
                                                <i className={`bx ${meta.icon}`} style={{ color: meta.color }}></i>{meta.label}
                                            </div>
                                            <div className="concepts-chips">
                                                {items.map(c => (
                                                    <div key={c.id} className="concept-chip"
                                                        style={{ borderColor: c.color + '44', background: c.color + '11' }}>
                                                        <i className={`bx ${c.icon}`} style={{ color: c.color }}></i>
                                                        <span>{c.name}</span>
                                                        {c.default_amount && <strong style={{ color: c.color }}>${fmt(c.default_amount)}</strong>}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })}
                                {billingConcepts.length === 0 && (
                                    <div className="empty-state-small">
                                        <i className='bx bx-info-circle'></i>
                                        <p>No hay conceptos. Creá uno en la pestaña <strong>Conceptos</strong>.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* ═══════════ TAB: PLANES ═══════════ */}
                    {activeTab === 'cuota' && (
                        <div className="cuotas-section">
                            <div className="section-header">
                                <h3>Planes de Membresía</h3>
                                {currentUser?.role?.id === 1 && (
                                    <button className="btn-primary" onClick={() => handleOpenModal('cuota')}>
                                        <i className='bx bx-plus'></i> Nuevo Plan
                                    </button>
                                )}
                            </div>
                            <div className="plans-table-container">
                                <table className="payments-table">
                                    <thead><tr><th>Nombre</th><th>Descripción</th><th>Precio</th><th>Duración</th><th>Concepto vinculado</th>{currentUser?.role?.id === 1 && <th style={{ textAlign: 'center' }}>Acciones</th>}</tr></thead>
                                    <tbody>
                                        {planes.map(plan => {
                                            const linked = billingConcepts.find(c => c.subscription_plan_id === plan.id);
                                            return (
                                                <tr key={plan.id}>
                                                    <td><strong>{plan.name}</strong></td>
                                                    <td>{plan.description || '—'}</td>
                                                    <td className="amount">${fmt(plan.price)}</td>
                                                    <td>{plan.duration_days} días</td>
                                                    <td>
                                                        {linked
                                                            ? <span className="concept-badge" style={{ background: linked.color + '22', color: linked.color, border: `1px solid ${linked.color}44` }}><i className={`bx ${linked.icon}`}></i>{linked.name}</span>
                                                            : <span style={{ color: '#6b7280', fontSize: '0.85rem' }}>Sin concepto</span>}
                                                    </td>
                                                    {currentUser?.role?.id === 1 && (
                                                        <td style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>
                                                            <button className="btn-icon" style={{ color: '#3b82f6', marginRight: '6px' }} title="Editar" onClick={() => handleOpenModal('cuota', plan)}>
                                                                <i className="bx bx-edit-alt"></i>
                                                            </button>
                                                            <button className="btn-icon" style={{ color: '#ef4444' }} title="Eliminar" onClick={() => handleDeletePlan(plan)}>
                                                                <i className="bx bx-trash"></i>
                                                            </button>
                                                        </td>
                                                    )}
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* ═══════════ TAB: CONCEPTOS ═══════════ */}
                    {activeTab === 'conceptos' && (
                        <div className="conceptos-section">
                            <div className="section-header">
                                <h3>Catálogo de Conceptos</h3>
                                {currentUser?.role?.id === 1 && (
                                    <button className="btn-primary" onClick={() => handleOpenModal('concepto')}>
                                        <i className='bx bx-plus'></i> Nuevo Concepto
                                    </button>
                                )}
                            </div>
                            <p className="section-description">
                                <i className='bx bx-info-circle'></i>
                                Tabla maestra de ítems cobrables. Se vincula a planes, actividades y espacios.
                            </p>
                            <div className="plans-table-container" style={{ marginTop: '16px' }}>
                                <table className="payments-table">
                                    <thead><tr><th>Concepto</th><th>Categoría</th><th>Monto base</th><th>Vinculado a</th><th>Estado</th>{currentUser?.role?.id === 1 && <th style={{ textAlign: 'center' }}>Acciones</th>}</tr></thead>
                                    <tbody>
                                        {billingConcepts.map(c => {
                                            const cat = CATEGORIAS[c.category] || CATEGORIAS.otro;
                                            const vinculo = c.plan_name ? `Plan: ${c.plan_name}` : c.activity_name ? `Actividad: ${c.activity_name}` : c.space_name ? `Espacio: ${c.space_name}` : '—';
                                            return (
                                                <tr key={c.id}>
                                                    <td>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                            <span className="concept-icon-sm" style={{ background: c.color + '22', color: c.color }}>
                                                                <i className={`bx ${c.icon}`}></i>
                                                            </span>
                                                            <strong>{c.name}</strong>
                                                        </div>
                                                    </td>
                                                    <td><span className="concept-badge" style={{ background: cat.color + '22', color: cat.color, border: `1px solid ${cat.color}44` }}><i className={`bx ${cat.icon}`}></i>{cat.label}</span></td>
                                                    <td className="amount">{c.default_amount ? `$${fmt(c.default_amount)}` : <span style={{ color: '#6b7280' }}>—</span>}</td>
                                                    <td style={{ color: '#9ca3af', fontSize: '0.9rem' }}>{vinculo}</td>
                                                    <td><span className={`status-badge ${c.is_active ? 'status-completed' : 'status-refunded'}`}>{c.is_active ? 'Activo' : 'Inactivo'}</span></td>
                                                    {currentUser?.role?.id === 1 && (
                                                        <td style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>
                                                            <button className="btn-icon" style={{ color: '#3b82f6', marginRight: '6px' }} title="Editar" onClick={() => handleOpenModal('concepto', c)}>
                                                                <i className="bx bx-edit-alt"></i>
                                                            </button>
                                                            <button className="btn-icon" style={{ color: c.is_active ? '#f59e0b' : '#10b981', marginRight: '6px' }} title={c.is_active ? 'Desactivar' : 'Activar'} onClick={() => handleToggleConcept(c.id)}>
                                                                <i className={`bx ${c.is_active ? 'bx-block' : 'bx-check'}`}></i>
                                                            </button>
                                                            <button className="btn-icon" style={{ color: '#ef4444' }} title="Eliminar" onClick={() => handleDeleteConcept(c.id)}>
                                                                <i className="bx bx-trash"></i>
                                                            </button>
                                                        </td>
                                                    )}
                                                </tr>
                                            );
                                        })}
                                        {billingConcepts.length === 0 && (
                                            <tr><td colSpan={currentUser?.role?.id === 1 ? 6 : 5} style={{ textAlign: 'center', color: '#6b7280', padding: '32px' }}>
                                                <i className='bx bx-inbox' style={{ fontSize: '2rem', display: 'block', marginBottom: '8px' }}></i>
                                                Sin conceptos configurados.
                                            </td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* ═══════════ TAB: CAJA ═══════════ */}
                    {activeTab === 'caja' && (
                        <div className="caja-section">
                            <h3>Caja Registradora</h3>
                            {cajaActiva ? (
                                <div className="caja-activa-card">
                                    <div className="status-indicator_open"><i className='bx bx-lock-open-alt'></i> CAJA ABIERTA</div>
                                    <p>Abierta por: <strong>{cajaActiva.opened_by_name}</strong></p>
                                    <p>Fecha: <strong>{new Date(cajaActiva.opening_time).toLocaleString('es-AR')}</strong></p>
                                    <p>Saldo Inicial: <strong>${fmt(cajaActiva.opening_balance)}</strong></p>
                                    <h4 style={{ marginTop: '1.5rem' }}>Resumen de Movimientos</h4>
                                    <ul>
                                        {cajaSummary.length === 0 && <li>Sin movimientos aún.</li>}
                                        {cajaSummary.map((s, i) => {
                                            const m = getMetodo(s.payment_method);
                                            return <li key={i}><i className={`bx ${m.icon}`}></i> {m.label}: <strong>${fmt(s.total)}</strong> ({s.tx_count} tx)</li>;
                                        })}
                                    </ul>
                                    <div className="quick-actions" style={{ marginTop: '1.5rem' }}>
                                        <button className="btn-danger" onClick={() => handleOpenModal('cerrar_caja')}>
                                            <i className='bx bx-lock-alt'></i> Cerrar Caja
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="caja-activa-card cerrado">
                                    <div className="status-indicator_closed"><i className='bx bx-lock-alt'></i> CAJA CERRADA</div>
                                    <p>No hay caja abierta en este momento.</p>
                                    <div className="quick-actions" style={{ marginTop: '1.5rem' }}>
                                        <button className="btn-primary" onClick={() => handleOpenModal('abrir_caja')}>
                                            <i className='bx bx-lock-open-alt'></i> Abrir Caja
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* ═══════════ TAB: HISTORIAL ═══════════ */}
                    {activeTab === 'historial' && (
                        <div className="historial-section">
                            <h3>Historial de Pagos</h3>
                            <table className="payments-table">
                                <thead>
                                    <tr><th>Fecha</th><th>Cliente</th><th>Concepto</th><th>Método</th><th>Monto</th><th>Estado</th><th>Acciones</th></tr>
                                </thead>
                                <tbody>
                                    {historialPagos.map(pago => {
                                        const { name: cName, icon: cIcon, color: cColor } = getConceptoDisplay(pago);
                                        const m = getMetodo(pago.payment_method);
                                        return (
                                            <tr key={pago.id}>
                                                <td>{new Date(pago.payment_date).toLocaleDateString('es-AR')}</td>
                                                <td>{pago.user_name || pago.client_name_guest || '—'}</td>
                                                <td>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                        <i className={`bx ${cIcon}`} style={{ color: cColor }}></i>
                                                        {cName}
                                                    </div>
                                                </td>
                                                <td>
                                                    <span className="method-badge">
                                                        <i className={`bx ${m.icon}`} style={{ color: m.color }}></i>{m.label}
                                                    </span>
                                                </td>
                                                <td className="amount">${fmt(pago.amount)}</td>
                                                <td>
                                                    <span className={`status-badge status-${pago.status}`}>
                                                        {pago.status === 'completed' ? 'Completado' : pago.status === 'refunded' ? 'Anulado' : 'Pendiente'}
                                                    </span>
                                                </td>
                                                <td>
                                                    <button className="btn-icon" title="Ticket" onClick={() => handleOpenModal('ticket', pago)}><i className='bx bx-printer'></i></button>
                                                    {pago.status === 'completed' && (
                                                        <button className="btn-icon" style={{ color: '#dc2626' }} title="Anular" onClick={() => handleOpenModal('cancelar_pago', pago)}><i className='bx bx-x-circle'></i></button>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}

                </div>
            )}

            {/* ══════════════════════════════
                MODAL PRINCIPAL
            ══════════════════════════════ */}
            <Modal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                title={
                    modalType === 'pago'         ? 'Registrar Cobro' :
                    modalType === 'cuota'        ? 'Nuevo Plan' :
                    modalType === 'concepto'     ? 'Nuevo Concepto' :
                    modalType === 'abrir_caja'   ? 'Abrir Caja' :
                    modalType === 'cerrar_caja'  ? 'Cerrar Caja' :
                    modalType === 'cancelar_pago'? 'Anular Pago' :
                    'Comprobante'
                }
                size={modalType === 'ticket' ? 'sm' : 'lg'}
            >
                <form onSubmit={handleSubmit}>

                    {/* ─── REGISTRAR COBRO (multi-ítem) ─── */}
                    {modalType === 'pago' && (
                        <div className="checkout-layout">

                            {/* ── COLUMNA IZQUIERDA: cliente + agregar ítems ── */}
                            <div className="checkout-left">

                                {/* Cliente */}
                                <div className="checkout-section">
                                    <div className="checkout-section-title">
                                        <i className='bx bx-user'></i> Cliente
                                    </div>

                                    {/* Toggle registrado / invitado */}
                                    <div className="client-mode-toggle">
                                        <button type="button"
                                            className={`toggle-btn ${clientMode === 'registered' ? 'active' : ''}`}
                                            onClick={() => setClientMode('registered')}>
                                            <i className='bx bx-user-check'></i> Registrado
                                        </button>
                                        <button type="button"
                                            className={`toggle-btn ${clientMode === 'guest' ? 'active' : ''}`}
                                            onClick={() => setClientMode('guest')}>
                                            <i className='bx bx-user-plus'></i> Invitado
                                        </button>
                                    </div>

                                    {clientMode === 'registered' ? (
                                        <>
                                            <input
                                                className="search-input"
                                                type="text"
                                                placeholder="Buscar por nombre o email..."
                                                value={userSearch}
                                                onChange={e => setUserSearch(e.target.value)}
                                            />
                                            <select
                                                className="user-select"
                                                value={selectedUserId}
                                                onChange={e => setSelectedUserId(e.target.value)}
                                                size={Math.min(5, filteredUsers.length + 1)}
                                            >
                                                <option value="">— Seleccionar —</option>
                                                {filteredUsers.map(u => (
                                                    <option key={u.id} value={u.id}>
                                                        {u.name}{u.role_name ? ` (${u.role_name})` : ''}
                                                    </option>
                                                ))}
                                            </select>
                                            {selectedUserId && (
                                                <div className="selected-user-badge">
                                                    <i className='bx bx-check-circle'></i>
                                                    {allUsers.find(u => String(u.id) === String(selectedUserId))?.name}
                                                </div>
                                            )}
                                        </>
                                    ) : (
                                        <input
                                            className="search-input"
                                            type="text"
                                            placeholder="Nombre del cliente invitado..."
                                            value={guestName}
                                            onChange={e => setGuestName(e.target.value)}
                                            autoFocus
                                        />
                                    )}
                                </div>

                                {/* Agregar concepto al carrito */}
                                <div className="checkout-section">
                                    <div className="checkout-section-title">
                                        <i className='bx bx-list-plus'></i> Agregar ítem
                                    </div>

                                    {/* Grid de conceptos */}
                                    <div className="concept-selector-grid">
                                        {Object.keys(CATEGORIAS).map(cat => {
                                            const items = conceptsBySet[cat];
                                            if (!items?.length) return null;
                                            const meta = CATEGORIAS[cat];
                                            return (
                                                <div key={cat} className="concept-selector-section">
                                                    <div className="concept-selector-cat-label">
                                                        <i className={`bx ${meta.icon}`} style={{ color: meta.color }}></i>
                                                        {meta.label}
                                                    </div>
                                                    <div className="concept-selector-items">
                                                        {items.map(c => {
                                                            const isSel = String(addingConceptId) === String(c.id);
                                                            return (
                                                                <button key={c.id} type="button"
                                                                    className={`concept-btn ${isSel ? 'selected' : ''}`}
                                                                    style={isSel ? { borderColor: c.color, background: c.color + '22', boxShadow: `0 0 0 2px ${c.color}44` } : {}}
                                                                    onClick={() => {
                                                                        setAddingConceptId(c.id);
                                                                        if (c.default_amount) setAddingAmount(String(c.default_amount));
                                                                    }}
                                                                >
                                                                    <i className={`bx ${c.icon}`} style={{ color: isSel ? c.color : undefined }}></i>
                                                                    <span className="concept-btn-name">{c.name}</span>
                                                                    {c.default_amount && <span className="concept-btn-amount" style={{ color: isSel ? c.color : '#9ca3af' }}>${fmt(c.default_amount)}</span>}
                                                                    {isSel && <i className='bx bx-check-circle concept-btn-check' style={{ color: c.color }}></i>}
                                                                </button>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                        {billingConcepts.length === 0 && (
                                            <div className="concept-empty-warning">
                                                <i className='bx bx-error-circle'></i>
                                                No hay conceptos. Creá uno en la pestaña Conceptos.
                                            </div>
                                        )}
                                    </div>

                                    {/* Monto + botón agregar */}
                                    {addingConceptId && (
                                        <div className="add-item-row">
                                            <div className="add-item-concept-preview">
                                                <i className={`bx ${addingConceptObj?.icon}`} style={{ color: addingConceptObj?.color }}></i>
                                                <span>{addingConceptObj?.name}</span>
                                            </div>
                                            <input
                                                type="number"
                                                className="amount-input"
                                                value={addingAmount}
                                                onChange={e => setAddingAmount(e.target.value)}
                                                placeholder="Monto"
                                                min="0"
                                                step="0.01"
                                                autoFocus
                                            />
                                            <button type="button" className="btn-add-item" onClick={handleAddToCart}>
                                                <i className='bx bx-plus'></i> Agregar
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* ── COLUMNA DERECHA: carrito + pago ── */}
                            <div className="checkout-right">

                                {/* Carrito */}
                                <div className="checkout-section cart-section">
                                    <div className="checkout-section-title">
                                        <i className='bx bx-cart'></i> Carrito
                                        {cart.length > 0 && <span className="cart-count">{cart.length}</span>}
                                    </div>

                                    {cart.length === 0 ? (
                                        <div className="cart-empty">
                                            <i className='bx bx-cart-alt'></i>
                                            <p>Seleccioná conceptos y presioná <strong>Agregar</strong></p>
                                        </div>
                                    ) : (
                                        <div className="cart-items">
                                            {cart.map(item => (
                                                <div key={item._key} className="cart-item">
                                                    <div className="cart-item-icon" style={{ background: item.color + '22', color: item.color }}>
                                                        <i className={`bx ${item.icon}`}></i>
                                                    </div>
                                                    <div className="cart-item-info">
                                                        <span className="cart-item-name">{item.name}</span>
                                                    </div>
                                                    <div className="cart-item-amount">${fmt(item.amount)}</div>
                                                    <button type="button" className="cart-item-remove"
                                                        onClick={() => handleRemoveFromCart(item._key)}>
                                                        <i className='bx bx-x'></i>
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {cart.length > 0 && (
                                        <div className="cart-total">
                                            <span>Total</span>
                                            <strong>${fmt(cartTotal)}</strong>
                                        </div>
                                    )}
                                </div>

                                {/* Tipo de pago */}
                                <div className="checkout-section">
                                    <div className="checkout-section-title">
                                        <i className='bx bx-wallet'></i> Tipo de Pago
                                    </div>
                                    <div className="payment-method-grid">
                                        {METODOS_PAGO.map(m => {
                                            const isActive = paymentMethod === m.value;
                                            return (
                                                <button key={m.value} type="button"
                                                    className={`payment-method-btn ${isActive ? 'active' : ''}`}
                                                    style={isActive ? { borderColor: m.color, background: m.color + '22', boxShadow: `0 0 0 2px ${m.color}44` } : {}}
                                                    onClick={() => setPaymentMethod(m.value)}
                                                >
                                                    <i className={`bx ${m.icon}`} style={{ color: isActive ? m.color : undefined }}></i>
                                                    <span>{m.label}</span>
                                                    {isActive && <i className='bx bx-check-circle payment-method-check' style={{ color: m.color }}></i>}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Estado y notas */}
                                <div className="checkout-section">
                                    <div className="form-group" style={{ marginBottom: '10px' }}>
                                        <label>Estado de la transacción</label>
                                        <select value={paymentStatus} onChange={e => setPaymentStatus(e.target.value)}>
                                            <option value="completed">✅ Aprobado / Pagado</option>
                                            <option value="pending">⏳ Pendiente</option>
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label>Notas (opcional)</label>
                                        <textarea value={paymentNotes} onChange={e => setPaymentNotes(e.target.value)}
                                            rows="2" placeholder="Observaciones..." />
                                    </div>
                                </div>

                            </div>
                        </div>
                    )}

                    {/* ─── NUEVO PLAN ─── */}
                    {modalType === 'cuota' && (
                        <>
                            <div className="form-group"><label>Nombre del Plan</label>
                                <input type="text" value={planFormData.name} onChange={e => setPlanFormData({ ...planFormData, name: e.target.value })} required />
                            </div>
                            <div className="form-group"><label>Descripción</label>
                                <textarea value={planFormData.description} onChange={e => setPlanFormData({ ...planFormData, description: e.target.value })} rows="2" />
                            </div>
                            <div className="form-row">
                                <div className="form-group"><label>Precio</label>
                                    <input type="number" value={planFormData.price} onChange={e => setPlanFormData({ ...planFormData, price: e.target.value })} required min="0" step="0.01" />
                                </div>
                                <div className="form-group"><label>Duración (días)</label>
                                    <input type="number" value={planFormData.duration_days} onChange={e => setPlanFormData({ ...planFormData, duration_days: e.target.value })} min="1" />
                                </div>
                            </div>
                            <small style={{ color: '#9ca3af' }}><i className='bx bx-info-circle'></i> Al crear el plan se genera automáticamente su concepto en el catálogo.</small>
                        </>
                    )}

                    {/* ─── NUEVO CONCEPTO ─── */}
                    {modalType === 'concepto' && (
                        <>
                            <div className="form-row">
                                <div className="form-group"><label>Nombre</label>
                                    <input type="text" value={conceptFormData.name} onChange={e => setConceptFormData({ ...conceptFormData, name: e.target.value })} required />
                                </div>
                                <div className="form-group"><label>Categoría</label>
                                    <select value={conceptFormData.category} onChange={e => setConceptFormData({ ...conceptFormData, category: e.target.value })}>
                                        {Object.entries(CATEGORIAS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div className="form-group"><label>Descripción</label>
                                <textarea value={conceptFormData.description} onChange={e => setConceptFormData({ ...conceptFormData, description: e.target.value })} rows="2" />
                            </div>
                            <div className="form-row">
                                <div className="form-group"><label>Monto por defecto</label>
                                    <input type="number" value={conceptFormData.default_amount} onChange={e => setConceptFormData({ ...conceptFormData, default_amount: e.target.value })} placeholder="Opcional" min="0" step="0.01" />
                                </div>
                                <div className="form-group"><label>Plan vinculado</label>
                                    <select value={conceptFormData.subscription_plan_id} onChange={e => setConceptFormData({ ...conceptFormData, subscription_plan_id: e.target.value })}>
                                        <option value="">Sin plan</option>
                                        {planes.map(p => <option key={p.id} value={p.id}>{p.name} (${fmt(p.price)})</option>)}
                                    </select>
                                </div>
                            </div>
                            <div className="form-row">
                                <div className="form-group"><label>Ícono (Boxicons)</label>
                                    <input type="text" value={conceptFormData.icon} onChange={e => setConceptFormData({ ...conceptFormData, icon: e.target.value })} placeholder="bx-receipt" />
                                </div>
                                <div className="form-group"><label>Color</label>
                                    <input type="color" value={conceptFormData.color} onChange={e => setConceptFormData({ ...conceptFormData, color: e.target.value })} style={{ height: '44px', width: '100%', padding: '4px', borderRadius: '8px' }} />
                                </div>
                            </div>
                        </>
                    )}

                    {/* ─── ABRIR CAJA ─── */}
                    {modalType === 'abrir_caja' && (
                        <div className="form-group"><label>Saldo Inicial (Efectivo en Caja)</label>
                            <input type="number" value={cajaFormData.opening_balance} onChange={e => setCajaFormData({ ...cajaFormData, opening_balance: e.target.value })} required min="0" />
                        </div>
                    )}

                    {/* ─── CERRAR CAJA ─── */}
                    {modalType === 'cerrar_caja' && (
                        <>
                            <div className="form-group"><label>Efectivo contado en caja</label>
                                <input type="number" value={cajaFormData.counted_balance} onChange={e => setCajaFormData({ ...cajaFormData, counted_balance: e.target.value })} required min="0" autoFocus />
                            </div>
                            <div className="form-group"><label>Observaciones</label>
                                <textarea value={cajaFormData.notes} onChange={e => setCajaFormData({ ...cajaFormData, notes: e.target.value })} rows="3" />
                            </div>
                        </>
                    )}

                    {/* ─── TICKET ─── */}
                    {modalType === 'ticket' && selectedPago && (
                        <div className="ticket-container" id="ticket-print-area">
                            <div className="ticket-header">
                                <h2>GIMNASIO MULTIESPACIO</h2>
                                <p>Comprobante de Pago</p>
                                <hr />
                            </div>
                            <div className="ticket-body">
                                <p><strong>Fecha:</strong> {new Date(selectedPago.payment_date).toLocaleString('es-AR')}</p>
                                <p><strong>Trámite #:</strong> {selectedPago.id}{selectedPago.batch_id ? ` (Lote)` : ''}</p>
                                <p><strong>Cliente:</strong> {selectedPago.user_name || selectedPago.client_name_guest || '—'}</p>
                                <p><strong>Concepto:</strong> {getConceptoDisplay(selectedPago).name}</p>
                                <p><strong>Medio de Pago:</strong> {getMetodo(selectedPago.payment_method).label}</p>
                                <p><strong>Estado:</strong> {selectedPago.status === 'completed' ? 'Aprobado' : selectedPago.status}</p>
                            </div>
                            <div className="ticket-footer">
                                <hr />
                                <h3>TOTAL: ${fmt(selectedPago.amount)}</h3>
                                <p>¡Gracias por elegirnos!</p>
                            </div>
                        </div>
                    )}

                    {/* ─── ANULAR PAGO ─── */}
                    {modalType === 'cancelar_pago' && (
                        <div className="form-group">
                            <label>Motivo de Anulación</label>
                            <textarea value={cancelData.reason} onChange={e => setCancelData({ ...cancelData, reason: e.target.value })} rows="3" required placeholder="Ej: Error de tipeo, devolución..." />
                            <small style={{ color: '#dc2626', marginTop: '0.5rem', display: 'block' }}>
                                <i className='bx bx-error-circle'></i> Acción irreversible. El pago queda marcado como ANULADO.
                            </small>
                        </div>
                    )}

                    {/* ─── ACCIONES ─── */}
                    {modalType !== 'ticket' && (
                        <div className="form-actions">
                            <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button>
                            <button type="submit" className={modalType === 'cancelar_pago' ? 'btn-danger' : 'btn-primary'}>
                                {modalType === 'pago'          ? `Confirmar Cobro${cart.length > 0 ? ` — $${fmt(cartTotal)}` : ''}` :
                                 modalType === 'cuota'         ? 'Crear Plan' :
                                 modalType === 'concepto'      ? 'Crear Concepto' :
                                 modalType === 'abrir_caja'    ? 'Abrir Caja' :
                                 modalType === 'cerrar_caja'   ? 'Ejecutar Cierre' :
                                 'Confirmar Anulación'}
                            </button>
                        </div>
                    )}
                    {modalType === 'ticket' && (
                        <div className="form-actions">
                            <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>Cerrar</button>
                            <button type="button" className="btn-primary" onClick={printTicketWindow}>
                                <i className='bx bx-printer'></i> Imprimir
                            </button>
                        </div>
                    )}

                </form>
            </Modal>
        </div>
    );
};

export default GestionPagos;
