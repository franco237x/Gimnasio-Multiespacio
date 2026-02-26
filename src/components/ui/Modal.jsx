import { useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import './Modal.css';

const Modal = ({ isOpen, onClose, title, size = 'md', children }) => {
    const handleEscape = useCallback((e) => {
        if (e.key === 'Escape') onClose();
    }, [onClose]);

    useEffect(() => {
        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
            document.body.style.overflow = 'hidden';
        }
        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.body.style.overflow = '';
        };
    }, [isOpen, handleEscape]);

    if (!isOpen) return null;

    return createPortal(
        <div className="modal-portal-overlay" onClick={onClose}>
            <div
                className={`modal-portal-content modal-portal-${size}`}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="modal-portal-header">
                    <h2>{title}</h2>
                    <button className="modal-portal-close" onClick={onClose}>
                        <i className='bx bx-x'></i>
                    </button>
                </div>
                <div className="modal-portal-body">
                    {children}
                </div>
            </div>
        </div>,
        document.body
    );
};

export default Modal;
