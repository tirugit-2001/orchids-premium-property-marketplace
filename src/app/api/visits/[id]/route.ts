import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase/server'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { status, owner_message, confirmed_date, confirmed_time } = body

    if (!status) {
      return NextResponse.json({ error: 'Status is required' }, { status: 400 })
    }

    // Get visit request to verify ownership
    const { data: visitRequest, error: fetchError } = await supabaseAdmin
      .from('visit_requests')
      .select('owner_id, customer_id, property_id')
      .eq('id', id)
      .single()

    if (fetchError || !visitRequest) {
      return NextResponse.json({ error: 'Visit request not found' }, { status: 404 })
    }

    // Verify user is the owner
    if (visitRequest.owner_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized. Only the property owner can update visit requests.' }, { status: 403 })
    }

    const updateData: any = {
      status,
      updated_at: new Date().toISOString(),
    }

    if (owner_message !== undefined) {
      updateData.owner_message = owner_message
    }

    if (confirmed_date) {
      updateData.confirmed_date = confirmed_date
    }

    if (confirmed_time) {
      updateData.confirmed_time = confirmed_time
    }

    // Update visit request
    const { data, error } = await supabaseAdmin
      .from('visit_requests')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Update visit request error:', error)
      return NextResponse.json({ 
        error: `Failed to update visit request: ${error.message}` 
      }, { status: 500 })
    }

    // Get property details for notification
    const { data: property } = await supabaseAdmin
      .from('properties')
      .select('title')
      .eq('id', visitRequest.property_id)
      .single()

    // Create notification for customer
    try {
      await supabaseAdmin
        .from('notifications')
        .insert({
          user_id: visitRequest.customer_id,
          type: 'visit_update',
          title: status === 'confirmed' ? 'Visit Confirmed' : 'Visit Rejected',
          message: status === 'confirmed'
            ? `Your visit request for "${property?.title || 'property'}" has been confirmed.${confirmed_date ? ` Scheduled for ${new Date(confirmed_date).toLocaleDateString()}` : ''}`
            : `Your visit request for "${property?.title || 'property'}" has been rejected.${owner_message ? ` Reason: ${owner_message}` : ''}`,
          link: '/dashboard/visits',
          is_read: false,
          metadata: {
            visit_request_id: id,
            property_id: visitRequest.property_id,
            status,
          }
        })
    } catch (notifError) {
      console.error('Notification creation error (non-critical):', notifError)
      // Continue even if notification creation fails
    }

    return NextResponse.json({ 
      success: true, 
      visit_request: data,
      message: `Visit request ${status} successfully`
    })
  } catch (error) {
    console.error('Update visit request error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

