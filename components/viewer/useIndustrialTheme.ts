"use client";
import { useEffect, useState } from "react";

export function useIndustrialTheme() {
  const [industrial, setIndustrial] = useState(false);
  useEffect(() => {
    const update = () => setIndustrial(document.body.dataset.designTheme === "industrial");
    update();
    const observer = new MutationObserver(update);
    observer.observe(document.body, { attributes: true, attributeFilter: ["data-design-theme"] });
    return () => observer.disconnect();
  }, []);
  return industrial;
}
