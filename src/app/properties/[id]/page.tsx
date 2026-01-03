'use client'

import { useState, useEffect, use } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/lib/store'
import type { Property } from '@/lib/types'
import { toast } from 'sonner'
import { VisitScheduler } from '@/components/VisitScheduler'
import { NeighborhoodInsights } from '@/components/NeighborhoodInsights'
import {
  Heart,
  Share2,
  MapPin,
  BedDouble,
  Bath,
  Maximize,
  IndianRupee,
  BadgeCheck,
  Calendar,
  Phone,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  X,
  Building2,
  Compass,
  Clock,
  Layers,
  Sofa,
  Star,
  ArrowLeft,
  Loader2,
  Lock,
  Check,
} from 'lucide-react'

const sampleProperty: Property = {
  id: '1',
  owner_id: '1',
  title: 'Luxury 3 BHK Apartment in Bandra West',
  description: `Experience luxury living in this stunning 3 BHK apartment located in the heart of Bandra West. This meticulously designed home offers breathtaking sea views and world-class amenities.

The apartment features spacious rooms with high ceilings, premium Italian marble flooring, and large windows that flood the space with natural light. The modular kitchen is equipped with top-of-the-line appliances and ample storage space.

Building amenities include a state-of-the-art gym, infinity swimming pool, landscaped gardens, children's play area, and 24/7 security. The location offers easy access to restaurants, cafes, shopping centers, and excellent connectivity to the rest of Mumbai.

Perfect for families looking for a premium lifestyle in one of Mumbai's most sought-after neighborhoods.`,
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
  address: 'Bandra West, Near Bandstand',
  city: 'Mumbai',
  state: 'Maharashtra',
  pincode: '400050',
  latitude: 19.0596,
  longitude: 72.8295,
  amenities: ['Parking', 'Gym', 'Swimming Pool', 'Security', 'Lift', 'Power Backup', 'Club House', 'Garden', 'Intercom'],
  images: [
    'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1200',
    'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=1200',
    'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=1200',
    'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=1200',
    'https://images.unsplash.com/photo-1560185007-cde436f6a4d0?w=1200',
  ],
  video_url: null,
  virtual_tour_url: null,
  is_verified: true,
  is_active: true,
  views_count: 234,
  contacts_count: 12,
  status: 'approved',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  owner: {
    id: '1',
    email: 'owner@example.com',
    full_name: 'Rajesh Kumar',
    phone: '+91 98765 43210',
    avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    role: 'owner',
    is_verified: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
}

export default function PropertyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const router = useRouter()
  const { user, subscription } = useAuthStore()
  const [property, setProperty] = useState<Property | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [isGalleryOpen, setIsGalleryOpen] = useState(false)
  const [isFavorite, setIsFavorite] = useState(false)
  const [showContactModal, setShowContactModal] = useState(false)
  const [hasRevealedContact, setHasRevealedContact] = useState(false)

  useEffect(() => {
    fetchProperty()
  }, [resolvedParams.id])

  const fetchProperty = async () => {
    setIsLoading(true)
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('properties')
        .select('*, owner:profiles(*)')
        .eq('id', resolvedParams.id)
        .single()

      if (error) throw error
      if (data) {
        setProperty(data)
      } else {
        setProperty({ ...sampleProperty, id: resolvedParams.id })
      }
    } catch (error) {
      console.error('Error fetching property:', error)
      setProperty({ ...sampleProperty, id: resolvedParams.id })
    } finally {
      setIsLoading(false)
    }
  }

  const formatPrice = (price: number, listingType: string) => {
    if (price >= 10000000) {
      return `${(price / 10000000).toFixed(2)} Cr`
    } else if (price >= 100000) {
      return `${(price / 100000).toFixed(2)} L`
    } else if (price >= 1000) {
      return `${(price / 1000).toFixed(1)}K`
    }
    return price.toString()
  }

  const handleFavorite = async () => {
    if (!user) {
      toast.error('Please sign in to save favorites')
      router.push('/auth/login')
      return
    }
    setIsFavorite(!isFavorite)
    toast.success(isFavorite ? 'Removed from favorites' : 'Added to favorites')
  }

  const handleShare = async () => {
    try {
      await navigator.share({
        title: property?.title,
        text: `Check out this property: ${property?.title}`,
        url: window.location.href,
      })
    } catch {
      navigator.clipboard.writeText(window.location.href)
      toast.success('Link copied to clipboard')
    }
  }

  const handleRevealContact = async () => {
    if (!user) {
      toast.error('Please sign in to view contact details')
      router.push('/auth/login')
      return
    }

    try {
      const response = await fetch('/api/contacts/reveal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ propertyId: resolvedParams.id }),
      })

      const data = await response.json()

      if (!response.ok) {
        if (response.status === 403) {
          setShowContactModal(true)
          return
        }
        throw new Error(data.error || 'Failed to reveal contact')
      }

      setHasRevealedContact(true)
      toast.success('Contact details revealed!')
      // Refresh user data to update contact limits if needed
    } catch (error: any) {
      toast.error(error.message)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!property) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Property not found</h2>
          <p className="text-muted-foreground mb-4">The property you&apos;re looking for doesn&apos;t exist.</p>
          <Button asChild>
            <Link href="/properties">Browse Properties</Link>
          </Button>
        </div>
      </div>
    )
  }

  const images = property.images || sampleProperty.images

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="pt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Button
            variant="ghost"
            className="mb-4"
            onClick={() => router.back()}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to listings
          </Button>

          <div className="grid lg:grid-cols-2 gap-4 mb-8">
            <div
              className="relative h-[400px] lg:h-[500px] rounded-2xl overflow-hidden cursor-pointer group"
              onClick={() => setIsGalleryOpen(true)}
            >
              <Image
                src={images?.[0] || ''}
                alt={property.title}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-colors" />
              <div className="absolute bottom-4 right-4">
                <Badge className="bg-black/50 backdrop-blur">
                  View all {images?.length} photos
                </Badge>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {images?.slice(1, 5).map((image, index) => (
                <div
                  key={index}
                  className="relative h-[190px] lg:h-[242px] rounded-xl overflow-hidden cursor-pointer group"
                  onClick={() => {
                    setCurrentImageIndex(index + 1)
                    setIsGalleryOpen(true)
                  }}
                >
                  <Image
                    src={image}
                    alt={`${property.title} ${index + 2}`}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-black/10 group-hover:bg-black/20 transition-colors" />
                </div>
              ))}
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              <div>
                <div className="flex flex-wrap items-center gap-3 mb-4">
                  <Badge className="bg-primary/90">
                    {property.listing_type === 'sale' ? 'For Sale' : property.listing_type === 'rent' ? 'For Rent' : 'For Lease'}
                  </Badge>
                  {property.is_verified && (
                    <Badge variant="secondary" className="bg-green-500/90 text-white">
                      <BadgeCheck className="w-3 h-3 mr-1" />
                      Verified
                    </Badge>
                  )}
                  <span className="capitalize text-muted-foreground">{property.property_type}</span>
                </div>

                <h1 className="text-3xl sm:text-4xl font-bold mb-4">{property.title}</h1>

                <div className="flex items-center gap-2 text-muted-foreground mb-6">
                  <MapPin className="w-5 h-5" />
                  <span>{property.address}, {property.city}, {property.state} - {property.pincode}</span>
                </div>

                <div className="flex items-baseline gap-2 mb-6">
                  <IndianRupee className="w-8 h-8 text-primary" />
                  <span className="text-4xl font-bold text-primary">
                    {formatPrice(property.price, property.listing_type)}
                  </span>
                  <span className="text-muted-foreground text-xl">
                    {property.listing_type === 'rent' ? '/month' : property.listing_type === 'lease' ? '/year' : ''}
                  </span>
                  {property.price_negotiable && (
                    <Badge variant="outline" className="ml-2">Negotiable</Badge>
                  )}
                </div>

                <div className="flex flex-wrap gap-6 p-6 bg-muted/50 rounded-xl">
                  {property.bedrooms && (
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                        <BedDouble className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <div className="font-semibold">{property.bedrooms} Bedrooms</div>
                        <div className="text-sm text-muted-foreground">Spacious rooms</div>
                      </div>
                    </div>
                  )}
                  {property.bathrooms && (
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Bath className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <div className="font-semibold">{property.bathrooms} Bathrooms</div>
                        <div className="text-sm text-muted-foreground">Attached baths</div>
                      </div>
                    </div>
                  )}
                  {property.area_sqft && (
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Maximize className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <div className="font-semibold">{property.area_sqft} sqft</div>
                        <div className="text-sm text-muted-foreground">Super built-up</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h2 className="text-2xl font-bold mb-4">About this property</h2>
                <p className="text-muted-foreground whitespace-pre-line leading-relaxed">
                  {property.description}
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-bold mb-4">Property Details</h2>
                <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {property.property_type && (
                    <div className="flex items-center gap-3 p-4 rounded-xl border">
                      <Building2 className="w-5 h-5 text-primary" />
                      <div>
                        <div className="text-sm text-muted-foreground">Property Type</div>
                        <div className="font-medium capitalize">{property.property_type}</div>
                      </div>
                    </div>
                  )}
                  {property.furnishing && (
                    <div className="flex items-center gap-3 p-4 rounded-xl border">
                      <Sofa className="w-5 h-5 text-primary" />
                      <div>
                        <div className="text-sm text-muted-foreground">Furnishing</div>
                        <div className="font-medium capitalize">{property.furnishing.replace('-', ' ')}</div>
                      </div>
                    </div>
                  )}
                  {property.floor_number && (
                    <div className="flex items-center gap-3 p-4 rounded-xl border">
                      <Layers className="w-5 h-5 text-primary" />
                      <div>
                        <div className="text-sm text-muted-foreground">Floor</div>
                        <div className="font-medium">{property.floor_number} of {property.total_floors}</div>
                      </div>
                    </div>
                  )}
                  {property.facing && (
                    <div className="flex items-center gap-3 p-4 rounded-xl border">
                      <Compass className="w-5 h-5 text-primary" />
                      <div>
                        <div className="text-sm text-muted-foreground">Facing</div>
                        <div className="font-medium">{property.facing}</div>
                      </div>
                    </div>
                  )}
                  {property.age_of_property && (
                    <div className="flex items-center gap-3 p-4 rounded-xl border">
                      <Clock className="w-5 h-5 text-primary" />
                      <div>
                        <div className="text-sm text-muted-foreground">Age of Property</div>
                        <div className="font-medium">{property.age_of_property} years</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

                {property.amenities && property.amenities.length > 0 && (
                  <div>
                    <h2 className="text-2xl font-bold mb-4">Amenities</h2>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                      {property.amenities.map((amenity) => (
                        <div key={amenity} className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
                          <Check className="w-4 h-4 text-primary" />
                          <span className="text-sm">{amenity}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <NeighborhoodInsights city={property.city} address={property.address} />
              </div>


            <div className="space-y-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="sticky top-24 space-y-6"
              >
                <div className="p-6 rounded-2xl border bg-card">
                  <div className="flex items-center gap-4 mb-6">
                    <Avatar className="h-16 w-16">
                      <AvatarImage src={property.owner?.avatar_url || ''} />
                      <AvatarFallback className="bg-primary text-primary-foreground text-xl">
                        {property.owner?.full_name?.charAt(0) || 'O'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-semibold text-lg">{property.owner?.full_name || 'Property Owner'}</div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        {property.owner?.is_verified && (
                          <>
                            <BadgeCheck className="w-4 h-4 text-green-500" />
                            <span>Verified Owner</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {hasRevealedContact || (subscription && subscription.contacts_used < subscription.contacts_limit) ? (
                    <div className="space-y-3 mb-6 p-4 bg-green-50 dark:bg-green-950/30 rounded-xl">
                      <div className="flex items-center gap-3">
                        <Phone className="w-5 h-5 text-green-600" />
                        <span className="font-medium">{property.owner?.phone || '+91 98765 43210'}</span>
                      </div>
                      <div className="text-sm text-green-700 dark:text-green-400">
                        Contact revealed! You can now call the owner directly.
                      </div>
                    </div>
                  ) : (
                    <Button
                      className="w-full h-12 mb-4"
                      onClick={handleRevealContact}
                    >
                      <Lock className="w-4 h-4 mr-2" />
                      Reveal Contact Number
                    </Button>
                  )}

                    <div className="grid grid-cols-2 gap-3">
                      <Button variant="outline" className="h-12" onClick={handleFavorite}>
                        <Heart className={`w-4 h-4 mr-2 ${isFavorite ? 'fill-red-500 text-red-500' : ''}`} />
                        {isFavorite ? 'Saved' : 'Save'}
                      </Button>
                      <Button variant="outline" className="h-12" onClick={handleShare}>
                        <Share2 className="w-4 h-4 mr-2" />
                        Share
                      </Button>
                    </div>
                  </div>

                  <VisitScheduler propertyId={property.id} ownerId={property.owner_id} />


                <div className="p-6 rounded-2xl border bg-gradient-to-br from-primary/5 to-accent/5">
                  <h3 className="font-semibold mb-4">Need help finding a property?</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Our experts can help you find the perfect property matching your requirements.
                  </p>
                  <Button variant="outline" className="w-full">
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Get Expert Help
                  </Button>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>

      <Dialog open={isGalleryOpen} onOpenChange={setIsGalleryOpen}>
        <DialogContent className="max-w-5xl h-[90vh] p-0">
          <div className="relative h-full bg-black">
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4 z-10 text-white hover:bg-white/20"
              onClick={() => setIsGalleryOpen(false)}
            >
              <X className="w-6 h-6" />
            </Button>
            <Image
              src={images?.[currentImageIndex] || ''}
              alt={property.title}
              fill
              className="object-contain"
            />
            <Button
              variant="ghost"
              size="icon"
              className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20"
              onClick={() => setCurrentImageIndex((prev) => (prev === 0 ? (images?.length || 1) - 1 : prev - 1))}
            >
              <ChevronLeft className="w-8 h-8" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20"
              onClick={() => setCurrentImageIndex((prev) => (prev === (images?.length || 1) - 1 ? 0 : prev + 1))}
            >
              <ChevronRight className="w-8 h-8" />
            </Button>
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
              {images?.map((_, index) => (
                <button
                  key={index}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    index === currentImageIndex ? 'bg-white' : 'bg-white/50'
                  }`}
                  onClick={() => setCurrentImageIndex(index)}
                />
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showContactModal} onOpenChange={setShowContactModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Subscribe to Contact Owners</DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground mb-6">
            Get a subscription to unlock contact details and connect directly with property owners.
          </p>
          <div className="space-y-3">
            <Link href="/pricing" className="block">
              <Button className="w-full">View Subscription Plans</Button>
            </Link>
            <Button variant="outline" className="w-full" onClick={() => setShowContactModal(false)}>
              Maybe Later
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  )
}
