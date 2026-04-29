"use client";

import "@/styles/loading-spinner.css";

export default function LoadingSpinner() {
  return (
    <div className="loading-spinner" role="status" aria-label="Loading">
      <svg
        className="loading-spinner__notes"
        viewBox="0 0 100 100"
        xmlns="http://www.w3.org/2000/svg"
      >
        <text className="loading-spinner__note loading-spinner__note--1" x="20" y="55" fontSize="30">
          &#9835;
        </text>
        <text className="loading-spinner__note loading-spinner__note--2" x="45" y="55" fontSize="30">
          &#9833;
        </text>
        <text className="loading-spinner__note loading-spinner__note--3" x="70" y="55" fontSize="30">
          &#9834;
        </text>
      </svg>
    </div>
  );
}
