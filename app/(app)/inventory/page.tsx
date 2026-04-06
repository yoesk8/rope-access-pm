import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import type { InventoryItem, Profile } from '@/types'
import { AddItemDialog } from './add-item-dialog'
import { DeleteItemButton } from './delete-item-button'
import { Package, Wrench, HardHat } from 'lucide-react'
import { cn } from '@/lib/utils'

const STATUS_STYLES: Record<string, string> = {
  active:      'bg-green-100 text-green-700',
  maintenance: 'bg-yellow-100 text-yellow-700',
  retired:     'bg-gray-100 text-gray-500',
}

function ItemCard({
  item,
  canManage,
}: {
  item: InventoryItem & { assignee?: Profile | null }
  canManage: boolean
}) {
  return (
    <div className="flex items-start justify-between gap-3 rounded-xl border border-gray-200 bg-white p-4">
      <div className="flex items-start gap-3 min-w-0">
        <div className="mt-0.5 shrink-0 h-8 w-8 rounded-lg bg-gray-100 flex items-center justify-center">
          <Package className="h-4 w-4 text-gray-500" />
        </div>
        <div className="min-w-0">
          <p className="font-medium text-gray-900 truncate">{item.name}</p>
          <p className="text-xs text-gray-500 capitalize">{item.category}</p>
          {item.serial_number && (
            <p className="text-xs text-gray-400 mt-0.5">S/N: {item.serial_number}</p>
          )}
          {item.assignee && (
            <p className="text-xs text-gray-500 mt-0.5">→ {item.assignee.full_name}</p>
          )}
          {item.notes && (
            <p className="text-xs text-gray-400 mt-1 line-clamp-1">{item.notes}</p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <span className={cn('rounded-full px-2 py-0.5 text-xs font-medium capitalize', STATUS_STYLES[item.status])}>
          {item.status}
        </span>
        {canManage && <DeleteItemButton id={item.id} />}
      </div>
    </div>
  )
}

export default async function InventoryPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const isTech = profile?.role === 'technician'
  const canManage = profile?.role === 'owner' || profile?.role === 'lead_tech'

  // Techs only see their personal items
  const query = supabase
    .from('inventory_items')
    .select('*, assignee:profiles!inventory_items_assigned_to_fkey(id, full_name)')
    .order('name')

  if (isTech) {
    query.eq('assigned_to', user.id)
  }

  const { data: items } = await query

  const personalItems = items?.filter(i => i.type === 'personal') ?? []
  const companyItems  = items?.filter(i => i.type === 'company')  ?? []

  // For add dialog: list of techs to assign personal items to
  let techs: Profile[] = []
  if (canManage) {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .in('role', ['technician', 'lead_tech'])
      .order('full_name')
    techs = (data ?? []) as Profile[]
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inventory</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {isTech ? 'Your assigned equipment' : 'All company and personal equipment'}
          </p>
        </div>
        {canManage && <AddItemDialog techs={techs} />}
      </div>

      {/* Personal Equipment */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <HardHat className="h-4 w-4 text-gray-400" />
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
            Personal Equipment
          </h2>
          <span className="ml-1 text-xs text-gray-400">{personalItems.length}</span>
        </div>
        {personalItems.length === 0 ? (
          <p className="text-sm text-gray-400 py-6 text-center rounded-xl border border-dashed border-gray-200">
            No personal equipment yet.
          </p>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2">
            {personalItems.map(item => (
              <ItemCard key={item.id} item={item as any} canManage={canManage} />
            ))}
          </div>
        )}
      </section>

      {/* Company Equipment — hidden from techs */}
      {!isTech && (
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <Wrench className="h-4 w-4 text-gray-400" />
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
              Company Equipment
            </h2>
            <span className="ml-1 text-xs text-gray-400">{companyItems.length}</span>
          </div>
          {companyItems.length === 0 ? (
            <p className="text-sm text-gray-400 py-6 text-center rounded-xl border border-dashed border-gray-200">
              No company equipment yet.
            </p>
          ) : (
            <div className="grid gap-2 sm:grid-cols-2">
              {companyItems.map(item => (
                <ItemCard key={item.id} item={item as any} canManage={canManage} />
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  )
}
