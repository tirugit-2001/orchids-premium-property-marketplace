'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
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
import {
  ArrowLeft,
  ArrowRight,
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

const steps = [
  { id: 1, title: 'Property Type', description: 'Select your property type' },
  { id: 2, title: 'Basic Details', description: 'Enter property information' },
  { id: 3, title: 'Location', description: 'Where is your property?' },
  { id: 4, title: 'Amenities', description: 'Select available amenities' },
  { id: 5, title: 'Review', description: 'Review and submit' },
]

export default function NewPropertyPage() {
  const router = useRouter()
  const { user } = useAuthStore()
  const [currentStep, setCurrentStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([])

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<PropertyForm>({
    resolver: zodResolver(propertySchema),
    defaultValues: {
      price_negotiable: false,
      amenities: [],
    },
  })

  const watchedValues = watch()

  const onSubmit = async (data: PropertyForm) => {
    if (!user) {
      toast.error('Please sign in to list a property')
      router.push('/auth/login')
      return
    }

    setIsSubmitting(true)
    try {
      const response = await fetch('/api/properties', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          user_id: user.id,
          amenities: selectedAmenities,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to submit property')
      }

      toast.success('Property listed successfully!')
      router.push('/dashboard')
    } catch (error: unknown) {
      const err = error as Error
      toast.error(err.message || 'Failed to submit property')
    } finally {
      setIsSubmitting(false)
    }
  }

  const nextStep = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
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
            <h1 className="text-3xl font-bold mb-2">List Your Property</h1>
            <p className="text-muted-foreground">
              Fill in the details below to list your property on PropVista
            </p>
          </div>

          <div className="mb-8">
            <div className="flex items-center justify-between">
              {steps.map((step, index) => (
                <div key={step.id} className="flex items-center">
                  <div
                    className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors ${
                      currentStep >= step.id
                        ? 'bg-primary border-primary text-primary-foreground'
                        : 'border-muted-foreground/30 text-muted-foreground'
                    }`}
                  >
                    {currentStep > step.id ? (
                      <Check className="w-5 h-5" />
                    ) : (
                      step.id
                    )}
                  </div>
                  {index < steps.length - 1 && (
                    <div
                      className={`hidden sm:block w-24 h-0.5 mx-2 ${
                        currentStep > step.id ? 'bg-primary' : 'bg-muted'
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>
            <div className="mt-4">
              <h2 className="font-semibold">{steps[currentStep - 1].title}</h2>
              <p className="text-sm text-muted-foreground">
                {steps[currentStep - 1].description}
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)}>
            <AnimatePresence mode="wait">
              {currentStep === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
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
                </motion.div>
              )}

              {currentStep === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
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
                </motion.div>
              )}

              {currentStep === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
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

                  <div>
                    <Label htmlFor="facing">Facing Direction</Label>
                    <Input
                      id="facing"
                      placeholder="e.g., North, East, Main Road"
                      className="mt-2"
                      {...register('facing')}
                    />
                  </div>
                </motion.div>
              )}

              {currentStep === 4 && (
                <motion.div
                  key="step4"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
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
                </motion.div>
              )}

              {currentStep === 5 && (
                <motion.div
                  key="step5"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div className="p-6 rounded-xl border bg-card">
                    <h3 className="font-semibold text-lg mb-4">Review Your Listing</h3>
                    
                    <div className="space-y-4">
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div>
                          <span className="text-sm text-muted-foreground">Property Type</span>
                          <p className="font-medium capitalize">{watchedValues.property_type}</p>
                        </div>
                        <div>
                          <span className="text-sm text-muted-foreground">Listing Type</span>
                          <p className="font-medium capitalize">{watchedValues.listing_type}</p>
                        </div>
                      </div>

                      <div>
                        <span className="text-sm text-muted-foreground">Title</span>
                        <p className="font-medium">{watchedValues.title}</p>
                      </div>

                      <div>
                        <span className="text-sm text-muted-foreground">Description</span>
                        <p className="text-sm">{watchedValues.description}</p>
                      </div>

                      <div className="grid sm:grid-cols-3 gap-4">
                        <div>
                          <span className="text-sm text-muted-foreground">Price</span>
                          <p className="font-medium">₹{watchedValues.price?.toLocaleString()}</p>
                        </div>
                        <div>
                          <span className="text-sm text-muted-foreground">Area</span>
                          <p className="font-medium">{watchedValues.area_sqft} sqft</p>
                        </div>
                        <div>
                          <span className="text-sm text-muted-foreground">Bedrooms</span>
                          <p className="font-medium">{watchedValues.bedrooms}</p>
                        </div>
                      </div>

                      <div>
                        <span className="text-sm text-muted-foreground">Location</span>
                        <p className="font-medium">
                          {watchedValues.address}, {watchedValues.city}, {watchedValues.state} - {watchedValues.pincode}
                        </p>
                      </div>

                      <div>
                        <span className="text-sm text-muted-foreground">Amenities</span>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {selectedAmenities.map((amenity) => (
                            <span
                              key={amenity}
                              className="px-2 py-1 rounded-md bg-muted text-sm"
                            >
                              {amenity}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
                    <p className="text-sm">
                      By submitting, you agree to our terms and confirm that the information provided is accurate.
                      Your listing will be reviewed before going live.
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex justify-between mt-8 pt-6 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={prevStep}
                disabled={currentStep === 1}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Previous
              </Button>

              {currentStep < steps.length ? (
                <Button type="button" onClick={nextStep}>
                  Next
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              ) : (
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4 mr-2" />
                      Submit Property
                    </>
                  )}
                </Button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
