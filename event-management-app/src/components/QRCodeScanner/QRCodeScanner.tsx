import React, { useEffect, useRef, useState, useImperativeHandle, forwardRef } from 'react';
import jsQR from 'jsqr';
import './QRCodeScanner.css';

interface QRCodeScannerProps {
  onScan: (qrCode: string) => void;
  onError?: (error: string) => void;
}

export interface QRCodeScannerHandle {
  stopCamera: () => void;
}

const QRCodeScanner = forwardRef<QRCodeScannerHandle, QRCodeScannerProps>(
  ({ onScan, onError }, ref) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [scanning, setScanning] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const animationFrameRef = useRef<number | null>(null);
    const lastScannedRef = useRef<string>('');
    const scanTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const isStoppingRef = useRef(false);

    const stopCamera = () => {
      isStoppingRef.current = true;
      setScanning(false);
      
      if (streamRef.current) {
        const tracks = streamRef.current.getTracks();
        tracks.forEach((track) => track.stop());
        streamRef.current = null;
      }
      
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
      
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      
      if (scanTimeoutRef.current) {
        clearTimeout(scanTimeoutRef.current);
        scanTimeoutRef.current = null;
      }
    };

    // Expose stopCamera method to parent component
    useImperativeHandle(ref, () => ({
      stopCamera,
    }), []);

    // Use useCallback for scanQR to avoid creating infinite dependency loops
    const scanQR = React.useCallback(() => {
      if (isStoppingRef.current || !videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    if (!ctx || video.readyState !== video.HAVE_ENOUGH_DATA) {
      animationFrameRef.current = requestAnimationFrame(scanQR);
      return;
    }

    // Set canvas size to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw video frame to canvas
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const code = jsQR(imageData.data, imageData.width, imageData.height);

    if (code) {
      const scannedCode = code.data;
      
      // Prevent scanning the same code multiple times within 2 seconds
      if (scannedCode !== lastScannedRef.current) {
        lastScannedRef.current = scannedCode;
        onScan(scannedCode);

        // Reset after 2 seconds to allow re-scanning
        scanTimeoutRef.current = setTimeout(() => {
          lastScannedRef.current = '';
        }, 2000);
      }
    }

    if (!isStoppingRef.current) {
      animationFrameRef.current = requestAnimationFrame(scanQR);
    }
  }, [onScan]);

  const startCamera = React.useCallback(async () => {
    if (isStoppingRef.current) return;

    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 640 }, height: { ideal: 480 } },
      });

      // Check if component is being unmounted
      if (isStoppingRef.current) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        
        // Handle play errors gracefully
        videoRef.current.play().catch((playError) => {
          console.warn('Video play warning:', playError);
          // Continue anyway - video might still work
        });
        
        setScanning(true);
        scanQR();
      }
    } catch (err) {
      if (!isStoppingRef.current) {
        const errorMsg = err instanceof Error ? err.message : 'Không thể truy cập camera';
        setError(errorMsg);
        onError?.(errorMsg);
        console.error('Camera access error:', err);
      }
    }
  }, [onError, scanQR]);

  useEffect(() => {
    isStoppingRef.current = false;
    startCamera();

    return () => {
      stopCamera();
    };
  }, [startCamera]);

  const retryCamera = () => {
    stopCamera();
    setTimeout(() => {
      startCamera();
    }, 500);
  };

  return (
    <div className="qr-scanner-container">
      {error ? (
        <div className="qr-scanner-error">
          <div className="error-message">
            <p>❌ {error}</p>
            <p style={{ fontSize: '0.9rem', color: '#666', marginTop: '0.5rem' }}>
              Vui lòng kiểm tra quyền truy cập camera của trình duyệt
            </p>
          </div>
          <button className="retry-button" onClick={retryCamera}>
            🔄 Thử lại
          </button>
        </div>
      ) : (
        <div className="qr-scanner-wrapper">
          <video
            ref={videoRef}
            className="qr-video"
            playsInline
            style={{
              width: '100%',
              borderRadius: '0.5rem',
              background: '#000',
              display: scanning ? 'block' : 'none',
            }}
          />
          <canvas ref={canvasRef} style={{ display: 'none' }} />
          {scanning && (
            <div className="qr-scanner-overlay">
              <div className="qr-scan-box">
                <div className="qr-corner qr-top-left"></div>
                <div className="qr-corner qr-top-right"></div>
                <div className="qr-corner qr-bottom-left"></div>
                <div className="qr-corner qr-bottom-right"></div>
              </div>
            </div>
          )}
          {scanning && (
            <div className="qr-scanner-hint">
              <span>📱 Quét mã QR vào khung</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
  }
);

QRCodeScanner.displayName = 'QRCodeScanner';

export default QRCodeScanner;
