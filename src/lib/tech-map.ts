// src/lib/tech-map.ts
// Maps npm package names → their official documentation URLs.
// The Gemini engine ONLY reads from these URLs — never from its training data.

export interface TechEntry {
  /** Human-readable name shown in the UI */
  name: string
  /** Primary documentation page Gemini will read */
  docsUrl: string
  /** Optional migration / upgrade guide */
  migrationUrl?: string
  /** Optional changelog / release notes page */
  changelogUrl?: string
}

export const TECH_DOC_MAP: Record<string, TechEntry> = {
  // ── React ──────────────────────────────────────────────────────────────────
  react: {
    name: 'React',
    docsUrl: 'https://react.dev/reference/react',
    changelogUrl: 'https://react.dev/versions',
    migrationUrl: 'https://react.dev/blog/2024/04/25/react-19-upgrade-guide',
  },
  'react-dom': {
    name: 'React DOM',
    docsUrl: 'https://react.dev/reference/react-dom',
  },
  'react-server-dom-webpack': {
    name: 'React Server Components',
    docsUrl: 'https://react.dev/reference/rsc/server-components',
  },

  // ── TanStack ───────────────────────────────────────────────────────────────
  '@tanstack/react-router': {
    name: 'TanStack Router',
    docsUrl: 'https://tanstack.com/router/latest/docs/framework/react/overview',
    migrationUrl: 'https://tanstack.com/router/latest/docs/framework/react/migrate-from-react-location',
  },
  '@tanstack/react-start': {
    name: 'TanStack Start',
    docsUrl: 'https://tanstack.com/start/latest/docs/framework/react/overview',
  },
  '@tanstack/react-query': {
    name: 'TanStack Query',
    docsUrl: 'https://tanstack.com/query/latest/docs/framework/react/overview',
    migrationUrl: 'https://tanstack.com/query/latest/docs/framework/react/guides/migrating-to-v5',
  },
  '@tanstack/react-table': {
    name: 'TanStack Table',
    docsUrl: 'https://tanstack.com/table/latest/docs/introduction',
    migrationUrl: 'https://tanstack.com/table/latest/docs/guide/migrating',
  },
  '@tanstack/react-form': {
    name: 'TanStack Form',
    docsUrl: 'https://tanstack.com/form/latest/docs/overview',
  },
  '@tanstack/react-virtual': {
    name: 'TanStack Virtual',
    docsUrl: 'https://tanstack.com/virtual/latest/docs/introduction',
  },

  // ── Meta-frameworks ────────────────────────────────────────────────────────
  next: {
    name: 'Next.js',
    docsUrl: 'https://nextjs.org/docs/app/getting-started',
    migrationUrl: 'https://nextjs.org/docs/app/building-your-application/upgrading/version-15',
    changelogUrl: 'https://nextjs.org/blog',
  },
  nuxt: {
    name: 'Nuxt',
    docsUrl: 'https://nuxt.com/docs/getting-started/introduction',
  },
  remix: {
    name: 'Remix',
    docsUrl: 'https://remix.run/docs/en/main/start/quickstart',
    migrationUrl: 'https://remix.run/docs/en/main/start/v2',
  },
  '@remix-run/react': {
    name: 'Remix React',
    docsUrl: 'https://remix.run/docs/en/main/components/links',
  },
  gatsby: {
    name: 'Gatsby',
    docsUrl: 'https://www.gatsbyjs.com/docs/',
  },
  astro: {
    name: 'Astro',
    docsUrl: 'https://docs.astro.build/en/getting-started/',
    migrationUrl: 'https://docs.astro.build/en/guides/upgrade-to/v5/',
  },
  svelte: {
    name: 'Svelte',
    docsUrl: 'https://svelte.dev/docs/introduction',
    migrationUrl: 'https://svelte.dev/docs/v5-migration-guide',
  },
  '@sveltejs/kit': {
    name: 'SvelteKit',
    docsUrl: 'https://svelte.dev/docs/kit/introduction',
  },

  // ── Build tools ────────────────────────────────────────────────────────────
  vite: {
    name: 'Vite',
    docsUrl: 'https://vitejs.dev/guide/',
    changelogUrl: 'https://vitejs.dev/changelog',
    migrationUrl: 'https://vitejs.dev/guide/migration',
  },
  '@vitejs/plugin-react': {
    name: 'Vite React Plugin',
    docsUrl: 'https://vitejs.dev/plugins/',
  },
  '@vitejs/plugin-react-swc': {
    name: 'Vite React SWC Plugin',
    docsUrl: 'https://vitejs.dev/plugins/',
  },
  webpack: {
    name: 'Webpack',
    docsUrl: 'https://webpack.js.org/concepts/',
    migrationUrl: 'https://webpack.js.org/migrate/5/',
  },
  turbopack: {
    name: 'Turbopack',
    docsUrl: 'https://turbo.build/pack/docs',
  },
  esbuild: {
    name: 'esbuild',
    docsUrl: 'https://esbuild.github.io/api/',
    changelogUrl: 'https://esbuild.github.io/news/',
  },
  rollup: {
    name: 'Rollup',
    docsUrl: 'https://rollupjs.org/guide/en/',
  },
  parcel: {
    name: 'Parcel',
    docsUrl: 'https://parceljs.org/docs/',
  },

  // ── TypeScript ─────────────────────────────────────────────────────────────
  typescript: {
    name: 'TypeScript',
    docsUrl: 'https://www.typescriptlang.org/docs/handbook/intro.html',
    changelogUrl: 'https://www.typescriptlang.org/docs/handbook/release-notes/overview.html',
  },

  // ── CSS / Styling ──────────────────────────────────────────────────────────
  tailwindcss: {
    name: 'Tailwind CSS',
    docsUrl: 'https://tailwindcss.com/docs/installation',
    changelogUrl: 'https://tailwindcss.com/blog',
    migrationUrl: 'https://tailwindcss.com/docs/upgrade-guide',
  },
  '@tailwindcss/vite': {
    name: 'Tailwind CSS Vite Plugin',
    docsUrl: 'https://tailwindcss.com/docs/installation/using-vite',
  },
  'styled-components': {
    name: 'Styled Components',
    docsUrl: 'https://styled-components.com/docs',
  },
  '@emotion/react': {
    name: 'Emotion React',
    docsUrl: 'https://emotion.sh/docs/introduction',
  },
  'sass': {
    name: 'Sass',
    docsUrl: 'https://sass-lang.com/documentation/',
    migrationUrl: 'https://sass-lang.com/documentation/breaking-changes/',
  },

  // ── Database / ORM ─────────────────────────────────────────────────────────
  'drizzle-orm': {
    name: 'Drizzle ORM',
    docsUrl: 'https://orm.drizzle.team/docs/overview',
  },
  '@neondatabase/serverless': {
    name: 'Neon Serverless Driver',
    docsUrl: 'https://neon.tech/docs/serverless/serverless-driver',
  },
  prisma: {
    name: 'Prisma',
    docsUrl: 'https://www.prisma.io/docs/getting-started',
    migrationUrl: 'https://www.prisma.io/docs/guides/upgrade-guides',
    changelogUrl: 'https://www.prisma.io/blog/releases',
  },
  '@prisma/client': {
    name: 'Prisma Client',
    docsUrl: 'https://www.prisma.io/docs/concepts/components/prisma-client',
  },
  mongoose: {
    name: 'Mongoose',
    docsUrl: 'https://mongoosejs.com/docs/index.html',
    migrationUrl: 'https://mongoosejs.com/docs/migrating_to_8.html',
  },
  kysely: {
    name: 'Kysely',
    docsUrl: 'https://kysely.dev/docs/intro',
  },
  typeorm: {
    name: 'TypeORM',
    docsUrl: 'https://typeorm.io/getting-started',
  },
  sequelize: {
    name: 'Sequelize',
    docsUrl: 'https://sequelize.org/docs/v6/getting-started/',
    migrationUrl: 'https://sequelize.org/docs/v6/other-topics/upgrade-to-v6/',
  },

  // ── Authentication ─────────────────────────────────────────────────────────
  'better-auth': {
    name: 'Better Auth',
    docsUrl: 'https://www.better-auth.com/docs/introduction',
  },
  'next-auth': {
    name: 'NextAuth.js / Auth.js',
    docsUrl: 'https://authjs.dev/getting-started',
    migrationUrl: 'https://authjs.dev/getting-started/migrating-to-v5',
  },
  '@auth/core': {
    name: 'Auth.js Core',
    docsUrl: 'https://authjs.dev/getting-started',
  },
  lucia: {
    name: 'Lucia',
    docsUrl: 'https://lucia-auth.com/getting-started/',
  },
  '@clerk/nextjs': {
    name: 'Clerk Next.js',
    docsUrl: 'https://clerk.com/docs/quickstarts/nextjs',
  },
  '@clerk/clerk-react': {
    name: 'Clerk React',
    docsUrl: 'https://clerk.com/docs/quickstarts/react',
  },

  // ── API / Server ───────────────────────────────────────────────────────────
  hono: {
    name: 'Hono',
    docsUrl: 'https://hono.dev/docs/getting-started/basic',
    migrationUrl: 'https://hono.dev/docs/migration/v4',
  },
  express: {
    name: 'Express.js',
    docsUrl: 'https://expressjs.com/en/5x/api.html',
    migrationUrl: 'https://expressjs.com/en/guide/migrating-5.html',
  },
  fastify: {
    name: 'Fastify',
    docsUrl: 'https://fastify.dev/docs/latest/',
    migrationUrl: 'https://fastify.dev/docs/latest/Guides/Migration-Guide-V5/',
  },
  koa: {
    name: 'Koa',
    docsUrl: 'https://koajs.com/',
  },
  '@trpc/server': {
    name: 'tRPC Server',
    docsUrl: 'https://trpc.io/docs/server/routers',
    migrationUrl: 'https://trpc.io/docs/migrate-from-v10-to-v11',
  },
  '@trpc/client': {
    name: 'tRPC Client',
    docsUrl: 'https://trpc.io/docs/client/vanilla',
  },
  '@trpc/react-query': {
    name: 'tRPC React Query',
    docsUrl: 'https://trpc.io/docs/client/react',
  },
  graphql: {
    name: 'GraphQL.js',
    docsUrl: 'https://graphql.org/learn/',
  },

  // ── State management ───────────────────────────────────────────────────────
  zustand: {
    name: 'Zustand',
    docsUrl: 'https://zustand.docs.pmnd.rs/getting-started/introduction',
  },
  jotai: {
    name: 'Jotai',
    docsUrl: 'https://jotai.org/docs/introduction',
  },
  redux: {
    name: 'Redux',
    docsUrl: 'https://redux.js.org/introduction/getting-started',
  },
  '@reduxjs/toolkit': {
    name: 'Redux Toolkit',
    docsUrl: 'https://redux-toolkit.js.org/introduction/getting-started',
    migrationUrl: 'https://redux-toolkit.js.org/migrations/migrating-rtk-2',
  },
  recoil: {
    name: 'Recoil',
    docsUrl: 'https://recoiljs.org/docs/introduction/getting-started',
  },
  valtio: {
    name: 'Valtio',
    docsUrl: 'https://valtio.dev/docs/introduction/getting-started',
  },
  mobx: {
    name: 'MobX',
    docsUrl: 'https://mobx.js.org/README.html',
    migrationUrl: 'https://mobx.js.org/migrating-from-4-or-5.html',
  },

  // ── Forms ──────────────────────────────────────────────────────────────────
  'react-hook-form': {
    name: 'React Hook Form',
    docsUrl: 'https://react-hook-form.com/docs',
    migrationUrl: 'https://react-hook-form.com/docs/migrate-v7',
  },
  formik: {
    name: 'Formik',
    docsUrl: 'https://formik.org/docs/overview',
  },

  // ── Validation ─────────────────────────────────────────────────────────────
  zod: {
    name: 'Zod',
    docsUrl: 'https://zod.dev/?id=introduction',
    migrationUrl: 'https://zod.dev/?id=changelog',
  },
  yup: {
    name: 'Yup',
    docsUrl: 'https://github.com/jquense/yup#readme',
  },
  valibot: {
    name: 'Valibot',
    docsUrl: 'https://valibot.dev/guides/introduction/',
  },

  // ── Animation ─────────────────────────────────────────────────────────────
  'framer-motion': {
    name: 'Framer Motion',
    docsUrl: 'https://www.framer.com/motion/introduction/',
  },
  motion: {
    name: 'Motion',
    docsUrl: 'https://motion.dev/docs/react-quick-start',
  },
  '@react-spring/web': {
    name: 'React Spring',
    docsUrl: 'https://www.react-spring.dev/docs/getting-started',
  },

  // ── UI component libraries ─────────────────────────────────────────────────
  'radix-ui': {
    name: 'Radix UI',
    docsUrl: 'https://www.radix-ui.com/primitives/docs/overview/introduction',
  },
  '@radix-ui/themes': {
    name: 'Radix UI Themes',
    docsUrl: 'https://www.radix-ui.com/themes/docs/overview/getting-started',
  },
  '@headlessui/react': {
    name: 'Headless UI React',
    docsUrl: 'https://headlessui.com/',
    migrationUrl: 'https://headlessui.com/react/changelog',
  },
  '@mui/material': {
    name: 'Material UI',
    docsUrl: 'https://mui.com/material-ui/getting-started/',
    migrationUrl: 'https://mui.com/material-ui/migration/upgrade-to-v6/',
  },
  '@chakra-ui/react': {
    name: 'Chakra UI',
    docsUrl: 'https://www.chakra-ui.com/docs/get-started/installation',
    migrationUrl: 'https://www.chakra-ui.com/docs/get-started/migration',
  },
  'antd': {
    name: 'Ant Design',
    docsUrl: 'https://ant.design/docs/react/getting-started',
    migrationUrl: 'https://ant.design/docs/react/migration-v5',
  },

  // ── Testing ────────────────────────────────────────────────────────────────
  vitest: {
    name: 'Vitest',
    docsUrl: 'https://vitest.dev/guide/',
    migrationUrl: 'https://vitest.dev/guide/migration',
  },
  jest: {
    name: 'Jest',
    docsUrl: 'https://jestjs.io/docs/getting-started',
    migrationUrl: 'https://jestjs.io/docs/upgrading-to-jest29',
  },
  '@testing-library/react': {
    name: 'Testing Library React',
    docsUrl: 'https://testing-library.com/docs/react-testing-library/intro/',
    migrationUrl: 'https://testing-library.com/docs/react-testing-library/migrate-from-enzyme',
  },
  playwright: {
    name: 'Playwright',
    docsUrl: 'https://playwright.dev/docs/intro',
    changelogUrl: 'https://playwright.dev/docs/release-notes',
  },
  cypress: {
    name: 'Cypress',
    docsUrl: 'https://docs.cypress.io/guides/overview/why-cypress',
    migrationUrl: 'https://docs.cypress.io/guides/references/migration-guide',
  },

  // ── HTTP clients ──────────────────────────────────────────────────────────
  axios: {
    name: 'Axios',
    docsUrl: 'https://axios-http.com/docs/intro',
    migrationUrl: 'https://axios-http.com/docs/notes',
  },
  swr: {
    name: 'SWR',
    docsUrl: 'https://swr.vercel.app/docs/getting-started',
    migrationUrl: 'https://swr.vercel.app/docs/advanced/migration',
  },

  // ── Cloudflare ─────────────────────────────────────────────────────────────
  wrangler: {
    name: 'Wrangler',
    docsUrl: 'https://developers.cloudflare.com/workers/wrangler/commands/',
    changelogUrl: 'https://developers.cloudflare.com/workers/wrangler/changelog/',
  },
  '@cloudflare/vite-plugin': {
    name: 'Cloudflare Vite Plugin',
    docsUrl: 'https://developers.cloudflare.com/workers/frameworks/framework-guides/react-tanstack/',
  },

  // ── Linting / Formatting ──────────────────────────────────────────────────
  eslint: {
    name: 'ESLint',
    docsUrl: 'https://eslint.org/docs/latest/use/getting-started',
    migrationUrl: 'https://eslint.org/docs/latest/use/migrate-to-9.0.0',
  },
  prettier: {
    name: 'Prettier',
    docsUrl: 'https://prettier.io/docs/en/index.html',
    migrationUrl: 'https://prettier.io/blog/2024/01/12/prettier-3-2',
  },
  biome: {
    name: 'Biome',
    docsUrl: 'https://biomejs.dev/guides/getting-started/',
    migrationUrl: 'https://biomejs.dev/guides/migrate-eslint-prettier/',
  },

  // ── Utilities ─────────────────────────────────────────────────────────────
  'date-fns': {
    name: 'date-fns',
    docsUrl: 'https://date-fns.org/docs/Getting-Started',
    migrationUrl: 'https://date-fns.org/v3.6.0/docs/Upgrade-Guide',
  },
  dayjs: {
    name: 'Day.js',
    docsUrl: 'https://day.js.org/docs/en/installation/installation',
  },
  lodash: {
    name: 'Lodash',
    docsUrl: 'https://lodash.com/docs/',
  },
  immer: {
    name: 'Immer',
    docsUrl: 'https://immerjs.github.io/immer/',
  },
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

export interface DetectedTech extends TechEntry {
  /** The npm package name (key in package.json) */
  package: string
  /** Version string from package.json (with range chars stripped) */
  version: string
}

/**
 * Given a flat list of {name, version} deps from package.json,
 * returns only those we have documentation entries for.
 */
export function detectTechStack(
  deps: Array<{ name: string; version: string }>,
): DetectedTech[] {
  return deps
    .filter((dep) => dep.name in TECH_DOC_MAP)
    .map((dep) => ({
      package: dep.name,
      // strip semver range characters so we get "19.2.5" not "^19.2.5"
      version: dep.version.replace(/[^0-9.]/g, '').trim() || dep.version,
      ...TECH_DOC_MAP[dep.name],
    }))
}

/**
 * Returns all documentation URLs for a detected tech stack.
 * Includes both the primary docs URL and migration/changelog URLs when present.
 */
export function collectDocUrls(stack: DetectedTech[]): Array<{ tech: string; url: string; type: 'docs' | 'migration' | 'changelog' }> {
  const urls: Array<{ tech: string; url: string; type: 'docs' | 'migration' | 'changelog' }> = []
  for (const tech of stack) {
    urls.push({ tech: tech.name, url: tech.docsUrl, type: 'docs' })
    if (tech.migrationUrl) urls.push({ tech: tech.name, url: tech.migrationUrl, type: 'migration' })
    if (tech.changelogUrl) urls.push({ tech: tech.name, url: tech.changelogUrl, type: 'changelog' })
  }
  return urls
}
