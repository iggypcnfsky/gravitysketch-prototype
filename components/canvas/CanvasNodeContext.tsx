"use client";

import { createContext, useContext } from "react";
import type { CanvasElementCanvasPatch } from "@/lib/store";

interface CanvasNodeContextValue {
  canvasId: string;
  syncElement: (nodeId: string, patch: CanvasElementCanvasPatch) => void;
}

export const CanvasNodeContext = createContext<CanvasNodeContextValue | null>(null);

export function useCanvasNodeActions() {
  const context = useContext(CanvasNodeContext);
  if (!context) {
    throw new Error("useCanvasNodeActions must be used within CanvasNodeContext");
  }
  return context;
}
