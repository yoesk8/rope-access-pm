'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'

interface Props {
  timesheetId: string
  approverId: string
}

export function ApproveButton({ timesheetId, approverId }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function update(status: 'approved' | 'rejected') {
    setLoading(true)
    const supabase = createClient()
    await supabase.from('timesheets').update({ status, approved_by: approverId }).eq('id', timesheetId)
    router.refresh()
  }

  return (
    <div className="flex gap-1.5">
      <Button size="sm" variant="outline" className="h-7 text-xs text-green-700 border-green-200 hover:bg-green-50" onClick={() => update('approved')} disabled={loading}>
        Approve
      </Button>
      <Button size="sm" variant="outline" className="h-7 text-xs text-red-700 border-red-200 hover:bg-red-50" onClick={() => update('rejected')} disabled={loading}>
        Reject
      </Button>
    </div>
  )
}
