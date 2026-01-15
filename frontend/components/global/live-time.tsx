"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function LiveTime() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [is24Hour, setIs24Hour] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const formatTime = (date: Date, use24Hour: boolean) => {
    const timeOptions: Intl.DateTimeFormatOptions = {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true // Always show AM/PM
    };

    const dateOptions: Intl.DateTimeFormatOptions = {
      weekday: "long", // Add full weekday name
      month: "short",
      day: "2-digit"
    };

    const timeString = date.toLocaleTimeString("en-US", timeOptions);
    const dateString = date.toLocaleDateString("en-US", dateOptions);

    if (use24Hour) {
      // Convert to 24-hour format but keep AM/PM
      const hours24 = date.getHours();
      const minutes = date.getMinutes();
      const ampm = hours24 >= 12 ? "PM" : "AM";
      const formattedTime = `${hours24.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")} ${ampm}`;
      return `${dateString}, ${formattedTime}`;
    }

    return `${dateString}, ${timeString}`;
  };

  const toggleFormat = () => {
    setIs24Hour(!is24Hour);
  };

  return (
    <div className="cursor-pointer text-center">
      <Button
        className="hover:text-primary cursor-pointer font-mono text-sm font-bold transition-colors duration-200"
        variant={"outline"}
        onClick={toggleFormat}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            toggleFormat();
          }
        }}
        aria-label={`Current time in ${is24Hour ? "24" : "12"}-hour format. Click to toggle format.`}>
        {formatTime(currentTime, is24Hour)}
      </Button>
    </div>
  );
}
