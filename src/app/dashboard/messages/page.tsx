'use client'

import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { Navbar } from '@/components/Navbar'
import { useAuthStore } from '@/lib/store'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import type { Chat, Message } from '@/lib/types'
import { formatDistanceToNow } from 'date-fns'
import {
  Send,
  ArrowLeft,
  MessageSquare,
  Home,
  Loader2,
  Search,
  MoreVertical,
  Phone,
  Image as ImageIcon,
} from 'lucide-react'

export default function MessagesPage() {
  const { user } = useAuthStore()
  const [chats, setChats] = useState<Chat[]>([])
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSending, setIsSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (user) {
      fetchChats()
    }
  }, [user])

  useEffect(() => {
    if (selectedChat) {
      fetchMessages(selectedChat.id)
      subscribeToMessages(selectedChat.id)
    }
  }, [selectedChat])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const fetchChats = async () => {
    setIsLoading(true)
    try {
      const res = await fetch(`/api/chats?user_id=${user?.id}`)
      const data = await res.json()
      if (data.chats) {
        setChats(data.chats)
      }
    } catch (error) {
      console.error('Error fetching chats:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchMessages = async (chatId: string) => {
    try {
      const res = await fetch(`/api/messages?chat_id=${chatId}&user_id=${user?.id}`)
      const data = await res.json()
      if (data.messages) {
        setMessages(data.messages)
      }
    } catch (error) {
      console.error('Error fetching messages:', error)
    }
  }

  const subscribeToMessages = (chatId: string) => {
    const supabase = createClient()
    
    const channel = supabase
      .channel(`chat-${chatId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `chat_id=eq.${chatId}`
        },
        (payload) => {
          const newMsg = payload.new as Message
          setMessages((prev) => [...prev, newMsg])
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedChat || !user || isSending) return

    setIsSending(true)
    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: selectedChat.id,
          sender_id: user.id,
          content: newMessage.trim()
        })
      })

      if (res.ok) {
        setNewMessage('')
      }
    } catch (error) {
      console.error('Error sending message:', error)
    } finally {
      setIsSending(false)
    }
  }

  const getOtherUser = (chat: Chat) => {
    return user?.id === chat.customer_id ? chat.owner : chat.customer
  }

  const getUnreadCount = (chat: Chat) => {
    return user?.id === chat.customer_id ? chat.customer_unread : chat.owner_unread
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="pt-20 h-screen flex flex-col">
        <div className="flex-1 flex overflow-hidden">
          <div className={`w-full md:w-80 lg:w-96 border-r flex flex-col ${selectedChat ? 'hidden md:flex' : 'flex'}`}>
            <div className="p-4 border-b">
              <h1 className="text-xl font-bold mb-4">Messages</h1>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input placeholder="Search conversations..." className="pl-10" />
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto">
              {chats.length === 0 ? (
                <div className="p-8 text-center">
                  <MessageSquare className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="font-semibold mb-2">No conversations yet</h3>
                  <p className="text-sm text-muted-foreground">
                    Start a conversation by contacting a property owner
                  </p>
                </div>
              ) : (
                chats.map((chat) => {
                  const otherUser = getOtherUser(chat)
                  const unread = getUnreadCount(chat)
                  
                  return (
                    <button
                      key={chat.id}
                      onClick={() => setSelectedChat(chat)}
                      className={`w-full p-4 flex items-start gap-3 hover:bg-muted/50 transition-colors border-b ${
                        selectedChat?.id === chat.id ? 'bg-muted/50' : ''
                      }`}
                    >
                      <Avatar className="h-12 w-12 flex-shrink-0">
                        <AvatarImage src={otherUser?.avatar_url || ''} />
                        <AvatarFallback>{otherUser?.full_name?.charAt(0) || '?'}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0 text-left">
                        <div className="flex items-center justify-between">
                          <span className="font-medium truncate">{otherUser?.full_name || 'Unknown'}</span>
                          {chat.last_message_at && (
                            <span className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(chat.last_message_at), { addSuffix: true })}
                            </span>
                          )}
                        </div>
                        {chat.property && (
                          <p className="text-xs text-primary truncate flex items-center gap-1">
                            <Home className="w-3 h-3" />
                            {chat.property.title}
                          </p>
                        )}
                        {chat.last_message && (
                          <p className="text-sm text-muted-foreground truncate mt-1">
                            {chat.last_message}
                          </p>
                        )}
                      </div>
                      {unread > 0 && (
                        <Badge className="bg-primary text-primary-foreground">{unread}</Badge>
                      )}
                    </button>
                  )
                })
              )}
            </div>
          </div>

          <div className={`flex-1 flex flex-col ${selectedChat ? 'flex' : 'hidden md:flex'}`}>
            {selectedChat ? (
              <>
                <div className="p-4 border-b flex items-center gap-4">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="md:hidden"
                    onClick={() => setSelectedChat(null)}
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </Button>
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={getOtherUser(selectedChat)?.avatar_url || ''} />
                    <AvatarFallback>
                      {getOtherUser(selectedChat)?.full_name?.charAt(0) || '?'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h2 className="font-semibold">{getOtherUser(selectedChat)?.full_name}</h2>
                    {selectedChat.property && (
                      <p className="text-sm text-muted-foreground truncate">
                        {selectedChat.property.title}
                      </p>
                    )}
                  </div>
                  <Button variant="ghost" size="icon">
                    <Phone className="w-5 h-5" />
                  </Button>
                  <Button variant="ghost" size="icon">
                    <MoreVertical className="w-5 h-5" />
                  </Button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {messages.map((message) => {
                    const isOwn = message.sender_id === user?.id
                    
                    return (
                      <motion.div
                        key={message.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                            isOwn
                              ? 'bg-primary text-primary-foreground rounded-br-md'
                              : 'bg-muted rounded-bl-md'
                          }`}
                        >
                          <p>{message.content}</p>
                          <p className={`text-xs mt-1 ${isOwn ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                            {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
                          </p>
                        </div>
                      </motion.div>
                    )
                  })}
                  <div ref={messagesEndRef} />
                </div>

                <div className="p-4 border-t">
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon">
                      <ImageIcon className="w-5 h-5" />
                    </Button>
                    <Input
                      placeholder="Type a message..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                      className="flex-1"
                    />
                    <Button onClick={sendMessage} disabled={!newMessage.trim() || isSending}>
                      {isSending ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <Send className="w-5 h-5" />
                      )}
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <MessageSquare className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                  <h2 className="text-xl font-semibold mb-2">Select a conversation</h2>
                  <p className="text-muted-foreground">
                    Choose a chat from the sidebar to start messaging
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
