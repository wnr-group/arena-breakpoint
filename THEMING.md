# 🎨 Theming System - Breakpoint Arena

## Quick Start: Changing the Primary Color

To change the golden color (`#FFC107`) to purple (or any other color) throughout the entire application:

1. Open `app/globals.css`
2. Find the `--primary` variable (around line 7)
3. Change the color values:

```css
:root {
  /* 🎨 PRIMARY BRAND COLOR - Change this to update the entire app theme */
  --primary: #9333EA;        /* Purple base */
  --primary-hover: #A855F7;  /* Lighter purple for hover */
  --primary-dark: #7E22CE;   /* Darker purple for active states */
}

@media (prefers-color-scheme: dark) {
  :root {
    /* Same colors for dark mode */
    --primary: #9333EA;
    --primary-hover: #A855F7;
    --primary-dark: #7E22CE;
  }
}
```

4. Save the file - all colors will update automatically!

---

## How to Use in Your Code

### 1. Tailwind Classes (Recommended)

Use the custom color classes anywhere:

```tsx
// Text color
<p className="text-primary">Golden text</p>

// Background color
<div className="bg-primary hover:bg-primary-hover">Button</div>

// Border color
<div className="border-primary">Card</div>

// Combination
<button className="bg-primary hover:bg-primary-hover text-black border border-primary-dark">
  Click Me
</button>
```

### 2. Direct CSS Variables

Use in inline styles or custom CSS:

```tsx
// In JSX inline style
<div style={{ color: 'var(--primary)' }}>Text</div>

// In CSS file
.custom-element {
  background-color: var(--primary);
  border-color: var(--primary-dark);
}
```

---

## Migration Guide: Replace Hardcoded Colors

### Find and Replace All Instances

Search for these patterns in your codebase and replace:

| Old Hardcoded Value | New Variable Class | Example |
|---------------------|-------------------|---------|
| `#FFC107` | `primary` | `text-[#FFC107]` → `text-primary` |
| `#ffcd38` | `primary-hover` | `bg-[#ffcd38]` → `bg-primary-hover` |
| `text-[#FFC107]` | `text-primary` | Direct replacement |
| `bg-[#FFC107]` | `bg-primary` | Direct replacement |
| `border-[#FFC107]` | `border-primary` | Direct replacement |

### VS Code Find & Replace Examples

1. Find: `text-\[#FFC107\]` → Replace: `text-primary`
2. Find: `bg-\[#FFC107\]` → Replace: `bg-primary`
3. Find: `hover:bg-\[#ffcd38\]` → Replace: `hover:bg-primary-hover`
4. Find: `border-\[#FFC107\]` → Replace: `border-primary`

---

## File Updates Needed

Here are the main files that need color migration:

### Customer Booking Pages
- `app/(customer)/booking/page.tsx`
- `app/(customer)/booking/auth/page.tsx`
- `app/(customer)/retrieve/page.tsx`

### Admin Pages
- `app/(admin)/admin/devices/page.tsx`
- `app/(admin)/admin/food/page.tsx`
- `components/admin/devices/AddDeviceModal.tsx`
- `components/admin/devices/EditDeviceModal.tsx`
- `components/admin/devices/DeviceFilters.tsx`
- `components/admin/devices/DeviceGrid.tsx`
- `components/admin/devices/DeviceTable.tsx`

### Common Components
- Any reusable components using golden color

---

## Color Palette Reference

Current color scheme:

```css
/* Primary (Golden) */
--primary: #FFC107
--primary-hover: #ffcd38
--primary-dark: #e6ad06

/* Suggested Purple Alternative */
--primary: #9333EA        /* Tailwind purple-600 */
--primary-hover: #A855F7  /* Tailwind purple-500 */
--primary-dark: #7E22CE   /* Tailwind purple-700 */

/* Suggested Blue Alternative */
--primary: #3B82F6        /* Tailwind blue-500 */
--primary-hover: #60A5FA  /* Tailwind blue-400 */
--primary-dark: #2563EB   /* Tailwind blue-600 */
```

---

## Testing Your Theme Change

After changing colors:

1. Run `npm run dev`
2. Check these pages:
   - Customer booking flow (`/booking`)
   - Admin device management (`/admin/devices`)
   - Booking retrieval (`/retrieve`)
3. Test hover states on buttons
4. Check text contrast for readability

---

## Benefits of This System

✅ **Single Source of Truth** - Change color once, update everywhere
✅ **Easy Theme Switching** - Switch from golden to purple in 30 seconds
✅ **Consistent Design** - No more mismatched color codes
✅ **Future-Proof** - Add dark mode variants easily
✅ **Developer Friendly** - Clear naming, easy to remember

---

## Advanced: Multiple Theme Support

To add theme variants (e.g., "Golden", "Purple", "Blue"):

```css
/* app/globals.css */

/* Default: Golden */
[data-theme="golden"] {
  --primary: #FFC107;
  --primary-hover: #ffcd38;
  --primary-dark: #e6ad06;
}

/* Purple Theme */
[data-theme="purple"] {
  --primary: #9333EA;
  --primary-hover: #A855F7;
  --primary-dark: #7E22CE;
}

/* Blue Theme */
[data-theme="blue"] {
  --primary: #3B82F6;
  --primary-hover: #60A5FA;
  --primary-dark: #2563EB;
}
```

Then add theme switcher:

```tsx
// In layout or settings
<html data-theme="golden"> // or "purple", "blue"
```

---

## Questions?

- Current primary color: **Golden (#FFC107)**
- Location to change: **app/globals.css** (line 7)
- Usage: **`className="text-primary bg-primary border-primary"`**
