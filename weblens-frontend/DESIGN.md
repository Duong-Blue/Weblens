# WebLens Frontend Design System

This document outlines the visual language, design tokens, and components for the WebLens frontend. Currently synthesized from the existing un-unified styles to establish a strong "Linear-like" modern SaaS aesthetic as the baseline for future refactoring.

## 1. Design Tokens

### Color Palette

The current palette relies heavily on Tailwind's default colors, leaning toward cool grays (zinc) and bright blues, but is applied inconsistently (mixing gray and zinc, mixing borders).

**Primary:**
- `blue-500` / `blue-600` (Main CTA, active states, branding: #2563EB)
- `blue-700` (Hover states)
- `blue-50` (Subtle backgrounds)

**Neutral / Surface:**
- `white` (Main cards, form inputs)
- `zinc-50` / `gray-50` (App backgrounds)
- `zinc-100` / `zinc-200` / `gray-200` (Borders, dividers, subtle secondary fills)
- `zinc-900` / `gray-900` (Primary text, dark headers, dark CTAs)
- `zinc-500` / `gray-500` / `zinc-600` / `gray-600` (Secondary text, descriptions, placeholders)

**Semantic:**
- Success: `green-500` / `green-600`
- Error/Warning: `red-100` (bg), `red-600` (text)

*Decision going forward: Standardize strictly on `zinc` for all neutrals to maintain a clean, slightly cool/modern feel. Drop all `gray` usage.*

### Typography

Using `geist-sans` and `geist-mono` (via `globals.css` variables, though currently overridden by a raw `font-family: Arial, Helvetica, sans-serif` in the body tag which needs removing). The app relies on Tailwind's default scale.

- **Headings:**
  - Hero (H1): `text-4xl sm:text-6xl font-bold tracking-tight leading-[1.1]`
  - Section (H2): `text-xl sm:text-2xl font-bold text-zinc-900`
  - Sub-section (H3): `text-lg font-semibold`
- **Body:**
  - Primary: `text-base text-zinc-900` (implicitly)
  - Secondary/Descriptions: `text-lg text-zinc-500` (Hero subtitle)
  - UI Text (Labels, small links): `text-sm font-medium`
  - Micro-copy (Caps headers): `text-xs font-semibold uppercase tracking-widest` (Used for "Status" labels and metric headers)

*Decision going forward: Ensure `geist` fonts are actually active. Keep tight tracking (`tracking-tight`) on large headers. Use the uppercase micro-copy pattern heavily for data labels.*

### Shadows & Depth

- **Cards:** `shadow-sm border border-zinc-200/80` (Clean, flat aesthetic)
- **Floating/Elevated (Hero Audit Card):** `shadow-[0_8px_40px_rgb(0,0,0,0.04)] ring-1 ring-zinc-900/5 backdrop-blur-xl`
- **Inputs:** `focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500` (Soft focus rings)

*Decision going forward: Default to very subtle borders (`border-zinc-200`) instead of heavy shadows for standard cards. Use the strong soft shadow + ring for primary focal points.*

## 2. Layout & Spacing

- **App Container:** `max-w-7xl mx-auto px-4 sm:px-6 lg:px-8` (Dashboard) and `max-w-5xl px-6 sm:px-16` (Home)
- **Spacing Scale:** heavily relies on Tailwind 4px grid.
  - Page padding: `py-8` to `py-16`
  - Component gaps: `gap-4` to `gap-6`
  - Card padding: `p-6`, `p-8`
- **Border Radius:**
  - Standard Inputs/Buttons: `rounded` (4px) to `rounded-md`
  - Cards: `rounded-xl`
  - Pills: `rounded-full`

*Decision going forward: Unify Border Radius. Inputs/Buttons should be `rounded-md` or `rounded-lg` (not raw `rounded`). Cards should consistently be `rounded-xl`.*

## 3. Motion & Transitions

Currently minimal, focused on functional feedback:
- **Hover:** `transition-all` or `transition-colors`, usually combined with a background color shift or slight shadow increase.
- **Active:** `active:scale-[0.98]` (Nice tactile button press on the home page)
- **Loading states:** `animate-spin` on custom SVG/div spinners, `animate-pulse` on text.
- **Decorations:** `animate-ping` (used on the 'Live' indicator pill).

*Decision going forward: Apply `transition-all duration-200` to all interactive elements. Retain the `active:scale-[0.98]` for primary buttons.*

## 4. Component Primitives (To Be Built)

Based on the existing codebase, we need the following reusable primitives to stop the current div-soup and copy-pasted Tailwind strings:

1. **Button (`<Button />`)**
   - Variants: `primary` (blue), `dark` (zinc-900), `outline`, `ghost`
   - Sizes: `sm`, `md`, `lg`
   - States: hover, focus, disabled, loading

2. **Input (`<Input />`)**
   - Standardized border, padding, and focus ring.
   - Includes label and error message slots.

3. **Card (`<Card />`)**
   - Sub-components: `CardHeader`, `CardContent`, `CardTitle`
   - Standardized `rounded-xl border border-zinc-200 bg-white shadow-sm`.

4. **Badge / Pill (`<Badge />`)**
   - Variants: `success`, `warning`, `info`, `neutral`
   - Used for statuses and tech stack tags.

## 5. Themes (Light/Dark Mode)

- Currently, `globals.css` defines a dark mode media query, but the classes in the `.tsx` files (e.g., `bg-white`, `text-zinc-900`) are strictly hardcoded for Light Mode.
- *Decision:* We will focus entirely on a polished **Light Mode** first, ignoring dark mode until the light mode primitives are perfectly consistent.

## 6. Implementation Rules (Tech)

- **Styling:** Tailwind CSS (v4 inline theme detected in `globals.css`).
- **Icons:** We should standardize on Lucide-react (currently missing/inconsistent).
- **Class Merging:** Need to introduce `clsx` and `tailwind-merge` (e.g., a `cn()` utility) to handle component variant logic cleanly without conflicts.

## 7. Known Design Debt (To Fix)

- Inconsistent neutral colors (`gray` in auth/dashboard vs `zinc` in home).
- Inconsistent border radii (buttons are `rounded`, cards are `rounded-xl`).
- Global CSS overriding the Geist font variables with Arial.
- Auth pages (`login`, `register`) are visually disconnected from the polished Landing page (`page.tsx`), using harsh `bg-green-600` and basic `shadow-md` cards.
- Redundant layout containers between `layout.tsx`, `page.tsx`, and `dashboard/page.tsx`.