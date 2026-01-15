"use client";

import { useEffect, useState } from "react";

const PageHeader = ({
  title,
  subtitle,
  scrollY,
  showBorder
}: {
  title: string;
  subtitle?: string;
  scrollY?: number;
  showBorder?: (value: boolean) => void;
}) => {
  useEffect(() => {
    if (scrollY && showBorder) {
      const handleScroll = () => {
        showBorder(window.scrollY > scrollY);
      };

      window.addEventListener("scroll", handleScroll);
      return () => window.removeEventListener("scroll", handleScroll);
    }
  }, [scrollY, showBorder]);

  return (
    <div className="flex items-center">
      <div>
        <h1 className="text-xl lg:text-3xl font-bold">{title}</h1>
        {subtitle ? <p className="text-muted-foreground">{subtitle}</p> : null}
      </div>
    </div>
  );
};

export default PageHeader;
