'use client'

import { useState, useRef, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { FileText, Download, Upload, X } from 'lucide-react'

const typeLabels: Record<string, string> = {
  risk_assessment: 'Risk Assessment',
  method_statement: 'Method Statement',
  inspection_report: 'Inspection Report',
  certificate: 'Certificate',
  other: 'Other',
}

interface Doc {
  id: string
  name: string
  type: string
  file_url: string
  file_size: number | null
  created_at: string
  uploader?: { full_name: string | null } | null
}

interface Props {
  projectId: string
  documents: Doc[]
  canUpload: boolean
}

const inputCls = 'w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900'

export function DocumentsTab({ projectId, documents, canUpload }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', type: 'other' })
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault()
    if (!file) return
    setUploading(true)
    setError(null)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const ext = file.name.split('.').pop()
    const path = `${projectId}/${Date.now()}.${ext}`
    const { error: uploadError } = await supabase.storage.from('documents').upload(path, file)
    if (uploadError) { setError(uploadError.message); setUploading(false); return }
    const { data: { publicUrl } } = supabase.storage.from('documents').getPublicUrl(path)
    const { error: dbError } = await supabase.from('documents').insert({
      project_id: projectId,
      name: form.name.trim() || file.name,
      type: form.type,
      file_url: publicUrl,
      file_size: file.size,
      uploaded_by: user?.id,
    })
    if (dbError) { setError(dbError.message); setUploading(false); return }
    setForm({ name: '', type: 'other' })
    setFile(null)
    setShowForm(false)
    setUploading(false)
    startTransition(() => router.refresh())
  }

  function formatSize(bytes: number | null) {
    if (!bytes) return ''
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`
  }

  return (
    <div className="space-y-4">
      {canUpload && (
        <div className="flex justify-end">
          <button
            onClick={() => setShowForm(v => !v)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-gray-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-gray-700 transition-colors"
          >
            <Upload className="h-4 w-4" /> Upload Document
          </button>
        </div>
      )}

      {showForm && (
        <div className="rounded-xl border bg-white p-4 space-y-3">
          <form onSubmit={handleUpload} className="space-y-3">
            <input
              placeholder="Document name (optional)"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              className={inputCls}
            />
            <select
              value={form.type}
              onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
              className={inputCls}
            >
              <option value="risk_assessment">Risk Assessment</option>
              <option value="method_statement">Method Statement</option>
              <option value="inspection_report">Inspection Report</option>
              <option value="certificate">Certificate</option>
              <option value="other">Other</option>
            </select>
            <div className="rounded-lg border-2 border-dashed border-gray-200 p-4 text-center">
              <input
                type="file"
                onChange={e => setFile(e.target.files?.[0] ?? null)}
                className="hidden"
                id="doc-upload"
                required
              />
              <label htmlFor="doc-upload" className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
                {file ? (
                  <span className="font-medium text-gray-900">{file.name}</span>
                ) : (
                  <>Click to choose a file</>
                )}
              </label>
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <div className="flex gap-2 justify-end">
              <button type="button" onClick={() => setShowForm(false)} className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">Cancel</button>
              <button type="submit" disabled={uploading || !file} className="px-3 py-1.5 text-sm font-medium bg-gray-900 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 transition-colors">
                {uploading ? 'Uploading…' : 'Upload'}
              </button>
            </div>
          </form>
        </div>
      )}

      {documents.length > 0 ? (
        <div className="divide-y rounded-xl border bg-white overflow-hidden">
          {documents.map(doc => (
            <div key={doc.id} className="flex items-center gap-3 px-4 py-3">
              <div className="h-9 w-9 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                <FileText className="h-5 w-5 text-blue-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{doc.name}</p>
                <p className="text-xs text-gray-400">
                  {typeLabels[doc.type] ?? doc.type}
                  {doc.file_size ? ` · ${formatSize(doc.file_size)}` : ''}
                  {' · '}{new Date(doc.created_at).toLocaleDateString()}
                </p>
              </div>
              <a
                href={doc.file_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors shrink-0"
              >
                <Download className="h-3.5 w-3.5" /> Download
              </a>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-xl border bg-white py-16 text-center">
          <FileText className="h-8 w-8 text-gray-200 mx-auto mb-2" />
          <p className="text-sm text-gray-400">No documents uploaded for this job yet.</p>
          {canUpload && <p className="text-xs text-gray-400 mt-1">Use "Upload Document" to add risk assessments, method statements, and more.</p>}
        </div>
      )}
    </div>
  )
}
