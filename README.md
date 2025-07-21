# Persian Birthday Wheel Picker

A fully typesafe, accessible **Jalali (Persian) date-of-birth picker** built with React, TailwindCSS, and Day.js + Jalaliday. It provides three synchronized scroll wheels (year / month / day) with smooth inertial scrolling, snapping, and an optional _centered_ (classic iOS‑style) wheel UX.

> **Goal:** Publish this component to the **shadcn/ui registry** or reuse it locally as a standalone package.

## ✨ Features

- 🇮🇷 **Jalali calendar** support via `dayjs` + `jalaliday`.
- 🎯 **Snapping wheel UX** – always lands on a valid value, even with fast flicks.
- 🧮 **Leap year + Esfand handling** (correct days per month).
- 🔁 **Debounced change events** to avoid re-renders spam.
- ♿ **Accessible**: proper `listbox` / `option` roles and ARIA attributes.
- 🎨 **TailwindCSS friendly** – minimal styling, easy to theme.
- 🧩 **Centering mode** with highlight lines or linear mode without spacers.
- 🧪 **TypeScript** first; no `any` leaks.

## 📦 Installation

```bash
npm i dayjs jalaliday
# or
pnpm add dayjs jalaliday
# or
bun add dayjs jalaliday
```

Add a TypeScript declaration if your setup complains about `jalaliday`:

```ts
// types/jalaliday.d.ts
declare module "jalaliday";
```

## 🛠 Usage

```tsx
import PersianBirthdayWheelPicker from "@/components/PersianBirthdayWheelPicker"; // adjust path

export default function Example() {
  return (
    <PersianBirthdayWheelPicker
      centered
      visibleRows={5}
      initialJalaliDate="1379-10-05"
      onChange={(val) => {
        console.log("Jalali:", val.jalali, "Gregorian:", val.gregorian);
      }}
    />
  );
}
```

### Props

| Prop                | Type                                                     | Default               | Description                                                      |
| ------------------- | -------------------------------------------------------- | --------------------- | ---------------------------------------------------------------- |
| `minYear`           | `number`                                                 | `1300`                | Smallest selectable Jalali year.                                 |
| `maxYear`           | `number`                                                 | `current Jalali year` | Largest selectable Jalali year (use to enforce age).             |
| `initialJalaliDate` | `string`                                                 | `today (Jalali)`      | Initial date in `YYYY-MM-DD`. Invalid values fall back to today. |
| `onChange`          | `(value: { jalali: string; gregorian: string }) => void` | `undefined`           | Called (debounced) when user selects a new date.                 |
| `className`         | `string`                                                 | `""`                  | Extra wrapper classes.                                           |
| `visibleRows`       | `number`                                                 | `5`                   | Only in `centered` mode – must be an odd number ≥3.              |
| `centered`          | `boolean`                                                | `false`               | Enables iOS‑style centered wheel with guide lines.               |

## 🧩 Publishing to shadcn/ui Registry

To submit this component to the shadcn registry:

1. **Create a folder** under `components/` (e.g. `components/persian-birthday-wheel-picker`).
2. Split the file if desired (e.g. `wheel.tsx` + `index.tsx`).
3. Export a `component.json` describing the entry point:

   ```json
   {
     "name": "persian-birthday-wheel-picker",
     "description": "Jalali birthday picker with snapping wheels.",
     "dependencies": ["dayjs", "jalaliday"],
     "files": ["./PersianBirthdayWheelPicker.tsx"],
     "registryDependencies": [],
     "type": "components:ui"
   }
   ```

4. Run the shadcn CLI to publish (or open a PR to the upstream registry repo).

> See the official docs: [https://ui.shadcn.com/docs/registry](https://ui.shadcn.com/docs/registry)

## 🧠 Implementation Notes

- Scrolling uses `requestAnimationFrame` to sync intermediate value changes.
- A timeout (120ms) schedules final snapping after the user stops.
- External `value` changes (through state lifting) will smoothly scroll into place if not currently scrolling.
- Leap years handled automatically by `dayjs().daysInMonth()` in Jalali context.

## 🖌 Styling

The component ships with minimal Tailwind classes. Override or extend via the `className` prop or global styles. The highlight lines in `centered` mode can be customized (e.g., replace `border-y` with your own gradients).

## ♿ Accessibility

- Each wheel uses `role="listbox"` and each item uses `role="option"`.
- Active option is identified by `aria-activedescendant`.
- Keyboard support can be added easily (e.g. handle `onKeyDown` to move focus). PRs welcome.

## ✅ Testing Suggestions

- Rapid scroll with mouse wheel or touchpad → ensure final snap occurs.
- Switch months around Esfand on leap / non‑leap years.
- Supply `initialJalaliDate` near boundaries (e.g., `1300-01-01`).

## 📄 License

MIT – feel free to use in commercial or open‑source projects.

---

Enjoy! If you publish it to the registry, drop a link so others can use it too. 🙌
