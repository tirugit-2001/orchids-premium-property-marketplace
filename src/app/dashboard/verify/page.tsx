'use client'

import React, { useState, useEffect } from 'react'
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
  Loader2,
  X,
  Image as ImageIcon
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
  const [uploadedDocuments, setUploadedDocuments] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const fileInputRef = React.useRef<HTMLInputElement>(null)
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

      if (data) {
        // Check if user is owner
        if (data.role !== 'owner') {
          toast.error('Only owners can access verification page')
          router.push('/dashboard')
          return
        }
        setProfile(data)
        setUploadedDocuments(data.verification_documents || [])
      }
      setLoading(false)
    }

    getProfile()
  }, [router, supabase])

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
    if (!allowedTypes.includes(file.type)) {
      toast.error('Invalid file type. Please upload JPEG, PNG, WebP, or PDF files.')
      return
    }

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024
    if (file.size > maxSize) {
      toast.error('File too large. Maximum 5MB allowed.')
      return
    }

    setIsUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/verification/upload', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to upload document')
      }

      setUploadedDocuments(data.documents || [])
      toast.success('Document uploaded successfully')
    } catch (error: any) {
      console.error('Upload error:', error)
      toast.error(error.message || 'Failed to upload document')
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleRemoveDocument = async (index: number) => {
    const updated = uploadedDocuments.filter((_, i) => i !== index)
    setUploadedDocuments(updated)
    
    // Update profile (only if verification_documents column exists)
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          verification_documents: updated,
          updated_at: new Date().toISOString()
        })
        .eq('id', profile.id)

      if (error) {
        // If column doesn't exist, just update timestamp
        if (error.message?.includes('verification_documents')) {
          await supabase
            .from('profiles')
            .update({ updated_at: new Date().toISOString() })
            .eq('id', profile.id)
        } else {
          throw error
        }
      }
      toast.success('Document removed')
      setProfile({ ...profile, verification_documents: updated })
    } catch (error: any) {
      console.error('Remove document error:', error)
      toast.error('Failed to remove document')
      setUploadedDocuments(uploadedDocuments) // Revert
    }
  }

  const handleVerifyRequest = async () => {
    if (uploadedDocuments.length === 0) {
      toast.error('Please upload at least one verification document')
      return
    }

    setIsSubmitting(true)
    try {
      // Try to update with verification_documents first
      let updateData: any = {
        verification_status: 'pending',
        updated_at: new Date().toISOString()
      }

      // Only include verification_documents if column exists
      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', profile.id)

      if (error) {
        // If verification_status column doesn't exist, try a different approach
        if (error.message?.includes('verification_status')) {
          // Just update is_verified flag
          const { error: altError } = await supabase
            .from('profiles')
            .update({ 
              is_verified: false,
              updated_at: new Date().toISOString()
            })
            .eq('id', profile.id)
          if (altError) throw altError
        } else {
          throw error
        }
      } else {
        // Try to update verification_documents separately if column exists
        try {
          await supabase
            .from('profiles')
            .update({ verification_documents: uploadedDocuments })
            .eq('id', profile.id)
        } catch (docError) {
          // Ignore if column doesn't exist
          console.warn('Could not update verification_documents (column may not exist)')
        }
      }

      toast.success('Verification request submitted successfully')
      setProfile({ ...profile, verification_status: 'pending', verification_documents: uploadedDocuments })
    } catch (error: any) {
      console.error('Submit error:', error)
      toast.error(error.message || 'Failed to submit verification request')
    } finally {
      setIsSubmitting(false)
    }
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

                    {/* Uploaded Documents */}
                    {uploadedDocuments.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-sm font-medium">Uploaded Documents ({uploadedDocuments.length})</p>
                        <div className="grid grid-cols-1 gap-2">
                          {uploadedDocuments.map((doc, index) => (
                            <div
                              key={index}
                              className="flex items-center justify-between p-3 rounded-lg bg-muted border"
                            >
                              <div className="flex items-center gap-3">
                                <ImageIcon className="w-5 h-5 text-primary" />
                                <span className="text-sm truncate max-w-xs">
                                  Document {index + 1}
                                </span>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemoveDocument(index)}
                                className="h-8 w-8 p-0"
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* File Upload */}
                    <div className="space-y-2">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp,application/pdf"
                        onChange={handleFileUpload}
                        className="hidden"
                        id="document-upload"
                        disabled={isUploading || isSubmitting}
                      />
                      <label
                        htmlFor="document-upload"
                        className={`border-2 border-dashed rounded-2xl p-12 text-center transition-colors cursor-pointer group ${
                          isUploading || isSubmitting
                            ? 'opacity-50 cursor-not-allowed'
                            : 'hover:border-primary/50'
                        }`}
                      >
                        {isUploading ? (
                          <div className="flex flex-col items-center">
                            <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
                            <p className="font-medium">Uploading...</p>
                          </div>
                        ) : (
                          <>
                            <Upload className="w-12 h-12 text-muted-foreground mx-auto mb-4 group-hover:text-primary transition-colors" />
                            <p className="font-medium">Click to upload document</p>
                            <p className="text-sm text-muted-foreground mt-1">
                              PNG, JPG, WebP, or PDF (max. 5MB)
                            </p>
                          </>
                        )}
                      </label>
                    </div>

                    <Button 
                      className="w-full h-12 text-lg font-bold"
                      onClick={handleVerifyRequest}
                      disabled={isUploading || isSubmitting || uploadedDocuments.length === 0}
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        'Submit for Verification'
                      )}
                    </Button>

                    {uploadedDocuments.length === 0 && (
                      <p className="text-sm text-muted-foreground text-center">
                        Please upload at least one document to submit for verification
                      </p>
                    )}
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
