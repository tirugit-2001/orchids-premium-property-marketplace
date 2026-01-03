import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const { property_id, user_id } = await request.json()

    if (!property_id || !user_id) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const { data: existingReveal } = await supabase
      .from('contact_reveals')
      .select('*, property:properties(owner:profiles(phone, email, whatsapp_number, full_name))')
      .eq('customer_id', user_id)
      .eq('property_id', property_id)
      .single()

    if (existingReveal) {
      return NextResponse.json({
        success: true,
        already_revealed: true,
        contact: {
          phone: existingReveal.revealed_phone,
          email: existingReveal.revealed_email,
          whatsapp: existingReveal.revealed_whatsapp,
          name: existingReveal.property?.owner?.full_name
        }
      })
    }

    const { data: subscription, error: subError } = await supabase
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

    const { data: property, error: propError } = await supabase
      .from('properties')
      .select('*, owner:profiles(phone, email, whatsapp_number, full_name)')
      .eq('id', property_id)
      .single()

    if (propError || !property) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 })
    }

    const { error: revealError } = await supabase
      .from('contact_reveals')
      .insert({
        customer_id: user_id,
        property_id,
        owner_id: property.owner_id,
        subscription_id: subscription.id,
        revealed_phone: property.owner?.phone,
        revealed_email: property.owner?.email,
        revealed_whatsapp: property.owner?.whatsapp_number
      })

    if (revealError) {
      console.error('Reveal error:', revealError)
      return NextResponse.json({ error: 'Failed to reveal contact' }, { status: 500 })
    }

    if (subscription.contacts_limit !== -1) {
      await supabase
        .from('subscriptions')
        .update({ contacts_used: subscription.contacts_used + 1 })
        .eq('id', subscription.id)
    }

    await supabase
      .from('properties')
      .update({ contacts_count: (property.contacts_count || 0) + 1 })
      .eq('id', property_id)

    return NextResponse.json({
      success: true,
      contact: {
        phone: property.owner?.phone,
        email: property.owner?.email,
        whatsapp: property.owner?.whatsapp_number,
        name: property.owner?.full_name
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
    const { searchParams } = new URL(request.url)
    const property_id = searchParams.get('property_id')
    const user_id = searchParams.get('user_id')

    if (!property_id || !user_id) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const { data: reveal } = await supabase
      .from('contact_reveals')
      .select('*')
      .eq('customer_id', user_id)
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
