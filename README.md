# @sidebase/authjs-prisma-adapter

<!-- Badges Start -->
<p>
  <a href="https://npmjs.com/package/@sidebase/nuxt-auth">
    <img src="https://img.shields.io/npm/v/@sidebase/authjs-prisma-adapter.svg?style=flat-square&colorA=202128&colorB=36936A" alt="Version">
  </a>
  <a href="https://npmjs.com/package/@sidebase/nuxt-auth">
    <img src="https://img.shields.io/npm/dm/@sidebase/authjs-prisma-adapter.svg?style=flat-square&colorA=202128&colorB=36936A" alt="Downloads">
  </a>
  <a href="https://github.com/sidebase/nuxt-auth/stargazers">
    <img src="https://img.shields.io/github/stars/sidebase/authjs-prisma-adapter.svg?style=flat-square&colorA=202128&colorB=36936A" alt="Downloads">
  </a>
  <a href="https://github.com/sidebase/nuxt-auth/blob/main/LICENSE">
    <img src="https://img.shields.io/github/license/sidebase/authjs-prisma-adapter.svg?style=flat-square&colorA=202128&colorB=36936A" alt="License">
  </a>
  <a href="https://auth.sidebase.io">
    <img src="https://img.shields.io/badge/Docs-202128?style=flat-square&logo=gitbook&logoColor=DDDDD4" alt="Docs">
  </a>
  <a href="https://x.com/sidebase_io">
    <img src="https://img.shields.io/badge/Follow_us-202128?style=flat-square&logo=X&logoColor=DDDDD4" alt="Follow us on X">
  </a>
  <a href="https://discord.gg/NDDgQkcv3s">
    <img src="https://img.shields.io/badge/Join_our_Discord-202128?style=flat-square&logo=discord&logoColor=DDDDD4" alt="Join our Discord">
  </a>
</p>
<!-- Badges End -->

A **type-compatible [NextAuth.js](https://next-auth.js.org/) Prisma adapter** for Prisma 6, designed for projects where the Prisma client is not located at `@prisma/client`.

This solves the problem with the official [`@next-auth/prisma-adapter`](https://github.com/nextauthjs/next-auth/tree/main/packages/adapter-prisma), which hardcodes an import from `@prisma/client`.
In Nuxt or custom setups (e.g. when the client lives at `~/prisma/client`), that import path cannot be resolved and breaks builds.

This adapter avoids the dependency on Prisma types and lets you use your own Prisma client instance.

The adapter is primarily meant for use with [`@sidebase/nuxt-auth`](https://github.com/sidebase/nuxt-auth) module.

## Installation

```bash
npm install @sidebase/authjs-prisma-adapter
# or
pnpm add @sidebase/authjs-prisma-adapter
````

## Usage

```ts
// server/api/auth/[...].ts
import { PrismaAdapter } from '@sidebase/authjs-prisma-adapter'
import { NuxtAuthHandler } from '#auth'

// Import your Prisma client (can live anywhere in your project)
import { prisma } from '~/prisma/client'

export default NuxtAuthHandler({
  adapter: PrismaAdapter(prisma),
  // ... other configuration
})
```

## Why not the official adapter?

* The official `@next-auth/prisma-adapter` directly imports from `@prisma/client`.
* In Nuxt or monorepo setups, Prisma 6 can be generated in a custom path (e.g. `~/prisma/client`).
* That import fails, making the official adapter unusable.

This adapter re-implements the same logic from [next-auth@4.21.1](https://github.com/nextauthjs/next-auth/blob/d69f311ddcc328d234c286ddef83f1d5934ea1fb/packages/adapter-prisma/src/index.ts), but without importing `@prisma/client`.

## API

```ts
function PrismaAdapter(prisma: PrismaClient): Adapter
```

* **`prisma`**: Your own Prisma client instance.
* Returns a NextAuth-compatible `Adapter`.

## Compatibility

* **prisma**: `^6.0.0`
* **next-auth**: `4.21.1`

## License

MIT

