"use client";

import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { MoonIcon, SunIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { setCookie } from "@/lib/cookie";
import { cookieOptions } from "@/lib/utils";

export default function ThemeSwitch({ themeCookieData }: { themeCookieData: any }) {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && themeCookieData) {
      setTheme(themeCookieData.themeData)
    }
  }, [mounted, themeCookieData]);

  if (!mounted) {
    return null;
  }

  return (
    <Button
      size="icon"
      variant="outline"
      className="relative"
      onClick={() => {
        setTheme(theme === "light" ? "dark" : "light");
        setCookie({
          name: String(process.env.NEXT_PUBLIC_THEME),
          value: JSON.stringify({
            themeData: theme === "light" ? "dark" : "light"
          }),
          options: cookieOptions
        });
      }}>
      {theme === "light" ? <SunIcon /> : <MoonIcon />}
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}
