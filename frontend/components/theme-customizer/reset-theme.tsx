"use client";

import { Button } from "@/components/ui/button";
import { DEFAULT_THEME } from "@/lib/themes";
import { useThemeConfig } from "../active-theme";

export function ResetThemeButton() {
  const { setTheme } = useThemeConfig();

  const resetThemeHandle = () => {
    setTheme(DEFAULT_THEME);
  };

  return (
    <Button variant="destructive" className="mt-4 w-full" onClick={resetThemeHandle}>
      Reset to Default
    </Button>
  );
}
