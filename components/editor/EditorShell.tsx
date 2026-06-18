import { EditorViewport } from "./EditorViewport";
import styles from "./EditorShell.module.css";

interface EditorShellProps {
  roomId: string;
  roomName: string;
}

export function EditorShell({ roomId, roomName }: EditorShellProps) {
  return (
    <div className={styles.shell}>
      <EditorViewport roomId={roomId} roomName={roomName} />
    </div>
  );
}
