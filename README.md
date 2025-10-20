This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## FayaPoint AI Academy – Project Overview

Modern Next.js 15 app for courses and AI tools. The UI features glassmorphism, rich motion, and a structured course detail experience.

### UI Highlights
- **HeroSection**: 3D mouse tilt, gradient orbs, animated stats/CTAs. Particles are SSR-safe (no direct `window`).
- **Features/Testimonials**: Glass cards, parallax/floating background, animated ratings, and CTA buttons.
- **Course Detail (`src/app/curso/[slug]/page.tsx`)**: Clean hero + separate tabs (Overview, Curriculum, Reviews, Instructor). No stray JSX; robust fallbacks for data.

### Data & Types
- **`CourseData` alignment**: Removed assumptions like `totalRatings`, `language`, `instructor` object. Uses `testimonials` when available, with fallback to `reviews`.
- **Typed lists**: Introduced small types in `curso/[slug]/page.tsx` to avoid `any`.
- **Tools page typing**: `src/app/ferramentas/[slug]/page.tsx` uses a `Tool` type and guards optional arrays.

### SSR-safe animations
- Avoid `window` during render. In `HeroSection`, particle positions are precomputed via state and animated with offsets.
- Prefer CSS transforms and Framer Motion timelines for GPU-accelerated performance.

### CSS Utilities (in `src/app/globals.css`)
- Glassmorphism helpers: `glass`, `glass-sm`, `glass-lg`.
- Animations: `animate-gradient-xy`, `animate-float`, `animate-pulse-glow`, `animate-shimmer`.
- 3D: `transform-3d`, `hover-lift`.
- Glows: `shadow-glow`, `shadow-glow-pink`, `shadow-glow-cyan`.

### Lint & Build
- Next.js ESLint rules enforced; CI will fail on errors (e.g., `no-unescaped-entities`, `@next/next/no-html-link-for-pages`, `@typescript-eslint/no-explicit-any`).
- Replaced `<a href="/cursos">` with `Link` in `TestimonialsSection`.
- Removed `any` in key pages; added guards for optional arrays.

### SEO & Metadata
- `metadataBase` added in `src/app/layout.tsx` to remove Next.js warning when generating social images.

### Development
- Dev: `npm run dev`
- Build: `npm run build`
- Lint: `npm run lint` (ensure zero errors for CI)

### Deployment
- Netlify using `@netlify/plugin-nextjs`. Environment vars (example): `NEXTAUTH_SECRET`.

