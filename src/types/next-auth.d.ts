// NextAuth type augmentation
import 'next-auth'
import 'next-auth/jwt'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      name?: string | null
      email?: string | null
      username: string
      role: string
      factory: string
      shift: string | null
    }
  }

  interface User {
    id: string
    name?: string | null
    username: string
    role: string
    factory: string
    shift: string | null
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    username: string
    role: string
    factory: string
    shift: string | null
  }
}
