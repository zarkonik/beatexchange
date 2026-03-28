import { createContext, useContext, useState } from "react";
import type { ReactNode } from "react";

// ── 1. Define the shape ────────────────────
interface NavigationContextType {
  currentPage: string;
  navigateTo: (page: string) => void;
}

// ── 2. Create the context ──────────────────
const NavigationContext = createContext<NavigationContextType>({
  currentPage: "marketplace",
  navigateTo: () => {},
});

// ── 3. Provider ────────────────────────────
export function NavigationProvider({ children }: { children: ReactNode }) {
  const [currentPage, setCurrentPage] = useState("marketplace");

  const navigateTo = (page: string) => {
    setCurrentPage(page);
  };

  return (
    <NavigationContext.Provider value={{ currentPage, navigateTo }}>
      {children}
    </NavigationContext.Provider>
  );
}

// ── 4. Custom hook ─────────────────────────
export function useNavigation() {
  return useContext(NavigationContext);
}
