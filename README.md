# Persian Wheel Picker

A fully type‑safe, accessible **Jalali (Persian) date picker** built with React, TailwindCSS, and Day.js + Jalaliday. It renders three synchronized scroll wheels (year / month / day) with smooth inertial scrolling, snapping, and an optional centered (classic iOS‑style) wheel UX.

---

### 🚀 Quick Start

```bash
# Install via shadcn CLI
bunx --bun shadcn@latest add https://code.nikode.ir/r/persian-wheel-picker.json
# or
pnpm dlx shadcn@latest add https://code.nikode.ir/r/persian-wheel-picker.json
# or
npx shadcn@latest add https://code.nikode.ir/r/persian-wheel-picker.json
```

```tsx
import PersianWheelPicker from "@/components/PersianWheelPicker";

export default function Example() {
  return (
    <PersianWheelPicker
      centered       // ← Recommended for best UX
      visibleRows={5} // ← Use 5 rows for optimal readout
      initialJalaliDate="1379-10-05"
      onChange={({ jalali, gregorian }) =>
        console.log("Jalali:", jalali, "Gregorian:", gregorian)
      }
    />
  );
}
```

---

### ✨ Key Features

* **🇮🇷 Jalali support** via `dayjs` + `jalaliday`
* **Snapping wheels** that always land on a valid value
* **Leap‑year & Esfand logic**: correct month lengths
* **Debounced `onChange`** to minimize render churn
* **Accessible** (`role="listbox"` / `option`, `aria-activedescendant`)
* **Tailwind‑friendly**: unopinionated styling, easy theming
* **iOS‑style centered mode** with highlight lines
* **TypeScript‑first**: zero `any` leaks

---

### ⭐️ Why **centered** + **5 rows**?

* **Centered mode** places your selection in the visual “sweet spot,” making it clear which date is picked.
* **5 visible rows** balances context (two above/below) with compactness—ideal for both mobile and desktop.

---

### 📦 Props

| Prop                | Type                                                   | Default             | Description                                    |
| ------------------- | ------------------------------------------------------ | ------------------- | ---------------------------------------------- |
| `minYear`           | `number`                                               | `1300`              | Minimum Jalali year                            |
| `maxYear`           | `number`                                               | *current Jalali*    | Maximum Jalali year (e.g. enforce age limits)  |
| `initialJalaliDate` | `string`                                               | *today*             | `"YYYY-MM-DD"`; falls back to today if invalid |
| `onChange`          | `(val: { jalali: string; gregorian: string }) => void` | `undefined`         | Debounced selection callback                   |
| `centered`          | `boolean`                                              | `false`             | iOS‑style centered wheel with guide lines      |
| `visibleRows`       | `number`                                               | `5` (when centered) | Odd number ≥3 of visible items                 |
| `className`         | `string`                                               | `""`                | Extra wrapper CSS classes                      |

---

### 🛠️ Publishing to shadcn/ui

1. Create `components/persian-wheel-picker/`

2. Add your `.tsx` files (e.g. `PersianWheelPicker.tsx`)

3. Include a `component.json`:

   ```json
   {
     "name": "persian-wheel-picker",
     "description": "Jalali date picker with snapping wheels.",
     "dependencies": ["dayjs", "jalaliday"],
     "files": ["./PersianWheelPicker.tsx"],
     "type": "components:ui"
   }
   ```

4. Run `npx shadcn@latest add ./components/persian-wheel-picker` or open a PR to the registry.

---

### 🧩 Implementation Notes

* **Smooth scrolling** via `requestAnimationFrame`; snaps after 120 ms idle
* **External updates** (prop changes) animate into place if idle
* **Leap‑year** and month‑length from `dayjs().daysInMonth()` in Jalali mode

---

### 🎨 Theming & Styling

* Minimal Tailwind classes—override via `className` or global CSS
* Customize highlight lines in centered mode (e.g. replace `border-y`)

---

### ♿ Accessibility

* `role="listbox"` on each wheel
* `role="option"` + `aria-activedescendant` for the active item
* Easily extensible to keyboard support (`onKeyDown`, arrow navigation)
