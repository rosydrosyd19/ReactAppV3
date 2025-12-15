import React from 'react';
import QRCode from 'react-qr-code';
import { FiX, FiDownload, FiPrinter } from 'react-icons/fi';
import './AssetModal.css'; // Reusing AssetModal styles for consistency

const QRCodeModal = ({ isOpen, onClose, assetId, assetName, assetTag }) => {
    if (!isOpen) return null;

    const qrValue = `${window.location.origin}/asset/scan/${assetId}`;

    const handlePrint = () => {
        const printWindow = window.open('', '', 'height=600,width=600');
        printWindow.document.write(`
            <html>
                <head>
                    <title>Asset QR Code - ${assetTag}</title>
                    <style>
                        body {
                            font-family: Arial, sans-serif;
                            display: flex;
                            flex-direction: column;
                            align-items: center;
                            justify-content: center;
                            height: 100vh;
                            margin: 0;
                            text-align: center;
                        }
                        .qr-container {
                            border: 2px solid #000;
                            padding: 20px;
                            border-radius: 10px;
                        }
                        h2 { margin: 10px 0 5px; font-size: 18px; }
                        p { margin: 5px 0; font-size: 14px; color: #555; }
                        .tag { font-weight: bold; font-size: 16px; margin-top: 10px; }
                    </style>
                </head>
                <body>
                    <div class="qr-container">
                        <h2>${assetName}</h2>
                        <div id="qr-code"></div>
                        <p class="tag">${assetTag}</p>
                    </div>
                </body>
            </html>
        `);

        // Grab the SVG from the modal
        // We look for the SVG inside the modal's content
        // Since the modal is rendered in the DOM, we can query it relative to the document or give it an ID
        // The modal content has specific styles, we can target the QRCode component wrapper
        // Let's add an ID to the wrapper in the JSX to make it easier, or just query generically if unique enough.
        // The QRCode component is inside a div with background white.
        const qrSvg = document.querySelector('#modal-qr-wrap svg');

        if (qrSvg) {
            const printQrDiv = printWindow.document.getElementById('qr-code');
            printQrDiv.innerHTML = qrSvg.outerHTML;
            // Adjust size for print
            const svg = printQrDiv.querySelector('svg');
            svg.style.width = '200px';
            svg.style.height = '200px';
        }

        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
            printWindow.print();
            printWindow.close();
        }, 500);
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

                <div
                    id="modal-qr-wrap"
                    style={{
                        padding: '16px',
                        background: 'white', // KEEP WHITE for QR contrast
                        border: '1px solid #e0e0e0',
                        borderRadius: '12px',
                        marginBottom: '16px',
                        display: 'flex',
                        justifyContent: 'center'
                    }}
                >
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
                    onClick={handlePrint}
                    className="btn btn-outline"
                    style={{
                        width: '100%',
                        justifyContent: 'center',
                        marginBottom: '10px'
                    }}
                >
                    <FiPrinter /> Print QR
                </button>

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
