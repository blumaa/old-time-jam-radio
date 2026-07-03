"use client";

import type { Tune } from "../types";
import Drawer from "./Drawer";

interface QueueDrawerProps {
  isOpen: boolean;
  queue: Tune[];
  currentIndex: number;
  onJump: (index: number) => void;
  onRemove: (index: number) => void;
  onClose: () => void;
}

export default function QueueDrawer({
  isOpen,
  queue,
  currentIndex,
  onJump,
  onRemove,
  onClose,
}: QueueDrawerProps) {
  return (
    <Drawer isOpen={isOpen} onClose={onClose} testId="queue-drawer">
      <div className="queue-drawer__header">
        <span className="queue-drawer__title">Queue · on repeat</span>
        <button
          className="queue-drawer__close"
          type="button"
          aria-label="Close queue"
          onClick={onClose}
        >
          ✕
        </button>
      </div>

      {queue.length === 0 ? (
        <p className="queue-drawer__empty">
          No tunes queued. Search to add tunes — they loop on repeat.
        </p>
      ) : (
        <ul className="queue-drawer__list" role="list">
          {queue.map((tune, index) => (
            <li
              key={`${tune.url}-${index}`}
              className={`queue-drawer__item ${
                index === currentIndex ? "queue-drawer__item--current" : ""
              }`}
            >
              <button
                className="queue-drawer__jump"
                type="button"
                aria-current={index === currentIndex}
                onClick={() => onJump(index)}
              >
                <span className="queue-drawer__item-title">{tune.title}</span>
                <span className="queue-drawer__item-key" data-testid="queue-item-key">
                  {tune.key}
                </span>
              </button>
              <button
                className="queue-drawer__remove"
                type="button"
                aria-label={`Remove ${tune.title} from queue`}
                onClick={() => onRemove(index)}
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}
    </Drawer>
  );
}
