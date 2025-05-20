"use client";

import { createContext, useCallback, useContext, useState } from "react";

const SidebarContext = createContext();

export function SidebarProvider({ children }) {
  const [sidebarVisible, setSidebarVisible] = useState(true);

  const toggleSidebar = useCallback(() => {
    setSidebarVisible((prevState) => !prevState);
  }, []);

  const hideSidebar = useCallback(() => {
    setSidebarVisible(false);
  }, []);

  const showSidebar = useCallback(() => {
    setSidebarVisible(true);
  }, []);

  return <SidebarContext.Provider value={{ sidebarVisible, toggleSidebar, hideSidebar, showSidebar }}>{children}</SidebarContext.Provider>;
}

export function useSidebar() {
  const context = useContext(SidebarContext);
  if (context === undefined) {
    throw new Error("useSidebar must be used within a SidebarProvider");
  }
  return context;
}
