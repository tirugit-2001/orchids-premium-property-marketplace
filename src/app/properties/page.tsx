"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { PropertyCard } from "@/components/PropertyCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { createClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/lib/store";
import type {
  Property,
  PropertyType,
  ListingType,
  FurnishingType,
} from "@/lib/types";
import { CITIES, AMENITIES } from "@/lib/types";
import { toast } from "sonner";
import {
  Search,
  SlidersHorizontal,
  Grid3X3,
  List,
  MapPin,
  X,
  Loader2,
  Home,
  Building2,
  Users,
  LandPlot,
  Castle,
  Store,
  Map as MapIcon,
} from "lucide-react";
import dynamic from "next/dynamic";

const PropertyMap = dynamic(
  () => import("@/components/PropertyMap").then((mod) => mod.PropertyMap),
  {
    ssr: false,
    loading: () => (
      <div className="h-full w-full bg-muted animate-pulse rounded-xl flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    ),
  }
);

const propertyTypeIcons = {
  house: Home,
  apartment: Building2,
  pg: Users,
  land: LandPlot,
  villa: Castle,
  commercial: Store,
};

function PropertiesContent() {
  // Nearby toggle for subscribers (customers)
  const [nearbyEnabled, setNearbyEnabled] = useState(false);
  const [nearbyRadius, setNearbyRadius] = useState(5); // km
  const hasActiveSubscription = useAuthStore((s: any) =>
    s.hasActiveSubscription()
  );
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useAuthStore();
  const [properties, setProperties] = useState<Property[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "");
  const [selectedCity, setSelectedCity] = useState(
    searchParams.get("city") || ""
  );
  const [cityOptions, setCityOptions] = useState<any[]>([]);
  const [selectedArea, setSelectedArea] = useState("");
  const [areaOptions, setAreaOptions] = useState<any[]>([]);
  const [mapCenter, setMapCenter] = useState<[number, number]>([
    20.5937, 78.9629,
  ]);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(
    null
  );
  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "";
  const [selectedType, setSelectedType] = useState<PropertyType | "">(
    (searchParams.get("property_type") as PropertyType) || ""
  );
  const [selectedListing, setSelectedListing] = useState<ListingType | "">(
    (searchParams.get("type") as ListingType) || ""
  );
  const [selectedFurnishing, setSelectedFurnishing] = useState<
    FurnishingType | ""
  >("");
  const [priceRange, setPriceRange] = useState([0, 50000000]);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState("newest");
  const [showMap, setShowMap] = useState(false);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchProperties();
  }, [selectedCity, selectedArea, selectedType, selectedListing, sortBy]);

  // Get user live location on mount
  useEffect(() => {
    if (typeof window !== "undefined" && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserLocation([pos.coords.latitude, pos.coords.longitude]);
          setMapCenter([pos.coords.latitude, pos.coords.longitude]);
        },
        () => {},
        { enableHighAccuracy: true }
      );
    }
  }, []);

  useEffect(() => {
    if (user) {
      fetchFavoriteIds();
    }
  }, [user, properties]);

  const fetchProperties = async () => {
    setIsLoading(true);
    try {
      const supabase = createClient();
      let query = supabase
        .from("properties")
        .select("*")
        .eq("status", "approved")
        .eq("is_active", true);

      if (selectedCity) {
        query = query.ilike("city", `%${selectedCity}%`);
      }
      if (selectedArea) {
        query = query.ilike("address", `%${selectedArea}%`);
      }
      if (selectedType) {
        query = query.eq("property_type", selectedType);
      }
      if (selectedListing) {
        query = query.eq("listing_type", selectedListing);
      }

      if (sortBy === "price_low") {
        query = query.order("price", { ascending: true });
      } else if (sortBy === "price_high") {
        query = query.order("price", { ascending: false });
      } else if (sortBy === "popular") {
        query = query.order("views_count", { ascending: false });
      } else {
        query = query.order("created_at", { ascending: false });
      }

      const { data, error } = await query.limit(100);

      if (error) throw error;
      if (data && data.length > 0) {
        setProperties(data);
      } else {
        setProperties([]);
      }
    } catch (error) {
      console.error("Error fetching properties:", error);
      setProperties([]);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchFavoriteIds = async () => {
    if (!user) return;

    try {
      const response = await fetch("/api/favorites");
      const data = await response.json();

      if (response.ok && data.favorites) {
        const ids = new Set<string>(
          data.favorites.map((f: any) => f.property_id)
        );
        setFavoriteIds(ids);
      }
    } catch (error) {
      console.error("Error fetching favorites:", error);
    }
  };

  const handleFavorite = async (propertyId: string) => {
    if (!user) {
      toast.error("Please sign in to save favorites");
      router.push("/auth/login");
      return;
    }

    try {
      const isFavorite = favoriteIds.has(propertyId);

      if (isFavorite) {
        // Remove from favorites
        const response = await fetch(
          `/api/favorites?property_id=${propertyId}`,
          {
            method: "DELETE",
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to remove favorite");
        }

        setFavoriteIds((prev) => {
          const newSet = new Set(prev);
          newSet.delete(propertyId);
          return newSet;
        });
        toast.success("Removed from favorites");
      } else {
        // Add to favorites
        const response = await fetch("/api/favorites", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ property_id: propertyId }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to add favorite");
        }

        setFavoriteIds((prev) => new Set(prev).add(propertyId));
        toast.success("Added to favorites");
      }
    } catch (error: any) {
      console.error("Favorite error:", error);
      toast.error(error.message || "Failed to update favorite");
    }
  };

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedCity("");
    setSelectedType("");
    setSelectedListing("");
    setSelectedFurnishing("");
    setPriceRange([0, 50000000]);
    setSelectedAmenities([]);
    router.push("/properties");
  };

  const activeFiltersCount = [
    selectedCity,
    selectedType,
    selectedListing,
    selectedFurnishing,
    selectedAmenities.length > 0,
  ].filter(Boolean).length;

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
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesSearch =
        property.title.toLowerCase().includes(query) ||
        property.city.toLowerCase().includes(query) ||
        property.address.toLowerCase().includes(query) ||
        property.property_type.toLowerCase().includes(query);
      if (!matchesSearch) return false;
    }
    if (selectedFurnishing && property.furnishing !== selectedFurnishing)
      return false;
    if (property.price < priceRange[0] || property.price > priceRange[1])
      return false;
    if (selectedAmenities.length > 0) {
      const hasAllAmenities = selectedAmenities.every((amenity) =>
        property.amenities?.includes(amenity)
      );
      if (!hasAllAmenities) return false;
    }
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

  // Render Nearby toggle inside main JSX tree

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="pt-20">
        <div className="bg-linear-to-br from-primary/5 to-accent/5 py-12 border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h1 className="text-3xl sm:text-4xl font-bold mb-4">
              Find Your Perfect Property
            </h1>
            <p className="text-muted-foreground mb-8">
              Browse through {filteredProperties.length} properties across India
            </p>

            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  placeholder="Search by location, property name..."
                  className="pl-12 h-12 bg-background"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              {/* City Autocomplete - Custom Dropdown */}
              <div className="w-full lg:w-56 relative">
                <Label className="mb-1 block">City</Label>
                <div className="relative">
                  <Input
                    type="text"
                    className="h-12 bg-background pr-10"
                    placeholder="Type city name"
                    value={selectedCity}
                    autoComplete="off"
                    onChange={async (e) => {
                      setSelectedCity(e.target.value);
                      setSelectedArea("");
                      if (e.target.value.length > 0) {
                        const res = await fetch(
                          `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(e.target.value)}.json?types=place&country=IN&access_token=${mapboxToken}`
                        );
                        const data = await res.json();
                        setCityOptions(data.features || []);
                      } else {
                        setCityOptions([]);
                      }
                    }}
                    onFocus={async (e) => {
                      if (selectedCity.length > 0 && cityOptions.length === 0) {
                        const res = await fetch(
                          `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(selectedCity)}.json?types=place&country=IN&access_token=${mapboxToken}`
                        );
                        const data = await res.json();
                        setCityOptions(data.features || []);
                      }
                    }}
                  />
                  {cityOptions.length > 0 && selectedCity && (
                    <ul className="absolute z-20 left-0 right-0 mt-1 bg-white dark:bg-zinc-900 border border-muted rounded-lg shadow-lg max-h-56 overflow-y-auto animate-fade-in">
                      {cityOptions.map((city, idx) => (
                        <li
                          key={city.id}
                          className="px-4 py-2 cursor-pointer hover:bg-primary/10 transition text-sm"
                          onClick={() => {
                            setSelectedCity(city.text);
                            setCityOptions([]);
                            setSelectedArea("");
                          }}
                        >
                          {city.text}
                          {city.context && (
                            <span className="ml-2 text-xs text-muted-foreground">
                              {city.context[0]?.text}
                            </span>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
              {/* Area Autocomplete - Custom Dropdown */}
              <div className="w-full lg:w-56 relative">
                <Label className="mb-1 block">Area/Locality</Label>
                <div className="relative">
                  <Input
                    type="text"
                    className="h-12 bg-background pr-10"
                    placeholder={
                      selectedCity
                        ? `Type area in ${selectedCity}`
                        : "Type area/locality"
                    }
                    value={selectedArea}
                    autoComplete="off"
                    onChange={async (e) => {
                      setSelectedArea(e.target.value);
                      if (e.target.value.length > 0 && selectedCity) {
                        const res = await fetch(
                          `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(e.target.value + ", " + selectedCity)}.json?types=neighborhood,locality,address&country=IN&access_token=${mapboxToken}`
                        );
                        const data = await res.json();
                        setAreaOptions(data.features || []);
                      } else {
                        setAreaOptions([]);
                      }
                    }}
                    onFocus={async (e) => {
                      if (
                        selectedArea.length > 0 &&
                        areaOptions.length === 0 &&
                        selectedCity
                      ) {
                        const res = await fetch(
                          `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(selectedArea + ", " + selectedCity)}.json?types=neighborhood,locality,address&country=IN&access_token=${mapboxToken}`
                        );
                        const data = await res.json();
                        setAreaOptions(data.features || []);
                      }
                    }}
                  />
                  {areaOptions.length > 0 && selectedArea && (
                    <ul className="absolute z-20 left-0 right-0 mt-1 bg-white dark:bg-zinc-900 border border-muted rounded-lg shadow-lg max-h-56 overflow-y-auto animate-fade-in">
                      {areaOptions.map((area, idx) => (
                        <li
                          key={area.id}
                          className="px-4 py-2 cursor-pointer hover:bg-primary/10 transition text-sm"
                          onClick={() => {
                            setSelectedArea(area.text);
                            setAreaOptions([]);
                          }}
                        >
                          {area.text}
                          {area.context && (
                            <span className="ml-2 text-xs text-muted-foreground">
                              {area.context[0]?.text}
                            </span>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
              <Select
                value={selectedListing}
                onValueChange={(v) => setSelectedListing(v as ListingType)}
              >
                <SelectTrigger className="w-full lg:w-40 h-12 bg-background">
                  <SelectValue placeholder="Buy/Rent" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="sale">Buy</SelectItem>
                  <SelectItem value="rent">Rent</SelectItem>
                  <SelectItem value="lease">Lease</SelectItem>
                </SelectContent>
              </Select>
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" className="h-12 gap-2">
                    <SlidersHorizontal className="w-4 h-4" />
                    Filters
                    {activeFiltersCount > 0 && (
                      <Badge className="ml-1">{activeFiltersCount}</Badge>
                    )}
                  </Button>
                </SheetTrigger>
                <SheetContent className="w-full sm:max-w-md overflow-y-auto">
                  <SheetHeader>
                    <SheetTitle>Filter Properties</SheetTitle>
                  </SheetHeader>
                  <div className="py-6 space-y-8">
                    <div>
                      <h3 className="font-medium mb-4">Property Type</h3>
                      <div className="grid grid-cols-3 gap-2">
                        {Object.entries(propertyTypeIcons).map(
                          ([type, Icon]) => (
                            <button
                              key={type}
                              onClick={() =>
                                setSelectedType(
                                  selectedType === type
                                    ? ""
                                    : (type as PropertyType)
                                )
                              }
                              className={`p-3 rounded-xl border text-center transition-all ${
                                selectedType === type
                                  ? "border-primary bg-primary/5"
                                  : "hover:border-primary/50"
                              }`}
                            >
                              <Icon
                                className={`w-5 h-5 mx-auto mb-1 ${selectedType === type ? "text-primary" : ""}`}
                              />
                              <span className="text-xs capitalize">{type}</span>
                            </button>
                          )
                        )}
                      </div>
                    </div>

                    <div>
                      <h3 className="font-medium mb-4">Price Range</h3>
                      <div className="px-2">
                        <Slider
                          value={priceRange}
                          onValueChange={setPriceRange}
                          max={50000000}
                          step={100000}
                          className="mb-4"
                        />
                        <div className="flex justify-between text-sm text-muted-foreground">
                          <span>₹{(priceRange[0] / 100000).toFixed(1)}L</span>
                          <span>
                            ₹{(priceRange[1] / 10000000).toFixed(1)}Cr
                          </span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="font-medium mb-4">Furnishing</h3>
                      <div className="flex flex-wrap gap-2">
                        {[
                          "unfurnished",
                          "semi-furnished",
                          "fully-furnished",
                        ].map((type) => (
                          <button
                            key={type}
                            onClick={() =>
                              setSelectedFurnishing(
                                selectedFurnishing === type
                                  ? ""
                                  : (type as FurnishingType)
                              )
                            }
                            className={`px-4 py-2 rounded-full border text-sm capitalize transition-all ${
                              selectedFurnishing === type
                                ? "border-primary bg-primary text-primary-foreground"
                                : "hover:border-primary/50"
                            }`}
                          >
                            {type.replace("-", " ")}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h3 className="font-medium mb-4">Amenities</h3>
                      <div className="grid grid-cols-2 gap-3">
                        {AMENITIES.slice(0, 12).map((amenity) => (
                          <label
                            key={amenity}
                            className="flex items-center gap-2 cursor-pointer"
                          >
                            <Checkbox
                              checked={selectedAmenities.includes(amenity)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setSelectedAmenities([
                                    ...selectedAmenities,
                                    amenity,
                                  ]);
                                } else {
                                  setSelectedAmenities(
                                    selectedAmenities.filter(
                                      (a) => a !== amenity
                                    )
                                  );
                                }
                              }}
                            />
                            <span className="text-sm">{amenity}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className="flex gap-3 pt-4 border-t">
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={clearFilters}
                      >
                        Clear All
                      </Button>
                      <Button className="flex-1">Apply Filters</Button>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div className="flex flex-wrap gap-2">
              {selectedCity && (
                <Badge variant="secondary" className="gap-1">
                  {selectedCity}
                  <X
                    className="w-3 h-3 cursor-pointer"
                    onClick={() => setSelectedCity("")}
                  />
                </Badge>
              )}
              {selectedType && (
                <Badge variant="secondary" className="gap-1 capitalize">
                  {selectedType}
                  <X
                    className="w-3 h-3 cursor-pointer"
                    onClick={() => setSelectedType("")}
                  />
                </Badge>
              )}
              {selectedListing && (
                <Badge variant="secondary" className="gap-1 capitalize">
                  {selectedListing}
                  <X
                    className="w-3 h-3 cursor-pointer"
                    onClick={() => setSelectedListing("")}
                  />
                </Badge>
              )}
              {activeFiltersCount > 0 && (
                <button
                  onClick={clearFilters}
                  className="text-sm text-primary hover:underline"
                >
                  Clear all
                </button>
              )}
            </div>

            <div className="flex items-center gap-4">
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest First</SelectItem>
                  <SelectItem value="price_low">Price: Low to High</SelectItem>
                  <SelectItem value="price_high">Price: High to Low</SelectItem>
                  <SelectItem value="popular">Most Popular</SelectItem>
                </SelectContent>
              </Select>

              <div className="flex border rounded-lg">
                <button
                  onClick={() => setShowMap(!showMap)}
                  className={`p-2 flex items-center gap-2 ${showMap ? "bg-primary text-primary-foreground" : ""}`}
                  title="Toggle Map View"
                >
                  <MapIcon className="w-5 h-5" />
                  <span className="text-sm font-medium hidden sm:inline">
                    Map
                  </span>
                </button>
              </div>

              <div className="flex border rounded-lg">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-2 ${viewMode === "grid" ? "bg-muted" : ""}`}
                >
                  <Grid3X3 className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`p-2 ${viewMode === "list" ? "bg-muted" : ""}`}
                >
                  <List className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : filteredProperties.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                <Home className="w-10 h-10 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-2">
                No properties found
              </h3>
              <p className="text-muted-foreground mb-4">
                Try adjusting your filters or search criteria
              </p>
              <Button onClick={clearFilters}>Clear Filters</Button>
            </div>
          ) : (
            <div
              className={`flex gap-6 ${showMap ? "flex-col lg:flex-row h-[calc(100vh-200px)]" : ""}`}
            >
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className={`overflow-y-auto pr-2 ${
                  showMap
                    ? "w-full lg:w-1/2 grid grid-cols-1 gap-6"
                    : viewMode === "grid"
                      ? "grid md:grid-cols-2 lg:grid-cols-3 gap-6 w-full"
                      : "space-y-4 w-full"
                }`}
              >
                {filteredProperties.map((property) => (
                  <PropertyCard
                    key={property.id}
                    property={property}
                    isFavorite={favoriteIds.has(property.id)}
                    onFavorite={handleFavorite}
                  />
                ))}
              </motion.div>

              {showMap && (
                <div className="w-full lg:w-1/2 h-125 lg:h-full sticky top-0">
                  <PropertyMap properties={filteredProperties} />
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
}

export default function PropertiesPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      }
    >
      <PropertiesContent />
    </Suspense>
  );
}
