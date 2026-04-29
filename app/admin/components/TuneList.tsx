"use client";

import type { Tune } from "@/app/radio/types";
import AudioPreview from "./AudioPreview";

interface TuneListProps {
  tunes: Tune[];
  r2PublicUrl: string;
  onEdit: (tune: Tune) => void;
  onDelete: (tune: Tune) => void;
}

export default function TuneList({
  tunes,
  r2PublicUrl,
  onEdit,
  onDelete,
}: TuneListProps) {
  if (tunes.length === 0) {
    return <p className="tune-list__empty">No tunes found.</p>;
  }

  return (
    <table className="tune-list">
      <thead>
        <tr>
          <th>Title</th>
          <th>Key</th>
          <th>Format</th>
          <th>Confidence</th>
          <th>Preview</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {tunes.map((tune) => (
          <tr key={tune.url}>
            <td>{tune.title}</td>
            <td>{tune.key}</td>
            <td>{tune.format}</td>
            <td>
              <span
                className={
                  tune.confidence < 0.5
                    ? "tune-list__confidence--low"
                    : tune.confidence < 0.8
                      ? "tune-list__confidence--medium"
                      : "tune-list__confidence--high"
                }
              >
                {(tune.confidence * 100).toFixed(0)}%
              </span>
            </td>
            <td>
              <AudioPreview url={`${r2PublicUrl}/${tune.url}`} />
            </td>
            <td>
              <button
                className="tune-list__action"
                onClick={() => onEdit(tune)}
                type="button"
              >
                Edit
              </button>
              <button
                className="tune-list__action tune-list__action--delete"
                onClick={() => onDelete(tune)}
                type="button"
              >
                Delete
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
