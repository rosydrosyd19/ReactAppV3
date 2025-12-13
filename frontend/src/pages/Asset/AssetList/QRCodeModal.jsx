import React from 'react';
import QRCode from 'react-qr-code';
import { FiX, FiDownload, FiPrinter } from 'react-icons/fi';
import './AssetModal.css'; // Reusing AssetModal styles for consistency

const QRCodeModal = ({ isOpen, onClose, assetId, assetName, assetTag }) => {
    if (!isOpen) return null;

    const qrValue = `${window.location.origin}/asset/scan/${assetId}`;

    const handlePrint = () => {
        const printWindow = window.open('', '', 'height=600,width=600');
        printWindow.document.write('<html><head><title>Asset QR Code</title>');
        printWindow.document.write('</head><body style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;font-family:sans-serif;">');
        printWindow.document.write(`<h2>${assetName}</h2>`);
        printWindow.document.write(`<p>${assetTag}</p>`);
        // We need to render the SVG string or image here. 
        // Since react-qr-code renders an SVG, we can't easily grab it string-wise without ref. 
        // For simplicity in this iteration, we'll just rely on the user printing the current modal or improve print later.
        // Actually, a better way for print is to use media print CSS or a dedicated print component.
        // Let's keep it simple: just show the QR and let them screenshot/print page for now, or use a window print on the modal content?
        // Let's stick to just displaying it clearly.
        printWindow.document.write('</body></html>');
        printWindow.print();
        printWindow.close();
    };

    return (
        <div className="qr-modal-overlay" style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 9999
        }}>
            <div className="qr-modal-content" style={{
                backgroundColor: 'var(--bg-color)', // Use main background color
                borderRadius: '16px',
                padding: '24px',
                maxWidth: '90%',
                width: '320px',
                textAlign: 'center',
                boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                border: '1px solid var(--border-color)' // Add border for definition in dark mode
            }}>
                <button
                    onClick={onClose}
                    style={{
                        position: 'absolute',
                        top: '12px',
                        right: '12px',
                        background: 'var(--bg-secondary)', // Adaptive button bg
                        border: 'none',
                        borderRadius: '50%',
                        width: '32px',
                        height: '32px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        color: 'var(--text-secondary)', // Adaptive icon color
                        fontSize: '18px',
                        transition: 'background 0.2s'
                    }}
                >
                    <FiX />
                </button>

                <h2 style={{ fontSize: '1.25rem', marginBottom: '20px', color: 'var(--text-primary)' }}>Asset QR Code</h2>

                <div style={{
                    padding: '16px',
                    background: 'white', // KEEP WHITE for QR contrast
                    border: '1px solid #e0e0e0',
                    borderRadius: '12px',
                    marginBottom: '16px',
                    display: 'flex',
                    justifyContent: 'center'
                }}>
                    <QRCode
                        size={200}
                        style={{ height: "auto", maxWidth: "100%", width: "200px" }}
                        value={qrValue}
                        viewBox={`0 0 256 256`}
                    />
                </div>

                <h3 style={{ margin: '0 0 4px 0', fontSize: '1.1rem', color: 'var(--text-primary)' }}>{assetName}</h3>
                <span style={{
                    fontSize: '0.85rem',
                    color: 'var(--text-secondary)',
                    background: 'var(--bg-secondary)',
                    padding: '4px 10px',
                    borderRadius: '20px',
                    display: 'inline-block',
                    marginBottom: '20px',
                    border: '1px solid var(--border-color)'
                }}>
                    {assetTag}
                </span>

                <button
                    onClick={onClose}
                    className="btn btn-primary" // Use class for unified button styling
                    style={{
                        width: '100%',
                        justifyContent: 'center'
                    }}
                >
                    Close
                </button>
            </div>
        </div>
    );
};

export default QRCodeModal;
