import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const user_id = searchParams.get('user_id')

    if (!user_id) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 })
    }

    const { data: chats, error } = await supabase
      .from('chats')
      .select(`
        *,
        property:properties(id, title, images, city),
        customer:profiles!chats_customer_id_fkey(id, full_name, avatar_url),
        owner:profiles!chats_owner_id_fkey(id, full_name, avatar_url)
      `)
      .or(`customer_id.eq.${user_id},owner_id.eq.${user_id}`)
      .order('last_message_at', { ascending: false, nullsFirst: false })

    if (error) {
      console.error('Chats query error:', error)
      return NextResponse.json({ error: 'Failed to fetch chats' }, { status: 500 })
    }

    return NextResponse.json({ chats: chats || [] })
  } catch (error) {
    console.error('Chats API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { property_id, customer_id, owner_id } = await request.json()

    if (!property_id || !customer_id || !owner_id) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const { data: existingChat } = await supabase
      .from('chats')
      .select('*')
      .eq('property_id', property_id)
      .eq('customer_id', customer_id)
      .single()

    if (existingChat) {
      return NextResponse.json({ chat: existingChat })
    }

    const { data: chat, error } = await supabase
      .from('chats')
      .insert({
        property_id,
        customer_id,
        owner_id
      })
      .select()
      .single()

    if (error) {
      console.error('Chat creation error:', error)
      return NextResponse.json({ error: 'Failed to create chat' }, { status: 500 })
    }

    return NextResponse.json({ chat })
  } catch (error) {
    console.error('Chat creation API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
