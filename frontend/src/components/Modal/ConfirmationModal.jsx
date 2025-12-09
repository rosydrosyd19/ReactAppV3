import React from 'react';
import './ConfirmationModal.css';
import { FiAlertTriangle, FiX } from 'react-icons/fi';

const ConfirmationModal = ({
    isOpen,
    onClose,
    onConfirm,
    title = 'Confirm Action',
    message = 'Are you sure you want to proceed?',
    confirmText = 'Delete',
    cancelText = 'Cancel',
    type = 'danger', // danger, warning, info
    isLoading = false
}) => {
    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={!isLoading ? onClose : undefined}>
            <div className={`confirmation-modal ${type}`} onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <div className="icon-wrapper">
                        <FiAlertTriangle />
                    </div>
                    <h3>{title}</h3>
                    {!isLoading && (
                        <button className="close-btn" onClick={onClose}>
                            <FiX />
                        </button>
                    )}
                </div>

                <div className="modal-body">
                    <p>{message}</p>
                </div>

                <div className="modal-footer">
                    <button
                        className="btn-cancel"
                        onClick={onClose}
                        disabled={isLoading}
                    >
                        {cancelText}
                    </button>
                    <button
                        className={`btn-confirm ${type}`}
                        onClick={onConfirm}
                        disabled={isLoading}
                    >
                        {isLoading ? 'Processing...' : confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmationModal;
