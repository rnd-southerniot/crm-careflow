"use client";

import { useMemo } from "react";

interface CompanyLogoProps {
  name: string;
  size?: number;
  className?: string;
}

export function CompanyLogo({ name, size = 40, className = "" }: CompanyLogoProps) {
  const initials = useMemo(() => {
    if (!name) return "??";

    // Split the company name by spaces
    const words = name.split(" ");

    // Get the first letter of the first word
    const firstInitial = words[0] ? words[0][0] : "";

    // Get the first letter of the second word (if it exists)
    const secondInitial = words.length > 1 ? words[1][0] : "";

    // Return the initials in uppercase
    return (firstInitial + secondInitial).toUpperCase();
  }, [name]);

  // Generate a deterministic color based on the company name
  const backgroundColor = useMemo(() => {
    if (!name) return "#6366F1"; // Default color

    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }

    const colors = [
      "#F97316", // Orange
      "#14B8A6", // Teal
      "#8B5CF6", // Purple
      "#EC4899", // Pink
      "#06B6D4", // Cyan
      "#22C55E", // Green
      "#EF4444", // Red
      "#3B82F6" // Blue
    ];

    // Use the hash to select a color from our palette
    const colorIndex = Math.abs(hash) % colors.length;
    return colors[colorIndex];
  }, [name]);

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      className={className}
      xmlns="http://www.w3.org/2000/svg">
      <rect width="40" height="40" rx="8" fill={backgroundColor} />
      <text
        x="20"
        y="20"
        fontFamily="system-ui, sans-serif"
        fontSize="16"
        fontWeight="bold"
        fill="white"
        textAnchor="middle"
        dominantBaseline="central">
        {initials}
      </text>
    </svg>
  );
}
