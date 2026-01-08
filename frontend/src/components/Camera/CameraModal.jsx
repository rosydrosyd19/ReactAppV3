import { useState, useRef, useEffect } from 'react';
import { FiX, FiCamera, FiRefreshCw } from 'react-icons/fi';
import './CameraModal.css';

const CameraModal = ({ isOpen, onClose, onCapture }) => {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const [stream, setStream] = useState(null);
    const [error, setError] = useState('');
    const [isStreaming, setIsStreaming] = useState(false);

    useEffect(() => {
        if (isOpen) {
            startCamera();
        } else {
            stopCamera();
        }
        return () => {
            stopCamera();
        };
    }, [isOpen]);

    const startCamera = async () => {
        setError('');

        // Check if browser supports mediaDevices (often undefined in insecure contexts like HTTP)
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            setError('Camera access requires a secure connection (HTTPS) or localhost. Please use the "From Gallery" option instead.');
            return;
        }

        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'environment' }
            });
            setStream(mediaStream);
            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
                setIsStreaming(true);
            }
        } catch (err) {
            console.error("Error accessing camera:", err);
            // Handle specific error types if needed, but generic fallback is good
            if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
                setError('Camera permission denied. Please allow camera access in your browser settings.');
            } else {
                setError('Could not access camera. Please ensure you have granted camera permissions.');
            }
        }
    };

    const stopCamera = () => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            setStream(null);
            setIsStreaming(false);
        }
    };

    const handleCapture = () => {
        if (videoRef.current && canvasRef.current) {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            const context = canvas.getContext('2d');

            // Set canvas dimensions to match video
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;

            // Draw video frame to canvas
            context.drawImage(video, 0, 0, canvas.width, canvas.height);

            // Convert to blob
            canvas.toBlob((blob) => {
                if (blob) {
                    // Create a File object from the blob
                    const file = new File([blob], `capture-${Date.now()}.png`, { type: 'image/png' });
                    onCapture(file);
                    onClose();
                }
            }, 'image/png');
        }
    };

    if (!isOpen) return null;

    return (
        <div className="camera-modal-overlay">
            <div className="camera-modal-content">
                <div className="camera-modal-header">
                    <h3>Take Photo</h3>
                    <button className="close-btn" onClick={onClose}>
                        <FiX />
                    </button>
                </div>

                <div className="camera-view">
                    {error ? (
                        <div className="camera-error">
                            <p>{error}</p>
                        </div>
                    ) : (
                        <video
                            ref={videoRef}
                            autoPlay
                            playsInline
                            className="camera-video"
                            onLoadedMetadata={() => videoRef.current.play()}
                        />
                    )}
                    <canvas ref={canvasRef} style={{ display: 'none' }} />
                </div>

                <div className="camera-controls">
                    {!error && (
                        <button className="capture-btn" onClick={handleCapture}>
                            <div className="capture-btn-inner"></div>
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CameraModal;
