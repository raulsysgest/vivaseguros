"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect } from "react";

interface DashboardContextType {
  isCollapsed: boolean;
  isMobileOpen: boolean;
  theme: "light" | "dark";
  toggleCollapse: () => void;
  toggleMobile: () => void;
  closeMobile: () => void;
  toggleTheme: () => void;
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

export function DashboardProvider({ children }: { children: ReactNode }) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">("light");

  const toggleCollapse = () => setIsCollapsed((prev) => !prev);
  const toggleMobile = () => setIsMobileOpen((prev) => !prev);
  const closeMobile = () => setIsMobileOpen(false);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  };

  // Sincroniza a classe dark no HTML quando alternar
  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }, [theme]);

  return (
    <DashboardContext.Provider
      value={{
        isCollapsed,
        isMobileOpen,
        theme,
        toggleCollapse,
        toggleMobile,
        closeMobile,
        toggleTheme,
      }}
    >
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboard() {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error("useDashboard deve ser utilizado dentro de um <DashboardProvider />");
  }
  return context;
}
