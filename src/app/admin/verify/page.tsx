'use client'

import { useEffect, useState } from 'react'
import { 
  CheckCircle2, 
  XCircle, 
  User, 
  FileText,
  Clock,
  ShieldCheck
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
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

export default function AdminVerify() {
  const [verifications, setVerifications] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedUser, setSelectedUser] = useState<any>(null)
  const [isRejectOpen, setIsRejectOpen] = useState(false)
  const [rejectionReason, setRejectionReason] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    fetchVerifications()
  }, [])

  async function fetchVerifications() {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('verification_status', 'pending')
      .order('created_at', { ascending: false })

    if (error) {
      toast.error('Failed to fetch pending verifications')
    } else {
      setVerifications(data || [])
    }
    setLoading(false)
  }

  async function handleVerify(userId: string) {
    setIsSubmitting(true)
    const { error } = await supabase
      .from('profiles')
      .update({ 
        verification_status: 'verified',
        is_verified: true
      })
      .eq('id', userId)

    if (error) {
      toast.error('Failed to verify user')
    } else {
      toast.success('User verified successfully')
      setVerifications(verifications.filter(v => v.id !== userId))
    }
    setIsSubmitting(false)
  }

  async function handleReject() {
    if (!selectedUser) return

    setIsSubmitting(true)
    const { error } = await supabase
      .from('profiles')
      .update({ 
        verification_status: 'rejected',
        is_verified: false
      })
      .eq('id', selectedUser.id)

    if (error) {
      toast.error('Failed to reject verification')
    } else {
      toast.success('Verification rejected')
      setVerifications(verifications.filter(v => v.id !== selectedUser.id))
      setIsRejectOpen(false)
      setSelectedUser(null)
      setRejectionReason('')
    }
    setIsSubmitting(false)
  }

  if (loading) {
    return <div className="animate-pulse space-y-4">
      <div className="h-10 w-48 bg-slate-200 rounded"></div>
      {[1, 2, 3].map(i => <div key={i} className="h-32 bg-slate-200 rounded-xl"></div>)}
    </div>
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Owner Verifications</h1>
        <p className="text-slate-500 mt-1">Review and approve owner verification requests.</p>
      </div>

      {verifications.length === 0 ? (
        <div className="text-center py-20 bg-white border border-slate-200 rounded-2xl shadow-sm">
          <CheckCircle2 className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-900">All caught up!</h3>
          <p className="text-slate-500">No pending verification requests at the moment.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {verifications.map((v) => (
            <div
              key={v.id}
              className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <User className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-slate-900">{v.full_name}</h3>
                  <p className="text-slate-500 text-sm">{v.email}</p>
                  <div className="flex items-center gap-3 mt-2">
                    <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                      <Clock className="w-3 h-3 mr-1" />
                      Pending Review
                    </Badge>
                    <span className="text-xs text-slate-400 flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3" />
                      Wants to become owner
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Button 
                  variant="outline" 
                  className="text-red-600 border-red-200 hover:bg-red-50"
                  onClick={() => {
                    setSelectedUser(v)
                    setIsRejectOpen(true)
                  }}
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Reject
                </Button>
                <Button 
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                  onClick={() => handleVerify(v.id)}
                  disabled={isSubmitting}
                >
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Approve
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={isRejectOpen} onOpenChange={setIsRejectOpen}>
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle>Reject Verification</DialogTitle>
            <DialogDescription>
              Are you sure you want to reject this verification request?
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="reason">Rejection Reason (Optional)</Label>
            <Textarea 
              id="reason"
              className="mt-2"
              placeholder="e.g., Invalid documents..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRejectOpen(false)}>Cancel</Button>
            <Button 
              variant="destructive" 
              onClick={handleReject}
              disabled={isSubmitting}
            >
              Reject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
