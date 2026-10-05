"use client";
import { useEffect } from "react";
import type { JoomlaHost } from "@/lib/leads/submit";

export default function JoomlaBridge() {
  useEffect(() => {
    if (window.parent === window) return;
    const root = document.querySelector<HTMLElement>(".joomla-content");
    if (!root) return;
    const sendSize = () => window.parent.postMessage({ type: "antidrone:size", height: Math.ceil(root.getBoundingClientRect().height) + 4 }, location.origin);
    const scrollTo = (element: Element | null) => {
      if (element) window.parent.postMessage({ type: "antidrone:scroll", offset: Math.max(0, element.getBoundingClientRect().top + window.scrollY) }, location.origin);
    };
    const chooseShape = () => scrollTo(document.getElementById("calculator"));
    const followAnchor = (event: MouseEvent) => {
      const link = (event.target as Element).closest?.('a[href^="#"]');
      const href = link?.getAttribute("href");
      if (href && href.length > 1) scrollTo(document.getElementById(href.slice(1)));
    };
    const receive = (event: MessageEvent) => {
      if (event.source !== window.parent || event.origin !== location.origin || event.data?.type !== "antidrone:host") return;
      const { theme, styles, host } = event.data;
      for (const [key, property] of [["text", "color"], ["muted", "color"], ["accent", "color"], ["heading", "color"], ["font", "font-family"]]) {
        const value = theme?.[key];
        if (typeof value === "string" && value.length < 250 && CSS.supports(property, value)) root.style.setProperty("--host-" + key, value);
      }
      if (Array.isArray(styles)) for (const value of styles.slice(0, 8)) {
        if (typeof value !== "string") continue;
        const url = new URL(value, location.href);
        if (url.origin !== location.origin || !url.pathname.includes("/templates/")) continue;
        if (Array.from(document.querySelectorAll("link[rel=stylesheet]")).some(link => (link as HTMLLinkElement).href === url.href)) continue;
        const link = document.createElement("link"); link.rel = "stylesheet"; link.href = url.href; document.head.prepend(link);
      }
      if (host && typeof host.endpoint === "string" && typeof host.tokenName === "string" && Number.isInteger(host.moduleId) && host.moduleId > 0 && typeof host.enabled === "boolean") {
        window.antidroneJoomlaHost = host as JoomlaHost;
        window.dispatchEvent(new Event("antidrone-host-ready"));
      }
      sendSize();
    };
    window.addEventListener("message", receive);
    window.addEventListener("choose-shape", chooseShape);
    document.addEventListener("click", followAnchor);
    const observer = new ResizeObserver(sendSize); observer.observe(root);
    window.addEventListener("resize", sendSize);
    window.parent.postMessage({ type: "antidrone:ready" }, location.origin);
    sendSize();
    return () => { observer.disconnect(); window.removeEventListener("message", receive); window.removeEventListener("resize", sendSize); window.removeEventListener("choose-shape", chooseShape); document.removeEventListener("click", followAnchor); delete window.antidroneJoomlaHost; };
  }, []);
  return null;
}
