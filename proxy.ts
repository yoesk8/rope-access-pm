import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  const publicPaths = ['/', '/login', '/signup', '/set-password', '/auth/confirm', '/pricing']

  if (!user && !publicPaths.includes(pathname)) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (user && (pathname === '/login' || pathname === '/signup' || pathname === '/')) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // Role-based route protection
  if (user) {
    const { data: profile } = await supabase.from('profiles').select('role, plan').eq('id', user.id).single()
    const role = profile?.role
    const plan = profile?.plan ?? 'basic'

    // Technicians: only /dashboard and /projects routes
    if (role === 'technician') {
      const allowed = ['/dashboard', '/projects']
      const isAllowed = allowed.some(p => pathname === p || pathname.startsWith(p + '/'))
      if (!isAllowed) return NextResponse.redirect(new URL('/dashboard', request.url))
    }

    // Lead techs: /dashboard, /projects, /messages
    if (role === 'lead_tech') {
      const blocked = ['/team', '/documents', '/timesheets']
      const isBlocked = blocked.some(p => pathname === p || pathname.startsWith(p + '/'))
      if (isBlocked) return NextResponse.redirect(new URL('/dashboard', request.url))
    }

    // Owner on basic plan: no /messages route
    if (role === 'owner' && plan === 'basic') {
      if (pathname === '/messages' || pathname.startsWith('/messages/')) {
        return NextResponse.redirect(new URL('/dashboard', request.url))
      }
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
