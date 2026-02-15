'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Profile, Subscription, Property, Notification } from '@/lib/types'

interface AuthState {
  user: Profile | null
  subscription: Subscription | null
  isLoading: boolean
  setUser: (user: Profile | null) => void
  setSubscription: (subscription: Subscription | null) => void
  setLoading: (loading: boolean) => void
  logout: () => void
  hasActiveSubscription: () => boolean
  canRevealContact: () => boolean
  getRemainingContacts: () => number
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      subscription: null,
      isLoading: true,
      setUser: (user) => set({ user }),
      setSubscription: (subscription) => set({ subscription }),
      setLoading: (isLoading) => set({ isLoading }),
      logout: () => set({ user: null, subscription: null }),
      hasActiveSubscription: () => {
        const { subscription } = get()
        if (!subscription) return false
        return subscription.is_active && new Date(subscription.expires_at) > new Date()
      },
      canRevealContact: () => {
        const { subscription } = get()
        if (!subscription) return false
        if (!subscription.is_active) return false
        if (new Date(subscription.expires_at) <= new Date()) return false
        if (subscription.contacts_limit === -1) return true
        return subscription.contacts_used < subscription.contacts_limit
      },
      getRemainingContacts: () => {
        const { subscription } = get()
        if (!subscription) return 0
        if (subscription.contacts_limit === -1) return -1
        return Math.max(0, subscription.contacts_limit - subscription.contacts_used)
      }
    }),
    {
      name: 'solvestay-auth',
      partialize: (state) => ({ user: state.user, subscription: state.subscription }),
    }
  )
)

interface ComparisonState {
  properties: Property[]
  addProperty: (property: Property) => boolean
  removeProperty: (id: string) => void
  clearAll: () => void
  isInComparison: (id: string) => boolean
}

export const useComparisonStore = create<ComparisonState>()(
  persist(
    (set, get) => ({
      properties: [],
      addProperty: (property) => {
        const { properties } = get()
        if (properties.length >= 4) return false
        if (properties.find(p => p.id === property.id)) return false
        set({ properties: [...properties, property] })
        return true
      },
      removeProperty: (id) => {
        set({ properties: get().properties.filter(p => p.id !== id) })
      },
      clearAll: () => set({ properties: [] }),
      isInComparison: (id) => get().properties.some(p => p.id === id)
    }),
    {
      name: 'solvestay-comparison',
    }
  )
)

interface NotificationState {
  notifications: Notification[]
  unreadCount: number
  setNotifications: (notifications: Notification[]) => void
  addNotification: (notification: Notification) => void
  markAsRead: (id: string) => void
  markAllAsRead: () => void
  clearAll: () => void
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  setNotifications: (notifications) => set({ 
    notifications, 
    unreadCount: notifications.filter(n => !n.is_read).length 
  }),
  addNotification: (notification) => {
    const { notifications } = get()
    set({ 
      notifications: [notification, ...notifications],
      unreadCount: get().unreadCount + (notification.is_read ? 0 : 1)
    })
  },
  markAsRead: (id) => {
    const { notifications } = get()
    const updated = notifications.map(n => 
      n.id === id ? { ...n, is_read: true, read_at: new Date().toISOString() } : n
    )
    set({ 
      notifications: updated,
      unreadCount: updated.filter(n => !n.is_read).length
    })
  },
  markAllAsRead: () => {
    const { notifications } = get()
    set({ 
      notifications: notifications.map(n => ({ ...n, is_read: true, read_at: new Date().toISOString() })),
      unreadCount: 0
    })
  },
  clearAll: () => set({ notifications: [], unreadCount: 0 })
}))
