import React, { Suspense, useState, useEffect } from 'react';
import Spline from '@splinetool/react-spline';
import { Heart } from 'lucide-react';

interface SplineSceneProps {
  className?: string;
  fallbackHeight?: string;
}

function SplineError() {
  return (
    <div className="flex items-center justify-center bg-gradient-to-br from-soft-pink via-soft-cream to-soft-lavender h-full">
      <div className="text-center">
        <div className="w-16 h-16 bg-gradient-to-r from-primary-400 to-primary-600 rounded-full flex items-center justify-center mb-4 mx-auto">
          <Heart className="h-8 w-8 text-white animate-heartbeat" />
        </div>
        <p className="text-gray-600">EverBloom is ready! 🌸</p>
      </div>
    </div>
  );
}

function SplineLoading({ height }: { height: string }) {
  return (
    <div 
      className="flex items-center justify-center bg-gradient-to-br from-soft-pink via-soft-cream to-soft-lavender"
      style={{ height }}
    >
      <div className="text-center">
        <div className="w-16 h-16 bg-gradient-to-r from-primary-400 to-primary-600 rounded-full flex items-center justify-center mb-4 mx-auto animate-pulse">
          <Heart className="h-8 w-8 text-white animate-heartbeat" />
        </div>
        <p className="text-gray-600">Creating magical experience...</p>
      </div>
    </div>
  );
}

export default function SplineScene({ className = "", fallbackHeight = "400px" }: SplineSceneProps) {
  const [showFallback, setShowFallback] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    // Show fallback after 2 seconds to prevent long loading on slow connections
    const timer = setTimeout(() => {
      if (isLoading) {
        setShowFallback(true);
        setIsLoading(false);
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [isLoading]);

  const handleLoad = () => {
    setIsLoading(false);
    setShowFallback(false);
  };

  const handleError = () => {
    console.warn('Spline scene failed to load, showing fallback');
    setHasError(true);
    setShowFallback(true);
    setIsLoading(false);
  };

  if (showFallback || hasError) {
    return (
      <div className={`relative overflow-hidden ${className}`}>
        <SplineError />
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden ${className}`}>
      <Suspense fallback={<SplineLoading height={fallbackHeight} />}>
        {isLoading && (
          <div className="absolute inset-0 z-10">
            <SplineLoading height={fallbackHeight} />
          </div>
        )}
        <Spline
          scene="https://prod.spline.design/FcehnAzQ6vh3cwgc/scene.splinecode"
          onLoad={handleLoad}
          onError={handleError}
          style={{ 
            width: '100%', 
            height: '100%',
            opacity: isLoading ? 0 : 1,
            transition: 'opacity 0.5s ease-in-out'
          }}
        />
      </Suspense>
    </div>
  );
}