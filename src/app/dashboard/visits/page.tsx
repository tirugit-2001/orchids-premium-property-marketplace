'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Navbar } from '@/components/Navbar'
import { useAuthStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
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
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import type { VisitRequest } from '@/lib/types'
import {
  Calendar,
  Clock,
  User,
  Phone,
  MapPin,
  MessageSquare,
  CheckCircle2,
  XCircle,
  Loader2,
  Eye,
} from 'lucide-react'
import { format } from 'date-fns'
import Link from 'next/link'

const statusConfig = {
  pending: { label: 'Pending', icon: Clock, className: 'bg-yellow-100 text-yellow-700' },
  confirmed: { label: 'Confirmed', icon: CheckCircle2, className: 'bg-green-100 text-green-700' },
  rejected: { label: 'Rejected', icon: XCircle, className: 'bg-red-100 text-red-700' },
  cancelled: { label: 'Cancelled', icon: XCircle, className: 'bg-gray-100 text-gray-700' },
  completed: { label: 'Completed', icon: CheckCircle2, className: 'bg-blue-100 text-blue-700' },
}

export default function VisitsPage() {
  const router = useRouter()
  const { user } = useAuthStore()
  const [visitRequests, setVisitRequests] = useState<VisitRequest[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedVisit, setSelectedVisit] = useState<VisitRequest | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [action, setAction] = useState<'confirm' | 'reject' | null>(null)
  const [ownerMessage, setOwnerMessage] = useState('')
  const [confirmedDate, setConfirmedDate] = useState('')
  const [confirmedTime, setConfirmedTime] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (user) {
      fetchVisitRequests()
    }
  }, [user])

  const fetchVisitRequests = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/visits?role=${user?.role}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch visit requests')
      }

      setVisitRequests(data.visit_requests || [])
    } catch (error: any) {
      console.error('Error fetching visit requests:', error)
      toast.error(error.message || 'Failed to load visit requests')
    } finally {
      setIsLoading(false)
    }
  }

  const handleAction = (visit: VisitRequest, actionType: 'confirm' | 'reject') => {
    setSelectedVisit(visit)
    setAction(actionType)
    setIsDialogOpen(true)
  }

  const submitAction = async () => {
    if (!selectedVisit) return

    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/visits/${selectedVisit.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: action === 'confirm' ? 'confirmed' : 'rejected',
          owner_message: ownerMessage || null,
          confirmed_date: action === 'confirm' && confirmedDate ? confirmedDate : null,
          confirmed_time: action === 'confirm' && confirmedTime ? confirmedTime : null,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update visit request')
      }

      toast.success(`Visit request ${action === 'confirm' ? 'confirmed' : 'rejected'} successfully`)
      setIsDialogOpen(false)
      setSelectedVisit(null)
      setAction(null)
      setOwnerMessage('')
      setConfirmedDate('')
      setConfirmedTime('')
      fetchVisitRequests()
    } catch (error: any) {
      console.error('Update visit error:', error)
      toast.error(error.message || 'Failed to update visit request')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  const pendingVisits = visitRequests.filter(v => v.status === 'pending')
  const otherVisits = visitRequests.filter(v => v.status !== 'pending')

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="pt-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Visit Requests</h1>
            <p className="text-muted-foreground">
              {user?.role === 'owner' 
                ? 'Manage visit requests from potential customers'
                : 'View your scheduled property visits'}
            </p>
          </div>

          {pendingVisits.length > 0 && (
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-4">Pending Requests</h2>
              <div className="space-y-4">
                {pendingVisits.map((visit) => {
                  const StatusIcon = statusConfig[visit.status as keyof typeof statusConfig]?.icon || Clock
                  return (
                    <motion.div
                      key={visit.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-card border rounded-xl p-6"
                    >
                      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                        <div className="flex-1 space-y-3">
                          <div className="flex items-start justify-between">
                            <div>
                              <Link 
                                href={`/properties/${visit.property_id}`}
                                className="font-semibold text-lg hover:text-primary"
                              >
                                {visit.property?.title || 'Property'}
                              </Link>
                              <p className="text-sm text-muted-foreground mt-1">
                                {visit.property?.address}, {visit.property?.city}
                              </p>
                            </div>
                            <Badge className={statusConfig[visit.status as keyof typeof statusConfig]?.className}>
                              <StatusIcon className="w-3 h-3 mr-1" />
                              {statusConfig[visit.status as keyof typeof statusConfig]?.label}
                            </Badge>
                          </div>

                          <div className="grid sm:grid-cols-2 gap-4 text-sm">
                            <div className="flex items-center gap-2">
                              <User className="w-4 h-4 text-muted-foreground" />
                              <span>{visit.customer?.full_name || 'Customer'}</span>
                            </div>
                            {visit.customer_phone && (
                              <div className="flex items-center gap-2">
                                <Phone className="w-4 h-4 text-muted-foreground" />
                                <span>{visit.customer_phone}</span>
                              </div>
                            )}
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-muted-foreground" />
                              <span>{format(new Date(visit.preferred_date), 'PPP')}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4 text-muted-foreground" />
                              <span>{visit.preferred_time}</span>
                            </div>
                          </div>

                          {visit.notes && (
                            <div className="flex items-start gap-2">
                              <MessageSquare className="w-4 h-4 text-muted-foreground mt-0.5" />
                              <p className="text-sm text-muted-foreground">{visit.notes}</p>
                            </div>
                          )}
                        </div>

                        {user?.role === 'owner' && visit.status === 'pending' && (
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleAction(visit, 'reject')}
                            >
                              <XCircle className="w-4 h-4 mr-2" />
                              Reject
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => handleAction(visit, 'confirm')}
                            >
                              <CheckCircle2 className="w-4 h-4 mr-2" />
                              Confirm
                            </Button>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            </div>
          )}

          {otherVisits.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold mb-4">
                {user?.role === 'owner' ? 'Other Requests' : 'Your Visits'}
              </h2>
              <div className="space-y-4">
                {otherVisits.map((visit) => {
                  const StatusIcon = statusConfig[visit.status as keyof typeof statusConfig]?.icon || Clock
                  return (
                    <motion.div
                      key={visit.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-card border rounded-xl p-6"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 space-y-3">
                          <div className="flex items-start justify-between">
                            <div>
                              <Link 
                                href={`/properties/${visit.property_id}`}
                                className="font-semibold text-lg hover:text-primary"
                              >
                                {visit.property?.title || 'Property'}
                              </Link>
                              <p className="text-sm text-muted-foreground mt-1">
                                {visit.property?.address}, {visit.property?.city}
                              </p>
                            </div>
                            <Badge className={statusConfig[visit.status as keyof typeof statusConfig]?.className}>
                              <StatusIcon className="w-3 h-3 mr-1" />
                              {statusConfig[visit.status as keyof typeof statusConfig]?.label}
                            </Badge>
                          </div>

                          <div className="grid sm:grid-cols-2 gap-4 text-sm">
                            {user?.role === 'owner' && (
                              <div className="flex items-center gap-2">
                                <User className="w-4 h-4 text-muted-foreground" />
                                <span>{visit.customer?.full_name || 'Customer'}</span>
                              </div>
                            )}
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-muted-foreground" />
                              <span>
                                {visit.confirmed_date 
                                  ? format(new Date(visit.confirmed_date), 'PPP')
                                  : format(new Date(visit.preferred_date), 'PPP')}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4 text-muted-foreground" />
                              <span>
                                {visit.confirmed_time || visit.preferred_time}
                              </span>
                            </div>
                          </div>

                          {visit.owner_message && (
                            <div className="p-3 bg-muted rounded-lg">
                              <p className="text-sm font-medium mb-1">Owner's Message:</p>
                              <p className="text-sm text-muted-foreground">{visit.owner_message}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            </div>
          )}

          {visitRequests.length === 0 && (
            <div className="text-center py-20">
              <Calendar className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No visit requests</h3>
              <p className="text-muted-foreground">
                {user?.role === 'owner' 
                  ? 'You don\'t have any visit requests yet.'
                  : 'You haven\'t scheduled any visits yet.'}
              </p>
            </div>
          )}
        </div>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle>
              {action === 'confirm' ? 'Confirm Visit Request' : 'Reject Visit Request'}
            </DialogTitle>
            <DialogDescription>
              {action === 'confirm' 
                ? 'Confirm the visit and optionally set a different date/time.'
                : 'Reject the visit request and optionally provide a reason.'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {action === 'confirm' && (
              <>
                <div>
                  <Label htmlFor="confirmedDate">Confirmed Date (Optional)</Label>
                  <Input
                    id="confirmedDate"
                    type="date"
                    value={confirmedDate}
                    onChange={(e) => setConfirmedDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label htmlFor="confirmedTime">Confirmed Time (Optional)</Label>
                  <Input
                    id="confirmedTime"
                    type="time"
                    value={confirmedTime}
                    onChange={(e) => setConfirmedTime(e.target.value)}
                    className="mt-2"
                  />
                </div>
              </>
            )}
            <div>
              <Label htmlFor="ownerMessage">
                {action === 'confirm' ? 'Message to Customer (Optional)' : 'Rejection Reason (Optional)'}
              </Label>
              <Textarea
                id="ownerMessage"
                value={ownerMessage}
                onChange={(e) => setOwnerMessage(e.target.value)}
                placeholder={action === 'confirm' 
                  ? 'Add any additional details or instructions...'
                  : 'Provide a reason for rejection...'}
                className="mt-2 min-h-[100px]"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={submitAction}
              disabled={isSubmitting}
              variant={action === 'reject' ? 'destructive' : 'default'}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                action === 'confirm' ? 'Confirm Visit' : 'Reject Visit'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

