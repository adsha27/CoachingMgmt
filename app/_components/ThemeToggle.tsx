"use client";

import { useEffect, useState } from "react";

// Reads the theme applied pre-paint by the inline script in layout.tsx,
// then toggles + persists it. Light is the hard default (DESIGN.md).
export function ThemeToggle() {
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    setTheme(document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light");
  }, []);

  function toggle() {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.setAttribute("data-theme", next);
    try {
      localStorage.setItem("theme", next);
    } catch {
      // ignore — private mode / storage disabled
    }
  }

  return (
    <button className="theme-toggle" onClick={toggle} aria-label="Toggle light or dark theme">
      ◐ {theme === "dark" ? "light" : "dark"} mode
    </button>
  );
}
