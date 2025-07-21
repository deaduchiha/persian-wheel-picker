"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import dayjs, { Dayjs } from "dayjs";
import jalaliday from "jalaliday";

// Enable Jalali calendar support once.
dayjs.extend(jalaliday);

/** Value passed to parent when the date changes. */
export type PickerChangeValue = { jalali: string; gregorian: string };

export interface IPersianWheelPickerProps {
  /** Smallest selectable Jalali year (e.g. 1300). */
  minYear?: number;
  /** Largest selectable Jalali year (defaults to current Jalali year). */
  maxYear?: number;
  /** Initial Jalali date string (YYYY-MM-DD). */
  initialJalaliDate?: string;
  /** Debounced callback fired when user selects a new date. */
  onChange?: (value: PickerChangeValue) => void;
  /** Extra container classes. */
  className?: string;
  /** Number of visible rows (odd number >= 3) when `centered` is true. */
  visibleRows?: number;
  /** If true, adds top/bottom spacers so the selected item sits in the vertical center. */
  centered?: boolean;
}

/** An individual option for a wheel. */
interface WheelItem {
  value: number;
  label: string;
}

const faMonths: readonly string[] = [
  "فروردین",
  "اردیبهشت",
  "خرداد",
  "تیر",
  "مرداد",
  "شهریور",
  "مهر",
  "آبان",
  "آذر",
  "دی",
  "بهمن",
  "اسفند",
] as const;

/** Utility clamp. */
const clamp = (v: number, min: number, max: number): number =>
  Math.max(min, Math.min(v, max));

/**
 * Debounce helper that returns a *stable* function identity.
 * We keep the timer ref inside so callers don't need to manage it.
 */
function useDebouncedCallback<T extends (...args: unknown[]) => void>(
  cb: T,
  delay = 150
): (...args: Parameters<T>) => void {
  const timerRef = useRef<number | null>(null);

  return useCallback(
    (...args: Parameters<T>) => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
      timerRef.current = window.setTimeout(() => cb(...args), delay);
    },
    [cb, delay]
  );
}

/** Props for a single scroll wheel UI. */
interface WheelProps {
  items: WheelItem[];
  /** Current selected value. */
  value: number;
  /** Called when wheel selection changes (while scrolling or after snap). */
  onChange: (v: number) => void;
  /** For accessibility. */
  ariaLabel: string;
  /** If true, use centered wheel with spacers. */
  centered: boolean;
  /** Number of rows to show when centered (must be odd). */
  visibleRows: number;
}

const ITEM_HEIGHT = 44; // px per row

/**
 * Generic scroll wheel component used for day / month / year.
 * Implements inertial scroll + snapping with smooth UX even during fast flicks.
 */
export const Wheel: React.FC<WheelProps> = ({
  items,
  value,
  onChange,
  ariaLabel,
  centered = false,
  visibleRows = 5,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const snapTimeoutRef = useRef<number | null>(null);
  const isUserScrollingRef = useRef(false);

  const spacerCountEachSide = centered ? (visibleRows - 1) / 2 : 0;

  /** Find index of current value in list. */
  const findIndex = useCallback(
    (v: number): number => items.findIndex((i) => i.value === v),
    [items]
  );

  /**
   * Programmatic scroll to a given index.
   * We compute target differently for linear vs centered modes.
   */
  const scrollToIndex = useCallback(
    (newIndex: number, behavior: ScrollBehavior = "smooth"): void => {
      const el = containerRef.current;
      if (!el) return;

      const target = centered
        ? newIndex * ITEM_HEIGHT
        : items.length > 1
        ? (newIndex / (items.length - 1)) * (el.scrollHeight - el.clientHeight)
        : 0;

      el.scrollTo({ top: target, behavior });
    },
    [centered, items]
  );

  /**
   * Snap the wheel to the *nearest* item index,
   * update selection if necessary, and animate to its precise offset.
   */
  const snapToClosest = useCallback(
    (el: HTMLDivElement): void => {
      const scrollTop = el.scrollTop;
      const maxScrollTop = el.scrollHeight - el.clientHeight;

      let index: number;
      if (centered) {
        index = Math.round(scrollTop / ITEM_HEIGHT);
      } else {
        index =
          maxScrollTop <= 0
            ? 0
            : Math.round((scrollTop / maxScrollTop) * (items.length - 1));
      }
      index = clamp(index, 0, items.length - 1);

      const newValue = items[index].value;
      if (newValue !== value) onChange(newValue);

      scrollToIndex(index, "smooth");
    },
    [centered, items, onChange, scrollToIndex, value]
  );

  /**
   * After scroll events quiet down for 120ms, trigger snap.
   * If user keeps scrolling, the timer resets.
   */
  const scheduleSnapToClosest = useCallback(
    (el: HTMLDivElement): void => {
      if (snapTimeoutRef.current) window.clearTimeout(snapTimeoutRef.current);
      snapTimeoutRef.current = window.setTimeout(() => {
        snapToClosest(el);
        isUserScrollingRef.current = false;
      }, 120);
    },
    [snapToClosest]
  );

  /**
   * Scroll event handler:
   *  - Marks user scrolling state
   *  - Debounces a snap
   *  - Schedules an rAF to emit intermediate selection changes
   */
  const handleScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement>): void => {
      const el = e.currentTarget;
      isUserScrollingRef.current = true;
      scheduleSnapToClosest(el);

      if (animationFrameRef.current)
        cancelAnimationFrame(animationFrameRef.current);

      animationFrameRef.current = requestAnimationFrame(() => {
        const scrollTop = el.scrollTop;
        const maxScrollTop = el.scrollHeight - el.clientHeight;

        let index: number;
        if (centered) {
          index = Math.round(scrollTop / ITEM_HEIGHT);
        } else {
          index =
            maxScrollTop <= 0
              ? 0
              : Math.round((scrollTop / maxScrollTop) * (items.length - 1));
        }
        index = clamp(index, 0, items.length - 1);

        const newValue = items[index].value;
        if (newValue !== value) onChange(newValue);
      });
    },
    [centered, items, onChange, scheduleSnapToClosest, value]
  );

  /**
   * Keep wheel visually in sync when parent changes `value` externally.
   * We only scroll if the DOM position is meaningfully different and the user
   * is not actively scrolling (prevents "fighting" their gesture).
   */
  useEffect(() => {
    const ix = findIndex(value);
    if (ix < 0 || !containerRef.current) return;

    const el = containerRef.current;
    const target = centered
      ? ix * ITEM_HEIGHT
      : items.length > 1
      ? (ix / (items.length - 1)) * (el.scrollHeight - el.clientHeight)
      : 0;

    if (Math.abs(el.scrollTop - target) > 2 && !isUserScrollingRef.current) {
      scrollToIndex(ix, "smooth");
    }
  }, [value, items, centered, findIndex, scrollToIndex]);

  /** Clean up timers / rAF on unmount. */
  useEffect(
    () => () => {
      if (animationFrameRef.current)
        cancelAnimationFrame(animationFrameRef.current);
      if (snapTimeoutRef.current) window.clearTimeout(snapTimeoutRef.current);
    },
    []
  );

  const containerStyle: React.CSSProperties = centered
    ? { height: ITEM_HEIGHT * visibleRows }
    : { height: ITEM_HEIGHT * 5.5 }; // arbitrary visible height for linear mode

  return (
    <div
      className="relative flex flex-col items-stretch w-28"
      aria-label={ariaLabel}
    >
      <div
        ref={containerRef}
        className={[
          "overflow-y-scroll no-scrollbar focus:outline-none rounded-xl select-none relative scroll-smooth",
          centered ? "scroll-py-0" : "",
        ].join(" ")}
        style={containerStyle}
        tabIndex={0}
        onScroll={handleScroll}
        role="listbox"
        aria-activedescendant={`${ariaLabel}-option-${value}`}
      >
        <div className="relative">
          {centered && (
            <div
              style={{ height: ITEM_HEIGHT * spacerCountEachSide }}
              aria-hidden
            />
          )}

          {items.map((item) => (
            <div
              key={item.value}
              id={`${ariaLabel}-option-${item.value}`}
              role="option"
              aria-selected={item.value === value}
              className={`h-[44px] flex items-center justify-center text-sm cursor-pointer transition-colors ${
                item.value === value ? "font-black !text-lg" : "rounded-md"
              }`}
              style={{ scrollSnapAlign: centered ? undefined : "start" }}
              onClick={() => {
                const ix = findIndex(item.value);
                if (item.value !== value) onChange(item.value);
                // Only animate scroll if visual position differs.
                const el = containerRef.current;
                if (el) {
                  const target = centered
                    ? ix * ITEM_HEIGHT
                    : items.length > 1
                    ? (ix / (items.length - 1)) *
                      (el.scrollHeight - el.clientHeight)
                    : 0;
                  if (Math.abs(el.scrollTop - target) > 1)
                    scrollToIndex(ix, "smooth");
                }
              }}
            >
              {item.label}
            </div>
          ))}

          {centered && (
            <div
              style={{ height: ITEM_HEIGHT * spacerCountEachSide }}
              aria-hidden
            />
          )}
        </div>
      </div>

      {/* Center highlight lines */}
      {centered && (
        <div
          className="pointer-events-none absolute left-0 right-0 flex justify-center"
          style={{
            top: `calc(50% - ${ITEM_HEIGHT / 2}px)`,
            height: `${ITEM_HEIGHT}px`,
          }}
        >
          <div className="w-full border-y" />
        </div>
      )}
    </div>
  );
};

/** Renders formatted Jalali + Gregorian preview text. */
const SelectedDatePreview: React.FC<{
  year: number;
  month: number;
  day: number;
}> = ({ year, month, day }) => {
  const jalaliStr = `${year}-${String(month).padStart(2, "0")}-${String(
    day
  ).padStart(2, "0")}`;

  const gregorian = dayjs(jalaliStr, { jalali: true }).calendar("gregory");
  const formattedFa = dayjs(jalaliStr, { jalali: true })
    .locale("fa")
    .calendar("jalali")
    .format("dddd D MMMM YYYY");

  return (
    <div className="flex flex-col items-center gap-1 text-sm">
      <div>{formattedFa}</div>
      <div className="text-xs">({gregorian.format("YYYY-MM-DD")})</div>
    </div>
  );
};

/**
 * Main composite component: three wheels (day / month / year) + preview.
 */
const PersianWheelPicker: React.FC<IPersianWheelPickerProps> = ({
  minYear = 1300,
  maxYear = dayjs().calendar("jalali").year(),
  initialJalaliDate,
  onChange,
  className = "",
  centered = false,
  visibleRows = 5,
}) => {
  // Resolve initial Jalali date.
  const todayJalali = dayjs().calendar("jalali");
  let initial: Dayjs = todayJalali;

  if (initialJalaliDate) {
    const [y, m, d] = initialJalaliDate.split("-").map(Number);
    const parsed = dayjs()
      .calendar("jalali")
      .year(y)
      .month(m - 1)
      .date(d);
    if (parsed.isValid()) initial = parsed;
  }

  // Controlled state for each wheel.
  const [year, setYear] = useState<number>(() =>
    clamp(initial.year(), minYear, maxYear)
  );
  const [month, setMonth] = useState<number>(() => initial.month() + 1);
  const [day, setDay] = useState<number>(() => initial.date());

  // Days in current Jalali month (handles Esfand leap years).
  const daysInMonth = dayjs()
    .calendar("jalali")
    .year(year)
    .month(month - 1)
    .date(1)
    .daysInMonth();

  // Adjust day if month/year change makes it overflow.
  useEffect(() => {
    if (day > daysInMonth) setDay(daysInMonth);
  }, [daysInMonth, day]);

  // Build wheel item lists.
  const yearItems: WheelItem[] = [];
  for (let y = maxYear; y >= minYear; y--) {
    yearItems.push({ value: y, label: y.toString() });
  }

  const monthItems: WheelItem[] = faMonths.map((m, i) => ({
    value: i + 1,
    label: m,
  }));

  const dayItems: WheelItem[] = Array.from({ length: daysInMonth }, (_, i) => ({
    value: i + 1,
    label: (i + 1).toString().padStart(2, "0"),
  }));

  /** Debounced emit to parent so rapid scroll doesn't spam. */
  const emitChange = useDebouncedCallback(() => {
    const jalaliStr = `${year}-${String(month).padStart(2, "0")}-${String(
      day
    ).padStart(2, "0")}`;
    const gregorianIso = dayjs(jalaliStr, { jalali: true })
      .calendar("gregory")
      .format("YYYY-MM-DD");
    onChange?.({ jalali: jalaliStr, gregorian: gregorianIso });
  }, 150);

  useEffect(() => {
    emitChange();
  }, [year, month, day, emitChange]);

  return (
    <div
      dir="rtl"
      className={`flex flex-col gap-4 p-4 rounded-2xl w-full ${className}`}
    >
      <div className="flex justify-center">
        <Wheel
          ariaLabel="day"
          items={dayItems}
          value={day}
          onChange={setDay}
          centered={centered}
          visibleRows={visibleRows}
        />
        <Wheel
          ariaLabel="month"
          items={monthItems}
          value={month}
          onChange={setMonth}
          centered={centered}
          visibleRows={visibleRows}
        />
        <Wheel
          ariaLabel="year"
          items={yearItems}
          value={year}
          onChange={setYear}
          centered={centered}
          visibleRows={visibleRows}
        />
      </div>

      <SelectedDatePreview year={year} month={month} day={day} />

      {/* Hide scrollbars for aesthetic wheel look. */}
      <style jsx global>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
};

export default PersianWheelPicker;

/**
 * Usage Example:
 *
 * const Example = () => {
 *   const handleDate = (val: { jalali: string; gregorian: string }) => {
 *     console.log('Selected date:', val);
 *   };
 *   return <PersianWheelPicker onChange={handleDate} centered visibleRows={5} />;
 * };
 *
 * Notes:
 *  - Install dependencies: `npm i dayjs jalaliday`
 *  - For TypeScript, add: `declare module 'jalaliday';` if needed.
 *  - Use `maxYear` / `minYear` to enforce age limits.
 *  - `centered` mode displays guiding lines and spacers.
 */
