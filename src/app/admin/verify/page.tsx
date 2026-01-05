'use client'

import { useEffect, useState } from 'react'
import { 
  CheckCircle2, 
  XCircle, 
  User, 
  Clock,
  ShieldCheck,
  FileText,
  ExternalLink
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
    try {
      const response = await fetch('/api/admin/verify')
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch verifications')
      }

      setVerifications(data.verifications || [])
    } catch (error: any) {
      console.error('Fetch error:', error)
      toast.error(error.message || 'Failed to fetch pending verifications')
    } finally {
      setLoading(false)
    }
  }

  async function handleVerify(userId: string) {
    setIsSubmitting(true)
    try {
      const response = await fetch('/api/admin/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          action: 'approve',
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to verify user')
      }

      toast.success('User verified successfully')
      setVerifications(verifications.filter(v => v.id !== userId))
    } catch (error: any) {
      console.error('Verify error:', error)
      toast.error(error.message || 'Failed to verify user')
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleReject() {
    if (!selectedUser) return

    setIsSubmitting(true)
    try {
      const response = await fetch('/api/admin/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: selectedUser.id,
          action: 'reject',
          rejectionReason: rejectionReason || 'Verification rejected by admin',
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to reject verification')
      }

      toast.success('Verification rejected')
      setVerifications(verifications.filter(v => v.id !== selectedUser.id))
      setIsRejectOpen(false)
      setSelectedUser(null)
      setRejectionReason('')
    } catch (error: any) {
      console.error('Reject error:', error)
      toast.error(error.message || 'Failed to reject verification')
    } finally {
      setIsSubmitting(false)
    }
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
                <div className="flex-1">
                  <h3 className="font-bold text-lg text-slate-900">{v.full_name}</h3>
                  <p className="text-slate-500 text-sm">{v.email}</p>
                  {v.phone && (
                    <p className="text-slate-500 text-sm">Phone: {v.phone}</p>
                  )}
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
                  {v.verification_documents && v.verification_documents.length > 0 && (
                    <div className="mt-3 space-y-2">
                      <p className="text-xs font-medium text-slate-600">Verification Documents:</p>
                      <div className="flex flex-wrap gap-2">
                        {v.verification_documents.map((doc: string, idx: number) => (
                          <a
                            key={idx}
                            href={doc}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-slate-100 hover:bg-slate-200 rounded-md transition-colors"
                          >
                            <FileText className="w-3 h-3" />
                            Document {idx + 1}
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
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
