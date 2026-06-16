---
name: Cinematic Glassmorphism
colors:
  surface: '#131313'
  surface-dim: '#131313'
  surface-bright: '#3a3939'
  surface-container-lowest: '#0e0e0e'
  surface-container-low: '#1c1b1b'
  surface-container: '#201f1f'
  surface-container-high: '#2a2a2a'
  surface-container-highest: '#353534'
  on-surface: '#e5e2e1'
  on-surface-variant: '#e9bcb6'
  inverse-surface: '#e5e2e1'
  inverse-on-surface: '#313030'
  outline: '#af8782'
  outline-variant: '#5e3f3b'
  surface-tint: '#ffb4aa'
  primary: '#ffb4aa'
  on-primary: '#690003'
  primary-container: '#e50914'
  on-primary-container: '#fff7f6'
  inverse-primary: '#c0000c'
  secondary: '#c8c6c6'
  on-secondary: '#303030'
  secondary-container: '#474747'
  on-secondary-container: '#b6b5b4'
  tertiary: '#a7c8ff'
  on-tertiary: '#003061'
  tertiary-container: '#0072d7'
  on-tertiary-container: '#f8f9ff'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#ffdad5'
  primary-fixed-dim: '#ffb4aa'
  on-primary-fixed: '#410001'
  on-primary-fixed-variant: '#930007'
  secondary-fixed: '#e4e2e1'
  secondary-fixed-dim: '#c8c6c6'
  on-secondary-fixed: '#1b1c1c'
  on-secondary-fixed-variant: '#474747'
  tertiary-fixed: '#d5e3ff'
  tertiary-fixed-dim: '#a7c8ff'
  on-tertiary-fixed: '#001b3c'
  on-tertiary-fixed-variant: '#004689'
  background: '#131313'
  on-background: '#e5e2e1'
  surface-variant: '#353534'
typography:
  display-lg:
    fontFamily: Inter
    fontSize: 64px
    fontWeight: '800'
    lineHeight: '1.1'
    letterSpacing: -0.04em
  display-lg-mobile:
    fontFamily: Inter
    fontSize: 40px
    fontWeight: '800'
    lineHeight: '1.2'
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '700'
    lineHeight: '1.3'
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '700'
    lineHeight: '1.4'
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
  label-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '600'
    lineHeight: '1.2'
    letterSpacing: 0.05em
  label-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: '1.2'
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 8px
  container-max: 1440px
  gutter: 24px
  margin-desktop: 64px
  margin-tablet: 32px
  margin-mobile: 16px
---

## Brand & Style
The design system is engineered to deliver a high-end, immersive entertainment experience that prioritizes content above all else. Drawing inspiration from modern cinematic interfaces, the style centers on "Cinematic Glassmorphism"—a blend of deep, infinite dark spaces and vibrant, translucent layers.

The emotional response should be one of premium exclusivity and effortless discovery. By utilizing heavy backdrop blurs, subtle light leaks, and high-contrast focal points, the UI mimics the depth of a theater. The interface remains unobtrusive, acting as a sophisticated frame for high-resolution media.

**Key Stylistic Pillars:**
- **Immersive Depth:** Use of layers to create a clear hierarchy between the background content, the glass containers, and active overlays.
- **Vibrant Minimalism:** A monochromatic dark base interrupted only by a singular, aggressive brand color to drive action.
- **Optical Clarity:** High-contrast typography and generous negative space ensure legibility against complex photographic backgrounds.

## Colors
The palette is intentionally restricted to maintain a "lights-out" cinematic feel. 

- **Primary (#E50914):** Reserved exclusively for primary calls to action, progress bars, and active states. It represents energy and the brand's core identity.
- **Surface Neutrals:** The base background is a pure charcoal-black (#0A0A0A). Secondary surfaces use a lighter charcoal (#2F2F2F) to define structure without breaking immersion.
- **Glass Specification:** Glass elements use a dark tint (`rgba(20, 20, 20, 0.75)`) with a `20px` backdrop-filter blur. A thin, 1px highlight stroke (`rgba(255, 255, 255, 0.12)`) is applied to the top and left edges to simulate light catching the "rim" of the glass.

## Typography
The design system utilizes **Inter** for its modern, neutral, and highly legible characteristics. The type hierarchy is designed for rapid scanning of titles and metadata.

- **Display & Headlines:** Use heavy weights (700-800) and tight letter spacing to create a commanding presence for movie titles and hero banners.
- **Body Text:** Maintained at a comfortable 16px or 18px to ensure readability for synopses.
- **Labels:** Small caps or increased letter spacing should be used for metadata like "HD," "4K," or "Trending Now" to distinguish them from narrative text.
- **Contrast:** Always use pure white (#FFFFFF) for primary text and a muted grey (#A0A0A0) for secondary metadata to maintain clear visual hierarchy.

## Layout & Spacing
The layout follows a fluid-to-fixed model. Content is organized into horizontal "shelves" or carousels that bleed to the edges of the screen on mobile, while snapping to a max-width container on larger displays.

- **The 8px Grid:** All spacing between elements (padding, margins, gaps) must be multiples of 8px.
- **Media Grids:** Standard media cards utilize a 16:9 aspect ratio for hero content and 2:3 for vertical posters.
- **Carousels:** Provide "peek" visibility for the next item in a sequence to encourage horizontal scrolling.
- **Navigation:** A persistent glassmorphic top navigation bar that transitions from transparent to blurred glass upon scroll.

## Elevation & Depth
Depth is created through the interplay of blur and light, rather than traditional shadows.

- **Level 0 (Base):** The background layer, often a full-bleed movie still or a pure black canvas.
- **Level 1 (Surface):** Glassmorphic cards and containers. These use `backdrop-filter: blur(20px)` and a subtle gradient fill to separate themselves from the background.
- **Level 2 (Interaction):** Hover states on cards should trigger a slight scale-up (1.05x) and an increase in the brightness of the glass border highlight.
- **Level 3 (Overlays):** Modals and full-screen menus use a darker backdrop dimming effect (70% opacity black) to pull focus entirely to the foreground.

## Shapes
The design system uses a pronounced roundedness to soften the high-contrast visuals and make the interface feel modern and approachable.

- **Cards & Banners:** Apply `rounded-lg` (16px) or `rounded-xl` (24px) to all media thumbnails and primary container blocks.
- **Buttons:** Primary CTAs use a 4px or 8px radius for a more "precise" feel, while utility chips and tags use a fully pill-shaped (rounded-full) radius.
- **Inputs:** Search bars and form fields follow the `rounded-lg` standard to match the card aesthetic.

## Components

### Buttons
- **Primary:** Solid Red (#E50914) with white text. High-contrast and bold.
- **Secondary:** Glassmorphic button with white text and a 1px border. No solid background unless hovered.
- **Ghost:** Transparent background with white text, used for low-priority actions like "More Info."

### Media Cards
- **Construction:** A container with 16px corner radius, a subtle 1px top-border, and a dark gradient overlay at the bottom to ensure title legibility over the image.
- **States:** On hover, the card scales up, and a "Play" icon or additional metadata is revealed via a glassmorphic overlay.

### Navigation & Chips
- **Category Chips:** Pill-shaped, semi-transparent grey backgrounds that become solid white with black text when active.
- **Progress Bars:** Use a thin 4px height. The background track is dark grey, and the active progress is brand red.

### Input Fields
- **Search:** A glassmorphic text field with a magnifying glass icon. The border glows slightly when the field is focused.

### Modals & Details View
- Full-screen glassmorphic overlays that blur the underlying homepage. Includes large-scale typography for titles and a clear "X" close button in the top right.