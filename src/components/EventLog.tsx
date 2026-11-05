import { Trash2 } from 'lucide-react';
import { EVENTS } from '../constants';
import { formatClock, playerLabel } from '../lib/match';
import { Match, Tag } from '../types';

interface EventLogProps {
  match: Match;
  selectedId: string | null;
  onSelect: (tag: Tag) => void;
  onDelete: (id: string) => void;
  onToggleOutcome: (id: string) => void;
}

export default function EventLog({ match, selectedId, onSelect, onDelete, onToggleOutcome }: EventLogProps) {
  const tags = match.tags
    .map((t, i) => ({ t, i }))
    .sort((a, b) => b.t.half - a.t.half || b.t.t - a.t.t || b.i - a.i)
    .map(x => x.t);
  return (
    <div className="bg-gray-800 rounded p-2 flex-1 min-h-0 flex flex-col">
      <div className="text-white text-xs font-semibold mb-1 px-1">Event log ({tags.length})</div>
      <div className="overflow-y-auto flex-1 text-xs">
        {tags.length === 0 && <div className="text-gray-500 p-2">No events yet.</div>}
        {tags.map(t => {
          const team = match[t.team];
          const sel = t.id === selectedId;
          const detail =
            t.event === 'SHOT'
              ? `${t.shotResult ?? ''}${t.bodyPart ? ` · ${t.bodyPart}` : ''}`
              : t.receiverId !== undefined
                ? `→ ${playerLabel(team, t.receiverId)}`
                : '';
          return (
            <div
              key={t.id}
              onClick={() => onSelect(t)}
              className={`flex items-center gap-2 px-1 py-1 rounded cursor-pointer ${
                sel ? 'bg-gray-600' : 'hover:bg-gray-700'
              }`}
            >
              <span className="text-gray-400 w-16 shrink-0 whitespace-nowrap">
                {t.half}H {formatClock(t.t)}
              </span>
              <span className="w-2 h-2 rounded-full shrink-0" style={{ background: team.color }} />
              <span className="font-semibold shrink-0" style={{ color: EVENTS[t.event].color }}>
                {EVENTS[t.event].label}
              </span>
              <span className="text-gray-200 truncate flex-1">
                {playerLabel(team, t.playerId)} {detail}
                {t.subtags.length > 0 && <span className="text-amber-400"> [{t.subtags.join(', ')}]</span>}
              </span>
              {t.outcome && (
                <button
                  title="Toggle outcome"
                  onClick={e => {
                    e.stopPropagation();
                    onToggleOutcome(t.id);
                  }}
                  className={`px-1 rounded ${t.outcome === 'success' ? 'text-green-400' : 'text-red-400'}`}
                >
                  {t.outcome === 'success' ? '✓' : '✗'}
                </button>
              )}
              <button
                title="Delete"
                onClick={e => {
                  e.stopPropagation();
                  onDelete(t.id);
                }}
                className="text-gray-500 hover:text-red-400"
              >
                <Trash2 size={12} />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
