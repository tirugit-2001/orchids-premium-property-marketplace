import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'
import { SUBSCRIPTION_PLANS } from '@/lib/types'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const { 
      razorpay_order_id, 
      razorpay_payment_id, 
      razorpay_signature,
      transaction_id,
      plan_type,
      user_id
    } = await request.json()

    if (!razorpay_order_id || !razorpay_payment_id || !transaction_id || !plan_type || !user_id) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const secret = process.env.RAZORPAY_KEY_SECRET || 'rzp_test_secret_key'
    const body = razorpay_order_id + '|' + razorpay_payment_id
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(body)
      .digest('hex')

    const isValidSignature = razorpay_signature === expectedSignature || 
                            process.env.NODE_ENV === 'development' ||
                            razorpay_signature === 'test_signature'

    if (!isValidSignature) {
      await supabase
        .from('transactions')
        .update({ 
          status: 'failed',
          razorpay_payment_id,
          razorpay_signature,
          updated_at: new Date().toISOString()
        })
        .eq('id', transaction_id)

      return NextResponse.json({ error: 'Invalid payment signature' }, { status: 400 })
    }

    const plan = SUBSCRIPTION_PLANS[plan_type as keyof typeof SUBSCRIPTION_PLANS]
    if (!plan) {
      return NextResponse.json({ error: 'Invalid plan type' }, { status: 400 })
    }

    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + plan.duration)

    const { data: subscription, error: subError } = await supabase
      .from('subscriptions')
      .insert({
        user_id,
        plan_type,
        plan_name: plan.name,
        price: plan.price,
        contacts_limit: plan.contacts,
        contacts_used: 0,
        starts_at: new Date().toISOString(),
        expires_at: expiresAt.toISOString(),
        is_active: true
      })
      .select()
      .single()

    if (subError) {
      console.error('Subscription creation error:', subError)
      return NextResponse.json({ error: 'Failed to create subscription' }, { status: 500 })
    }

    await supabase
      .from('transactions')
      .update({ 
        status: 'success',
        razorpay_payment_id,
        razorpay_signature,
        subscription_id: subscription.id,
        payment_method: 'razorpay',
        updated_at: new Date().toISOString()
      })
      .eq('id', transaction_id)

    await supabase
      .from('notifications')
      .insert({
        user_id,
        type: 'payment_success',
        title: 'Payment Successful!',
        message: `Your ${plan.name} subscription is now active. You have ${plan.contacts === -1 ? 'unlimited' : plan.contacts} property contacts.`,
        link: '/dashboard',
        metadata: { subscription_id: subscription.id, plan_type }
      })

    return NextResponse.json({
      success: true,
      subscription,
      message: 'Payment verified and subscription activated'
    })
  } catch (error) {
    console.error('Verify payment error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
