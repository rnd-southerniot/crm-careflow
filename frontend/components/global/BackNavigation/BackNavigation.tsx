"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ArrowLeftIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const BackNavigation = ({ routes }: { routes: string[] }) => {
  return (
    <Button
      variant="outline"
      size={"icon"}
      className={cn("ml-0 flex items-center gap-2")}
      disabled={routes.length == 0}>
      <Link href={routes.length > 0 ? routes[0] : "#"}>
        <ArrowLeftIcon className="size-5" />
      </Link>
    </Button>
  );
};

export default BackNavigation;
