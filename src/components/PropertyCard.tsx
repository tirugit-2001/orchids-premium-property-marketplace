"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Property } from "@/lib/types";
import {
  Heart,
  MapPin,
  BedDouble,
  Bath,
  Maximize,
  IndianRupee,
  BadgeCheck,
  Eye,
} from "lucide-react";

interface PropertyCardProps {
  property: Property;
  onFavorite?: (id: string) => void;
  isFavorite?: boolean;
}

const defaultImages = [
  "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800",
  "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800",
  "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800",
  "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800",
];

export function PropertyCard({
  property,
  onFavorite,
  isFavorite,
  isSelected,
  onClick,
}: PropertyCardProps & { isSelected?: boolean; onClick?: () => void }) {
  const imageUrl =
    property.images?.[0] ||
    defaultImages[Math.floor(Math.random() * defaultImages.length)];

  const formatPrice = (price: number, listingType: string) => {
    if (price >= 10000000) {
      return `${(price / 10000000).toFixed(2)} Cr`;
    } else if (price >= 100000) {
      return `${(price / 100000).toFixed(2)} L`;
    } else if (price >= 1000) {
      return `${(price / 1000).toFixed(1)}K`;
    }
    return price.toString();
  };

  const getPriceLabel = (listingType: string) => {
    switch (listingType) {
      case "rent":
        return "/month";
      case "lease":
        return "/year";
      default:
        return "";
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      className={`group bg-card rounded-2xl border overflow-hidden hover:shadow-xl transition-all duration-300 ${isSelected ? "ring-2 ring-primary border-primary" : ""}`}
      onClick={onClick}
    >
      <Link href={`/properties/${property.id}`}>
        <div className="relative h-56 overflow-hidden">
          <Image
            src={imageUrl}
            alt={property.title}
            fill
            className="object-cover group-hover:scale-110 transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-transparent" />

          <div className="absolute top-4 left-4 flex gap-2">
            <Badge className="bg-primary/90 backdrop-blur">
              {property.listing_type === "sale"
                ? "For Sale"
                : property.listing_type === "rent"
                  ? "For Rent"
                  : "For Lease"}
            </Badge>
            {property.is_verified && (
              <Badge
                variant="secondary"
                className="bg-green-500/90 text-white backdrop-blur"
              >
                <BadgeCheck className="w-3 h-3 mr-1" />
                Verified
              </Badge>
            )}
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="absolute top-4 right-4 h-9 w-9 rounded-full bg-white/20 backdrop-blur hover:bg-white/40"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onFavorite?.(property.id);
            }}
          >
            <Heart
              className={`w-5 h-5 ${isFavorite ? "fill-red-500 text-red-500" : "text-white"}`}
            />
          </Button>

          <div className="absolute bottom-4 left-4 right-4">
            <div className="flex items-center gap-2 text-white/80 text-sm mb-2">
              <MapPin className="w-4 h-4" />
              <span className="truncate">
                {property.city}, {property.state}
              </span>
            </div>
          </div>
        </div>
      </Link>

      <div className="p-5">
        <Link href={`/properties/${property.id}`}>
          <h3 className="font-semibold text-lg mb-2 line-clamp-1 group-hover:text-primary transition-colors">
            {property.title}
          </h3>
        </Link>

        <div className="flex items-baseline gap-1 mb-4">
          <IndianRupee className="w-5 h-5 text-primary" />
          <span className="text-2xl font-bold text-primary">
            {formatPrice(property.price, property.listing_type)}
          </span>
          <span className="text-muted-foreground text-sm">
            {getPriceLabel(property.listing_type)}
          </span>
          {property.price_negotiable && (
            <Badge variant="outline" className="ml-2 text-xs">
              Negotiable
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-4 text-muted-foreground text-sm mb-4">
          {property.bedrooms && (
            <div className="flex items-center gap-1.5">
              <BedDouble className="w-4 h-4" />
              <span>{property.bedrooms} Beds</span>
            </div>
          )}
          {property.bathrooms && (
            <div className="flex items-center gap-1.5">
              <Bath className="w-4 h-4" />
              <span>{property.bathrooms} Baths</span>
            </div>
          )}
          {property.area_sqft && (
            <div className="flex items-center gap-1.5">
              <Maximize className="w-4 h-4" />
              <span>{property.area_sqft} sqft</span>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between pt-4 border-t">
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <span className="capitalize">{property.property_type}</span>
            {property.furnishing && (
              <>
                <span>•</span>
                <span className="capitalize">
                  {property.furnishing.replace("-", " ")}
                </span>
              </>
            )}
          </div>
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Eye className="w-4 h-4" />
            <span>{property.views_count}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
