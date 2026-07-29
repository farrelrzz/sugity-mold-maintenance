import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default withAuth(
  function proxy(req) {
    const { pathname } = req.nextUrl
    const token = req.nextauth.token

    // Jika user sudah login dan mengakses /login, redirect ke /
    if (token && pathname === '/login') {
      return NextResponse.redirect(new URL('/', req.url))
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl
        // Biarkan /login dapat diakses tanpa login
        if (pathname === '/login') {
          return true
        }
        return !!token
      },
    },
    pages: {
      signIn: '/login',
    },
    secret: process.env.NEXTAUTH_SECRET,
  }
)

export const config = {
  matcher: [
    /*
     * Match all request paths EXCEPT:
     * - api routes (e.g. /api/auth)
     * - static files (e.g. /favicon.ico, /uploads)
     * - _next/static, _next/image
     */
    '/((?!api|_next/static|_next/image|favicon.ico|uploads|.*\\..*$).*)',
  ],
}
