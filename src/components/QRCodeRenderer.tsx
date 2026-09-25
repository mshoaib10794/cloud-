import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';

interface QRCodeRendererProps {
  value: string;
  size?: number;
  className?: string;
  includeMargin?: boolean;
  alt?: string;
}

export const QRCodeRenderer: React.FC<QRCodeRendererProps> = ({
  value,
  size = 120,
  className = '',
  includeMargin = true,
  alt = 'Order QR Code'
}) => {
  const [dataUrl, setDataUrl] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    setError(null);

    QRCode.toDataURL(value, {
      width: size * 2, // 2x resolution for retina / crisp print
      margin: includeMargin ? 2 : 1,
      color: {
        dark: '#0f172a',
        light: '#ffffff'
      },
      errorCorrectionLevel: 'M'
    })
      .then((url) => {
        if (isMounted) {
          setDataUrl(url);
        }
      })
      .catch((err) => {
        console.error('Error generating QR code:', err);
        if (isMounted) {
          setError('Failed to generate QR');
        }
      });

    return () => {
      isMounted = false;
    };
  }, [value, size, includeMargin]);

  if (error) {
    return (
      <div
        style={{ width: size, height: size }}
        className={`bg-rose-50 border border-rose-200 rounded flex items-center justify-center text-[10px] text-rose-500 text-center p-1 ${className}`}
      >
        QR Error
      </div>
    );
  }

  if (!dataUrl) {
    return (
      <div
        style={{ width: size, height: size }}
        className={`bg-slate-100 border border-slate-200 rounded animate-pulse flex items-center justify-center text-[9px] font-mono text-slate-400 ${className}`}
      >
        QR...
      </div>
    );
  }

  return (
    <img
      src={dataUrl}
      alt={alt}
      width={size}
      height={size}
      style={{ width: size, height: size }}
      className={`object-contain ${className}`}
      loading="lazy"
    />
  );
};

/**
 * Utility to generate a QR data URL asynchronously
 */
export async function generateQRDataURL(text: string, size = 250): Promise<string> {
  return QRCode.toDataURL(text, {
    width: size,
    margin: 2,
    color: {
      dark: '#0f172a',
      light: '#ffffff'
    },
    errorCorrectionLevel: 'M'
  });
}
