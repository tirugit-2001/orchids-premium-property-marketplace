"use client";

import { useEffect, useRef, useState } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

interface Panorama360ViewerProps {
  images: string[];
  isOpen: boolean;
  onClose: () => void;
  initialIndex?: number;
}

declare global {
  interface Window {
    pannellum: any;
  }
}

export function Panorama360Viewer({
  images,
  isOpen,
  onClose,
  initialIndex = 0,
}: Panorama360ViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<HTMLDivElement>(null);
  const pannellumRef = useRef<any>(null);
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isLoading, setIsLoading] = useState(true);
  const [libraryLoaded, setLibraryLoaded] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    // Load Pannellum library
    const loadPannellum = () => {
      // Check if already loaded
      if (window.pannellum && libraryLoaded) {
        initializePannellum();
        return;
      }

      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = "https://cdn.pannellum.org/2.5/pannellum.css";
      document.head.appendChild(link);

      const script = document.createElement("script");
      script.src = "https://cdn.pannellum.org/2.5/pannellum.js";
      script.async = true;

      script.onload = () => {
        setLibraryLoaded(true);
        setTimeout(() => {
          initializePannellum();
        }, 100);
      };

      script.onerror = () => {
        console.error("Failed to load Pannellum library");
        setIsLoading(false);
      };

      document.head.appendChild(script);
    };

    const initializePannellum = () => {
      if (!viewerRef.current || !images[currentIndex]) {
        setIsLoading(false);
        return;
      }

      try {
        // Destroy existing viewer if any
        if (pannellumRef.current) {
          try {
            pannellumRef.current.destroy();
          } catch (e) {
            console.warn("Error destroying previous viewer");
          }
        }

        // Clear the container
        if (viewerRef.current) {
          viewerRef.current.innerHTML = "";
        }

        pannellumRef.current = window.pannellum.viewer(viewerRef.current, {
          type: "equirectangular",
          panorama: images[currentIndex],
          autoLoad: true,
          showControls: true,
          mouseZoom: true,
          keyboardZoom: true,
          friction: 0.05,
          title: "360° Property View",
          preview: images[currentIndex],
          showFullscreenCtrl: true,
        });

        pannellumRef.current.on("load", () => {
          console.log("Pannellum viewer loaded successfully");
          setIsLoading(false);
        });

        pannellumRef.current.on("error", (error: string) => {
          console.error("Pannellum error:", error);
          setIsLoading(false);
        });
      } catch (error) {
        console.error("Error initializing Pannellum:", error);
        setIsLoading(false);
      }
    };

    loadPannellum();

    return () => {
      if (pannellumRef.current) {
        try {
          pannellumRef.current.destroy();
          pannellumRef.current = null;
        } catch (e) {
          console.warn("Error destroying Pannellum viewer");
        }
      }
    };
  }, [isOpen, currentIndex, images, libraryLoaded]);

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
    setIsLoading(true);
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
    setIsLoading(true);
  };

  if (!isOpen || !images || images.length === 0) return null;

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-50 bg-black bg-opacity-95 flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Close Button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-10 p-2 bg-black/50 hover:bg-black/70 rounded-full transition-colors"
      >
        <X className="w-6 h-6 text-white" />
      </button>

      {/* Title */}
      <div className="absolute top-4 left-4 text-white z-10">
        <h3 className="text-lg font-semibold">360° Property View</h3>
        <p className="text-sm text-gray-300">
          Image {currentIndex + 1} of {images.length}
        </p>
      </div>

      {/* Viewer Container */}
      <div
        ref={viewerRef}
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          height: "100%",
          position: "relative",
          borderRadius: "8px",
          overflow: "hidden",
        }}
      />

      {/* Loading State */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded pointer-events-none">
          <div className="text-white text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mb-4 mx-auto" />
            <p>Loading 360° image...</p>
          </div>
        </div>
      )}

      {/* Navigation - Only show if multiple images */}
      {images.length > 1 && (
        <>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handlePrevious();
            }}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-10 p-2 bg-black/50 hover:bg-black/70 rounded-full transition-colors"
          >
            <ChevronLeft className="w-6 h-6 text-white" />
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              handleNext();
            }}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-10 p-2 bg-black/50 hover:bg-black/70 rounded-full transition-colors"
          >
            <ChevronRight className="w-6 h-6 text-white" />
          </button>

          {/* Thumbnail strip */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-10 bg-black/60 p-3 rounded-lg max-w-[90%] overflow-x-auto">
            {images.map((img, idx) => (
              <button
                key={idx}
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentIndex(idx);
                  setIsLoading(true);
                }}
                className={`shrink-0 w-14 h-14 rounded border-2 transition-colors overflow-hidden ${
                  idx === currentIndex
                    ? "border-blue-500"
                    : "border-gray-600 hover:border-gray-400"
                }`}
              >
                <img
                  src={img}
                  alt={`360 image ${idx + 1}`}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src =
                      "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='56' height='56'%3E%3Crect fill='%23333' width='56' height='56'/%3E%3C/svg%3E";
                  }}
                />
              </button>
            ))}
          </div>
        </>
      )}

      {/* Help text */}
      <div className="absolute bottom-6 right-6 text-white text-xs bg-black/60 px-4 py-2 rounded hidden md:block pointer-events-none">
        <p className="font-semibold mb-1">Controls:</p>
        <p>🖱️ Drag to rotate</p>
        <p>🔄 Scroll to zoom</p>
      </div>
    </div>
  );
}
