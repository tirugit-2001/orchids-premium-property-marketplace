export type UserRole = 'customer' | 'owner' | 'admin'
export type VerificationStatus = 'pending' | 'verified' | 'rejected' | null

export interface Profile {
  id: string
  email: string
  full_name: string | null
  phone: string | null
  avatar_url: string | null
  role: UserRole
  is_verified: boolean
  verification_status: VerificationStatus
  verification_documents: string[] | null
  verification_rejection_reason: string | null
  whatsapp_number: string | null
  bio: string | null
  company_name: string | null
  city: string | null
  notification_email: boolean
  notification_sms: boolean
  notification_push: boolean
  last_seen_at: string | null
  created_at: string
  updated_at: string
}

export type PropertyType = 'house' | 'apartment' | 'pg' | 'land' | 'villa' | 'commercial' | 'plot'
export type ListingType = 'sale' | 'rent' | 'lease'
export type FurnishingType = 'unfurnished' | 'semi-furnished' | 'fully-furnished'
export type PropertyStatus = 'pending' | 'approved' | 'rejected' | 'draft'
export type PossessionStatus = 'ready' | 'under_construction' | 'upcoming'

export interface Property {
  id: string
  owner_id: string
  title: string
  description: string | null
  property_type: PropertyType
  listing_type: ListingType
  price: number
  price_negotiable: boolean
  security_deposit: number | null
  maintenance_charge: number | null
  area_sqft: number | null
  carpet_area: number | null
  bedrooms: number | null
  bathrooms: number | null
  balconies: number | null
  furnishing: FurnishingType | null
  floor_number: number | null
  total_floors: number | null
  facing: string | null
  age_of_property: number | null
  possession_status: PossessionStatus
  available_from: string | null
  address: string
  locality: string | null
  city: string
  state: string
  pincode: string | null
  latitude: number | null
  longitude: number | null
  amenities: string[]
  images: string[]
  images_360: string[]
  video_url: string | null
  virtual_tour_url: string | null
  is_verified: boolean
  is_featured: boolean
  is_active: boolean
  views_count: number
  contacts_count: number
  favorites_count: number
  status: PropertyStatus
  rejection_reason: string | null
  approved_at: string | null
  created_at: string
  updated_at: string
  owner?: Profile
  average_rating?: number
  review_count?: number
  pg_details?: PgDetails | null
}

/** PG/Hostel listing – room types available */
export type PgRoomType = 'single' | 'double' | 'three' | 'four'

/** PG/Hostel – who the place is available for */
export type PgAvailableFor = 'male' | 'female' | 'anyone'

/** PG/Hostel – room-level amenities */
export const PG_ROOM_AMENITIES = [
  'Cupboard', 'TV', 'Bedding', 'Geyser', 'AC', 'Attached Bathroom'
] as const

/** PG/Hostel – rules (checkboxes) */
export const PG_RULES = [
  { id: 'no_smoking', label: 'No Smoking' },
  { id: 'no_guardians_stay', label: 'No Guardians Stay' },
  { id: 'no_girls_entry', label: "No Girl's Entry" },
  { id: 'no_drinking', label: 'No Drinking' },
  { id: 'no_non_veg', label: 'No Non-Veg' },
] as const

/** PG/Hostel – common/facility amenities */
export const PG_COMMON_AMENITIES = [
  { id: 'common_tv', label: 'Common TV' },
  { id: 'mess', label: 'Mess' },
  { id: 'lift', label: 'Lift' },
  { id: 'refrigerator', label: 'Refrigerator' },
  { id: 'wifi', label: 'Wifi' },
  { id: 'cooking_allowed', label: 'Cooking Allowed' },
  { id: 'power_backup', label: 'Power Backup' },
] as const

export const PG_PARKING_TYPES = ['None', 'Two Wheeler', 'Four Wheeler', 'Both'] as const

export interface PgDetails {
  room_types: PgRoomType[]
  room_amenities: string[]
  available_for: PgAvailableFor
  preferred_guests: string | null
  food_included: boolean
  rules: string[]
  gate_closing_time: string | null
  laundry: boolean
  room_cleaning: boolean
  warden_facility: boolean
  directions: string | null
  common_amenities: string[]
  parking_type: string | null
}

export type SubscriptionPlan = 'day' | 'weekly' | 'monthly'

export interface Subscription {
  id: string
  user_id: string
  plan_type: SubscriptionPlan
  plan_name: string
  price: number
  contacts_limit: number
  contacts_used: number
  starts_at: string
  expires_at: string
  is_active: boolean
  razorpay_subscription_id: string | null
  created_at: string
}

export type TransactionStatus = 'pending' | 'success' | 'failed' | 'refunded'

export interface Transaction {
  id: string
  user_id: string
  subscription_id: string | null
  razorpay_order_id: string | null
  razorpay_payment_id: string | null
  razorpay_signature: string | null
  amount: number
  currency: string
  status: TransactionStatus
  payment_method: string | null
  description: string | null
  metadata: Record<string, unknown>
  created_at: string
  updated_at: string
}

export interface ContactReveal {
  id: string
  customer_id: string
  property_id: string
  owner_id: string
  subscription_id: string | null
  revealed_phone: string | null
  revealed_email: string | null
  revealed_whatsapp: string | null
  revealed_at: string
}

export interface Chat {
  id: string
  property_id: string | null
  customer_id: string
  owner_id: string
  last_message: string | null
  last_message_at: string | null
  last_message_by: string | null
  customer_unread: number
  owner_unread: number
  is_blocked: boolean
  blocked_by: string | null
  created_at: string
  property?: Property
  customer?: Profile
  owner?: Profile
}

export type MessageType = 'text' | 'image' | 'file' | 'system'

export interface Message {
  id: string
  chat_id: string
  sender_id: string
  content: string
  message_type: MessageType
  image_url: string | null
  is_read: boolean
  read_at: string | null
  created_at: string
  sender?: Profile
}

export interface Review {
  id: string
  property_id: string
  reviewer_id: string
  rating: number
  title: string | null
  comment: string | null
  images: string[]
  helpful_count: number
  owner_response: string | null
  owner_response_at: string | null
  is_verified_contact: boolean
  is_hidden: boolean
  created_at: string
  reviewer?: Profile
}

export type VisitStatus = 'pending' | 'confirmed' | 'rejected' | 'cancelled' | 'completed'

export interface VisitRequest {
  id: string
  property_id: string
  customer_id: string
  owner_id: string
  preferred_date: string
  preferred_time: string
  alternate_date: string | null
  alternate_time: string | null
  notes: string | null
  customer_phone: string | null
  status: VisitStatus
  owner_message: string | null
  confirmed_date: string | null
  confirmed_time: string | null
  created_at: string
  updated_at: string
  property?: Property
  customer?: Profile
}

export type NotificationType = 'message' | 'property_approved' | 'property_rejected' | 'subscription_expiring' | 'payment_success' | 'visit_request' | 'visit_update' | 'new_property_match' | 'review' | 'general'

export interface Notification {
  id: string
  user_id: string
  type: NotificationType
  title: string
  message: string
  link: string | null
  image_url: string | null
  is_read: boolean
  read_at: string | null
  metadata: Record<string, unknown>
  created_at: string
}

export interface Favorite {
  id: string
  user_id: string
  property_id: string
  notes: string | null
  created_at: string
  property?: Property
}

export interface SavedSearch {
  id: string
  user_id: string
  name: string
  filters: SearchFilters
  email_alerts: boolean
  alert_frequency: 'instant' | 'daily' | 'weekly'
  last_notified_at: string | null
  created_at: string
}

export interface SearchFilters {
  q?: string
  city?: string
  property_type?: PropertyType
  listing_type?: ListingType
  min_price?: number
  max_price?: number
  bedrooms?: number[]
  bathrooms?: number
  furnishing?: FurnishingType
  amenities?: string[]
  possession_status?: PossessionStatus
  sort_by?: 'newest' | 'price_low' | 'price_high' | 'popular'
}

export interface PropertyView {
  id: string
  property_id: string
  viewer_id: string | null
  viewer_ip: string | null
  session_id: string | null
  viewed_at: string
}

export const SUBSCRIPTION_PLANS = {
  day: { 
    id: 'day',
    name: 'Two Day Pass', 
    price: 49, 
    contacts: 5, 
    duration: 2,
    description: '48 hours access',
    features: ['5 property contacts', 'Basic search filters', 'Chat with owners', '48 hours access']
  },
  weekly: { 
    id: 'weekly',
    name: 'Weekly Pass', 
    price: 150, 
    contacts: 20, 
    duration: 7,
    description: '7 days access',
    features: ['20 property contacts', 'Advanced filters', 'Chat with owners', 'Save favorites', '7 days access', 'Priority support']
  },
  monthly: { 
    id: 'monthly',
    name: 'Monthly Pass', 
    price: 299, 
    contacts: -1, 
    duration: 30,
    description: '30 days unlimited',
    features: ['Unlimited contacts', 'All premium filters', 'Chat with owners', 'Save favorites', '30 days access', 'Priority support', 'Download PDFs', 'Price insights']
  },
} as const

export const AMENITIES = [
  'Parking', 'Gym', 'Swimming Pool', 'Garden', 'Security', 'Lift',
  'Power Backup', 'Water Supply', 'Gas Pipeline', 'Club House',
  'Children Play Area', 'Fire Safety', 'Intercom', 'Rain Water Harvesting',
  'Servant Room', 'Store Room', 'Balcony', 'Terrace', 'AC', 'WiFi',
  'CCTV', 'Gated Community', 'Jogging Track', 'Indoor Games', 'Party Hall',
  'Visitor Parking', 'Laundry', 'ATM', 'Grocery Store', 'Medical Shop'
] as const

export const CITIES = [
  'Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Chennai', 'Kolkata',
  'Pune', 'Ahmedabad', 'Jaipur', 'Lucknow', 'Surat', 'Noida', 'Gurgaon',
  'Chandigarh', 'Kochi', 'Indore', 'Bhopal', 'Nagpur', 'Vadodara', 'Coimbatore'
] as const

export const STATES = [
  'Maharashtra', 'Delhi', 'Karnataka', 'Telangana', 'Tamil Nadu', 'West Bengal',
  'Gujarat', 'Rajasthan', 'Uttar Pradesh', 'Haryana', 'Punjab', 'Kerala',
  'Madhya Pradesh', 'Andhra Pradesh', 'Bihar', 'Odisha', 'Jharkhand', 'Uttarakhand'
] as const

export const FACING_OPTIONS = [
  'North', 'South', 'East', 'West', 'North-East', 'North-West', 'South-East', 'South-West'
] as const
