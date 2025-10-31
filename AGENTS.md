# AGENTS

## Commands

### Development Commands

```bash
# Start development server (runs both web and SSR)
pnpm dev

# Start only web development server
pnpm --filter web dev

# Start only SSR development server
pnpm --filter @afilmory/ssr dev

# Build production version
pnpm build

# Build manifest from storage (generates photo metadata)
pnpm run build:manifest

# Force rebuild all photos and metadata
pnpm run build:manifest -- --force

# Force regenerate thumbnails only
pnpm run build:manifest -- --force-thumbnails

# Force regenerate manifest only
pnpm run build:manifest -- --force-manifest
```

### Database Commands (SSR app)

```bash
# Generate database migrations
pnpm --filter @afilmory/ssr db:generate

# Run database migrations
pnpm --filter @afilmory/ssr db:migrate
```

### Code Quality Commands

```bash
# Lint and fix code
pnpm lint

# Format code
pnpm format

# Type check (web app)
pnpm --filter web type-check
```

## Architecture

### Design Patterns & Application Structure

**Hybrid SPA + SSR Architecture**: The application uses a unique architecture where Next.js serves as both a hosting platform for the Vite-built SPA and a dynamic SEO/OG meta generator:

- **Production**: Next.js serves the pre-built SPA static assets and provides dynamic routes for SEO
- **Development**: Both servers run concurrently with the SSR app proxying to the SPA for seamless development

**Key Design Patterns**:

- **Adapter Pattern**: Builder system uses adapters for different storage providers (S3, GitHub)
- **Factory Pattern**: Photo processing pipeline with configurable workers and storage adapters
- **Observer Pattern**: Manifest changes trigger SSR meta tag updates for social sharing
- **Singleton Pattern**: PhotoLoader class provides global access to manifest data

### Monorepo Structure

This is a pnpm workspace with multiple applications and packages:

- `apps/web/` - Main frontend React application (Vite + React 19 SPA)
- `apps/ssr/` - Next.js 15 application serving as SPA host + dynamic SEO/OG generator
- `packages/builder/` - Photo processing and manifest generation tool with adapter pattern
- `packages/webgl-viewer/` - High-performance WebGL-based photo viewer component
- `packages/data/` - Shared data access layer and PhotoLoader singleton
- `packages/components/` - Reusable UI components across apps

### Next.js as SPA Host & SEO Provider

**Dual Server Architecture**:

- **Development Mode**: `apps/ssr/src/app/[...all]/route.ts` catches all SPA routes and serves index.html with injected manifest data
- **Production Mode**: Next.js serves pre-built Vite SPA assets while providing dynamic OG image generation

**Dynamic SEO Implementation**:

- `apps/ssr/src/index.html.ts` - Pre-compiled HTML template with manifest data injected as `window.__MANIFEST__`
- Dynamic OG images generated per photo via Next.js API routes (`/og/[photoId]/route.ts`)
- HTML meta tags dynamically replaced for social media sharing

### Configuration Architecture

**Two-Layer Configuration System**:

1. **Builder Config** (`builder.config.ts`) - **Infrastructure/Processing Layer**:

   - Controls photo processing, storage connections, and build performance
   - Handles remote git repository sync for manifest/thumbnails
   - Configures multi-process/cluster processing for large photo sets

2. **Site Config** (`site.config.ts` + `config.json`) - **Presentation/Content Layer**:
   ```typescript
   {
     name: "Gallery Name",
     description: "...",
     author: { name: "...", url: "...", avatar: "..." },
     social: { twitter: "...", github: "..." },
     map: ["maplibre"] // Map provider configuration
   }
   ```
   - Controls site branding, author info, social links
   - Merged with user `config.json` using es-toolkit/compat
   - Consumed by both SPA and SSR for consistent branding

### Manifest Generation & Data Flow

**Builder Pipeline** (`packages/builder/src/cli.ts`):

1. **Storage Sync**: Downloads photos from S3/GitHub with incremental change detection
2. **Format Processing**: HEIC→JPEG, TIFF→web formats, Live Photo detection
3. **Multi-threaded Processing**: Configurable worker pools or cluster mode for performance
4. **EXIF & Metadata Extraction**: Camera settings, GPS, Fujifilm recipes, tone analysis
5. **Thumbnail Generation**: Multiple sizes with blurhash placeholders
6. **Manifest Serialization**: Generates `photos-manifest.json` with full metadata
7. **Remote Sync**: Pushes updates to git repository if configured

**SPA Data Consumption** (`packages/data/src/index.ts`):

```typescript
class PhotoLoader {
  constructor() {
    this.photos = __MANIFEST__.data // Injected via window global
    this.cameras = __MANIFEST__.cameras
    this.lenses = __MANIFEST__.lenses
    // Creates lookup maps and provides data access layer
  }
}
```

**Data Flow**:

1. Builder generates manifest → `photos-manifest.json`
2. SSR injects manifest into HTML → `window.__MANIFEST__`
3. SPA PhotoLoader singleton consumes global data
4. React components access photos via `photoLoader.getPhotos()`

### Key Technologies

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS, Jotai (state), TanStack Query
- **Backend**: Next.js 15 (SPA host + SEO), Drizzle ORM, PostgreSQL
- **Image Processing**: Sharp, exiftool-vendored, HEIC conversion, blurhash generation
- **Storage**: S3-compatible (AWS/MinIO), GitHub repository storage
- **Build System**: pnpm workspaces, concurrent dev servers, cluster-based processing

### Development Workflow

- **Concurrent Development**: `pnpm dev` runs both SPA (Vite) and SSR (Next.js) servers
- **Hot Reloading**: SPA changes reflect immediately, SSR provides SEO preview
- **Manifest Building**: `pnpm run build:manifest` processes photos and updates data
- **Type Safety**: Shared types between builder, SPA, and SSR ensure consistency
- **Page Structure**: Keep files under `pages/` as thin routing shells; move reusable UI/logic into `modules/<domain>/**` (e.g., dashboard overview lives in `modules/dashboard/components`).

### Code Quality Rules

1. Avoid code duplication - extract common types and components
2. Keep components focused - use hooks and component composition
3. Follow React best practices - proper Context usage, state management
4. Use TypeScript strictly - leverage type safety throughout

### i18n Guidelines

- Use flat keys with `.` separation (e.g., `exif.camera.model`)
- Support pluralization with `_one` and `_other` suffixes
- Modify English first, then other languages (ESLint auto-removes unused keys)
- **CRITICAL: Avoid nested key conflicts in flat structure**
  - ❌ WRONG: `"action.tag.mode.and": "AND"` + `"action.tag.mode.and.tooltip": "..."`
  - ✅ CORRECT: `"action.tag.mode.and": "AND"` + `"action.tag.tooltip.and": "..."`
  - Rule: A key cannot be both a string value AND a parent object
  - Each key must be completely independent in the flat structure

### Testing Strategy

- Check README.md and package.json scripts for test commands
- Verify builds work with `pnpm build`
- Test photo processing with `pnpm run build:manifest`
- Validate types with `pnpm --filter web type-check`

## Cursor Rules Integration

### Code Quality Standards

- Avoid code duplication - extract common types and components when used multiple times
- Keep components focused - use hooks and component splitting for large logic blocks
- Master React philosophy - proper Context usage, component composition, state management to prevent re-renders

## Glassmorphic Depth Design System

Follow uses a sophisticated glassmorphic depth design system for elevated UI components (modals, toasts, floating panels, etc.). This design provides visual hierarchy through layered transparency and subtle color accents.

### Design Principles

- **Multi-layer Depth**: Create visual depth through stacked transparent layers
- **Subtle Color Accents**: Use brand colors at very low opacity (5-20%) for borders, glows, and backgrounds
- **Refined Blur**: Heavy backdrop blur (backdrop-blur-2xl) for frosted glass effect
- **Minimal Shadows**: Combine multiple soft shadows with accent colors for depth perception
- **Smooth Animations**: Use Spring presets for all transitions

### Color Usage

**IMPORTANT**: Tailwind CSS 4 uses `color-mix()` by default for `/opacity` syntax. **Always prefer Tailwind classes over inline styles.**

#### Tailwind CSS Classes (Preferred)
- **Borders**: `border-accent/20` instead of `borderColor: 'color-mix(...)'`
- **Backgrounds**: `bg-accent/5`, `bg-accent/[0.03]` (use bracket notation for custom percentages)
- **Text Colors**: `text-accent/80`
- **Any solid color with opacity**: Use Tailwind `/opacity` syntax

#### When to Use Inline Styles with `color-mix()`
Only use explicit `color-mix(in srgb, var(--color-accent) X%, transparent)` for:
1. **Gradients**: `linear-gradient`, `radial-gradient` (Tailwind doesn't support color-mix in gradients)
2. **Box Shadows**: Tailwind doesn't support color-mix in shadows yet
3. **Complex multi-color blending**: When you need more than simple opacity

#### Examples

✅ **CORRECT - Use Tailwind Classes**:
```tsx
<div className="border-accent/20 bg-accent/5">
  <div className="bg-accent/[0.03]"> {/* Custom percentage */}
    Content
  </div>
</div>
```

❌ **WRONG - Unnecessary inline styles**:
```tsx
<div 
  style={{
    borderColor: 'color-mix(in srgb, var(--color-accent) 20%, transparent)',
    background: 'color-mix(in srgb, var(--color-accent) 5%, transparent)',
  }}
>
```

✅ **CORRECT - Inline styles for gradients/shadows**:
```tsx
<div 
  className="border-accent/20" 
  style={{
    background: 'linear-gradient(to right, color-mix(in srgb, var(--color-accent) 8%, transparent), color-mix(in srgb, var(--color-accent) 5%, transparent))',
    boxShadow: '0 8px 32px color-mix(in srgb, var(--color-accent) 8%, transparent)',
  }}
>
```

#### Color Usage Summary
- **Borders**: `border-accent/20` (Tailwind class)
- **Solid Backgrounds**: `bg-accent/5` or `bg-accent/[0.03]` (Tailwind class)
- **Gradient Backgrounds**: Inline style with `linear-gradient` + `color-mix()`
- **Shadows**: Inline style with `color-mix()`
- **Inner Glow**: Inline style with gradient + `color-mix()`

### Component Structure

```tsx
<div
  className="rounded-2xl border border-accent/20 backdrop-blur-2xl"
  style={{
    backgroundImage:
      "linear-gradient(to bottom right, color-mix(in srgb, var(--color-background) 98%, transparent), color-mix(in srgb, var(--color-background) 95%, transparent))",
    boxShadow:
      "0 8px 32px color-mix(in srgb, var(--color-accent) 8%, transparent), 0 4px 16px color-mix(in srgb, var(--color-accent) 6%, transparent), 0 2px 8px rgba(0, 0, 0, 0.1)",
  }}
>
  {/* Inner glow layer */}
  <div
    className="pointer-events-none absolute inset-0 rounded-2xl"
    style={{
      background:
        "linear-gradient(to bottom right, color-mix(in srgb, var(--color-accent) 5%, transparent), transparent, color-mix(in srgb, var(--color-accent) 5%, transparent))",
    }}
  />

  {/* Content */}
  <div className="relative">{/* Your content here */}</div>
</div>
```

### Interactive Elements

**IMPORTANT**: Prefer CSS-driven hover effects over JavaScript event handlers for better performance and cleaner code.

#### Radix UI Menu Items (using `data-highlighted`)

For Radix UI components that support `data-highlighted` attribute:

```tsx
<DropdownMenuItem
  className="rounded-lg transition-all duration-200 data-[highlighted]:text-accent"
  style={{
    // Use CSS custom properties for dynamic background on highlight
    ['--highlight-bg' as any]: 'linear-gradient(to right, color-mix(in srgb, var(--color-accent) 8%, transparent), color-mix(in srgb, var(--color-accent) 5%, transparent))'
  }}
  onSelect={() => {}}
>
  Menu Item
</DropdownMenuItem>

// Add this CSS for highlighted state (in tailwind.css):
// @layer components {
//   [data-highlighted] { background: var(--highlight-bg); }
// }
```

#### Custom Buttons (using CSS classes)

**✅ PREFERRED - CSS-driven hover**:
```tsx
<button className="glassmorphic-btn border-accent/20 text-text-secondary ...">
  Button Text
</button>

// In tailwind.css:
// @layer components {
//   .glassmorphic-btn:hover {
//     background: linear-gradient(to right, 
//       color-mix(in srgb, var(--color-accent) 8%, transparent), 
//       color-mix(in srgb, var(--color-accent) 5%, transparent)
//     ) !important;
//     color: var(--color-accent) !important;
//   }
// }
```

**❌ AVOID - JavaScript event handlers** (use only when CSS cannot achieve the effect):
```tsx
<button
  onMouseEnter={(e) => {
    e.currentTarget.style.background = "..."
    e.currentTarget.style.color = "var(--color-accent)"
  }}
  onMouseLeave={(e) => {
    e.currentTarget.style.background = "transparent"
    e.currentTarget.style.color = ""
  }}
>
  Button Text
</button>
```

### Dividers

Use gradient dividers within glass containers:

```tsx
<div
  className="mx-4 h-px"
  style={{
    background: "linear-gradient(to right, transparent, color-mix(in srgb, var(--color-accent) 20%, transparent), transparent)",
  }}
/>
```

### Animation Guidelines

- Entry animations: `initial={{ y: 8, opacity: 0 }}` → `animate={{ y: 0, opacity: 1 }}`
- Use `Spring.presets.snappy` for quick interactions
- Use `Spring.presets.smooth` for larger movements
- Keep scale animations subtle (1.0 ↔ 1.02)

### When to Use

Apply this design system to:

- Toast notifications
- Modal dialogs
- Floating panels and popovers
- Ambient UI prompts
- Contextual menus
- Elevated cards with actions

## Design Guidelines

### UI/UX Guidelines

- Follow Glassmorphic Depth Design System
- Use Apple UIKit color system via tailwind-uikit-colors package
- Prefer semantic color names: `text-primary`, `fill-secondary`, `material-thin`, etc.
- Follow system colors: `red`, `blue`, `green`, `mint`, `teal`, `cyan`, `indigo`, `purple`, `pink`, `brown`, `gray`
- Use material design principles with opacity-based fills and proper contrast

### i18n Development Rules

- Use flat keys with dot notation: `exif.camera.model`
- Support pluralization: `_one` and `_other` suffixes
- Always modify English (`en.json`) first, then other languages
- Avoid key conflicts in flat structure (e.g., `exif.custom.rendered` vs `exif.custom.rendered.custom`)
- ESLint automatically removes unused keys from non-English files

## Important Notes

- This is a photo gallery application that processes and displays photos from cloud storage
- The builder tool handles complex image processing workflows
- WebGL viewer provides high-performance photo viewing experience
- Map integration shows photo locations from GPS EXIF data
- Live Photo support for iOS/Apple device videos
