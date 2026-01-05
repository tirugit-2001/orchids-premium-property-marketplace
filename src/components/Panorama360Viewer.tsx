"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { X, Compass, ZoomIn, ZoomOut, RotateCw } from "lucide-react";

interface Panorama360ViewerProps {
  images: string[];
  isOpen: boolean;
  onClose: () => void;
  initialIndex?: number;
}

export function Panorama360Viewer({
  images,
  isOpen,
  onClose,
  initialIndex = 0,
}: Panorama360ViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [panX, setPanX] = useState(0);
  const [scale, setScale] = useState(1);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageAspectRatio, setImageAspectRatio] = useState(2); // Default 2:1 for equirectangular

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "unset";
      };
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(initialIndex);
      setPanX(0);
      setScale(1);
      setImageLoaded(false);
      setIsDragging(false);
    }
  }, [initialIndex, isOpen]);

  if (!isOpen || !images || images.length === 0) return null;

  const currentImage = images[currentIndex];

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    setStartX(e.clientX);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    e.preventDefault();

    const deltaX = e.clientX - startX;
    const containerWidth =
      containerRef.current?.clientWidth || window.innerWidth;

    // For equirectangular panorama: image width = 2 * image height
    // We need to pan across the full width of the image
    // Calculate how much of the image width we can see
    const visibleWidth = containerWidth / scale;
    const imageWidth = visibleWidth * imageAspectRatio; // Full image width at current scale

    // Calculate pan amount - each pixel dragged moves the image
    // We want smooth panning that allows wrapping
    setPanX((prev) => {
      const newPan = prev - deltaX;
      // Allow infinite panning (wrapping effect)
      // Normalize to keep it within reasonable bounds for performance
      const maxPan = imageWidth - visibleWidth;
      if (maxPan > 0) {
        // Wrap around for seamless 360 effect
        if (newPan < -maxPan) return newPan + maxPan;
        if (newPan > 0) return newPan - maxPan;
      }
      return newPan;
    });

    setStartX(e.clientX);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setScale((prev) => {
      const newScale = Math.max(0.5, Math.min(3, prev * delta));
      return newScale;
    });
  };

  const nextImage = () => {
    setCurrentIndex((prev) => (prev + 1) % images.length);
    setPanX(0);
    setScale(1);
    setImageLoaded(false);
  };

  const prevImage = () => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
    setPanX(0);
    setScale(1);
    setImageLoaded(false);
  };

  const resetView = () => {
    setPanX(0);
    setScale(1);
  };

  // Calculate image display dimensions
  // For equirectangular: maintain 2:1 aspect ratio, fill height
  const containerHeight =
    containerRef.current?.clientHeight || window.innerHeight;
  const imageHeight = containerHeight / scale;
  const imageWidth = imageHeight * imageAspectRatio;

  return (
    <div
      className="fixed inset-0 z-9999 bg-black flex items-center justify-center"
      onClick={onClose}
    >
      <div
        className="relative w-full h-full flex items-center justify-center"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-4 right-4 z-10 bg-black/70 hover:bg-black/90 text-white border border-white/20"
          onClick={onClose}
        >
          <X className="w-6 h-6" />
        </Button>

        {/* Image Container */}
        <div
          ref={containerRef}
          className="relative w-full h-full overflow-hidden"
          style={{
            cursor: isDragging ? "grabbing" : "grab",
          }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onWheel={handleWheel}
        >
          {!imageLoaded && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50">
              <div className="text-white text-lg flex items-center gap-3">
                <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Loading 360° view...</span>
              </div>
            </div>
          )}

          {/* Panorama Image */}
          <div
            className="absolute inset-0 flex items-center justify-center"
            style={{
              transform: `scale(${scale})`,
              transformOrigin: "center center",
            }}
          >
            <div
              className="relative"
              style={{
                height: `${imageHeight}px`,
                width: `${imageWidth}px`,
                transform: `translateX(${panX}px)`,
                transition: isDragging ? "none" : "transform 0.05s linear",
              }}
            >
              <img
                ref={imageRef}
                src={currentImage}
                alt={`360° View ${currentIndex + 1}`}
                style={{
                  width: `${imageWidth}px`,
                  height: `${imageHeight}px`,
                  display: "block",
                  objectFit: "cover",
                  userSelect: "none",
                }}
                draggable={false}
                onLoad={(e) => {
                  setImageLoaded(true);
                  const img = e.currentTarget;
                  const aspectRatio = img.naturalWidth / img.naturalHeight;
                  setImageAspectRatio(aspectRatio);

                  console.log("360° Image loaded:", {
                    dimensions: `${img.naturalWidth}x${img.naturalHeight}`,
                    aspectRatio: aspectRatio.toFixed(2),
                    isEquirectangular: Math.abs(aspectRatio - 2.0) < 0.1,
                  });

                  if (Math.abs(aspectRatio - 2.0) > 0.1) {
                    console.warn(
                      `⚠️ Image aspect ratio is ${aspectRatio.toFixed(2)}:1, expected 2:1 for equirectangular panorama.`
                    );
                  }
                }}
                onError={() => {
                  setImageLoaded(true);
                  console.error("❌ Failed to load 360° image:", currentImage);
                }}
              />
            </div>
          </div>
        </div>

        {/* Controls Bar */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-black/80 backdrop-blur-md rounded-full px-4 py-3 border border-white/10 shadow-2xl">
          {/* Navigation */}
          {images.length > 1 && (
            <>
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/20 h-9 w-9"
                onClick={(e) => {
                  e.stopPropagation();
                  prevImage();
                }}
              >
                <span className="text-lg">←</span>
              </Button>
              <span className="text-white text-sm px-3 min-w-[60px] text-center">
                {currentIndex + 1} / {images.length}
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/20 h-9 w-9"
                onClick={(e) => {
                  e.stopPropagation();
                  nextImage();
                }}
              >
                <span className="text-lg">→</span>
              </Button>
              <div className="w-px h-6 bg-white/30 mx-1" />
            </>
          )}

          {/* Zoom Controls */}
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/20 h-9 w-9"
            onClick={(e) => {
              e.stopPropagation();
              setScale((prev) => Math.max(0.5, prev - 0.1));
            }}
          >
            <ZoomOut className="w-4 h-4" />
          </Button>
          <span className="text-white text-xs px-2 min-w-[40px] text-center">
            {Math.round(scale * 100)}%
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/20 h-9 w-9"
            onClick={(e) => {
              e.stopPropagation();
              setScale((prev) => Math.min(3, prev + 0.1));
            }}
          >
            <ZoomIn className="w-4 h-4" />
          </Button>

          {/* Reset View */}
          <div className="w-px h-6 bg-white/30 mx-1" />
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/20 h-9 w-9"
            onClick={(e) => {
              e.stopPropagation();
              resetView();
            }}
          >
            <RotateCw className="w-4 h-4" />
          </Button>
        </div>

        {/* Instructions */}
        <div className="absolute top-6 left-1/2 -translate-x-1/2 bg-black/80 backdrop-blur-md rounded-lg px-4 py-2 border border-white/10 shadow-lg">
          <p className="text-white text-sm flex items-center gap-2">
            <Compass className="w-4 h-4" />
            <span>Drag to rotate • Scroll to zoom</span>
          </p>
        </div>
      </div>
    </div>
  );
}
