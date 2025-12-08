import { useState, useEffect } from 'react';
import { FiCheckCircle, FiX, FiAlertCircle } from 'react-icons/fi';
import './Toast.css';

const Toast = ({ message, type = 'success', onClose, duration = 5000 }) => {
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose();
        }, duration);

        return () => clearTimeout(timer);
    }, [duration, onClose]);

    const getIcon = () => {
        if (type === 'success') {
            return <FiCheckCircle />;
        } else if (type === 'error') {
            return <FiAlertCircle />;
        }
        return <FiCheckCircle />;
    };

    return (
        <div className={`toast toast-${type}`}>
            <div className="toast-icon">
                {getIcon()}
            </div>
            <div className="toast-message">{message}</div>
            <button className="toast-close" onClick={onClose}>
                <FiX />
            </button>
        </div>
    );
};

export default Toast;
