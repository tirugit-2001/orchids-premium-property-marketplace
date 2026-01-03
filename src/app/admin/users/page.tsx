'use client'

import { useEffect, useState } from 'react'
import { 
  Users, 
  Search,
  MoreVertical,
  Shield,
  User as UserIcon,
  Mail,
  Calendar,
  ShieldAlert,
  CheckCircle2
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { toast } from 'sonner'

export default function AdminUsers() {
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const supabase = createClient()

  useEffect(() => {
    fetchUsers()
  }, [])

  async function fetchUsers() {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      toast.error('Failed to fetch users')
    } else {
      setUsers(data || [])
    }
    setLoading(false)
  }

  async function updateRole(userId: string, newRole: string) {
    const { error } = await supabase
      .from('profiles')
      .update({ role: newRole })
      .eq('id', userId)

    if (error) {
      toast.error('Failed to update role')
    } else {
      toast.success(`Role updated to ${newRole}`)
      setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u))
    }
  }

  async function toggleVerification(userId: string, currentStatus: boolean) {
    const { error } = await supabase
      .from('profiles')
      .update({ 
        is_verified: !currentStatus,
        verification_status: !currentStatus ? 'verified' : null
      })
      .eq('id', userId)

    if (error) {
      toast.error('Failed to update verification')
    } else {
      toast.success(currentStatus ? 'User unverified' : 'User verified')
      setUsers(users.map(u => u.id === userId ? { ...u, is_verified: !currentStatus } : u))
    }
  }

  const filteredUsers = users.filter(u => 
    u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  )

  if (loading) {
    return <div className="animate-pulse space-y-4">
      <div className="h-10 w-full bg-slate-200 rounded"></div>
      {[1, 2, 3, 4, 5].map(i => <div key={i} className="h-20 bg-slate-200 rounded"></div>)}
    </div>
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">User Management</h1>
          <p className="text-slate-500 mt-1">Manage user roles and permissions.</p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input 
            placeholder="Search users..." 
            className="pl-10 bg-white border-slate-200"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 text-slate-600 text-sm border-b border-slate-200">
                <th className="px-6 py-4 font-medium">User</th>
                <th className="px-6 py-4 font-medium">Role</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium">Joined</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                        <UserIcon className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">{user.full_name || 'Anonymous'}</p>
                        <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                          <Mail className="w-3 h-3" />
                          {user.email}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant="outline" className={`capitalize ${
                      user.role === 'admin' ? 'bg-primary/10 text-primary border-primary/20' :
                      user.role === 'owner' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                      'bg-slate-50 text-slate-600 border-slate-200'
                    }`}>
                      {user.role || 'customer'}
                    </Badge>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${user.is_verified ? 'bg-emerald-500' : 'bg-slate-300'}`}></div>
                      <span className="text-sm text-slate-600">{user.is_verified ? 'Verified' : 'Unverified'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-slate-500 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(user.created_at).toLocaleDateString()}
                    </p>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="text-slate-500 hover:text-slate-900">
                          <MoreVertical className="w-5 h-5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-white border-slate-200">
                        <DropdownMenuItem onClick={() => updateRole(user.id, 'admin')} className="focus:bg-slate-100">
                          <Shield className="w-4 h-4 mr-2 text-primary" />
                          Make Admin
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => updateRole(user.id, 'owner')} className="focus:bg-slate-100">
                          <Shield className="w-4 h-4 mr-2 text-amber-600" />
                          Make Owner
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => updateRole(user.id, 'customer')} className="focus:bg-slate-100">
                          <UserIcon className="w-4 h-4 mr-2 text-slate-500" />
                          Make Customer
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => toggleVerification(user.id, user.is_verified)} className="focus:bg-slate-100">
                          <CheckCircle2 className="w-4 h-4 mr-2 text-emerald-600" />
                          {user.is_verified ? 'Remove Verification' : 'Verify User'}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
