'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'
import { PropertyCard } from '@/components/PropertyCard'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Slider } from '@/components/ui/slider'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { createClient } from '@/lib/supabase/client'
import type { Property, PropertyType, ListingType, FurnishingType } from '@/lib/types'
import { CITIES, AMENITIES } from '@/lib/types'
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
} from 'lucide-react'
import dynamic from 'next/dynamic'

const PropertyMap = dynamic(() => import('@/components/PropertyMap').then(mod => mod.PropertyMap), { 
  ssr: false,
  loading: () => <div className="h-full w-full bg-muted animate-pulse rounded-xl flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin" /></div>
})

const propertyTypeIcons = {
  house: Home,
  apartment: Building2,
  pg: Users,
  land: LandPlot,
  villa: Castle,
  commercial: Store,
}

const sampleProperties: Property[] = [
  {
    id: '1',
    owner_id: '1',
    title: 'Luxury 3 BHK Apartment in Bandra West',
    description: 'Spacious apartment with sea view',
    property_type: 'apartment',
    listing_type: 'rent',
    price: 85000,
    price_negotiable: true,
    area_sqft: 1450,
    bedrooms: 3,
    bathrooms: 2,
    furnishing: 'fully-furnished',
    floor_number: 12,
    total_floors: 20,
    facing: 'West',
    age_of_property: 5,
    address: 'Bandra West',
    city: 'Mumbai',
    state: 'Maharashtra',
    pincode: '400050',
    latitude: 19.0596,
    longitude: 72.8295,
    amenities: ['Parking', 'Gym', 'Swimming Pool', 'Security', 'Lift'],
    images: ['https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800'],
    video_url: null,
    virtual_tour_url: null,
    is_verified: true,
    is_active: true,
    views_count: 234,
    contacts_count: 12,
    status: 'approved',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '2',
    owner_id: '2',
    title: 'Modern 2 BHK Flat in Whitefield',
    description: 'Brand new apartment in tech hub',
    property_type: 'apartment',
    listing_type: 'sale',
    price: 7500000,
    price_negotiable: false,
    area_sqft: 1200,
    bedrooms: 2,
    bathrooms: 2,
    furnishing: 'semi-furnished',
    floor_number: 8,
    total_floors: 15,
    facing: 'East',
    age_of_property: 1,
    address: 'Whitefield',
    city: 'Bangalore',
    state: 'Karnataka',
    pincode: '560066',
    latitude: 12.9698,
    longitude: 77.7500,
    amenities: ['Parking', 'Gym', 'Club House', 'Children Play Area', 'Security'],
    images: ['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800'],
    video_url: null,
    virtual_tour_url: null,
    is_verified: true,
    is_active: true,
    views_count: 456,
    contacts_count: 28,
    status: 'approved',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '3',
    owner_id: '3',
    title: 'Cozy PG for Working Professionals',
    description: 'Well maintained PG with all amenities',
    property_type: 'pg',
    listing_type: 'rent',
    price: 12000,
    price_negotiable: true,
    area_sqft: 200,
    bedrooms: 1,
    bathrooms: 1,
    furnishing: 'fully-furnished',
    floor_number: 2,
    total_floors: 4,
    facing: 'North',
    age_of_property: 10,
    address: 'Koramangala',
    city: 'Bangalore',
    state: 'Karnataka',
    pincode: '560034',
    latitude: 12.9352,
    longitude: 77.6245,
    amenities: ['WiFi', 'AC', 'Power Backup', 'Water Supply'],
    images: ['https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=800'],
    video_url: null,
    virtual_tour_url: null,
    is_verified: false,
    is_active: true,
    views_count: 89,
    contacts_count: 5,
    status: 'approved',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '4',
    owner_id: '4',
    title: 'Premium Villa with Private Pool',
    description: 'Luxurious villa in gated community',
    property_type: 'villa',
    listing_type: 'sale',
    price: 45000000,
    price_negotiable: true,
    area_sqft: 4500,
    bedrooms: 5,
    bathrooms: 6,
    furnishing: 'fully-furnished',
    floor_number: null,
    total_floors: 3,
    facing: 'South',
    age_of_property: 3,
    address: 'Golf Course Road',
    city: 'Gurgaon',
    state: 'Haryana',
    pincode: '122002',
    latitude: 28.4595,
    longitude: 77.0266,
    amenities: ['Swimming Pool', 'Garden', 'Parking', 'Security', 'Servant Room', 'Terrace'],
    images: ['https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800'],
    video_url: null,
    virtual_tour_url: null,
    is_verified: true,
    is_active: true,
    views_count: 567,
    contacts_count: 34,
    status: 'approved',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '5',
    owner_id: '5',
    title: 'Commercial Plot in Prime Location',
    description: 'Ideal for office or showroom',
    property_type: 'land',
    listing_type: 'sale',
    price: 25000000,
    price_negotiable: true,
    area_sqft: 5000,
    bedrooms: null,
    bathrooms: null,
    furnishing: null,
    floor_number: null,
    total_floors: null,
    facing: 'Main Road',
    age_of_property: null,
    address: 'Sector 62',
    city: 'Noida',
    state: 'Uttar Pradesh',
    pincode: '201301',
    latitude: 28.6274,
    longitude: 77.3649,
    amenities: [],
    images: ['https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800'],
    video_url: null,
    virtual_tour_url: null,
    is_verified: true,
    is_active: true,
    views_count: 123,
    contacts_count: 8,
    status: 'approved',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '6',
    owner_id: '6',
    title: 'Spacious 4 BHK Independent House',
    description: 'Perfect for large families',
    property_type: 'house',
    listing_type: 'rent',
    price: 65000,
    price_negotiable: false,
    area_sqft: 2800,
    bedrooms: 4,
    bathrooms: 4,
    furnishing: 'unfurnished',
    floor_number: null,
    total_floors: 2,
    facing: 'East',
    age_of_property: 8,
    address: 'Defence Colony',
    city: 'Delhi',
    state: 'Delhi',
    pincode: '110024',
    latitude: 28.5731,
    longitude: 77.2333,
    amenities: ['Parking', 'Garden', 'Power Backup', 'Water Supply', 'Servant Room'],
    images: ['https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800'],
    video_url: null,
    virtual_tour_url: null,
    is_verified: true,
    is_active: true,
    views_count: 345,
    contacts_count: 18,
    status: 'approved',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
]

function PropertiesContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [properties, setProperties] = useState<Property[]>(sampleProperties)
  const [isLoading, setIsLoading] = useState(false)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '')
  const [selectedCity, setSelectedCity] = useState(searchParams.get('city') || '')
  const [selectedType, setSelectedType] = useState<PropertyType | ''>(searchParams.get('property_type') as PropertyType || '')
  const [selectedListing, setSelectedListing] = useState<ListingType | ''>(searchParams.get('type') as ListingType || '')
  const [selectedFurnishing, setSelectedFurnishing] = useState<FurnishingType | ''>('')
  const [priceRange, setPriceRange] = useState([0, 50000000])
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([])
  const [sortBy, setSortBy] = useState('newest')
  const [showMap, setShowMap] = useState(false)

  useEffect(() => {
    fetchProperties()
  }, [selectedCity, selectedType, selectedListing, sortBy])

  const fetchProperties = async () => {
    setIsLoading(true)
    try {
      const supabase = createClient()
      let query = supabase
        .from('properties')
        .select('*')
        .eq('status', 'approved')
        .eq('is_active', true)

      if (selectedCity) {
        query = query.eq('city', selectedCity)
      }
      if (selectedType) {
        query = query.eq('property_type', selectedType)
      }
      if (selectedListing) {
        query = query.eq('listing_type', selectedListing)
      }

      if (sortBy === 'price_low') {
        query = query.order('price', { ascending: true })
      } else if (sortBy === 'price_high') {
        query = query.order('price', { ascending: false })
      } else if (sortBy === 'popular') {
        query = query.order('views_count', { ascending: false })
      } else {
        query = query.order('created_at', { ascending: false })
      }

      const { data, error } = await query.limit(20)

      if (error) throw error
      if (data && data.length > 0) {
        setProperties(data)
      } else {
        setProperties(sampleProperties)
      }
    } catch (error) {
      console.error('Error fetching properties:', error)
      setProperties(sampleProperties)
    } finally {
      setIsLoading(false)
    }
  }

  const clearFilters = () => {
    setSearchQuery('')
    setSelectedCity('')
    setSelectedType('')
    setSelectedListing('')
    setSelectedFurnishing('')
    setPriceRange([0, 50000000])
    setSelectedAmenities([])
    router.push('/properties')
  }

  const activeFiltersCount = [
    selectedCity,
    selectedType,
    selectedListing,
    selectedFurnishing,
    selectedAmenities.length > 0,
  ].filter(Boolean).length

  const filteredProperties = properties.filter((property) => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      const matchesSearch =
        property.title.toLowerCase().includes(query) ||
        property.city.toLowerCase().includes(query) ||
        property.address.toLowerCase().includes(query) ||
        property.property_type.toLowerCase().includes(query)
      if (!matchesSearch) return false
    }
    if (selectedFurnishing && property.furnishing !== selectedFurnishing) return false
    if (property.price < priceRange[0] || property.price > priceRange[1]) return false
    if (selectedAmenities.length > 0) {
      const hasAllAmenities = selectedAmenities.every((amenity) =>
        property.amenities?.includes(amenity)
      )
      if (!hasAllAmenities) return false
    }
    return true
  })

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="pt-20">
        <div className="bg-gradient-to-br from-primary/5 to-accent/5 py-12 border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h1 className="text-3xl sm:text-4xl font-bold mb-4">Find Your Perfect Property</h1>
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
              <Select value={selectedCity} onValueChange={setSelectedCity}>
                <SelectTrigger className="w-full lg:w-48 h-12 bg-background">
                  <MapPin className="w-4 h-4 mr-2 text-muted-foreground" />
                  <SelectValue placeholder="All Cities" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Cities</SelectItem>
                  {CITIES.map((city) => (
                    <SelectItem key={city} value={city}>{city}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={selectedListing} onValueChange={(v) => setSelectedListing(v as ListingType)}>
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
                        {Object.entries(propertyTypeIcons).map(([type, Icon]) => (
                          <button
                            key={type}
                            onClick={() => setSelectedType(selectedType === type ? '' : type as PropertyType)}
                            className={`p-3 rounded-xl border text-center transition-all ${
                              selectedType === type
                                ? 'border-primary bg-primary/5'
                                : 'hover:border-primary/50'
                            }`}
                          >
                            <Icon className={`w-5 h-5 mx-auto mb-1 ${selectedType === type ? 'text-primary' : ''}`} />
                            <span className="text-xs capitalize">{type}</span>
                          </button>
                        ))}
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
                          <span>₹{(priceRange[1] / 10000000).toFixed(1)}Cr</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="font-medium mb-4">Furnishing</h3>
                      <div className="flex flex-wrap gap-2">
                        {['unfurnished', 'semi-furnished', 'fully-furnished'].map((type) => (
                          <button
                            key={type}
                            onClick={() => setSelectedFurnishing(selectedFurnishing === type ? '' : type as FurnishingType)}
                            className={`px-4 py-2 rounded-full border text-sm capitalize transition-all ${
                              selectedFurnishing === type
                                ? 'border-primary bg-primary text-primary-foreground'
                                : 'hover:border-primary/50'
                            }`}
                          >
                            {type.replace('-', ' ')}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h3 className="font-medium mb-4">Amenities</h3>
                      <div className="grid grid-cols-2 gap-3">
                        {AMENITIES.slice(0, 12).map((amenity) => (
                          <label key={amenity} className="flex items-center gap-2 cursor-pointer">
                            <Checkbox
                              checked={selectedAmenities.includes(amenity)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setSelectedAmenities([...selectedAmenities, amenity])
                                } else {
                                  setSelectedAmenities(selectedAmenities.filter((a) => a !== amenity))
                                }
                              }}
                            />
                            <span className="text-sm">{amenity}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className="flex gap-3 pt-4 border-t">
                      <Button variant="outline" className="flex-1" onClick={clearFilters}>
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
                  <X className="w-3 h-3 cursor-pointer" onClick={() => setSelectedCity('')} />
                </Badge>
              )}
              {selectedType && (
                <Badge variant="secondary" className="gap-1 capitalize">
                  {selectedType}
                  <X className="w-3 h-3 cursor-pointer" onClick={() => setSelectedType('')} />
                </Badge>
              )}
              {selectedListing && (
                <Badge variant="secondary" className="gap-1 capitalize">
                  {selectedListing}
                  <X className="w-3 h-3 cursor-pointer" onClick={() => setSelectedListing('')} />
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
                    className={`p-2 flex items-center gap-2 ${showMap ? 'bg-primary text-primary-foreground' : ''}`}
                    title="Toggle Map View"
                  >
                    <MapIcon className="w-5 h-5" />
                    <span className="text-sm font-medium hidden sm:inline">Map</span>
                  </button>
                </div>

                <div className="flex border rounded-lg">

                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 ${viewMode === 'grid' ? 'bg-muted' : ''}`}
                >
                  <Grid3X3 className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 ${viewMode === 'list' ? 'bg-muted' : ''}`}
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
              <h3 className="text-xl font-semibold mb-2">No properties found</h3>
              <p className="text-muted-foreground mb-4">
                Try adjusting your filters or search criteria
              </p>
              <Button onClick={clearFilters}>Clear Filters</Button>
            </div>
          ) : (
            <div className={`flex gap-6 ${showMap ? 'flex-col lg:flex-row h-[calc(100vh-200px)]' : ''}`}>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className={`overflow-y-auto pr-2 ${
                  showMap 
                    ? 'w-full lg:w-1/2 grid grid-cols-1 gap-6' 
                    : viewMode === 'grid'
                      ? 'grid md:grid-cols-2 lg:grid-cols-3 gap-6 w-full'
                      : 'space-y-4 w-full'
                }`}
              >
                {filteredProperties.map((property) => (
                  <PropertyCard key={property.id} property={property} />
                ))}
              </motion.div>

              {showMap && (
                <div className="w-full lg:w-1/2 h-[500px] lg:h-full sticky top-0">
                  <PropertyMap properties={filteredProperties} />
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  )
}

export default function PropertiesPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin" /></div>}>
      <PropertiesContent />
    </Suspense>
  )
}
