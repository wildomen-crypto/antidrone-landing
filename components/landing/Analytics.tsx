"use client";
import { useEffect } from "react";
import { track } from "@/lib/analytics";
export default function Analytics() {
  useEffect(() => {
    const click = (event: MouseEvent) => {
      const link = (event.target as Element)?.closest("a");
      const href = link?.getAttribute("href") ?? "";
      if (href.startsWith("tel:")) track("call_click");
      else if (href.startsWith("mailto:")) track("email_click");
      else if (href === "#calculator") track("open_calculator");
    };
    document.addEventListener("click", click); return () => document.removeEventListener("click", click);
  }, []);
  return null;
}
