-- Add pg_details JSONB column for PG/Hostel listing data
-- Run this in Supabase SQL Editor if your properties table doesn't have this column yet.

ALTER TABLE properties
ADD COLUMN IF NOT EXISTS pg_details JSONB DEFAULT NULL;

COMMENT ON COLUMN properties.pg_details IS 'PG/Hostel specific: room_types, room_amenities, available_for, rules, gate_closing_time, laundry, room_cleaning, warden_facility, directions, common_amenities, parking_type, etc.';
