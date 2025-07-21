import PersianWheelCalender from "@/components/persian-wheel-calender";
import * as React from "react";

// This page displays items from the custom registry.
// You are free to implement this with your own design as needed.

export default function Home() {
  return (
    <div className="grid place-items-center h-dvh w-full">
      <PersianWheelCalender
        initialJalaliDate="1379-10-05"
        centered
        className="border w-fit !max-w-full"
        visibleRows={5}
      />
    </div>
  );
}
