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
    const { property_id, propertyId } = body
    const propertyIdValue = property_id || propertyId

    if (!propertyIdValue) {
      return NextResponse.json({ error: 'Missing required fields: property_id' }, { status: 400 })
    }

    const user_id = user.id

    const { data: existingReveal } = await supabaseAdmin
      .from('contact_reveals')
      .select('revealed_phone, revealed_email, revealed_whatsapp, owner_id')
      .eq('customer_id', user_id)
      .eq('property_id', propertyIdValue)
      .single()

    if (existingReveal) {
      // Fetch owner name if needed
      const { data: ownerProfile } = await supabaseAdmin
        .from('profiles')
        .select('full_name')
        .eq('id', existingReveal.owner_id)
        .single()

      return NextResponse.json({
        success: true,
        already_revealed: true,
        contact: {
          phone: existingReveal.revealed_phone,
          email: existingReveal.revealed_email,
          whatsapp: existingReveal.revealed_whatsapp,
          name: ownerProfile?.full_name || null
        }
      })
    }

    const { data: subscription, error: subError } = await supabaseAdmin
      .from('subscriptions')
      .select('*')
      .eq('user_id', user_id)
      .eq('is_active', true)
      .gte('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (subError || !subscription) {
      return NextResponse.json({ 
        error: 'No active subscription',
        requires_subscription: true 
      }, { status: 403 })
    }

    if (subscription.contacts_limit !== -1 && subscription.contacts_used >= subscription.contacts_limit) {
      return NextResponse.json({ 
        error: 'Contact limit reached',
        contacts_exhausted: true,
        contacts_used: subscription.contacts_used,
        contacts_limit: subscription.contacts_limit
      }, { status: 403 })
    }

    const { data: property, error: propError } = await supabaseAdmin
      .from('properties')
      .select('owner_id')
      .eq('id', propertyIdValue)
      .single()

    if (propError || !property) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 })
    }

    // Fetch owner profile separately
    const { data: ownerProfile, error: ownerError } = await supabaseAdmin
      .from('profiles')
      .select('phone, email, whatsapp_number, full_name')
      .eq('id', property.owner_id)
      .single()

    if (ownerError || !ownerProfile) {
      return NextResponse.json({ error: 'Owner profile not found' }, { status: 404 })
    }

    const { error: revealError } = await supabaseAdmin
      .from('contact_reveals')
      .insert({
        customer_id: user_id,
        property_id: propertyIdValue,
        owner_id: property.owner_id,
        subscription_id: subscription.id,
        revealed_phone: ownerProfile.phone,
        revealed_email: ownerProfile.email,
        revealed_whatsapp: ownerProfile.whatsapp_number,
        revealed_at: new Date().toISOString()
      })

    if (revealError) {
      console.error('Reveal error:', revealError)
      return NextResponse.json({ error: 'Failed to reveal contact' }, { status: 500 })
    }

    if (subscription.contacts_limit !== -1) {
      await supabaseAdmin
        .from('subscriptions')
        .update({ contacts_used: subscription.contacts_used + 1 })
        .eq('id', subscription.id)
    }

    // Get current contacts_count before updating
    const { data: propertyData } = await supabaseAdmin
      .from('properties')
      .select('contacts_count')
      .eq('id', propertyIdValue)
      .single()

    await supabaseAdmin
      .from('properties')
      .update({ contacts_count: (propertyData?.contacts_count || 0) + 1 })
      .eq('id', propertyIdValue)

    return NextResponse.json({
      success: true,
      contact: {
        phone: ownerProfile.phone,
        email: ownerProfile.email,
        whatsapp: ownerProfile.whatsapp_number,
        name: ownerProfile.full_name
      },
      contacts_remaining: subscription.contacts_limit === -1 
        ? -1 
        : subscription.contacts_limit - subscription.contacts_used - 1
    })
  } catch (error) {
    console.error('Contact reveal error:', error)
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

    if (!property_id) {
      return NextResponse.json({ error: 'Missing required field: property_id' }, { status: 400 })
    }

    const { data: reveal } = await supabaseAdmin
      .from('contact_reveals')
      .select('*')
      .eq('customer_id', user.id)
      .eq('property_id', property_id)
      .single()

    return NextResponse.json({
      is_revealed: !!reveal,
      contact: reveal ? {
        phone: reveal.revealed_phone,
        email: reveal.revealed_email,
        whatsapp: reveal.revealed_whatsapp
      } : null
    })
  } catch (error) {
    console.error('Check reveal error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
