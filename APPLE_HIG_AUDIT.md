# Design review: MobileShop web app

## Summary

**Rating: Good.** The app is a quiet, desktop-first operations tool. Its thesis is “see the shop at a glance, then act without friction,” and its memorable quality is restrained, data-dense surfaces with accent color reserved for primary actions and status. The Apple HIG pass focused on accessibility, semantic color, system typography, familiar navigation, and feedback rather than adding decoration.

Scope: this is a web app, so Apple’s platform conventions were translated as principles through `references/cross-platform.md`; native iOS/macOS components were not copied.

## Critical

None after this pass.

## Improvements applied

- **Muted text contrast was too low.** Small text used `text-crust-800/40`–`/65`, which blended to 2.16:1–3.93:1 on white. Raised all muted text to `/75`, or **6.59:1 on light surfaces** and **8.62:1 on dark surfaces**. Focus moved from amber (`#f59e0b`, 2.15:1 on white) to blue (`#2563eb`, **5.17:1**).
  - `accessibility.md › Vision`: “Strive to meet color contrast minimum standards… Up to 17 pts… 4.5:1.”
  - `color.md › Best practices`: semantic colors should adapt to appearance and accessibility settings.

- **Dark appearance and increased contrast added.** Replaced salon-specific `cream`/`crust` colors with semantic tokens (`canvas`, `surface`, `line`, `ink`, `accent`, `on-accent`, `focus`, `danger`) and light/dark/quality-query overrides. Contrast figures are documented in `src/app/globals.css`.
  - `accessibility.md › Vision`: “If your app supports Dark Mode, make sure to check the minimum contrast in both light and dark appearances.”
  - `color.md › Color management`: “Provide alternative appearances.”

- **System font stack and mobile type floor.** Switched display/body type to `-apple-system`, `BlinkMacSystemFont`, `SF Pro Text/Display`, with system fallbacks. Inputs, selects, and textareas use 16px on compact widths to avoid iOS zoom; hints, labels, eyebrows, badges, and stat labels moved from 11px to 12px.
  - `typography.md › Ensuring legibility`: “Use font sizes that most people can read easily.”
  - `typography.md › Using system fonts`: system fonts support optical sizing and consistent weights.

- **Touch targets.** Buttons now have a 44px minimum on compact widths (36px at `sm` and above), icon buttons are 44px on mobile, and the POS quantity stepper no longer overrides them with 32px controls.
  - `buttons.md › Best practices`: “A button needs a hit region of at least 44x44 pt.”
  - `accessibility.md › Mobility`: controls need comfortable target sizes and spacing.

- **Persistent left sidebar.** The navigation is now a fixed left rail at every width: an icon-only 72px rail on compact screens and a 264px labeled sidebar from `lg` upward. The active row is marked with `aria-current="page"`, labels are shortened where possible (`Sales`, `Staff`), and icon-only links and the sign-out control carry accessible names plus tooltips.
  - `sidebars.md › Best practices`: sidebars navigate top-level content and show current location.
  - `layout.md › Adaptability`: the same functions remain available as available space changes.

- **Tables are easier to read and navigate.** Added `scope="col"` to every header, kept horizontal scroll regions labeled and keyboard-focusable, unified subtle row dividers, and removed tinted salon shadows.
  - `lists-and-tables.md › Best practices`: tables should support scanning and interaction clearly.
  - `accessibility.md › Vision`: information must not depend on a single visual cue.

- **Chart made accessible and theme-aware.** The revenue chart uses CSS-variable colors for grid, axes, tooltip, and line, has an `aria-label`, and includes a visually hidden data table with a caption and row headers.
  - `charting-data.md › Best practices`: “Make every chart in your app accessible.”
  - `charting-data.md › Designing effective charts`: prefer familiar chart types and simple readings.

- **Sign-in improved.** Password remains unfilled on load, gained a labeled Show/Hide control, error text is linked with `aria-describedby`, the submit label changes to “Signing in…”, and demo accounts are filled by explicit user action rather than prepopulated passwords.
  - `text-fields.md › Best practices`: “Use secure text fields to hide private data.”
  - `entering-data.md › Best practices`: gather information from the system where possible and minimize typing.

- **Dialogs behave more like system sheets.** Native `<dialog>` already supplies top-layer modality and Escape; this pass added body scroll locking while open and kept focus on the dialog title on open. Destructive confirmations retain an explicit Cancel and a specific action title.
  - `modality.md › Best practices`: a modal should be a distinct, narrowly scoped task with a clear exit.
  - `alerts.md › Buttons`: use a specific title for destructive actions and always include Cancel.

- **Loading and feedback states kept intentional.** Spinners carry `role="status"` and hidden labels; errors use `role="alert"` with a retry action; toasts use `aria-live` and distinct roles. Motion remains brief and is disabled under `prefers-reduced-motion`; backdrop blur is disabled under `prefers-reduced-transparency`.
  - `loading.md › Best practices`: show something as soon as possible and communicate loading.
  - `feedback.md › Best practices`: make feedback accessible and match its interruption level to the information.
  - `motion.md › Best practices`: motion should be purposeful, brief, cancellable, and optional.

## What works

- One accent color carries primary actions, links, the active nav row, and the chart line; status colors carry status only.
- The dashboard’s four metric cards establish a clear reading order, followed by trend, detail, and alert content.
- Forms use persistent labels, logical tab order, and inline validation rather than blocking alerts.
- Empty, loading, and error states are deliberate components instead of bare text.
- The app remains a quiet utility; no decorative hero or personality overload was added.

## Platform notes

- Desktop: a persistent leading sidebar, keyboard focus rings, hover and press states, and fluid grid breakpoints.
- Mobile: fixed 72px icon rail with labeled controls, 44px targets, 16px inputs, and safe single-column stacking.
- Appearance follows the system through `prefers-color-scheme`; there is no app-specific appearance switch.
- Browser automation could not launch in this environment. Verification used a clean production build, authenticated API checks, HTTP 200s for all routes, and inspection of the emitted CSS for semantic tokens and media queries.

## Files touched in this pass

- `src/app/globals.css`
- `src/app/layout.tsx` (unchanged metadata, now inherits semantic tokens)
- `src/app/login/page.tsx`
- `src/app/(app)/page.tsx`
- `src/app/(app)/pos/page.tsx`
- all `src/app/(app)/*/page.tsx` (semantic class tokens, table header scope, contrast)
- `src/components/app-shell.tsx`
- `src/components/ui.tsx`
- `src/components/toast-provider.tsx` (minor token cleanup)
