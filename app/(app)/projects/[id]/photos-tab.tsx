'use client'

import { useState, useTransition, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent } from '@/components/ui/card'
import { Upload, X, ImageIcon } from 'lucide-react'

interface Photo {
  id: string
  url: string
  caption: string | null
  created_at: string
  uploader: { full_name: string | null } | null
}

export function PhotosTab({ projectId, photos }: { projectId: string; photos: Photo[] }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [uploading, setUploading] = useState(false)
  const [caption, setCaption] = useState('')
  const [preview, setPreview] = useState<string | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) return
    setFile(f)
    setPreview(URL.createObjectURL(f))
  }

  async function uploadPhoto(e: React.FormEvent) {
    e.preventDefault()
    if (!file) return
    setUploading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const ext = file.name.split('.').pop()
    const path = `${projectId}/${Date.now()}.${ext}`
    const { data: storageData, error } = await supabase.storage.from('photos').upload(path, file)
    if (!error && storageData) {
      const { data: { publicUrl } } = supabase.storage.from('photos').getPublicUrl(path)
      await supabase.from('photos').insert({
        project_id: projectId,
        url: publicUrl,
        caption: caption.trim() || null,
        uploaded_by: user?.id,
      })
    }
    setFile(null)
    setPreview(null)
    setCaption('')
    if (inputRef.current) inputRef.current.value = ''
    setUploading(false)
    startTransition(() => router.refresh())
  }

  async function deletePhoto(id: string, url: string) {
    const supabase = createClient()
    const path = url.split('/photos/')[1]
    await Promise.all([
      supabase.from('photos').delete().eq('id', id),
      supabase.storage.from('photos').remove([path]),
    ])
    startTransition(() => router.refresh())
  }

  return (
    <div className="space-y-6">
      {/* Upload form */}
      <Card>
        <CardContent className="pt-5">
          <form onSubmit={uploadPhoto} className="space-y-3">
            <div
              onClick={() => inputRef.current?.click()}
              className="border-2 border-dashed border-gray-200 rounded-lg p-6 text-center cursor-pointer hover:border-gray-400 transition-colors"
            >
              {preview ? (
                <img src={preview} alt="preview" className="mx-auto max-h-48 rounded-lg object-contain" />
              ) : (
                <div className="flex flex-col items-center gap-2 text-gray-400">
                  <Upload className="h-8 w-8" />
                  <span className="text-sm">Click to select a photo</span>
                </div>
              )}
              <input ref={inputRef} type="file" accept="image/*" onChange={onFileChange} className="hidden" />
            </div>
            {file && (
              <>
                <input
                  placeholder="Caption (optional)"
                  value={caption}
                  onChange={e => setCaption(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                />
                <div className="flex gap-2 justify-end">
                  <button
                    type="button"
                    onClick={() => { setFile(null); setPreview(null); setCaption(''); if (inputRef.current) inputRef.current.value = '' }}
                    className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={uploading}
                    className="px-3 py-1.5 text-sm font-medium bg-gray-900 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 transition-colors"
                  >
                    {uploading ? 'Uploading…' : 'Upload Photo'}
                  </button>
                </div>
              </>
            )}
          </form>
        </CardContent>
      </Card>

      {/* Gallery */}
      {photos.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <ImageIcon className="h-10 w-10 mx-auto mb-2 opacity-40" />
          <p className="text-sm">No photos yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {photos.map(photo => (
            <div key={photo.id} className="group relative rounded-lg overflow-hidden bg-gray-100 aspect-square">
              <img src={photo.url} alt={photo.caption ?? ''} className="w-full h-full object-cover" />
              {photo.caption && (
                <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs p-1.5 truncate">
                  {photo.caption}
                </div>
              )}
              <button
                onClick={() => deletePhoto(photo.id, photo.url)}
                disabled={isPending}
                className="absolute top-1.5 right-1.5 rounded-full bg-black/50 p-1 text-white opacity-0 group-hover:opacity-100 hover:bg-red-600 transition-all"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
