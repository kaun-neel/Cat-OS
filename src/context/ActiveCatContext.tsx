import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { api } from "../lib/api";
import { useAuth } from "./AuthContext";

export type RiskStatus = "STABLE" | "MONITOR" | "ATTENTION";

export interface Cat {
  id: string;
  userId: string;
  name: string;
  breed: string;
  age: string;
  weightLbs: number | null;
  sex: string;
  conditions: string[];
  vet: string;
  status: RiskStatus;
  photo: string;
  fileNumber: string;
  createdAt: string;
}

interface ActiveCatContextValue {
  cats: Cat[];
  activeCat: Cat | null;
  activeCatId: string;
  loading: boolean;
  setActiveCatId: (id: string) => void;
  refreshCats: () => Promise<void>;
  removeCat: (id: string) => Promise<void>;
}

const ActiveCatContext = createContext<ActiveCatContextValue | null>(null);

export function ActiveCatProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [cats, setCats] = useState<Cat[]>([]);
  const [activeCatId, setActiveCatId] = useState("");
  const [loading, setLoading] = useState(true);

  const refreshCats = useCallback(async () => {
    if (!user) {
      setCats([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const { cats } = await api.get("/cats");
      setCats(cats);
      setActiveCatId((current) => (cats.find((c: Cat) => c.id === current) ? current : cats[0]?.id ?? ""));
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    refreshCats();
  }, [refreshCats]);

  async function removeCat(id: string) {
    await api.del(`/cats/${id}`);
    await refreshCats();
  }

  const value = useMemo<ActiveCatContextValue>(
    () => ({
      cats,
      activeCatId,
      activeCat: cats.find((c) => c.id === activeCatId) ?? null,
      loading,
      setActiveCatId,
      refreshCats,
      removeCat,
    }),
    [cats, activeCatId, loading, refreshCats]
  );

  return <ActiveCatContext.Provider value={value}>{children}</ActiveCatContext.Provider>;
}

export function useActiveCat() {
  const ctx = useContext(ActiveCatContext);
  if (!ctx) throw new Error("useActiveCat must be used within ActiveCatProvider");
  return ctx;
}
