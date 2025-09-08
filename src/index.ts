import type { AuthOptions } from 'next-auth'

/**
 * This function had to be added because the `next-auth/prisma-adapter` adapter has an import from `@prisma/client`.
 * However, since the client can be located anywhere (e.g. in `~/prisma/client`),
 * it can not be found in `@prisma/client` and this leads to an error with the official adapter.
 *
 * The code below was taken from the next-auth repo. The types were added to not depend on Prisma types at all.
 * Next-Auth@4.21.1: https://github.com/nextauthjs/next-auth/blob/next-auth%404.21.1/packages/adapter-prisma/src/index.ts
 */
type Adapter = Exclude<AuthOptions['adapter'], undefined>
type AdapterAccount = Parameters<Adapter['linkAccount']>[0]
type AdapterSession = Awaited<ReturnType<Adapter['createSession']>>
type AdapterUser = Awaited<ReturnType<Adapter['createUser']>>
type VerificationToken = Exclude<Awaited<ReturnType<Exclude<Adapter['useVerificationToken'], undefined>>>, null>

interface PrismaClient {
  account: {
    create: (args: Data<AdapterAccount>) => Promise<Omit<AdapterAccount, 'type'> & { type: string }>
    findUnique: (args: { where: PrismaAccountWhereUniqueInput, select: { user: true } }) => Promise<{ user: AdapterUser } | null>
    delete: (args: Where<PrismaAccountWhereUniqueInput>) => void
  }

  session: {
    create: (args: Data<AdapterSession>) => Promise<AdapterSession>
    findUnique: (args: { where: PrismaSessionWhereUniqueInput, include: { user: true } }) => Promise<AdapterSession & { user: AdapterUser } | null>
    update: (args: WhereAndData<PrismaSessionWhereUniqueInput, Partial<AdapterSession> & Pick<AdapterSession, 'sessionToken'>>) => Promise<AdapterSession>
    delete: (args: Where<PrismaSessionWhereUniqueInput>) => Promise<AdapterSession>
  }

  user: {
    create: (args: Data<Omit<AdapterUser, 'id'>>) => Promise<AdapterUser>
    findUnique: (args: Where<PrismaUserWhereUniqueInput>) => Promise<AdapterUser | null>
    update: (args: WhereAndData<PrismaUserWhereUniqueInput, Partial<AdapterUser>>) => Promise<AdapterUser>
    delete: (args: Where<PrismaUserWhereUniqueInput>) => Promise<AdapterUser>
  }

  verificationToken: {
    create: (args: Data<VerificationToken>) => Promise<VerificationToken>
    delete: (args: Where<{ identifier_token: Pick<VerificationToken, 'identifier' | 'token'> }>) => Promise<VerificationToken>
  }
}

interface Where<T> {
  where: T
}

interface Data<D> {
  data: D
}

interface WhereAndData<W, D> extends Where<W>, Data<D> {}

type PrismaUserWhereUniqueInput = { id: string } | { email: string }
interface PrismaAccountWhereUniqueInput { provider_providerAccountId: Pick<AdapterAccount, 'provider' | 'providerAccountId'> }
interface PrismaSessionWhereUniqueInput { sessionToken: string }

interface PrismaClientKnownRequestError {
  code: string
}

export function PrismaAdapter(p: PrismaClient): Adapter {
  return {
    createUser: data => p.user.create({ data }),
    getUser: id => p.user.findUnique({ where: { id } }),
    getUserByEmail: email => p.user.findUnique({ where: { email } }),
    async getUserByAccount(provider_providerAccountId) {
      const account = await p.account.findUnique({
        where: { provider_providerAccountId },
        select: { user: true },
      })
      return account?.user ?? null
    },
    updateUser: ({ id, ...data }) => p.user.update({ where: { id }, data }),
    deleteUser: id => p.user.delete({ where: { id } }),
    linkAccount: data =>
      p.account.create({ data }) as unknown as AdapterAccount,
    unlinkAccount: provider_providerAccountId =>
      p.account.delete({
        where: { provider_providerAccountId },
      }) as unknown as AdapterAccount,
    async getSessionAndUser(sessionToken) {
      const userAndSession = await p.session.findUnique({
        where: { sessionToken },
        include: { user: true },
      })
      if (!userAndSession) {
        return null
      }
      const { user, ...session } = userAndSession
      return { user, session }
    },
    createSession: data => p.session.create({ data }),
    updateSession: data =>
      p.session.update({ where: { sessionToken: data.sessionToken }, data }),
    deleteSession: sessionToken =>
      p.session.delete({ where: { sessionToken } }),
    async createVerificationToken(data) {
      const verificationToken = await p.verificationToken.create({ data })
      // @ts-expect-errors // MongoDB needs an ID, but we don't
      if (verificationToken.id) {
        // @ts-expect-errors // MongoDB needs an ID, but we don't
        delete verificationToken.id
      }
      return verificationToken
    },
    async useVerificationToken(identifier_token) {
      try {
        const verificationToken = await p.verificationToken.delete({
          where: { identifier_token },
        })
        // @ts-expect-errors // MongoDB needs an ID, but we don't
        if (verificationToken.id) {
          // @ts-expect-errors // MongoDB needs an ID, but we don't
          delete verificationToken.id
        }
        return verificationToken
      }
      catch (error) {
        // If token already used/deleted, just return null
        // https://www.prisma.io/docs/reference/api-reference/error-reference#p2025
        if ((error as PrismaClientKnownRequestError).code === 'P2025') {
          return null
        }
        throw error
      }
    },
  }
}
