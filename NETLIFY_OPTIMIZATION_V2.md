# Netlify Optimization Analysis V2 & Action Plan

## 🔍 Deep Dive Analysis (Post-Fix Review)

The previous optimization pass made significant improvements (commenting out heavy components, creating caching hooks), but **two critical architectural issues remain** that are driving the 110k+ serverless function invocations.

### 1. 🔴 Critical: The Site is Still 100% SSR (Server-Side Rendered)
**The Problem:**
Next.js with dynamic routes (`[locale]`) requires the `generateStaticParams` function to pre-render pages at build time (SSG).
Currently, `src/app/[locale]/layout.tsx` **does not export** `generateStaticParams`.

**The Consequence:**
Because this function is missing, Next.js defaults to **on-demand Server-Side Rendering**.
*   Every single visitor to the home page triggers a Serverless Function execution.
*   Every visitor to `/sobre`, `/cursos`, etc., triggers a function.
*   **100 visitors = 100 function calls**, even if the content hasn't changed.

**The Fix:**
We must export `generateStaticParams` in `layout.tsx` to tell Next.js: "Please build `pt-BR` and `en` versions of these pages once at build time, and serve them as static HTML files."
*   **Expected Impact:** ~90% reduction in function calls for public pages.

### 2. 🟠 Major: The Caching Hook is Unused
**The Problem:**
A sophisticated caching hook `src/hooks/useDashboard.ts` was created to deduplicate requests and cache dashboard data for 5 minutes.
However, upon inspection of `src/app/[locale]/(site)/portal/page.tsx`, **this hook is not being used**. The page still performs a raw `fetch('/api/user/dashboard')` inside a `useEffect` on every mount.

**The Consequence:**
*   Every time a user navigates between tabs or refreshes the portal, a heavy API call is made.
*   This API call performs database writes (daily check-in logic), making it slower and more resource-intensive.

**The Fix:**
Refactor `PortalPage` to actually use the `useDashboard` hook that was created.

---

## 🚀 Action Plan

### Step 1: Enable Static Site Generation (SSG)
**Target:** `src/app/[locale]/layout.tsx`
**Action:** Add `generateStaticParams` to pre-render the localized routes.

### Step 2: Implement Dashboard Caching
**Target:** `src/app/[locale]/(site)/portal/page.tsx`
**Action:** Replace the manual `fetch` logic with the `useDashboard` hook.
**Target:** `src/app/[locale]/(site)/portal/layout.tsx` (if exists, or verify where else dashboard data might be fetched).

### Step 3: Verify & Monitor
**Action:** Ensure the build output shows `● (SSG) automatically generated as static HTML + JSON` for the page routes instead of `λ (Server) server-side renders at runtime`.

---

## 📉 Expected Result
This plan specifically targets the discrepancy between "Web Requests" (127k) and "Function Invocations" (110k). By moving public pages to SSG, Function Invocations should drop drastically, detaching from Web Requests volume.
