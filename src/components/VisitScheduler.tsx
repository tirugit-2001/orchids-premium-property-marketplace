'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { format } from 'date-fns'
import { Calendar as CalendarIcon, Clock, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useAuthStore } from '@/lib/store'
import { useRouter } from 'next/navigation'

interface VisitSchedulerProps {
  propertyId: string
  ownerId: string
}

export function VisitScheduler({ propertyId, ownerId }: VisitSchedulerProps) {
  const router = useRouter()
  const { user } = useAuthStore()
  const [date, setDate] = useState<Date>()
  const [time, setTime] = useState<string>()
  const [notes, setNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSchedule = async () => {
    if (!user) {
      toast.error('Please sign in to schedule a visit')
      router.push('/auth/login')
      return
    }

    if (!date || !time) {
      toast.error('Please select date and time')
      return
    }

    setIsSubmitting(true)
    try {
      // In a real app, this would be an API call
      // const response = await fetch('/api/visits', {
      //   method: 'POST',
      //   body: JSON.stringify({ propertyId, ownerId, date, time, notes })
      // })
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      toast.success('Visit scheduled successfully! The owner will be notified.')
      setDate(undefined)
      setTime(undefined)
      setNotes('')
    } catch (error) {
      toast.error('Failed to schedule visit. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="p-6 rounded-2xl border bg-card space-y-4">
      <h3 className="font-semibold text-lg">Schedule a Visit</h3>
      <p className="text-sm text-muted-foreground"> Pick a date and time to visit this property.</p>
      
      <div className="grid gap-4">
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={`w-full justify-start text-left font-normal ${!date && 'text-muted-foreground'}`}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {date ? format(date, 'PPP') : <span>Pick a date</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={date}
              onSelect={setDate}
              initialFocus
              disabled={(date) => date < new Date()}
            />
          </PopoverContent>
        </Popover>

        <Select value={time} onValueChange={setTime}>
          <SelectTrigger>
            <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
            <SelectValue placeholder="Select time slot" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="10:00 AM">10:00 AM - 11:00 AM</SelectItem>
            <SelectItem value="11:00 AM">11:00 AM - 12:00 PM</SelectItem>
            <SelectItem value="12:00 PM">12:00 PM - 01:00 PM</SelectItem>
            <SelectItem value="02:00 PM">02:00 PM - 03:00 PM</SelectItem>
            <SelectItem value="03:00 PM">03:00 PM - 04:00 PM</SelectItem>
            <SelectItem value="04:00 PM">04:00 PM - 05:00 PM</SelectItem>
            <SelectItem value="05:00 PM">05:00 PM - 06:00 PM</SelectItem>
          </SelectContent>
        </Select>

        <Textarea
          placeholder="Any special requests or questions for the owner?"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="min-h-[100px]"
        />

        <Button 
          className="w-full" 
          onClick={handleSchedule}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Scheduling...
            </>
          ) : 'Request Visit'}
        </Button>
      </div>
    </div>
  )
}
