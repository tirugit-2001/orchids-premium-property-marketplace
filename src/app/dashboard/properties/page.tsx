"use client";

import { useState, useEffect } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { motion } from "framer-motion";
import { Navbar } from "@/components/Navbar";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Property } from "@/lib/types";
import { useAuthStore } from "@/lib/store";
import {
  Plus,
  Home,
  Eye,
  Phone,
  Heart,
  Loader2,
  MoreVertical,
  Edit,
  Trash2,
  CheckCircle,
  Clock,
  XCircle,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import Image from "next/image";
import { toast } from "sonner";

const statusConfig = {
  approved: {
    label: "Live",
    icon: CheckCircle,
    className: "bg-green-100 text-green-700",
  },
  pending: {
    label: "Pending",
    icon: Clock,
    className: "bg-yellow-100 text-yellow-700",
  },
  rejected: {
    label: "Rejected",
    icon: XCircle,
    className: "bg-red-100 text-red-700",
  },
  draft: { label: "Draft", icon: Edit, className: "bg-gray-100 text-gray-700" },
};

export default function MyPropertiesPage() {
  const { user } = useAuthStore();
  const [properties, setProperties] = useState<Property[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [nearbyEnabled, setNearbyEnabled] = useState(false);
  const [nearbyRadius, setNearbyRadius] = useState(5); // km
  const [userLocation, setUserLocation] = useState<[number, number] | null>(
    null
  );
  const [propertyToDelete, setPropertyToDelete] = useState<Property | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const hasActiveSubscription = useAuthStore((s: any) =>
    s.hasActiveSubscription()
  );

  useEffect(() => {
    if (user) {
      fetchProperties();
    }
  }, [user]);

  const fetchProperties = async () => {
    setIsLoading(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("properties")
        .select("*")
        .eq("owner_id", user?.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      if (data) {
        setProperties(data as Property[]);
      }
    } catch (error) {
      console.error("Error fetching properties:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Get user live location on mount
  useEffect(() => {
    if (typeof window !== "undefined" && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserLocation([pos.coords.latitude, pos.coords.longitude]);
        },
        () => {},
        { enableHighAccuracy: true }
      );
    }
  }, []);

  // Haversine formula for distance in km
  function getDistanceKm(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ) {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  const filteredProperties = properties.filter((property) => {
    if (
      nearbyEnabled &&
      userLocation &&
      typeof property.latitude === "number" &&
      typeof property.longitude === "number"
    ) {
      const dist = getDistanceKm(
        userLocation[0],
        userLocation[1],
        property.latitude,
        property.longitude
      );
      if (dist > nearbyRadius) return false;
    } else if (nearbyEnabled && !userLocation) {
      return false;
    }
    return true;
  });
  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this property?"))
      return;

    try {
      const supabase = createClient();
      const { error } = await supabase.from("properties").delete().eq("id", id);

      if (error) throw error;
      setProperties(properties.filter((p) => p.id !== id));
    } catch (error) {
      console.error("Error deleting property:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="pt-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold mb-2">My Properties</h1>
              <p className="text-muted-foreground">
                {properties.length}{" "}
                {properties.length === 1 ? "property" : "properties"} listed
              </p>
            </div>
            <Button asChild>
              <Link href="/dashboard/properties/new">
                <Plus className="w-4 h-4 mr-2" />
                Add New Property
              </Link>
            </Button>
          </div>

          {filteredProperties.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-20"
            >
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                <Home className="w-10 h-10 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-2">No properties yet</h3>
              <p className="text-muted-foreground mb-6">
                List your first property and start connecting with potential
                tenants and buyers
              </p>
              <Button asChild>
                <Link href="/dashboard/properties/new">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Your First Property
                </Link>
              </Button>
            </motion.div>
          ) : (
            <div className="space-y-4">
              {properties.map((property) => {
                const status =
                  statusConfig[property.status as keyof typeof statusConfig];
                const StatusIcon = status?.icon || Clock;

                return (
                  <motion.div
                    key={property.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col sm:flex-row gap-4 p-4 rounded-xl border bg-card"
                  >
                    <div className="relative w-full sm:w-48 h-32 rounded-lg overflow-hidden shrink-0">
                      <Image
                        src={
                          property.images?.[0] ||
                          "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=400"
                        }
                        alt={property.title}
                        fill
                        className="object-cover"
                      />
                      <Badge
                        className={`absolute top-2 left-2 ${status?.className}`}
                      >
                        <StatusIcon className="w-3 h-3 mr-1" />
                        {status?.label}
                      </Badge>
                    </div>

                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <Link
                            href={`/properties/${property.id}`}
                            className="font-semibold hover:text-primary"
                          >
                            {property.title}
                          </Link>
                          <p className="text-sm text-muted-foreground mt-1">
                            {property.address}, {property.city}
                          </p>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link href={`/properties/${property.id}`}>
                                <Eye className="w-4 h-4 mr-2" />
                                View
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link
                                href={`/dashboard/properties/${property.id}/edit`}
                              >
                                <Edit className="w-4 h-4 mr-2" />
                                Edit
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDelete(property.id)}
                              className="text-destructive"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      <div className="flex items-center gap-6 mt-3">
                        <div className="text-lg font-bold text-primary">
                          ₹
                          {property.price >= 100000
                            ? (property.price / 100000).toFixed(1) + "L"
                            : property.price.toLocaleString()}
                          {property.listing_type === "rent" && (
                            <span className="text-sm font-normal">/mo</span>
                          )}
                        </div>
                        <Badge variant="outline" className="capitalize">
                          {property.listing_type}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-6 mt-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Eye className="w-4 h-4" />
                          <span>{property.views_count} views</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Phone className="w-4 h-4" />
                          <span>{property.contacts_count} contacts</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Heart className="w-4 h-4" />
                          <span>{property.favorites_count} saves</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
