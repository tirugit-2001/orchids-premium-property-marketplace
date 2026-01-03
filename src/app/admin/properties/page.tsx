'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { 
  Building2, 
  Search,
  CheckCircle2,
  XCircle,
  MapPin,
  IndianRupee,
  Eye
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'

export default function AdminProperties() {
  const [properties, setProperties] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedProperty, setSelectedProperty] = useState<any>(null)
  const [isRejectOpen, setIsRejectOpen] = useState(false)
  const [rejectionReason, setRejectionReason] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    fetchProperties()
  }, [])

  async function fetchProperties() {
    const { data, error } = await supabase
      .from('properties')
      .select(`
        *,
        owner:profiles!properties_owner_id_fkey (full_name, email, is_verified)
      `)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error:', error)
      toast.error('Failed to fetch properties')
    } else {
      setProperties(data || [])
    }
    setLoading(false)
  }

  async function handleApprove(propertyId: string) {
    setIsSubmitting(true)
    const { error } = await supabase
      .from('properties')
      .update({ 
        status: 'approved',
        is_verified: true,
        is_active: true
      })
      .eq('id', propertyId)

    if (error) {
      toast.error('Failed to approve property')
    } else {
      toast.success('Property approved successfully')
      fetchProperties()
    }
    setIsSubmitting(false)
  }

  async function handleReject() {
    if (!selectedProperty || !rejectionReason) return
    
    setIsSubmitting(true)
    const { error } = await supabase
      .from('properties')
      .update({ 
        status: 'rejected',
        rejection_reason: rejectionReason,
        is_active: false
      })
      .eq('id', selectedProperty.id)

    if (error) {
      toast.error('Failed to reject property')
    } else {
      toast.success('Property rejected')
      setIsRejectOpen(false)
      setRejectionReason('')
      setSelectedProperty(null)
      fetchProperties()
    }
    setIsSubmitting(false)
  }

  const filteredProperties = properties.filter(p => 
    p.title?.toLowerCase().includes(search.toLowerCase()) ||
    p.city?.toLowerCase().includes(search.toLowerCase())
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
          <h1 className="text-3xl font-bold text-slate-900">Property Moderation</h1>
          <p className="text-slate-500 mt-1">Manage and review all property listings.</p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input 
            placeholder="Search properties..." 
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
                <th className="px-6 py-4 font-medium">Property</th>
                <th className="px-6 py-4 font-medium">Owner</th>
                <th className="px-6 py-4 font-medium">Price</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredProperties.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                    No properties found
                  </td>
                </tr>
              ) : (
                filteredProperties.map((property) => (
                  <tr key={property.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-16 h-12 rounded-lg bg-slate-100 overflow-hidden relative shrink-0">
                          {property.images?.[0] ? (
                            <Image src={property.images[0]} alt={property.title} fill className="object-cover" />
                          ) : (
                            <div className="flex items-center justify-center h-full">
                              <Building2 className="w-5 h-5 text-slate-300" />
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-slate-900">{property.title}</p>
                          <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                            <MapPin className="w-3 h-3" />
                            {property.city}, {property.state}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm">
                        <p className="font-medium text-slate-900">{property.owner?.full_name || 'Unknown'}</p>
                        <p className="text-slate-500 text-xs">{property.owner?.email}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium flex items-center gap-1 text-slate-900">
                        <IndianRupee className="w-3 h-3" />
                        {property.price?.toLocaleString()}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant="outline" className={`capitalize ${
                        property.status === 'approved' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                        property.status === 'pending' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                        'bg-red-50 text-red-700 border-red-200'
                      }`}>
                        {property.status || 'pending'}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        {property.status !== 'approved' && (
                          <>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              onClick={() => {
                                setSelectedProperty(property)
                                setIsRejectOpen(true)
                              }}
                            >
                              <XCircle className="w-4 h-4 mr-1" />
                              Reject
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                              onClick={() => handleApprove(property.id)}
                              disabled={isSubmitting}
                            >
                              <CheckCircle2 className="w-4 h-4 mr-1" />
                              Approve
                            </Button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={isRejectOpen} onOpenChange={setIsRejectOpen}>
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle>Reject Property</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this property listing.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="reason">Rejection Reason</Label>
            <Textarea 
              id="reason"
              className="mt-2"
              placeholder="e.g., Incomplete information, inappropriate content..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRejectOpen(false)}>Cancel</Button>
            <Button 
              variant="destructive" 
              onClick={handleReject}
              disabled={!rejectionReason || isSubmitting}
            >
              Reject Property
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
