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
    const { plan_type, user_id } = await request.json()

    if (!plan_type || !user_id) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const plan = SUBSCRIPTION_PLANS[plan_type as keyof typeof SUBSCRIPTION_PLANS]
    if (!plan) {
      return NextResponse.json({ error: 'Invalid plan type' }, { status: 400 })
    }

    const { data: user, error: userError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user_id)
      .single()

    if (userError || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const orderId = `order_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`
    const amount = plan.price * 100

    const { data: transaction, error: txError } = await supabase
      .from('transactions')
      .insert({
        user_id,
        razorpay_order_id: orderId,
        amount: plan.price,
        currency: 'INR',
        status: 'pending',
        description: `${plan.name} Subscription`,
        metadata: { plan_type, plan_name: plan.name }
      })
      .select()
      .single()

    if (txError) {
      console.error('Transaction creation error:', txError)
      return NextResponse.json({ error: 'Failed to create transaction' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      order_id: orderId,
      amount,
      currency: 'INR',
      transaction_id: transaction.id,
      key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      prefill: {
        name: user.full_name || '',
        email: user.email,
        contact: user.phone || ''
      },
      notes: {
        plan_type,
        user_id,
        transaction_id: transaction.id
      }
    })
  } catch (error) {
    console.error('Create order error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
