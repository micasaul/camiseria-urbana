import { useState, useEffect, useRef } from 'react';

const NgrokImage = ({ src, alt, className, style }) => {
  const [imageSrc, setImageSrc] = useState(null);
  const [loading, setLoading] = useState(true);
  const blobRef = useRef(null);

  useEffect(() => {
    blobRef.current = null;
    if (!src) {
      setImageSrc(null);
      setLoading(false);
      return;
    }
    if ((src.startsWith('http') && !src.includes('ngrok')) || src.startsWith('blob:')) {
      setImageSrc(src);
      setLoading(false);
      return;
    }

    const fetchImage = async () => {
      try {
        const response = await fetch(src, {
          headers: {
            'ngrok-skip-browser-warning': 'true',
          },
        });

        if (!response.ok) throw new Error('Error cargando imagen');

        const blob = await response.blob();
        const objectUrl = URL.createObjectURL(blob);
        blobRef.current = objectUrl;
        setImageSrc(objectUrl);
      } catch (error) {
        console.error('Error bypassing Ngrok:', error);
        setImageSrc(src);
      } finally {
        setLoading(false);
      }
    };

    fetchImage();

    return () => {
      if (blobRef.current) {
        URL.revokeObjectURL(blobRef.current);
        blobRef.current = null;
      }
    };
  }, [src]);

  if (loading) {
    return (
      <div
        className={`skeleton-loader ${className || ''}`}
        style={{ ...style, background: '#eee', minHeight: '100px' }}
      />
    );
  }

  if (!imageSrc) return null;

  return (
    <img src={imageSrc} alt={alt} className={className} style={style} />
  );
};

export default NgrokImage;
