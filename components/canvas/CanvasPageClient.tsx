"use client";

import dynamic from "next/dynamic";
import { getCanvas } from "@/lib/store";

const CanvasPanel = dynamic(
  () => import("./CanvasPanel").then((mod) => mod.CanvasPanel),
  { ssr: false },
);

interface CanvasPageClientProps {
  canvasId: string;
}

export function CanvasPageClient({ canvasId }: CanvasPageClientProps) {
  const canvas = getCanvas(canvasId);
  const canvasName = canvas?.name ?? "Canvas";

  return <CanvasPanel canvasId={canvasId} canvasName={canvasName} />;
}
