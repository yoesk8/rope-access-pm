import { Sidebar } from '@/components/sidebar'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 overflow-auto p-4 pt-18 md:pt-8 md:p-8">
        {children}
      </main>
    </div>
  )
}
