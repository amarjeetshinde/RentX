import { supabase } from './supabaseClient'

const BUCKET_NAME = 'equipment-images'
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5 MB
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

/**
 * Validates an image file before upload.
 */
export function validateImageFile(file) {
  if (!file) {
    return { valid: false, error: 'Please select an image file.' }
  }

  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: 'Invalid file format. Only JPG, PNG, WEBP, and GIF images are allowed.',
    }
  }

  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `File size exceeds 5MB limit. Your file is ${(file.size / (1024 * 1024)).toFixed(1)}MB.`,
    }
  }

  return { valid: true, error: null }
}

/**
 * Uploads an equipment photo to Supabase Storage.
 *
 * Folder Isolation:
 * The file is placed inside a folder named after the user's UUID:
 *   /{userId}/{timestamp}-{sanitizedFilename}
 * This matches the RLS Storage policy requirement:
 *   (storage.foldername(name))[1] = auth.uid()::text
 */
export async function uploadEquipmentImage(file, userId) {
  const validation = validateImageFile(file)
  if (!validation.valid) {
    throw new Error(validation.error)
  }

  if (!userId) {
    throw new Error('User authentication required for image upload.')
  }

  const fileExt = file.name.split('.').pop().toLowerCase()
  const cleanName = file.name
    .replace(/\.[^/.]+$/, '')
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .slice(0, 30)

  const filePath = `${userId}/${Date.now()}_${cleanName}.${fileExt}`

  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
    })

  if (error) {
    console.error('[Storage Error] Upload failed:', error)
    throw new Error(error.message || 'Failed to upload equipment image.')
  }

  // Get public CDN URL for the uploaded file
  const { data: publicData } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(data.path)

  return {
    path: data.path,
    publicUrl: publicData.publicUrl,
  }
}

/**
 * Deletes an equipment image from Supabase Storage by its public URL.
 */
export async function deleteEquipmentImage(publicUrl, userId) {
  if (!publicUrl || !userId) return

  try {
    // Extract the relative path from the public URL
    const marker = `/${BUCKET_NAME}/`
    const index = publicUrl.indexOf(marker)
    if (index === -1) return

    const filePath = publicUrl.slice(index + marker.length)

    // Security check: only delete if the path starts with the user's UUID (or user is admin)
    if (!filePath.startsWith(userId)) {
      console.warn('[Storage] Skipping delete: path does not belong to user')
      return
    }

    const { error } = await supabase.storage.from(BUCKET_NAME).remove([filePath])
    if (error) {
      console.warn('[Storage Error] Failed to delete image file:', error.message)
    }
  } catch (err) {
    console.warn('[Storage Error] Unexpected error deleting image:', err)
  }
}
