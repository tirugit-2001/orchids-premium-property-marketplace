'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { 
  Users, 
  Building2, 
  CheckCircle2, 
  TrendingUp,
  Activity,
  ArrowUpRight,
  Clock
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalProperties: 0,
    pendingVerifications: 0,
    activeListings: 0
  })
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function fetchStats() {
      const [
        { count: usersCount },
        { count: propertiesCount },
        { count: pendingCount },
        { count: activeCount }
      ] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('properties').select('*', { count: 'exact', head: true }),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('verification_status', 'pending'),
        supabase.from('properties').select('*', { count: 'exact', head: true }).eq('is_active', true)
      ])

      setStats({
        totalUsers: usersCount || 0,
        totalProperties: propertiesCount || 0,
        pendingVerifications: pendingCount || 0,
        activeListings: activeCount || 0
      })
      setLoading(false)
    }

    fetchStats()
  }, [supabase])

  const statCards = [
    { name: 'Total Users', value: stats.totalUsers, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
    { name: 'Properties', value: stats.totalProperties, icon: Building2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { name: 'Pending Verifications', value: stats.pendingVerifications, icon: CheckCircle2, color: 'text-amber-600', bg: 'bg-amber-50' },
    { name: 'Active Listings', value: stats.activeListings, icon: Activity, color: 'text-purple-600', bg: 'bg-purple-50' },
  ]

  if (loading) {
    return <div className="animate-pulse space-y-8">
      <div className="h-8 w-48 bg-slate-200 rounded"></div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => <div key={i} className="h-32 bg-slate-200 rounded-xl"></div>)}
      </div>
    </div>
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Dashboard Overview</h1>
        <p className="text-slate-500 mt-1">Welcome back, Admin.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => (
          <Card key={stat.name} className="bg-white border-slate-200 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className={`p-3 rounded-lg ${stat.bg}`}>
                  <stat.icon className={`w-6 h-6 ${stat.color}`} />
                </div>
                <TrendingUp className="w-4 h-4 text-emerald-500" />
              </div>
              <div className="mt-4">
                <p className="text-sm text-slate-500">{stat.name}</p>
                <h3 className="text-2xl font-bold mt-1 text-slate-900">{stat.value}</h3>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="bg-white border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2 text-slate-900">
              <Clock className="w-5 h-5 text-primary" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <Link href="/admin/verify" className="p-4 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors text-left group border border-slate-200">
              <p className="text-sm font-medium text-slate-900">Review Owners</p>
              <p className="text-xs text-slate-500 mt-1">Check pending verifications</p>
            </Link>
            <Link href="/admin/properties" className="p-4 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors text-left group border border-slate-200">
              <p className="text-sm font-medium text-slate-900">Moderate Listings</p>
              <p className="text-xs text-slate-500 mt-1">Approve new properties</p>
            </Link>
            <Link href="/admin/users" className="p-4 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors text-left group border border-slate-200">
              <p className="text-sm font-medium text-slate-900">Manage Users</p>
              <p className="text-xs text-slate-500 mt-1">View and edit user roles</p>
            </Link>
            <Link href="/" className="p-4 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors text-left group border border-slate-200">
              <p className="text-sm font-medium text-slate-900">View Site</p>
              <p className="text-xs text-slate-500 mt-1">See the public website</p>
            </Link>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2 text-slate-900">
              <Activity className="w-5 h-5 text-primary" />
              Platform Stats
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between py-3 border-b border-slate-100">
                <span className="text-slate-600">Total Users</span>
                <span className="font-bold text-slate-900">{stats.totalUsers}</span>
              </div>
              <div className="flex items-center justify-between py-3 border-b border-slate-100">
                <span className="text-slate-600">Total Properties</span>
                <span className="font-bold text-slate-900">{stats.totalProperties}</span>
              </div>
              <div className="flex items-center justify-between py-3 border-b border-slate-100">
                <span className="text-slate-600">Active Listings</span>
                <span className="font-bold text-slate-900">{stats.activeListings}</span>
              </div>
              <div className="flex items-center justify-between py-3">
                <span className="text-slate-600">Pending Verifications</span>
                <span className="font-bold text-amber-600">{stats.pendingVerifications}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
