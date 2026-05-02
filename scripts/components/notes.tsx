import { Fragment } from "react";
import type { AppNotes } from "../types";

interface NotesProps {
  notes?: AppNotes;
  downloadUrls: Record<string, string>;
}

export function Notes({ notes, downloadUrls }: NotesProps) {
  if (!notes) return null;
  const lines = Object.entries(notes)
    .filter((entry): entry is [string, string] => Boolean(entry[1]) && Boolean(downloadUrls[entry[0]]))
    .map(([, note]) => note.trim());
  if (lines.length === 0) return null;
  return (
    <div className="note-box">
      {lines.map((line, i) => (
        <Fragment key={i}>
          {i > 0 && <><br /><br /></>}
          {line}
        </Fragment>
      ))}
    </div>
  );
}
