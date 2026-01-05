import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase/server'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { property_id, owner_id, preferred_date, preferred_time, notes, customer_phone } = body

    if (!property_id || !owner_id || !preferred_date || !preferred_time) {
      return NextResponse.json({ 
        error: 'Missing required fields: property_id, owner_id, preferred_date, preferred_time' 
      }, { status: 400 })
    }

    // Ensure customer profile exists (required for foreign key constraint)
    const { data: customerProfile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('phone, full_name, id')
      .eq('id', user.id)
      .single()

    // If profile doesn't exist, create a basic one
    if (profileError || !customerProfile) {
      const { error: createProfileError } = await supabaseAdmin
        .from('profiles')
        .insert({
          id: user.id,
          email: user.email || '',
          full_name: user.user_metadata?.full_name || '',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (createProfileError) {
        console.error('Error creating profile:', createProfileError)
        return NextResponse.json({ 
          error: 'Failed to create user profile. Please contact support.' 
        }, { status: 500 })
      }
    }

    // Get customer profile for phone number (refresh after potential creation)
    const { data: customerProfileData } = await supabaseAdmin
      .from('profiles')
      .select('phone, full_name')
      .eq('id', user.id)
      .single()

    // Create visit request
    const { data: visitRequest, error: visitError } = await supabaseAdmin
      .from('visit_requests')
      .insert({
        property_id,
        customer_id: user.id,
        owner_id,
        preferred_date,
        preferred_time,
        notes: notes || null,
        customer_phone: customer_phone || customerProfileData?.phone || null,
        status: 'pending',
      })
      .select()
      .single()

    if (visitError) {
      console.error('Visit request creation error:', visitError)
      return NextResponse.json({ 
        error: `Failed to create visit request: ${visitError.message}` 
      }, { status: 500 })
    }

    // Get property details for notification
    const { data: property } = await supabaseAdmin
      .from('properties')
      .select('title, images')
      .eq('id', property_id)
      .single()

    // Create notification for owner
    try {
      await supabaseAdmin
        .from('notifications')
        .insert({
          user_id: owner_id,
          type: 'visit_request',
          title: 'New Visit Request',
          message: `${customerProfileData?.full_name || 'A customer'} has requested to visit "${property?.title || 'your property'}" on ${new Date(preferred_date).toLocaleDateString()} at ${preferred_time}`,
          link: `/dashboard/visits`,
          image_url: property?.images?.[0] || null,
          is_read: false,
          metadata: {
            visit_request_id: visitRequest.id,
            property_id,
            customer_id: user.id,
          }
        })
    } catch (notifError) {
      console.error('Notification creation error (non-critical):', notifError)
      // Continue even if notification creation fails
    }

    return NextResponse.json({ 
      success: true, 
      visit_request: visitRequest,
      message: 'Visit request submitted successfully. The owner will be notified.'
    })
  } catch (error) {
    console.error('Visit request error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const role = searchParams.get('role') // 'owner' or 'customer'
    const property_id = searchParams.get('property_id')

    let query = supabaseAdmin
      .from('visit_requests')
      .select('*, property:properties(*), customer:profiles!visit_requests_customer_id_fkey(*), owner:profiles!visit_requests_owner_id_fkey(*)')
      .order('created_at', { ascending: false })

    if (role === 'owner') {
      query = query.eq('owner_id', user.id)
    } else {
      query = query.eq('customer_id', user.id)
    }

    if (property_id) {
      query = query.eq('property_id', property_id)
    }

    const { data, error } = await query

    if (error) {
      console.error('Fetch visit requests error:', error)
      return NextResponse.json({ error: 'Failed to fetch visit requests' }, { status: 500 })
    }

    return NextResponse.json({ success: true, visit_requests: data || [] })
  } catch (error) {
    console.error('Get visit requests error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

