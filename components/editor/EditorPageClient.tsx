"use client";

import dynamic from "next/dynamic";
import { getRoom } from "@/lib/store";

const EditorShell = dynamic(
  () => import("@/components/editor/EditorShell").then((mod) => mod.EditorShell),
  { ssr: false },
);

interface EditorPageClientProps {
  roomId: string;
}

export function EditorPageClient({ roomId }: EditorPageClientProps) {
  const room = getRoom(roomId);
  const roomName = room?.name ?? "New Room";

  return <EditorShell roomId={roomId} roomName={roomName} />;
}
