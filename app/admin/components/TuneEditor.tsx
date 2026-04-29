"use client";

import { useState } from "react";
import type { Tune } from "@/app/radio/types";

interface TuneEditorProps {
  tune: Tune;
  onSave: (updated: Tune) => void;
  onCancel: () => void;
}

const KEYS = [
  "?",
  "C", "G", "D", "A", "E", "B", "F#",
  "F", "Bb", "Eb", "Ab",
  "Am", "Em", "Bm", "F#m", "Dm", "Gm", "Cm",
];

export default function TuneEditor({ tune, onSave, onCancel }: TuneEditorProps) {
  const [title, setTitle] = useState(tune.title);
  const [key, setKey] = useState(tune.key);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    onSave({ ...tune, title, key });
  }

  return (
    <form className="tune-editor" onSubmit={handleSubmit}>
      <div className="tune-editor__field">
        <label htmlFor="tune-title">Title</label>
        <input
          id="tune-title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>
      <div className="tune-editor__field">
        <label htmlFor="tune-key">Key</label>
        <select
          id="tune-key"
          value={key}
          onChange={(e) => setKey(e.target.value)}
        >
          {KEYS.map((k) => (
            <option key={k} value={k}>
              {k}
            </option>
          ))}
        </select>
      </div>
      <div className="tune-editor__actions">
        <button type="submit">Save</button>
        <button type="button" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  );
}
