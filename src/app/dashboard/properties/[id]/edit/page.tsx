'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Navbar } from '@/components/Navbar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/lib/store'
import { toast } from 'sonner'
import { CITIES, AMENITIES } from '@/lib/types'
import type { Property } from '@/lib/types'
import { Badge } from '@/components/ui/badge'
import {
  ArrowLeft,
  Check,
  Home,
  Building2,
  Users,
  LandPlot,
  Castle,
  Store,
  MapPin,
  IndianRupee,
  Image as ImageIcon,
  Loader2,
  X,
  Upload,
  Compass,
} from 'lucide-react'

const propertyTypes = [
  { id: 'house', label: 'House', icon: Home },
  { id: 'apartment', label: 'Apartment', icon: Building2 },
  { id: 'pg', label: 'PG/Hostel', icon: Users },
  { id: 'land', label: 'Land', icon: LandPlot },
  { id: 'villa', label: 'Villa', icon: Castle },
  { id: 'commercial', label: 'Commercial', icon: Store },
]

const listingTypes = [
  { id: 'sale', label: 'For Sale' },
  { id: 'rent', label: 'For Rent' },
  { id: 'lease', label: 'For Lease' },
]

const furnishingTypes = [
  { id: 'unfurnished', label: 'Unfurnished' },
  { id: 'semi-furnished', label: 'Semi-Furnished' },
  { id: 'fully-furnished', label: 'Fully Furnished' },
]

const propertySchema = z.object({
  title: z.string().min(10, 'Title must be at least 10 characters'),
  description: z.string().min(50, 'Description must be at least 50 characters'),
  property_type: z.string().min(1, 'Please select property type'),
  listing_type: z.string().min(1, 'Please select listing type'),
  price: z.preprocess((val) => (val === '' || val === undefined ? undefined : Number(val)), z.number().min(1, 'Please enter a valid price')),
  price_negotiable: z.boolean(),
  area_sqft: z.preprocess((val) => (val === '' || val === undefined ? undefined : Number(val)), z.number().optional()),
  bedrooms: z.preprocess((val) => (val === '' || val === undefined ? undefined : Number(val)), z.number().optional()),
  bathrooms: z.preprocess((val) => (val === '' || val === undefined ? undefined : Number(val)), z.number().optional()),
  furnishing: z.string().optional(),
  floor_number: z.preprocess((val) => (val === '' || val === undefined ? undefined : Number(val)), z.number().optional()),
  total_floors: z.preprocess((val) => (val === '' || val === undefined ? undefined : Number(val)), z.number().optional()),
  facing: z.string().optional(),
  age_of_property: z.preprocess((val) => (val === '' || val === undefined ? undefined : Number(val)), z.number().optional()),
  address: z.string().min(5, 'Please enter a valid address'),
  city: z.string().min(1, 'Please select a city'),
  state: z.string().min(1, 'Please enter state'),
  pincode: z.string().min(6, 'Please enter a valid pincode'),
  amenities: z.array(z.string()).optional(),
})

type PropertyForm = z.infer<typeof propertySchema>

export default function EditPropertyPage() {
  const router = useRouter()
  const params = useParams()
  const propertyId = params.id as string
  const { user } = useAuthStore()
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [property, setProperty] = useState<Property | null>(null)
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([])
  const [images, setImages] = useState<string[]>([])
  const [images360, setImages360] = useState<string[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [isUploading360, setIsUploading360] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
    reset,
  } = useForm<PropertyForm>({
    resolver: zodResolver(propertySchema),
    defaultValues: {
      price_negotiable: false,
      amenities: [],
    },
  })

  const watchedValues = watch()
  const propertyType = watchedValues.property_type

  useEffect(() => {
    fetchProperty()
  }, [propertyId])

  const fetchProperty = async () => {
    setIsLoading(true)
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .eq('id', propertyId)
        .single()

      if (error) throw error

      if (data) {
        setProperty(data as Property)
        setImages(data.images || [])
        setImages360((data as Property).images_360 || [])
        setSelectedAmenities(data.amenities || [])
        
        reset({
          title: data.title,
          description: data.description || '',
          property_type: data.property_type,
          listing_type: data.listing_type,
          price: data.price,
          price_negotiable: data.price_negotiable || false,
          area_sqft: data.area_sqft || undefined,
          bedrooms: data.bedrooms || undefined,
          bathrooms: data.bathrooms || undefined,
          furnishing: data.furnishing || undefined,
          floor_number: data.floor_number || undefined,
          total_floors: data.total_floors || undefined,
          facing: data.facing || undefined,
          age_of_property: data.age_of_property || undefined,
          address: data.address,
          city: data.city,
          state: data.state,
          pincode: data.pincode || '',
          amenities: data.amenities || [],
        })
      }
    } catch (error) {
      console.error('Error fetching property:', error)
      toast.error('Failed to load property')
      router.push('/dashboard/properties')
    } finally {
      setIsLoading(false)
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user) return

    setIsUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('user_id', user.id)
      formData.append('property_id', propertyId)

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to upload image')
      }

      setImages([...images, data.url])
      toast.success('Image uploaded successfully')
    } catch (error: any) {
      console.error('Upload error:', error)
      toast.error(error.message || 'Failed to upload image')
    } finally {
      setIsUploading(false)
      if (e.target) e.target.value = ''
    }
  }

  const handleRemoveImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index))
  }

  const handle360ImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user) return

    setIsUploading360(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('user_id', user.id)
      formData.append('property_id', propertyId)

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to upload 360 image')
      }

      setImages360([...images360, data.url])
      toast.success('360° image uploaded successfully')
    } catch (error: any) {
      console.error('Upload error:', error)
      toast.error(error.message || 'Failed to upload 360 image')
    } finally {
      setIsUploading360(false)
      if (e.target) e.target.value = ''
    }
  }

  const handleRemove360Image = (index: number) => {
    setImages360(images360.filter((_, i) => i !== index))
  }

  const onSubmit = async (data: PropertyForm) => {
    if (!user || !property) return

    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/properties/${propertyId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          amenities: selectedAmenities,
          images: images,
          images_360: images360,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update property')
      }

      toast.success('Property updated successfully!')
      router.push('/dashboard/properties')
    } catch (error: unknown) {
      const err = error as Error
      console.error('Update error:', err)
      toast.error(err.message || 'Failed to update property')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Dynamic field rendering based on property type
  const shouldShowField = (field: string): boolean => {
    if (propertyType === 'land') {
      return ['area_sqft', 'facing'].includes(field)
    }
    if (propertyType === 'pg') {
      return ['bedrooms', 'bathrooms', 'furnishing', 'floor_number', 'total_floors'].includes(field)
    }
    // For house, apartment, villa, commercial
    return true
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!property) {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="pt-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Button
            variant="ghost"
            className="mb-6"
            onClick={() => router.back()}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>

          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Edit Property</h1>
            <p className="text-muted-foreground">
              Update your property details
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Property Type */}
            <div>
              <Label className="text-base mb-4 block">Property Type</Label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {propertyTypes.map((type) => (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => setValue('property_type', type.id)}
                    className={`p-6 rounded-xl border-2 text-center transition-all ${
                      watchedValues.property_type === type.id
                        ? 'border-primary bg-primary/5'
                        : 'hover:border-primary/50'
                    }`}
                  >
                    <type.icon className={`w-8 h-8 mx-auto mb-2 ${
                      watchedValues.property_type === type.id ? 'text-primary' : ''
                    }`} />
                    <span className="font-medium">{type.label}</span>
                  </button>
                ))}
              </div>
              {errors.property_type && (
                <p className="text-sm text-destructive mt-2">{errors.property_type.message}</p>
              )}
            </div>

            {/* Listing Type */}
            <div>
              <Label className="text-base mb-4 block">Listing Type</Label>
              <div className="grid grid-cols-3 gap-4">
                {listingTypes.map((type) => (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => setValue('listing_type', type.id)}
                    className={`p-4 rounded-xl border-2 text-center transition-all ${
                      watchedValues.listing_type === type.id
                        ? 'border-primary bg-primary/5'
                        : 'hover:border-primary/50'
                    }`}
                  >
                    <span className="font-medium">{type.label}</span>
                  </button>
                ))}
              </div>
              {errors.listing_type && (
                <p className="text-sm text-destructive mt-2">{errors.listing_type.message}</p>
              )}
            </div>

            {/* Basic Details */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Property Title</Label>
                <Input
                  id="title"
                  placeholder="e.g., Spacious 3 BHK Apartment in Bandra"
                  className="mt-2"
                  {...register('title')}
                />
                {errors.title && (
                  <p className="text-sm text-destructive mt-1">{errors.title.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Describe your property in detail..."
                  className="mt-2 min-h-[150px]"
                  {...register('description')}
                />
                {errors.description && (
                  <p className="text-sm text-destructive mt-1">{errors.description.message}</p>
                )}
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="price">Price (₹)</Label>
                  <div className="relative mt-2">
                    <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="price"
                      type="number"
                      placeholder="Enter price"
                      className="pl-10"
                      {...register('price', { valueAsNumber: true })}
                    />
                  </div>
                  {errors.price && (
                    <p className="text-sm text-destructive mt-1">{errors.price.message}</p>
                  )}
                </div>
                {shouldShowField('area_sqft') && (
                  <div>
                    <Label htmlFor="area">Area (sqft)</Label>
                    <Input
                      id="area"
                      type="number"
                      placeholder="Enter area"
                      className="mt-2"
                      {...register('area_sqft', { valueAsNumber: true })}
                    />
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2">
                <Checkbox
                  id="negotiable"
                  checked={watchedValues.price_negotiable}
                  onCheckedChange={(checked) => setValue('price_negotiable', !!checked)}
                />
                <Label htmlFor="negotiable" className="cursor-pointer">
                  Price is negotiable
                </Label>
              </div>

              {shouldShowField('bedrooms') && (
                <div className="grid sm:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="bedrooms">Bedrooms</Label>
                    <Input
                      id="bedrooms"
                      type="number"
                      placeholder="No. of bedrooms"
                      className="mt-2"
                      {...register('bedrooms', { valueAsNumber: true })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="bathrooms">Bathrooms</Label>
                    <Input
                      id="bathrooms"
                      type="number"
                      placeholder="No. of bathrooms"
                      className="mt-2"
                      {...register('bathrooms', { valueAsNumber: true })}
                    />
                  </div>
                  <div>
                    <Label>Furnishing</Label>
                    <Select
                      value={watchedValues.furnishing}
                      onValueChange={(value) => setValue('furnishing', value)}
                    >
                      <SelectTrigger className="mt-2">
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        {furnishingTypes.map((type) => (
                          <SelectItem key={type.id} value={type.id}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              {shouldShowField('floor_number') && (
                <div className="grid sm:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="floor">Floor Number</Label>
                    <Input
                      id="floor"
                      type="number"
                      placeholder="Floor"
                      className="mt-2"
                      {...register('floor_number', { valueAsNumber: true })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="totalFloors">Total Floors</Label>
                    <Input
                      id="totalFloors"
                      type="number"
                      placeholder="Total floors"
                      className="mt-2"
                      {...register('total_floors', { valueAsNumber: true })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="age">Age (years)</Label>
                    <Input
                      id="age"
                      type="number"
                      placeholder="Property age"
                      className="mt-2"
                      {...register('age_of_property', { valueAsNumber: true })}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Location */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="address">Full Address</Label>
                <div className="relative mt-2">
                  <MapPin className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                  <Textarea
                    id="address"
                    placeholder="Enter complete address with landmarks"
                    className="pl-10 min-h-[100px]"
                    {...register('address')}
                  />
                </div>
                {errors.address && (
                  <p className="text-sm text-destructive mt-1">{errors.address.message}</p>
                )}
              </div>

              <div className="grid sm:grid-cols-3 gap-4">
                <div>
                  <Label>City</Label>
                  <Select
                    value={watchedValues.city}
                    onValueChange={(value) => setValue('city', value)}
                  >
                    <SelectTrigger className="mt-2">
                      <SelectValue placeholder="Select city" />
                    </SelectTrigger>
                    <SelectContent>
                      {CITIES.map((city) => (
                        <SelectItem key={city} value={city}>
                          {city}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.city && (
                    <p className="text-sm text-destructive mt-1">{errors.city.message}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="state">State</Label>
                  <Input
                    id="state"
                    placeholder="Enter state"
                    className="mt-2"
                    {...register('state')}
                  />
                  {errors.state && (
                    <p className="text-sm text-destructive mt-1">{errors.state.message}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="pincode">Pincode</Label>
                  <Input
                    id="pincode"
                    placeholder="Enter pincode"
                    className="mt-2"
                    {...register('pincode')}
                  />
                  {errors.pincode && (
                    <p className="text-sm text-destructive mt-1">{errors.pincode.message}</p>
                  )}
                </div>
              </div>

              {shouldShowField('facing') && (
                <div>
                  <Label htmlFor="facing">Facing Direction</Label>
                  <Input
                    id="facing"
                    placeholder="e.g., North, East, Main Road"
                    className="mt-2"
                    {...register('facing')}
                  />
                </div>
              )}
            </div>

            {/* Images */}
            <div>
              <Label className="text-base mb-4 block">Property Images</Label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
                {images.map((image, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={image}
                      alt={`Property ${index + 1}`}
                      className="w-full h-32 object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(index)}
                      className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
              <div className="border-2 border-dashed rounded-lg p-8 text-center">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  id="image-upload"
                  disabled={isUploading}
                />
                <label
                  htmlFor="image-upload"
                  className={`cursor-pointer flex flex-col items-center ${isUploading ? 'opacity-50' : ''}`}
                >
                  {isUploading ? (
                    <Loader2 className="w-8 h-8 animate-spin text-primary mb-2" />
                  ) : (
                    <Upload className="w-8 h-8 text-muted-foreground mb-2" />
                  )}
                  <span className="text-sm text-muted-foreground">
                    {isUploading ? 'Uploading...' : 'Click to upload images'}
                  </span>
                </label>
              </div>
            </div>

            {/* 360 Images */}
            <div>
              <Label className="text-base mb-4 block">
                <Compass className="w-4 h-4 inline mr-2" />
                360° Panoramic Images (Optional)
              </Label>
              <p className="text-sm text-muted-foreground mb-4">
                Upload 360-degree panoramic images for an immersive viewing experience
              </p>
              {images360.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
                  {images360.map((image, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={image}
                        alt={`360° View ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemove360Image(index)}
                        className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-4 h-4" />
                      </button>
                      <Badge className="absolute top-2 left-2 bg-primary/90">
                        360°
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
              <div className="border-2 border-dashed rounded-lg p-8 text-center">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handle360ImageUpload}
                  className="hidden"
                  id="360-image-upload"
                  disabled={isUploading360}
                />
                <label
                  htmlFor="360-image-upload"
                  className={`cursor-pointer flex flex-col items-center ${isUploading360 ? 'opacity-50' : ''}`}
                >
                  {isUploading360 ? (
                    <Loader2 className="w-8 h-8 animate-spin text-primary mb-2" />
                  ) : (
                    <Compass className="w-8 h-8 text-muted-foreground mb-2" />
                  )}
                  <span className="text-sm text-muted-foreground">
                    {isUploading360 ? 'Uploading...' : 'Click to upload 360° images'}
                  </span>
                </label>
              </div>
            </div>

            {/* Amenities */}
            <div>
              <Label className="text-base mb-4 block">Select Amenities</Label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {AMENITIES.map((amenity) => (
                  <label
                    key={amenity}
                    className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      selectedAmenities.includes(amenity)
                        ? 'border-primary bg-primary/5'
                        : 'hover:border-primary/50'
                    }`}
                  >
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

            <div className="flex justify-end gap-4 pt-6 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Update Property
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

