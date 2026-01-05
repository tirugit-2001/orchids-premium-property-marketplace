import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase/server'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    // Verify user is authenticated
    const supabase = await createServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify user is owner
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    if (profile.role !== 'owner') {
      return NextResponse.json({ error: 'Only owners can upload verification documents' }, { status: 403 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: 'File is required' }, { status: 400 })
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ 
        error: 'Invalid file type. Allowed: JPEG, PNG, WebP, PDF' 
      }, { status: 400 })
    }

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024
    if (file.size > maxSize) {
      return NextResponse.json({ 
        error: 'File too large. Maximum 5MB allowed' 
      }, { status: 400 })
    }

    const fileExt = file.name.split('.').pop()
    const fileName = `verification/${user.id}/${Date.now()}.${fileExt}`

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Upload to verification-documents bucket
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from('verification-documents')
      .upload(fileName, buffer, {
        contentType: file.type,
        upsert: false
      })

    if (uploadError) {
      console.error('Upload error:', uploadError)
      return NextResponse.json({ error: 'Failed to upload document' }, { status: 500 })
    }

    const { data: { publicUrl } } = supabaseAdmin.storage
      .from('verification-documents')
      .getPublicUrl(uploadData.path)

    // Get current documents (if column exists)
    let existingDocuments: string[] = []
    try {
      const { data: currentProfile } = await supabaseAdmin
        .from('profiles')
        .select('verification_documents')
        .eq('id', user.id)
        .single()

      existingDocuments = currentProfile?.verification_documents || []
    } catch (err) {
      // Column might not exist, start with empty array
      existingDocuments = []
    }

    const updatedDocuments = [...existingDocuments, publicUrl]

    // Update profile with new document
    // Try with verification_documents first, fallback without it if column doesn't exist
    let updateError = null
    try {
      const result = await supabaseAdmin
        .from('profiles')
        .update({ 
          verification_documents: updatedDocuments,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)
      updateError = result.error
    } catch (err: any) {
      // If verification_documents column doesn't exist, update without it
      if (err.message?.includes('verification_documents')) {
        const result = await supabaseAdmin
          .from('profiles')
          .update({ 
            updated_at: new Date().toISOString()
          })
          .eq('id', user.id)
        updateError = result.error
        // Still return success since file was uploaded, just can't store reference
        return NextResponse.json({
          success: true,
          url: publicUrl,
          path: uploadData.path,
          documents: [publicUrl],
          warning: 'Document uploaded but verification_documents column not found in database'
        })
      } else {
        updateError = err
      }
    }

    if (updateError) {
      console.error('Update error:', updateError)
      // Try to delete uploaded file if update fails
      await supabaseAdmin.storage
        .from('verification-documents')
        .remove([uploadData.path])
      return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      url: publicUrl,
      path: uploadData.path,
      documents: updatedDocuments
    })
  } catch (error) {
    console.error('Document upload error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

