import { useEffect, useRef } from 'react';
import './ConfirmDialog.css';

/**
 * Modal de confirmación reutilizable que reemplaza window.confirm().
 * 
 * @param {boolean} isOpen - Controla la visibilidad del diálogo
 * @param {string} title - Título del diálogo
 * @param {string} message - Mensaje descriptivo
 * @param {string} confirmText - Texto del botón de confirmación (default: 'Confirmar')
 * @param {string} cancelText - Texto del botón de cancelar (default: 'Cancelar')
 * @param {string} variant - Variante visual: 'danger', 'warning', 'info' (default: 'danger')
 * @param {Function} onConfirm - Callback al confirmar
 * @param {Function} onCancel - Callback al cancelar
 */
const ConfirmDialog = ({
    isOpen,
    title = '¿Estás seguro?',
    message = 'Esta acción no se puede deshacer.',
    confirmText = 'Confirmar',
    cancelText = 'Cancelar',
    variant = 'danger',
    onConfirm,
    onCancel
}) => {
    const dialogRef = useRef(null);
    const confirmBtnRef = useRef(null);

    useEffect(() => {
        if (isOpen) {
            // Focus the cancel button by default (safer default)
            setTimeout(() => confirmBtnRef.current?.focus(), 100);

            // Trap focus inside dialog
            const handleKeyDown = (e) => {
                if (e.key === 'Escape') {
                    onCancel?.();
                }
            };
            document.addEventListener('keydown', handleKeyDown);
            document.body.style.overflow = 'hidden';

            return () => {
                document.removeEventListener('keydown', handleKeyDown);
                document.body.style.overflow = '';
            };
        }
    }, [isOpen, onCancel]);

    if (!isOpen) return null;

    const iconMap = {
        danger: 'bx-trash',
        warning: 'bx-error',
        info: 'bx-info-circle'
    };

    return (
        <div className="confirm-overlay" onClick={onCancel}>
            <div
                className={`confirm-dialog confirm-${variant}`}
                ref={dialogRef}
                onClick={(e) => e.stopPropagation()}
                role="alertdialog"
                aria-modal="true"
                aria-labelledby="confirm-title"
                aria-describedby="confirm-message"
            >
                <div className="confirm-icon-wrapper">
                    <i className={`bx ${iconMap[variant] || iconMap.danger}`}></i>
                </div>
                <h3 id="confirm-title" className="confirm-title">{title}</h3>
                <p id="confirm-message" className="confirm-message">{message}</p>
                <div className="confirm-actions">
                    <button className="confirm-btn-cancel" onClick={onCancel}>
                        {cancelText}
                    </button>
                    <button
                        className={`confirm-btn-confirm confirm-btn-${variant}`}
                        onClick={onConfirm}
                        ref={confirmBtnRef}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmDialog;
