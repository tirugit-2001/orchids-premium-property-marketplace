'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Navbar } from '@/components/Navbar'
import { useAuthStore } from '@/lib/store'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import type { Property, Subscription } from '@/lib/types'
import {
  Building2,
  Eye,
  MessageSquare,
  Heart,
  Plus,
  TrendingUp,
  Users,
  IndianRupee,
  Calendar,
  ArrowUpRight,
  Loader2,
  Home,
  Clock,
  BadgeCheck,
} from 'lucide-react'

export default function DashboardPage() {
  const router = useRouter()
  const { user, subscription, setUser, setLoading } = useAuthStore()
  const [properties, setProperties] = useState<Property[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [stats, setStats] = useState({
    totalViews: 0,
    totalContacts: 0,
    activeListings: 0,
    pendingListings: 0,
  })

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    const supabase = createClient()
    const { data: { user: authUser } } = await supabase.auth.getUser()

    if (!authUser) {
      router.push('/auth/login')
      return
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authUser.id)
      .single()

    if (profile) {
      setUser(profile)
      
      if (profile.role === 'owner') {
        fetchOwnerData(profile.id)
      } else {
        fetchCustomerData(profile.id)
      }
    } else {
      router.push('/auth/login')
    }
  }

  const fetchOwnerData = async (ownerId: string) => {
    const supabase = createClient()
    
    const { data: propertiesData } = await supabase
      .from('properties')
      .select('*')
      .eq('owner_id', ownerId)
      .order('created_at', { ascending: false })

    if (propertiesData) {
      setProperties(propertiesData)
      const totalViews = propertiesData.reduce((acc, p) => acc + (p.views_count || 0), 0)
      const totalContacts = propertiesData.reduce((acc, p) => acc + (p.contacts_count || 0), 0)
      const activeListings = propertiesData.filter(p => p.status === 'approved').length
      const pendingListings = propertiesData.filter(p => p.status === 'pending').length
      
      setStats({ totalViews, totalContacts, activeListings, pendingListings })
    }
    
    setIsLoading(false)
  }

  const fetchCustomerData = async (customerId: string) => {
    const supabase = createClient()
    
    const { data: favoritesData } = await supabase
      .from('favorites')
      .select('*, property:properties(*)')
      .eq('user_id', customerId)

    if (favoritesData) {
      setStats(prev => ({ ...prev, activeListings: favoritesData.length }))
    }
    
    setIsLoading(false)
  }

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  const isOwner = user.role === 'owner'

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="pt-20">
        <div className="bg-gradient-to-br from-primary/5 to-accent/5 border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold mb-2">
                  Welcome back, {user.full_name?.split(' ')[0] || 'User'}!
                </h1>
                <p className="text-muted-foreground">
                  {isOwner
                    ? 'Manage your properties and track performance'
                    : 'Find your dream home and track your favorites'}
                </p>
              </div>
              {isOwner && (
                <Button asChild>
                  <Link href="/dashboard/properties/new">
                    <Plus className="w-4 h-4 mr-2" />
                    Add New Property
                  </Link>
                </Button>
              )}
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {isOwner ? (
            <>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        Total Views
                      </CardTitle>
                      <Eye className="w-5 h-5 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold">{stats.totalViews.toLocaleString()}</div>
                      <p className="text-sm text-muted-foreground mt-1">
                        <span className="text-green-600">+12%</span> from last month
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        Contact Requests
                      </CardTitle>
                      <MessageSquare className="w-5 h-5 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold">{stats.totalContacts}</div>
                      <p className="text-sm text-muted-foreground mt-1">
                        <span className="text-green-600">+8%</span> from last month
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        Active Listings
                      </CardTitle>
                      <Building2 className="w-5 h-5 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold">{stats.activeListings}</div>
                      <p className="text-sm text-muted-foreground mt-1">
                        Properties live on platform
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        Pending Approval
                      </CardTitle>
                      <Clock className="w-5 h-5 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold">{stats.pendingListings}</div>
                      <p className="text-sm text-muted-foreground mt-1">
                        Under review
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              </div>

              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>My Properties</CardTitle>
                      <CardDescription>Manage and track your property listings</CardDescription>
                    </div>
                    <Button asChild variant="outline" size="sm">
                      <Link href="/dashboard/properties">View All</Link>
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {properties.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                        <Home className="w-8 h-8 text-muted-foreground" />
                      </div>
                      <h3 className="font-semibold mb-2">No properties yet</h3>
                      <p className="text-muted-foreground mb-4">
                        Start by adding your first property listing
                      </p>
                      <Button asChild>
                        <Link href="/dashboard/properties/new">
                          <Plus className="w-4 h-4 mr-2" />
                          Add Property
                        </Link>
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {properties.slice(0, 5).map((property) => (
                        <div
                          key={property.id}
                          className="flex items-center justify-between p-4 rounded-xl border hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center">
                              <Building2 className="w-6 h-6 text-muted-foreground" />
                            </div>
                            <div>
                              <h4 className="font-medium line-clamp-1">{property.title}</h4>
                              <p className="text-sm text-muted-foreground">
                                {property.city} • ₹{property.price.toLocaleString()}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <Badge
                              variant={
                                property.status === 'approved'
                                  ? 'default'
                                  : property.status === 'pending'
                                  ? 'secondary'
                                  : 'destructive'
                              }
                            >
                              {property.status}
                            </Badge>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Eye className="w-4 h-4" />
                              {property.views_count}
                            </div>
                            <Button asChild variant="ghost" size="sm">
                              <Link href={`/properties/${property.id}`}>
                                <ArrowUpRight className="w-4 h-4" />
                              </Link>
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          ) : (
            <>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <Card className={subscription ? 'border-primary' : ''}>
                    <CardHeader>
                      <CardTitle className="text-lg">Subscription Status</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {subscription ? (
                        <div>
                          <Badge className="mb-3 capitalize">{subscription.plan_type} Pass</Badge>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Contacts Used</span>
                              <span className="font-medium">
                                {subscription.contacts_used} / {subscription.contacts_limit === -1 ? '∞' : subscription.contacts_limit}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Expires</span>
                              <span className="font-medium">
                                {new Date(subscription.expires_at).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center">
                          <p className="text-muted-foreground mb-4">No active subscription</p>
                          <Button asChild>
                            <Link href="/pricing">Get Started</Link>
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        Saved Properties
                      </CardTitle>
                      <Heart className="w-5 h-5 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold">{stats.activeListings}</div>
                      <Button asChild variant="link" className="px-0 mt-2">
                        <Link href="/dashboard/favorites">View all favorites</Link>
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        Quick Actions
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <Button asChild variant="outline" className="w-full justify-start">
                        <Link href="/properties">
                          <Building2 className="w-4 h-4 mr-2" />
                          Browse Properties
                        </Link>
                      </Button>
                      <Button asChild variant="outline" className="w-full justify-start">
                        <Link href="/dashboard/messages">
                          <MessageSquare className="w-4 h-4 mr-2" />
                          Messages
                        </Link>
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Recommended for You</CardTitle>
                  <CardDescription>Properties matching your search history</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                      <TrendingUp className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <h3 className="font-semibold mb-2">Start exploring</h3>
                    <p className="text-muted-foreground mb-4">
                      Browse properties to get personalized recommendations
                    </p>
                    <Button asChild>
                      <Link href="/properties">Browse Properties</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
