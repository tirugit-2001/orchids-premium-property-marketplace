import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    const q = searchParams.get('q')
    const city = searchParams.get('city')
    const property_type = searchParams.get('property_type')
    const listing_type = searchParams.get('listing_type')
    const min_price = searchParams.get('min_price')
    const max_price = searchParams.get('max_price')
    const bedrooms = searchParams.get('bedrooms')
    const furnishing = searchParams.get('furnishing')
    const amenities = searchParams.get('amenities')
    const sort_by = searchParams.get('sort_by') || 'newest'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '12')
    const offset = (page - 1) * limit

    let query = supabase
      .from('properties')
      .select('*, owner:profiles(id, full_name, phone, avatar_url, is_verified)', { count: 'exact' })
      .eq('status', 'approved')
      .eq('is_active', true)

    if (q) {
      query = query.or(`title.ilike.%${q}%,description.ilike.%${q}%,address.ilike.%${q}%,locality.ilike.%${q}%`)
    }

    if (city && city !== 'all') {
      query = query.eq('city', city)
    }

    if (property_type && property_type !== 'all') {
      query = query.eq('property_type', property_type)
    }

    if (listing_type && listing_type !== 'all') {
      query = query.eq('listing_type', listing_type)
    }

    if (min_price) {
      query = query.gte('price', parseFloat(min_price))
    }

    if (max_price) {
      query = query.lte('price', parseFloat(max_price))
    }

    if (bedrooms) {
      const bedroomList = bedrooms.split(',').map(Number)
      if (bedroomList.includes(4)) {
        query = query.or(`bedrooms.in.(${bedroomList.filter(b => b < 4).join(',')}),bedrooms.gte.4`)
      } else {
        query = query.in('bedrooms', bedroomList)
      }
    }

    if (furnishing && furnishing !== 'all') {
      query = query.eq('furnishing', furnishing)
    }

    if (amenities) {
      const amenityList = amenities.split(',')
      query = query.contains('amenities', amenityList)
    }

    switch (sort_by) {
      case 'price_low':
        query = query.order('price', { ascending: true })
        break
      case 'price_high':
        query = query.order('price', { ascending: false })
        break
      case 'popular':
        query = query.order('views_count', { ascending: false })
        break
      default:
        query = query.order('created_at', { ascending: false })
    }

    query = query.range(offset, offset + limit - 1)

    const { data, error, count } = await query

    if (error) {
      console.error('Properties query error:', error)
      return NextResponse.json({ error: 'Failed to fetch properties' }, { status: 500 })
    }

    return NextResponse.json({
      properties: data || [],
      total: count || 0,
      page,
      limit,
      total_pages: Math.ceil((count || 0) / limit)
    })
  } catch (error) {
    console.error('Properties API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { user_id, ...propertyData } = body

    if (!user_id) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 })
    }

    let { data: user, error: userError } = await supabase
      .from('profiles')
      .select('role, email')
      .eq('id', user_id)
      .single()

    if (userError || !user) {
      // Create profile on the fly if it doesn't exist
      // We need the email from auth.users
      const { data: { user: authUser }, error: authError } = await supabase.auth.admin.getUserById(user_id)
      
      if (authError || !authUser) {
        return NextResponse.json({ error: 'User not found in auth' }, { status: 404 })
      }

      const { data: newProfile, error: createError } = await supabase
        .from('profiles')
        .insert({
          id: user_id,
          email: authUser.email,
          role: 'owner',
          full_name: authUser.user_metadata?.full_name || authUser.email?.split('@')[0],
        })
        .select()
        .single()

      if (createError) {
        console.error('Profile creation error:', createError)
        return NextResponse.json({ error: 'Failed to create user profile' }, { status: 500 })
      }
      user = newProfile
    } else if (user.role !== 'owner') {
      await supabase
        .from('profiles')
        .update({ role: 'owner' })
        .eq('id', user_id)
    }

    const { data, error } = await supabase
      .from('properties')
      .insert({
        ...propertyData,
        owner_id: user_id,
        status: 'approved',
        is_active: true
      })
      .select()
      .single()

    if (error) {
      console.error('Property creation error:', error)
      return NextResponse.json({ error: `Failed to create property: ${error.message}` }, { status: 500 })
    }

    return NextResponse.json({ success: true, property: data })
  } catch (error) {
    console.error('Property creation API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
