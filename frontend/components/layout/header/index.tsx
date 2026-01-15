"use client";

import * as React from "react";
import { Calendar, CalendarClock, PanelLeftIcon } from "lucide-react";

import { useSidebar } from "@/components/ui/sidebar";
import ThemeSwitch from "@/components/layout/header/theme-switch";
import Notifications from "@/components/layout/header/notifications";
import { useRouteStore } from "@/components/global/BackNavigation/back-navigation-store";
import BackNavigation from "@/components/global/BackNavigation/BackNavigation";
import { CustomDrawer } from "@/components/ui/custom/CustomDrawer";
import IconTooltipButton from "@/components/ui/custom/IconTooltipButton";
import { useRouter } from "next/navigation";
import LiveTime from "@/components/global/live-time";
import { useAuthStore } from "@/lib/zustand-store/store";

export default function Header({
  themeCookieData,
  companyId
}: {
  themeCookieData: any;
  companyId: string | null;
}) {
  const routes = useRouteStore((state) => state.routes);
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  console.log("routes debug", routes);

  return (
    <div className="sticky top-0 z-40 flex flex-col">
      <header className="bg-background/50 flex h-14 items-center gap-3 px-4 backdrop-blur-xl lg:h-[60px]">
        <BackNavigation routes={routes} />
        <LiveTime />
        <IconTooltipButton
          icon={<Calendar />}
          tooltip="Work Calendar"
          iconSize="sm"
          onClick={(e) => {
            setOpen(true);
          }}
        />
        <Notifications />
        {/* <ThemeCustomizerPanel /> */}
        <ThemeSwitch themeCookieData={themeCookieData} />
      </header>
    </div>
  );
}
