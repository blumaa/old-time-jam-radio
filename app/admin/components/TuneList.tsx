"use client";

import type { Tune } from "@/app/radio/types";
import AudioPreview from "./AudioPreview";

type SortDirection = "asc" | "desc" | null;

interface TuneListProps {
  tunes: Tune[];
  r2PublicUrl: string;
  onEdit: (tune: Tune) => void;
  onDelete: (tune: Tune) => void;
  sortDirection: SortDirection;
  onSortByConfidence: () => void;
}

export default function TuneList({
  tunes,
  r2PublicUrl,
  onEdit,
  onDelete,
  sortDirection,
  onSortByConfidence,
}: TuneListProps) {
  if (tunes.length === 0) {
    return <p className="tune-list__empty">No tunes found.</p>;
  }

  const sortArrow = sortDirection === "asc" ? "▲" : sortDirection === "desc" ? "▼" : "";

  return (
    <table className="tune-list">
      <thead>
        <tr>
          <th>Title</th>
          <th>Artist</th>
          <th>Key</th>
          <th>Format</th>
          <th
            className="tune-list__sortable"
            onClick={onSortByConfidence}
          >
            Confidence
            {sortArrow && <span className="tune-list__sort-arrow">{sortArrow}</span>}
          </th>
          <th>Preview</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {tunes.map((tune) => (
          <tr key={tune.url}>
            <td>{tune.title}</td>
            <td>{tune.artist}</td>
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
