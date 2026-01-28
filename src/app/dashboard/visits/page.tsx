"use client";

import { useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import dynamic from "next/dynamic";
import { Loader2, Sun, Moon } from "lucide-react";
import { useAuthStore } from "@/lib/store";

const PropertyMap = dynamic(
  () => import("@/components/PropertyMap").then((mod) => mod.PropertyMap),
  {
    ssr: false,
    loading: () => (
      <div className="h-96 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    ),
  }
);

export default function VisitsPage() {
  const { user } = useAuthStore();
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [visitRequests, setVisitRequests] = useState<any[]>([]);
  const [selectedMarker, setSelectedMarker] = useState<any>(null);
  const [mapCenter, setMapCenter] = useState({ lat: 20.5937, lng: 78.9629 });

  const [fetchError, setFetchError] = useState<string | null>(null);
  useEffect(() => {
    async function fetchVisits() {
      try {
        const res = await fetch("/api/visits");
        const data = await res.json();
        if (data.visit_requests) {
          setVisitRequests(data.visit_requests);
          setFetchError(null);
        } else {
          setVisitRequests([]);
          setFetchError("No visits found.");
        }
      } catch (err) {
        setVisitRequests([]);
        setFetchError("Failed to fetch visits.");
      }
    }
    fetchVisits();
  }, []);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) =>
          setMapCenter({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => {}
      );
    }
  }, []);

  return (
    <div
      className={`min-h-screen transition-colors duration-300 ${isDarkMode ? "bg-gray-900" : "bg-background"}`}
    >
      <Navbar />
      <div className="pt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8 p-6 rounded-xl border transition-colors ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-card'}">
            <div className="flex items-center justify-between mb-6">
              <h2
                className={`text-xl font-semibold mb-4 ${isDarkMode ? "text-white" : ""}`}
              >
                Visits Map
              </h2>
              <button
                onClick={() => setIsDarkMode(!isDarkMode)}
                className={`rounded p-2 border ${isDarkMode ? "bg-gray-700 border-gray-600 text-white" : ""}`}
                aria-label="Toggle dark mode"
              >
                {isDarkMode ? (
                  <Sun className="w-4 h-4" />
                ) : (
                  <Moon className="w-4 h-4" />
                )}
              </button>
            </div>
            <div
              className={`rounded-lg overflow-hidden border ${isDarkMode ? "border-gray-600" : ""}`}
              style={{ minHeight: 400 }}
            >
              {fetchError ? (
                <div className="flex items-center justify-center h-full text-muted-foreground text-center p-8">
                  {fetchError}
                </div>
              ) : (
                <PropertyMap
                  properties={visitRequests
                    .filter(
                      (v) =>
                        v.property &&
                        v.property.latitude &&
                        v.property.longitude
                    )
                    .map((v) => v.property)}
                  center={[mapCenter.lat, mapCenter.lng]}
                  zoom={13}
                  onMarkerClick={(propertyId: string) => {
                    const visit = visitRequests.find(
                      (v) => v.property?.id === propertyId
                    );
                    if (visit) setSelectedMarker(visit);
                  }}
                />
              )}
              {selectedMarker && (
                <div className="absolute top-8 left-1/2 transform -translate-x-1/2 z-50 bg-white dark:bg-gray-800 border rounded-lg shadow-lg p-4 w-80">
                  <h3 className="font-semibold text-lg mb-1">
                    {selectedMarker.property?.title}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                    {selectedMarker.property?.address}
                  </p>
                  <a
                    href={`/properties/${selectedMarker.property_id}`}
                    className="text-primary text-xs mt-2 inline-block hover:underline"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    View Details →
                  </a>
                  <button
                    className="absolute top-2 right-2 text-gray-400 hover:text-gray-700 dark:hover:text-white"
                    onClick={() => setSelectedMarker(null)}
                    aria-label="Close"
                  >
                    ×
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
