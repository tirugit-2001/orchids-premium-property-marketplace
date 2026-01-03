import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const chat_id = searchParams.get('chat_id')
    const user_id = searchParams.get('user_id')

    if (!chat_id) {
      return NextResponse.json({ error: 'Chat ID required' }, { status: 400 })
    }

    const { data: messages, error } = await supabase
      .from('messages')
      .select(`
        *,
        sender:profiles(id, full_name, avatar_url)
      `)
      .eq('chat_id', chat_id)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Messages query error:', error)
      return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 })
    }

    if (user_id) {
      const { data: chat } = await supabase
        .from('chats')
        .select('customer_id, owner_id')
        .eq('id', chat_id)
        .single()

      if (chat) {
        const isCustomer = chat.customer_id === user_id
        const updateField = isCustomer ? 'customer_unread' : 'owner_unread'
        
        await supabase
          .from('chats')
          .update({ [updateField]: 0 })
          .eq('id', chat_id)

        await supabase
          .from('messages')
          .update({ is_read: true, read_at: new Date().toISOString() })
          .eq('chat_id', chat_id)
          .neq('sender_id', user_id)
          .eq('is_read', false)
      }
    }

    return NextResponse.json({ messages: messages || [] })
  } catch (error) {
    console.error('Messages API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { chat_id, sender_id, content, message_type = 'text', image_url } = await request.json()

    if (!chat_id || !sender_id || !content) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const { data: message, error } = await supabase
      .from('messages')
      .insert({
        chat_id,
        sender_id,
        content,
        message_type,
        image_url
      })
      .select(`
        *,
        sender:profiles(id, full_name, avatar_url)
      `)
      .single()

    if (error) {
      console.error('Message creation error:', error)
      return NextResponse.json({ error: 'Failed to send message' }, { status: 500 })
    }

    const { data: chat } = await supabase
      .from('chats')
      .select('customer_id, owner_id, customer_unread, owner_unread')
      .eq('id', chat_id)
      .single()

    if (chat) {
      const isCustomer = chat.customer_id === sender_id
      const updateField = isCustomer ? 'owner_unread' : 'customer_unread'
      const currentUnread = isCustomer ? chat.owner_unread : chat.customer_unread

      await supabase
        .from('chats')
        .update({
          last_message: content,
          last_message_at: new Date().toISOString(),
          last_message_by: sender_id,
          [updateField]: (currentUnread || 0) + 1
        })
        .eq('id', chat_id)

      const recipientId = isCustomer ? chat.owner_id : chat.customer_id
      
      const { data: senderProfile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', sender_id)
        .single()

      await supabase
        .from('notifications')
        .insert({
          user_id: recipientId,
          type: 'message',
          title: 'New Message',
          message: `${senderProfile?.full_name || 'Someone'}: ${content.substring(0, 50)}${content.length > 50 ? '...' : ''}`,
          link: `/dashboard/messages?chat=${chat_id}`,
          metadata: { chat_id, sender_id }
        })
    }

    return NextResponse.json({ message })
  } catch (error) {
    console.error('Message creation API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
