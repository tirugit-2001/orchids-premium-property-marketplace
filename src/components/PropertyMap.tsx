"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { Property } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { IndianRupee, MapPin, BedDouble, Bath } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

// Fix for default marker icons in Leaflet with Next.js
const DefaultIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

interface PropertyMapProps {
  properties: Property[];
  center?: [number, number];
  zoom?: number;
  onMarkerClick?: (propertyId: string) => void;
}

function ChangeView({
  center,
  zoom,
}: {
  center: [number, number];
  zoom: number;
}) {
  const map = useMap();
  map.setView(center, zoom);
  return null;
}

export function PropertyMap({
  properties,
  center = [20.5937, 78.9629],
  zoom = 5,
  onMarkerClick,
}: PropertyMapProps) {
  // Only use properties with valid lat/lng
  const validProperties = properties.filter(
    (p) =>
      typeof p.latitude === "number" &&
      typeof p.longitude === "number" &&
      p.latitude !== null &&
      p.longitude !== null &&
      !isNaN(p.latitude) &&
      !isNaN(p.longitude)
  );

  // If no center provided, calculate center from first valid property
  const mapCenter =
    validProperties.length > 0
      ? ([validProperties[0].latitude, validProperties[0].longitude] as [
          number,
          number,
        ])
      : center;

  return (
    <div
      className="h-full w-full rounded-xl overflow-hidden border shadow-sm z-0"
      style={{ minHeight: 400 }}
    >
      <MapContainer
        center={mapCenter}
        zoom={validProperties.length > 0 ? 12 : zoom}
        style={{ height: "100%", width: "100%" }}
      >
        <ChangeView
          center={mapCenter}
          zoom={validProperties.length > 0 ? 12 : zoom}
        />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {validProperties.map((property) => (
          <Marker
            key={property.id}
            position={[property.latitude, property.longitude]}
            eventHandlers={
              onMarkerClick
                ? {
                    click: () => onMarkerClick(property.id),
                  }
                : undefined
            }
          >
            <Popup className="property-popup">
              <div className="w-64 p-0 overflow-hidden">
                <div className="relative h-32 w-full">
                  <Image
                    src={
                      property.images?.[0] ||
                      "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=400"
                    }
                    alt={property.title}
                    fill
                    className="object-cover"
                  />
                  <div className="absolute top-2 left-2">
                    <Badge className="bg-primary/90">
                      ₹
                      {property.price >= 100000
                        ? (property.price / 100000).toFixed(1) + "L"
                        : (property.price / 1000).toFixed(0) + "K"}
                    </Badge>
                  </div>
                </div>
                <div className="p-3">
                  <h3 className="font-semibold text-sm line-clamp-1 mb-1">
                    {property.title}
                  </h3>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
                    <MapPin className="w-3 h-3" />
                    <span className="truncate">
                      {property.address}, {property.city}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex gap-3 text-xs">
                      <div className="flex items-center gap-1">
                        <BedDouble className="w-3 h-3" />
                        <span>{property.bedrooms}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Bath className="w-3 h-3" />
                        <span>{property.bathrooms}</span>
                      </div>
                    </div>
                    <Link
                      href={`/properties/${property.id}`}
                      className="text-xs font-semibold text-primary hover:underline"
                    >
                      View Details
                    </Link>
                  </div>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
