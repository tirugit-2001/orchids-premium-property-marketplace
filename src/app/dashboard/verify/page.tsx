'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { 
  ShieldCheck, 
  Upload, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  FileText,
  ArrowLeft,
  Loader2
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { toast } from 'sonner'
import { Navbar } from '@/components/Navbar'

export default function OwnerVerification() {
  const router = useRouter()
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [isUploading, setIsUploading] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    async function getProfile() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/login')
        return
      }

      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      setProfile(data)
      setLoading(false)
    }

    getProfile()
  }, [router, supabase])

  const handleVerifyRequest = async () => {
    setIsUploading(true)
    const { error } = await supabase
      .from('profiles')
      .update({ 
        verification_status: 'pending'
      })
      .eq('id', profile.id)

    if (error) {
      toast.error('Failed to submit verification request')
    } else {
      toast.success('Verification request submitted successfully')
      setProfile({ ...profile, verification_status: 'pending' })
    }
    setIsUploading(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="pt-24 pb-12 px-4">
        <div className="max-w-2xl mx-auto">
          <Button 
            variant="ghost" 
            className="mb-8"
            onClick={() => router.back()}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card>
              <CardHeader className="text-center pb-2">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <ShieldCheck className="w-8 h-8 text-primary" />
                </div>
                <CardTitle className="text-2xl font-bold">Owner Verification</CardTitle>
                <CardDescription>
                  Verify your account to start listing properties on PropVista.
                </CardDescription>
              </CardHeader>

              <CardContent className="pt-6 space-y-6">
                {profile.is_verified ? (
                  <div className="p-6 rounded-2xl bg-emerald-50 border border-emerald-200 text-center">
                    <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-emerald-700">Verified Account</h3>
                    <p className="text-emerald-600 mt-2">
                      Your account has been verified. You can now add and manage properties.
                    </p>
                    <Button 
                      className="mt-6 bg-emerald-600 hover:bg-emerald-700"
                      onClick={() => router.push('/dashboard/properties/new')}
                    >
                      Add New Property
                    </Button>
                  </div>
                ) : profile.verification_status === 'pending' ? (
                  <div className="p-6 rounded-2xl bg-amber-50 border border-amber-200 text-center">
                    <Clock className="w-12 h-12 text-amber-600 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-amber-700">Verification Pending</h3>
                    <p className="text-amber-600 mt-2">
                      Your verification request is currently being reviewed by our admin team.
                      This usually takes 24-48 hours.
                    </p>
                    <div className="mt-6 pt-6 border-t border-amber-200">
                      <p className="text-sm text-amber-500">
                        We will notify you via email once your account is verified.
                      </p>
                    </div>
                  </div>
                ) : profile.verification_status === 'rejected' ? (
                  <div className="p-6 rounded-2xl bg-red-50 border border-red-200 text-center">
                    <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-red-700">Verification Rejected</h3>
                    <p className="text-red-600 mt-2">
                      Unfortunately, your verification request was rejected. This could be due to invalid documents or incomplete information.
                    </p>
                    <Button 
                      variant="outline" 
                      className="mt-6 border-red-300 text-red-600 hover:bg-red-50"
                      onClick={() => setProfile({ ...profile, verification_status: null })}
                    >
                      Try Again
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="space-y-4">
                      <div className="flex gap-4 p-4 rounded-xl bg-muted border">
                        <div className="p-2 bg-background rounded-lg h-fit">
                          <FileText className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">Government Issued ID</p>
                          <p className="text-sm text-muted-foreground">Upload a clear photo of your Aadhar, PAN, or Passport.</p>
                        </div>
                      </div>
                      <div className="flex gap-4 p-4 rounded-xl bg-muted border">
                        <div className="p-2 bg-background rounded-lg h-fit">
                          <ShieldCheck className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">Trust & Safety</p>
                          <p className="text-sm text-muted-foreground">Verification helps us build a trusted marketplace for everyone.</p>
                        </div>
                      </div>
                    </div>

                    <div className="border-2 border-dashed rounded-2xl p-12 text-center hover:border-primary/50 transition-colors cursor-pointer group">
                      <Upload className="w-12 h-12 text-muted-foreground mx-auto mb-4 group-hover:text-primary transition-colors" />
                      <p className="font-medium">Click to upload document</p>
                      <p className="text-sm text-muted-foreground mt-1">PNG, JPG, or PDF (max. 5MB)</p>
                    </div>

                    <Button 
                      className="w-full h-12 text-lg font-bold"
                      onClick={handleVerifyRequest}
                      disabled={isUploading}
                    >
                      {isUploading ? (
                        <>
                          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        'Submit for Verification'
                      )}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
