import NextAuth from 'next-auth'
import { authOptions } from '@/lib/auth'

const handler = async (req: Request, res: any) => {
  const host = req.headers.get('host')
  if (host) {
    process.env.NEXTAUTH_URL = `http://${host}`
  }
  return NextAuth(authOptions)(req, res)
}

export { handler as GET, handler as POST }
