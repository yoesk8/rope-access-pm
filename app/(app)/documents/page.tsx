import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { UploadDocumentDialog } from './upload-document-dialog'
import { FileText, Download } from 'lucide-react'

const typeLabels: Record<string, string> = {
  risk_assessment: 'Risk Assessment',
  method_statement: 'Method Statement',
  inspection_report: 'Inspection Report',
  certificate: 'Certificate',
  other: 'Other',
}

export default async function DocumentsPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  const { data: documents } = await supabase
    .from('documents')
    .select('*, project:projects(name), uploader:profiles(full_name)')
    .order('created_at', { ascending: false })

  const { data: projects } = await supabase.from('projects').select('id, name')

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Documents</h1>
        <UploadDocumentDialog projects={projects ?? []} userId={user!.id} />
      </div>

      <Card>
        <CardHeader><CardTitle>All Documents</CardTitle></CardHeader>
        <CardContent>
          {documents && documents.length > 0 ? (
            <div className="divide-y">
              {documents.map(doc => (
                <div key={doc.id} className="flex items-center justify-between py-3 gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <FileText className="h-5 w-5 text-gray-400 shrink-0" />
                    <div className="min-w-0">
                      <p className="font-medium text-sm text-gray-900 truncate">{doc.name}</p>
                      <p className="text-xs text-gray-500">
                        {(doc.project as any)?.name} · {typeLabels[doc.type] ?? doc.type} · {new Date(doc.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <a
                    href={doc.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs text-blue-600 hover:underline shrink-0"
                  >
                    <Download className="h-3.5 w-3.5" />
                    Download
                  </a>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 py-8 text-center">No documents uploaded yet.</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
