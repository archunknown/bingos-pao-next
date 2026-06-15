import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'

export async function proxy(request) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set(name, value, options)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refresh session — do not remove this call without also removing the
  // setAll cookie handler above; they work together to keep the session alive.
  const { data: { user } } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  // Only /dashboard routes require authentication
  if (pathname.startsWith('/dashboard') && !user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (user && pathname === '/login') {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // /sorteos redirects to the first active sorteo (or landing if none)
  if (pathname === '/sorteos') {
    const { data: sorteo } = await supabase
      .from('sorteos')
      .select('id')
      .eq('estado', 'activo')
      .order('fecha_sorteo', { ascending: true })
      .limit(1)
      .maybeSingle()

    const dest = sorteo ? `/sorteos/${sorteo.id}` : '/'
    return NextResponse.redirect(new URL(dest, request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
