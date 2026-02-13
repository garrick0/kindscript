import React, { useState, useEffect, useRef } from 'react';
import { cn } from '../../../../utils/cn';

export interface OptimizedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  fallbackSrc?: string;
  blurDataUrl?: string;
  priority?: boolean;
  quality?: number;
  sizes?: string;
  onLoadComplete?: () => void;
  aspectRatio?: 'square' | '16/9' | '4/3' | '21/9' | 'auto';
}

/**
 * Optimized image component with lazy loading, blur placeholder, and error handling
 */
export function OptimizedImage({
  src,
  alt,
  fallbackSrc = '/images/placeholder.jpg',
  blurDataUrl,
  priority = false,
  quality = 75,
  sizes,
  onLoadComplete,
  aspectRatio = 'auto',
  className,
  ...props
}: OptimizedImageProps) {
  const [imageSrc, setImageSrc] = useState(blurDataUrl || '');
  const [isLoading, setIsLoading] = useState(!priority);
  const [isError, setIsError] = useState(false);
  const [isInView, setIsInView] = useState(priority);
  const imgRef = useRef<HTMLImageElement>(null);

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (priority || !imgRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observer.disconnect();
          }
        });
      },
      {
        rootMargin: '50px',
        threshold: 0.01,
      }
    );

    observer.observe(imgRef.current);

    return () => {
      observer.disconnect();
    };
  }, [priority]);

  // Load image when in view
  useEffect(() => {
    if (!isInView) return;

    const img = new Image();
    
    img.onload = () => {
      setImageSrc(src);
      setIsLoading(false);
      setIsError(false);
      onLoadComplete?.();
    };

    img.onerror = () => {
      setImageSrc(fallbackSrc);
      setIsLoading(false);
      setIsError(true);
    };

    img.src = src;

    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [isInView, src, fallbackSrc, onLoadComplete]);

  const aspectRatioClasses = {
    'square': 'aspect-square',
    '16/9': 'aspect-video',
    '4/3': 'aspect-4/3',
    '21/9': 'aspect-[21/9]',
    'auto': '',
  };

  return (
    <div
      className={cn(
        'relative overflow-hidden bg-gray-100',
        aspectRatioClasses[aspectRatio],
        className
      )}
    >
      <img
        ref={imgRef}
        src={imageSrc || fallbackSrc}
        alt={alt}
        loading={priority ? 'eager' : 'lazy'}
        decoding={priority ? 'sync' : 'async'}
        sizes={sizes}
        className={cn(
          'w-full h-full object-cover transition-opacity duration-300',
          {
            'opacity-0': isLoading && !blurDataUrl,
            'opacity-100': !isLoading || blurDataUrl,
            'blur-lg': isLoading && blurDataUrl,
            'blur-0': !isLoading,
          }
        )}
        {...props}
      />
      
      {isLoading && !blurDataUrl && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
        </div>
      )}

      {isError && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <div className="text-center text-gray-500">
            <svg
              className="w-12 h-12 mx-auto mb-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <p className="text-sm">Failed to load image</p>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Generate a blur data URL from a small image
 */
export async function generateBlurDataUrl(imageSrc: string, width = 10): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }

      const aspectRatio = img.height / img.width;
      canvas.width = width;
      canvas.height = Math.floor(width * aspectRatio);
      
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL('image/jpeg', 0.1));
    };
    
    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };
    
    img.src = imageSrc;
  });
}

/**
 * Preload images for better performance
 */
export function preloadImages(urls: string[]): Promise<void[]> {
  return Promise.all(
    urls.map(
      (url) =>
        new Promise<void>((resolve, reject) => {
          const img = new Image();
          img.onload = () => resolve();
          img.onerror = reject;
          img.src = url;
        })
    )
  );
}