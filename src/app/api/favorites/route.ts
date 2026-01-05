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
    const { property_id } = body

    if (!property_id) {
      return NextResponse.json({ error: 'Missing required field: property_id' }, { status: 400 })
    }

    // Check if favorite already exists
    const { data: existingFavorite } = await supabaseAdmin
      .from('favorites')
      .select('id')
      .eq('user_id', user.id)
      .eq('property_id', property_id)
      .single()

    if (existingFavorite) {
      return NextResponse.json({ 
        success: true, 
        message: 'Property is already in favorites',
        is_favorite: true
      })
    }

    // Add favorite
    const { data: favorite, error: favoriteError } = await supabaseAdmin
      .from('favorites')
      .insert({
        user_id: user.id,
        property_id: property_id,
        created_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (favoriteError) {
      console.error('Add favorite error:', favoriteError)
      return NextResponse.json({ error: 'Failed to add favorite' }, { status: 500 })
    }

    // Update property favorites_count
    const { data: property } = await supabaseAdmin
      .from('properties')
      .select('favorites_count')
      .eq('id', property_id)
      .single()

    if (property) {
      await supabaseAdmin
        .from('properties')
        .update({ favorites_count: (property.favorites_count || 0) + 1 })
        .eq('id', property_id)
    }

    return NextResponse.json({ 
      success: true, 
      favorite,
      message: 'Added to favorites',
      is_favorite: true
    })
  } catch (error) {
    console.error('Add favorite error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const property_id = searchParams.get('property_id')

    if (!property_id) {
      return NextResponse.json({ error: 'Missing required field: property_id' }, { status: 400 })
    }

    // Remove favorite
    const { error: deleteError } = await supabaseAdmin
      .from('favorites')
      .delete()
      .eq('user_id', user.id)
      .eq('property_id', property_id)

    if (deleteError) {
      console.error('Remove favorite error:', deleteError)
      return NextResponse.json({ error: 'Failed to remove favorite' }, { status: 500 })
    }

    // Update property favorites_count
    const { data: property } = await supabaseAdmin
      .from('properties')
      .select('favorites_count')
      .eq('id', property_id)
      .single()

    if (property && property.favorites_count > 0) {
      await supabaseAdmin
        .from('properties')
        .update({ favorites_count: property.favorites_count - 1 })
        .eq('id', property_id)
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Removed from favorites',
      is_favorite: false
    })
  } catch (error) {
    console.error('Remove favorite error:', error)
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
    const property_id = searchParams.get('property_id')

    if (property_id) {
      // Check if specific property is favorited
      const { data: favorite } = await supabaseAdmin
        .from('favorites')
        .select('id')
        .eq('user_id', user.id)
        .eq('property_id', property_id)
        .single()

      return NextResponse.json({
        is_favorite: !!favorite
      })
    }

    // Get all favorites
    const { data: favorites, error } = await supabaseAdmin
      .from('favorites')
      .select('*, property:properties(*)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Get favorites error:', error)
      return NextResponse.json({ error: 'Failed to fetch favorites' }, { status: 500 })
    }

    return NextResponse.json({ success: true, favorites: favorites || [] })
  } catch (error) {
    console.error('Get favorites error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

