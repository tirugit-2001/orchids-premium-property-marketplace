"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/lib/store";
import { toast } from "sonner";
import {
  CITIES,
  PG_ROOM_AMENITIES,
  PG_RULES,
  PG_COMMON_AMENITIES,
  PG_PARKING_TYPES,
  type PgRoomType,
  type PgAvailableFor,
  type PgDetails,
} from "@/lib/types";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  MapPin,
  IndianRupee,
  Image as ImageIcon,
  Loader2,
  ShieldCheck,
  X,
  Upload,
  Compass,
  BedDouble,
  UtensilsCrossed,
  Clock,
  Car,
} from "lucide-react";

const roomTypeOptions: { id: PgRoomType; label: string }[] = [
  { id: "single", label: "Single" },
  { id: "double", label: "Double" },
  { id: "three", label: "Three" },
  { id: "four", label: "Four" },
];

const availableForOptions: { id: PgAvailableFor; label: string }[] = [
  { id: "male", label: "Male" },
  { id: "female", label: "Female" },
  { id: "anyone", label: "Anyone" },
];

const pgSchema = z.object({
  title: z.string().min(10, "Title must be at least 10 characters"),
  description: z.string().min(50, "Description must be at least 50 characters"),
  price: z.preprocess(
    (val) => (val === "" || val === undefined ? undefined : Number(val)),
    z.number().min(1, "Please enter expected rent")
  ),
  security_deposit: z.preprocess(
    (val) => (val === "" || val === undefined ? undefined : Number(val)),
    z.number().min(0, "Please enter expected deposit")
  ),
  city: z.string().min(1, "Please select a city"),
  locality: z.string().min(1, "Enter location / society name"),
  address: z.string().min(5, "Landmark / Street is required"),
  state: z.string().min(1, "State is required"),
  pincode: z.string().min(6, "Valid pincode required"),
  latitude: z.preprocess(
    (val) => (val === "" || val === undefined ? undefined : Number(val)),
    z.number().optional()
  ),
  longitude: z.preprocess(
    (val) => (val === "" || val === undefined ? undefined : Number(val)),
    z.number().optional()
  ),
  available_from: z.string().optional(),
  preferred_guests: z.string().optional(),
  gate_closing_time: z.string().optional(),
  directions: z.string().optional(),
});

type PgFormValues = z.infer<typeof pgSchema>;

const steps = [
  { id: 1, title: "Room Types", description: "Select room types available" },
  { id: 2, title: "Rent & Room Amenities", description: "Expected rent, deposit & room amenities" },
  { id: 3, title: "Location", description: "Provide location details" },
  { id: 4, title: "Place Details", description: "Available for, food, rules, description" },
  { id: 5, title: "Additional Details", description: "Services, directions, amenities" },
  { id: 6, title: "Photos & Videos", description: "Upload photos and videos" },
  { id: 7, title: "Review", description: "Review and submit" },
];

const defaultPgDetails: PgDetails = {
  room_types: [],
  room_amenities: [],
  available_for: "anyone",
  preferred_guests: null,
  food_included: false,
  rules: [],
  gate_closing_time: null,
  laundry: false,
  room_cleaning: false,
  warden_facility: false,
  directions: null,
  common_amenities: [],
  parking_type: null,
};

export default function NewPgPropertyPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const [images360, setImages360] = useState<string[]>([]);
  const [videoUrl, setVideoUrl] = useState<string>("");
  const [isUploading, setIsUploading] = useState(false);
  const [isUploading360, setIsUploading360] = useState(false);
  const [verificationLoading, setVerificationLoading] = useState(true);
  const [isVerified, setIsVerified] = useState(false);

  const [pgDetails, setPgDetails] = useState<PgDetails>(defaultPgDetails);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    trigger,
    formState: { errors },
  } = useForm<PgFormValues>({
    resolver: zodResolver(pgSchema),
    mode: "onChange",
    defaultValues: {
      security_deposit: 0,
    },
  });

  const watchedValues = watch();

  useEffect(() => {
    async function checkVerification() {
      const supabase = createClient();
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();
      if (!authUser) {
        router.push("/auth/login");
        return;
      }
      const { data } = await supabase
        .from("profiles")
        .select("is_verified, role")
        .eq("id", authUser.id)
        .single();
      if (data?.role === "admin") setIsVerified(true);
      else if (data?.role === "owner") setIsVerified(!!data?.is_verified);
      else router.push("/dashboard");
      setVerificationLoading(false);
    }
    checkVerification();
  }, [router]);

  const toggleRoomType = (id: PgRoomType) => {
    setPgDetails((prev) => ({
      ...prev,
      room_types: prev.room_types.includes(id)
        ? prev.room_types.filter((t) => t !== id)
        : [...prev.room_types, id],
    }));
  };

  const toggleRoomAmenity = (amenity: string) => {
    setPgDetails((prev) => ({
      ...prev,
      room_amenities: prev.room_amenities.includes(amenity)
        ? prev.room_amenities.filter((a) => a !== amenity)
        : [...prev.room_amenities, amenity],
    }));
  };

  const toggleRule = (id: string) => {
    setPgDetails((prev) => ({
      ...prev,
      rules: prev.rules.includes(id) ? prev.rules.filter((r) => r !== id) : [...prev.rules, id],
    }));
  };

  const toggleCommonAmenity = (id: string) => {
    setPgDetails((prev) => ({
      ...prev,
      common_amenities: prev.common_amenities.includes(id)
        ? prev.common_amenities.filter((a) => a !== id)
        : [...prev.common_amenities, id],
    }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("user_id", user.id);
      formData.append("property_id", "temp");
      const response = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to upload");
      setImages((prev) => [...prev, data.url]);
      toast.success("Image uploaded");
    } catch (err: unknown) {
      toast.error((err as Error).message || "Upload failed");
    } finally {
      setIsUploading(false);
      if (e.target) e.target.value = "";
    }
  };

  const handle360ImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setIsUploading360(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("user_id", user.id);
      formData.append("property_id", "temp");
      const response = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to upload");
      setImages360((prev) => [...prev, data.url]);
      toast.success("360° image uploaded");
    } catch (err: unknown) {
      toast.error((err as Error).message || "Upload failed");
    } finally {
      setIsUploading360(false);
      if (e.target) e.target.value = "";
    }
  };

  const validateStep = async (): Promise<boolean> => {
    switch (currentStep) {
      case 1:
        if (pgDetails.room_types.length === 0) {
          toast.error("Select at least one room type");
          return false;
        }
        return true;
      case 2:
        return await trigger(["title", "description", "price", "security_deposit"]);
      case 3:
        return await trigger(["city", "locality", "address", "state", "pincode"]);
      case 4:
        return true;
      case 5:
      case 6:
        return true;
      default:
        return true;
    }
  };

  const nextStep = async () => {
    const ok = await validateStep();
    if (!ok) {
      toast.error("Please fill required fields");
      return;
    }
    if (currentStep < steps.length) setCurrentStep(currentStep + 1);
  };

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const onSubmit: SubmitHandler<PgFormValues> = async (data) => {
    if (!user) {
      toast.error("Please sign in");
      router.push("/auth/login");
      return;
    }
    const isValid = await trigger();
    if (!isValid) {
      toast.error("Please fix errors before submitting");
      return;
    }
    if (images.length === 0) {
      toast.error("Add at least one photo");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        user_id: user.id,
        property_type: "pg",
        listing_type: "rent",
        title: data.title,
        description: data.description,
        price: data.price,
        security_deposit: data.security_deposit ?? 0,
        price_negotiable: false,
        address: data.address,
        locality: data.locality,
        city: data.city,
        state: data.state,
        pincode: data.pincode,
        latitude: data.latitude ?? null,
        longitude: data.longitude ?? null,
        available_from: data.available_from || null,
        amenities: [
          ...pgDetails.room_amenities,
          ...pgDetails.common_amenities,
          pgDetails.parking_type ? `Parking: ${pgDetails.parking_type}` : null,
        ].filter(Boolean) as string[],
        images,
        images_360: images360 || [],
        video_url: videoUrl || null,
        locality: data.locality,
        possession_status: "ready",
        status: "pending",
        pg_details: {
          ...pgDetails,
          preferred_guests: data.preferred_guests || null,
          gate_closing_time: data.gate_closing_time || null,
          directions: data.directions || null,
        },
      };

      const response = await fetch("/api/properties", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Failed to submit");
      if (result.warning) toast.warning(result.warning);
      toast.success("PG listed successfully! It will be reviewed before going live.");
      router.push("/dashboard/properties");
    } catch (err: unknown) {
      toast.error((err as Error).message || "Failed to submit");
    } finally {
      setIsSubmitting(false);
    }
  };

  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation not supported");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setValue("latitude", pos.coords.latitude);
        setValue("longitude", pos.coords.longitude);
        toast.success("Location set");
      },
      () => toast.error("Could not get location")
    );
  };

  if (verificationLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isVerified) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-24 px-4 max-w-2xl mx-auto text-center">
          <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <ShieldCheck className="w-10 h-10 text-amber-600" />
          </div>
          <h1 className="text-3xl font-bold mb-4">Verification Required</h1>
          <p className="text-muted-foreground mb-8">
            Property owners must be verified before listing. Please complete verification first.
          </p>
          <Button size="lg" onClick={() => router.push("/dashboard/verify")}>
            Get Verified Now
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Button variant="ghost" className="mb-6" onClick={() => router.push("/dashboard/properties/new")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>

          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">List PG / Hostel</h1>
            <p className="text-muted-foreground">Fill in the details for your PG or hostel listing.</p>
          </div>

          <div className="mb-8">
            <div className="flex items-center justify-between flex-wrap gap-2">
              {steps.map((step, index) => (
                <div key={step.id} className="flex items-center">
                  <div
                    className={`flex items-center justify-center w-8 h-8 rounded-full border-2 text-sm transition-colors ${
                      currentStep >= step.id ? "bg-primary border-primary text-primary-foreground" : "border-muted"
                    }`}
                  >
                    {currentStep > step.id ? <Check className="w-4 h-4" /> : step.id}
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`hidden sm:block w-8 h-0.5 mx-1 ${currentStep > step.id ? "bg-primary" : "bg-muted"}`} />
                  )}
                </div>
              ))}
            </div>
            <div className="mt-4">
              <h2 className="font-semibold">{steps[currentStep - 1].title}</h2>
              <p className="text-sm text-muted-foreground">{steps[currentStep - 1].description}</p>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)}>
            <AnimatePresence mode="wait">
              {/* Step 1: Room types */}
              {currentStep === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div>
                    <Label className="text-base mb-4 block">Select the type of rooms available in your PG</Label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      {roomTypeOptions.map((opt) => (
                        <label
                          key={opt.id}
                          className={`flex items-center justify-center gap-2 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                            pgDetails.room_types.includes(opt.id) ? "border-primary bg-primary/5" : "hover:border-primary/50"
                          }`}
                        >
                          <Checkbox
                            checked={pgDetails.room_types.includes(opt.id)}
                            onCheckedChange={() => toggleRoomType(opt.id)}
                          />
                          <span>{opt.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Step 2: Rent, Deposit, Room Amenities */}
              {currentStep === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div>
                    <Label htmlFor="title">Property Title *</Label>
                    <Input
                      id="title"
                      placeholder="e.g., Cozy PG for working professionals near Tech Park"
                      className="mt-2"
                      {...register("title")}
                    />
                    {errors.title && <p className="text-sm text-destructive mt-1">{errors.title.message}</p>}
                  </div>
                  <div>
                    <Label htmlFor="description">Description *</Label>
                    <Textarea
                      id="description"
                      placeholder="Describe your PG – what makes it special. Do not include contact details."
                      className="mt-2 min-h-[120px]"
                      {...register("description")}
                    />
                    {errors.description && <p className="text-sm text-destructive mt-1">{errors.description.message}</p>}
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <Label>Expected Rent * (₹)</Label>
                      <div className="relative mt-2">
                        <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          type="number"
                          placeholder="Enter amount"
                          className="pl-10"
                          {...register("price", { valueAsNumber: true })}
                        />
                      </div>
                      {errors.price && <p className="text-sm text-destructive mt-1">{errors.price.message}</p>}
                    </div>
                    <div>
                      <Label>Expected Deposit * (₹)</Label>
                      <div className="relative mt-2">
                        <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          type="number"
                          placeholder="Enter amount"
                          className="pl-10"
                          {...register("security_deposit", { valueAsNumber: true })}
                        />
                      </div>
                      {errors.security_deposit && (
                        <p className="text-sm text-destructive mt-1">{errors.security_deposit.message}</p>
                      )}
                    </div>
                  </div>
                  <div>
                    <Label className="text-base mb-4 block">Room Amenities</Label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                      {PG_ROOM_AMENITIES.map((amenity) => (
                        <label
                          key={amenity}
                          className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                            pgDetails.room_amenities.includes(amenity) ? "border-primary bg-primary/5" : "hover:border-primary/50"
                          }`}
                        >
                          <Checkbox
                            checked={pgDetails.room_amenities.includes(amenity)}
                            onCheckedChange={() => toggleRoomAmenity(amenity)}
                          />
                          <span className="text-sm">{amenity}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Step 3: Location */}
              {currentStep === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <h3 className="font-medium flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    Provide location details
                  </h3>
                  <div>
                    <Label>City *</Label>
                    <Select value={watchedValues.city} onValueChange={(v) => setValue("city", v)}>
                      <SelectTrigger className="mt-2">
                        <SelectValue placeholder="Select city" />
                      </SelectTrigger>
                      <SelectContent>
                        {CITIES.map((city) => (
                          <SelectItem key={city} value={city}>{city}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.city && <p className="text-sm text-destructive mt-1">{errors.city.message}</p>}
                  </div>
                  <div>
                    <Label htmlFor="locality">Locality *</Label>
                    <Input
                      id="locality"
                      placeholder="Enter location / society name"
                      className="mt-2"
                      {...register("locality")}
                    />
                    {errors.locality && <p className="text-sm text-destructive mt-1">{errors.locality.message}</p>}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button type="button" variant="outline" size="sm" onClick={useCurrentLocation}>
                      Use Current Location
                    </Button>
                    <span className="text-sm text-muted-foreground">GPS</span>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="latitude">Latitude</Label>
                      <Input id="latitude" type="number" step="any" placeholder="e.g. 12.9716" {...register("latitude")} />
                    </div>
                    <div>
                      <Label htmlFor="longitude">Longitude</Label>
                      <Input id="longitude" type="number" step="any" placeholder="e.g. 77.5946" {...register("longitude")} />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="address">Landmark / Street *</Label>
                    <Input id="address" placeholder="e.g. Evergreen street" className="mt-2" {...register("address")} />
                    {errors.address && <p className="text-sm text-destructive mt-1">{errors.address.message}</p>}
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="state">State *</Label>
                      <Input id="state" placeholder="State" {...register("state")} />
                      {errors.state && <p className="text-sm text-destructive mt-1">{errors.state.message}</p>}
                    </div>
                    <div>
                      <Label htmlFor="pincode">Pincode *</Label>
                      <Input id="pincode" placeholder="e.g. 560001" {...register("pincode")} />
                      {errors.pincode && <p className="text-sm text-destructive mt-1">{errors.pincode.message}</p>}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Step 4: Place details */}
              {currentStep === 4 && (
                <motion.div
                  key="step4"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <h3 className="font-medium flex items-center gap-2">
                    <BedDouble className="w-4 h-4" />
                    Provide details about your place
                  </h3>
                  <div>
                    <Label className="mb-2 block">Place is available for *</Label>
                    <div className="flex gap-4">
                      {availableForOptions.map((opt) => (
                        <label
                          key={opt.id}
                          className={`flex items-center gap-2 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                            pgDetails.available_for === opt.id ? "border-primary bg-primary/5" : "hover:border-primary/50"
                          }`}
                        >
                          <input
                            type="radio"
                            name="available_for"
                            checked={pgDetails.available_for === opt.id}
                            onChange={() => setPgDetails((p) => ({ ...p, available_for: opt.id }))}
                            className="sr-only"
                          />
                          <span>{opt.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="preferred_guests">Preferred Guests</Label>
                    <Select
                      value={watchedValues.preferred_guests || ""}
                      onValueChange={(v) => setValue("preferred_guests", v)}
                    >
                      <SelectTrigger className="mt-2">
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="students">Students</SelectItem>
                        <SelectItem value="working">Working Professionals</SelectItem>
                        <SelectItem value="both">Both</SelectItem>
                        <SelectItem value="any">Anyone</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="available_from">Available From *</Label>
                    <Input id="available_from" type="date" className="mt-2" {...register("available_from")} />
                  </div>
                  <div>
                    <Label className="mb-2 block flex items-center gap-2">
                      <UtensilsCrossed className="w-4 h-4" />
                      Food Included *
                    </Label>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="food_included"
                          checked={pgDetails.food_included === true}
                          onChange={() => setPgDetails((p) => ({ ...p, food_included: true }))}
                        />
                        Yes
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="food_included"
                          checked={pgDetails.food_included === false}
                          onChange={() => setPgDetails((p) => ({ ...p, food_included: false }))}
                        />
                        No
                      </label>
                    </div>
                  </div>
                  <div>
                    <Label className="mb-4 block">PG/Hostel Rules</Label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {PG_RULES.map((rule) => (
                        <label
                          key={rule.id}
                          className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer ${
                            pgDetails.rules.includes(rule.id) ? "border-primary bg-primary/5" : ""
                          }`}
                        >
                          <Checkbox
                            checked={pgDetails.rules.includes(rule.id)}
                            onCheckedChange={() => toggleRule(rule.id)}
                          />
                          <span className="text-sm">{rule.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="gate_closing_time" className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      Gate Closing Time
                    </Label>
                    <Input
                      id="gate_closing_time"
                      type="time"
                      className="mt-2"
                      {...register("gate_closing_time")}
                    />
                  </div>
                  <div>
                    <Label htmlFor="description_again">Description</Label>
                    <Textarea
                      id="description_again"
                      placeholder="What makes your property stand out. Do not mention contact details."
                      className="mt-2 min-h-[100px]"
                      {...register("description")}
                    />
                  </div>
                </motion.div>
              )}

              {/* Step 5: Additional details */}
              {currentStep === 5 && (
                <motion.div
                  key="step5"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <h3 className="font-medium">Available Services</h3>
                  <div className="grid sm:grid-cols-3 gap-4">
                    {[
                      { key: "laundry" as const, label: "Laundry" },
                      { key: "room_cleaning" as const, label: "Room Cleaning" },
                      { key: "warden_facility" as const, label: "Warden Facility" },
                    ].map(({ key, label }) => (
                      <div key={key} className="flex items-center justify-between p-4 rounded-xl border">
                        <span>{label}</span>
                        <div className="flex gap-4">
                          <label className="flex items-center gap-1">
                            <input
                              type="radio"
                              name={key}
                              checked={pgDetails[key] === true}
                              onChange={() => setPgDetails((p) => ({ ...p, [key]: true }))}
                            />
                            Yes
                          </label>
                          <label className="flex items-center gap-1">
                            <input
                              type="radio"
                              name={key}
                              checked={pgDetails[key] === false}
                              onChange={() => setPgDetails((p) => ({ ...p, [key]: false }))}
                            />
                            No
                          </label>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div>
                    <Label htmlFor="directions">Add Directions (tip for tenants)</Label>
                    <Textarea
                      id="directions"
                      placeholder="e.g. Take the road opposite to Amrita College, take right after 300m..."
                      className="mt-2 min-h-[80px]"
                      {...register("directions")}
                    />
                  </div>
                  <div>
                    <Label className="mb-4 block">Available Amenities</Label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {PG_COMMON_AMENITIES.map((a) => (
                        <label
                          key={a.id}
                          className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer text-sm ${
                            pgDetails.common_amenities.includes(a.id) ? "border-primary bg-primary/5" : ""
                          }`}
                        >
                          <Checkbox
                            checked={pgDetails.common_amenities.includes(a.id)}
                            onCheckedChange={() => toggleCommonAmenity(a.id)}
                          />
                          {a.label}
                        </label>
                      ))}
                    </div>
                  </div>
                  <div>
                    <Label className="mb-2 block flex items-center gap-2">
                      <Car className="w-4 h-4" />
                      Parking
                    </Label>
                    <Select
                      value={pgDetails.parking_type || ""}
                      onValueChange={(v) => setPgDetails((p) => ({ ...p, parking_type: v || null }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select parking type" />
                      </SelectTrigger>
                      <SelectContent>
                        {PG_PARKING_TYPES.map((t) => (
                          <SelectItem key={t} value={t}>{t}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </motion.div>
              )}

              {/* Step 6: Photos & Videos */}
              {currentStep === 6 && (
                <motion.div
                  key="step6"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div>
                    <Label className="text-base mb-4 block flex items-center gap-2">
                      <ImageIcon className="w-4 h-4" />
                      Upload photos
                    </Label>
                    <p className="text-sm text-muted-foreground mb-4">
                      Add photos to get more responses. At least one photo is required.
                    </p>
                    {images.length > 0 && (
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
                        {images.map((url, i) => (
                          <div key={i} className="relative group">
                            <img src={url} alt="" className="w-full h-32 object-cover rounded-lg" />
                            <button
                              type="button"
                              onClick={() => setImages((prev) => prev.filter((_, idx) => idx !== i))}
                              className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="border-2 border-dashed rounded-lg p-6 text-center">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                        id="pg-image-upload"
                        disabled={isUploading}
                      />
                      <label htmlFor="pg-image-upload" className={`cursor-pointer flex flex-col items-center ${isUploading ? "opacity-50" : ""}`}>
                        {isUploading ? <Loader2 className="w-8 h-8 animate-spin mb-2" /> : <Upload className="w-8 h-8 mb-2 text-muted-foreground" />}
                        <span className="text-sm text-muted-foreground">{isUploading ? "Uploading..." : "Add Photos"}</span>
                      </label>
                    </div>
                  </div>
                  <div>
                    <Label className="text-base mb-4 block flex items-center gap-2">
                      <Compass className="w-4 h-4" />
                      360° Images (optional)
                    </Label>
                    {images360.length > 0 && (
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
                        {images360.map((url, i) => (
                          <div key={i} className="relative group">
                            <img src={url} alt="" className="w-full h-32 object-cover rounded-lg" />
                            <button
                              type="button"
                              onClick={() => setImages360((prev) => prev.filter((_, idx) => idx !== i))}
                              className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="border-2 border-dashed rounded-lg p-6 text-center">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handle360ImageUpload}
                        className="hidden"
                        id="pg-360-upload"
                        disabled={isUploading360}
                      />
                      <label htmlFor="pg-360-upload" className={`cursor-pointer flex flex-col items-center ${isUploading360 ? "opacity-50" : ""}`}>
                        {isUploading360 ? <Loader2 className="w-8 h-8 animate-spin mb-2" /> : <Compass className="w-8 h-8 mb-2 text-muted-foreground" />}
                        <span className="text-sm text-muted-foreground">Add 360° images</span>
                      </label>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="video_url">Video URL (optional)</Label>
                    <Input
                      id="video_url"
                      placeholder="https://..."
                      className="mt-2"
                      value={videoUrl}
                      onChange={(e) => setVideoUrl(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground mt-1">Add a video link to get more responses.</p>
                  </div>
                </motion.div>
              )}

              {/* Step 7: Review */}
              {currentStep === 7 && (
                <motion.div
                  key="step7"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div className="p-6 rounded-xl border bg-card space-y-4">
                    <h3 className="font-semibold text-lg">Review your PG listing</h3>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <span className="text-sm text-muted-foreground">Title</span>
                        <p className="font-medium">{watchedValues.title}</p>
                      </div>
                      <div>
                        <span className="text-sm text-muted-foreground">Rent / Deposit</span>
                        <p className="font-medium">₹{watchedValues.price?.toLocaleString()} / ₹{watchedValues.security_deposit?.toLocaleString()}</p>
                      </div>
                    </div>
                    <div>
                      <span className="text-sm text-muted-foreground">Room types</span>
                      <p className="font-medium">{pgDetails.room_types.map((t) => t).join(", ")}</p>
                    </div>
                    <div>
                      <span className="text-sm text-muted-foreground">Location</span>
                      <p className="font-medium">{watchedValues.locality}, {watchedValues.city}</p>
                    </div>
                    <div>
                      <span className="text-sm text-muted-foreground">Available for</span>
                      <p className="font-medium capitalize">{pgDetails.available_for}</p>
                    </div>
                    <div>
                      <span className="text-sm text-muted-foreground">Photos</span>
                      <p className="font-medium">{images.length} photo(s)</p>
                    </div>
                  </div>
                  <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 text-sm">
                    By submitting, you agree to our terms. Your listing will be reviewed before going live.
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex justify-between mt-8 pt-6 border-t">
              <Button type="button" variant="outline" onClick={prevStep} disabled={currentStep === 1}>
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
                      Submit PG Listing
                    </>
                  )}
                </Button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
