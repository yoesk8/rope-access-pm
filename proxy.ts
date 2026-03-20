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

  const publicPaths = ['/', '/login', '/set-password', '/auth/confirm']

  if (!user && !publicPaths.includes(pathname)) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (user && (pathname === '/login' || pathname === '/')) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // Block restricted routes based on role
  if (user) {
    // technicians: blocked from /team, /documents, /messages
    // lead_tech: blocked from /team, /messages (but CAN access /documents)
    const allRestrictedPaths = ['/team', '/documents', '/messages']
    const isRestricted = allRestrictedPaths.some(p => pathname === p || pathname.startsWith(p + '/'))
    if (isRestricted) {
      const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
      if (profile?.role === 'technician') {
        return NextResponse.redirect(new URL('/dashboard', request.url))
      }
      // lead_tech can access /documents but not /team or /messages
      if (profile?.role === 'lead_tech') {
        const leadTechRestricted = ['/team', '/messages']
        if (leadTechRestricted.some(p => pathname === p || pathname.startsWith(p + '/'))) {
          return NextResponse.redirect(new URL('/dashboard', request.url))
        }
      }
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
