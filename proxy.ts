import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function proxy(request: NextRequest) {
  const response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  // Create a Supabase client configured to use cookies
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set(name, value)
          )
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // getUser(), not getSession(): getSession() decodes whatever is in the cookie
  // without guaranteeing it is revalidated against the auth server, so it must
  // never be the basis of an access decision. getUser() verifies the token.
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Role comes from app_metadata only. user_metadata is writable by the user
  // via supabase.auth.updateUser(), so a staff account could otherwise promote
  // itself to admin. An account with no explicit staff role is not staff -
  // there is deliberately no default, because public signup means a stranger
  // can hold a perfectly valid Supabase session.
  const role = user?.app_metadata?.role
  const isStaff = role === 'admin' || role === 'staff'

  const isAdminRoute = request.nextUrl.pathname.startsWith('/admin')
  const isLoginPage = request.nextUrl.pathname === '/admin/login'

  // Anyone who is not staff is sent to the login page, signed in or not.
  if (isAdminRoute && !isLoginPage && !isStaff) {
    const loginUrl = new URL('/admin/login', request.url)
    loginUrl.searchParams.set('redirectTo', request.nextUrl.pathname)
    if (user) loginUrl.searchParams.set('error', 'not-staff')
    return NextResponse.redirect(loginUrl)
  }

  // Already signed in as staff and heading to the login page - go to the panel.
  if (isLoginPage && isStaff) {
    return NextResponse.redirect(new URL('/admin', request.url))
  }

  return response
}

// Configure which routes to run middleware on
export const config = {
  matcher: [
    '/admin/:path*',
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
