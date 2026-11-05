import { EVENTS } from '../constants';
import { Tag, Team } from '../types';
import { onPitch } from '../lib/match';

interface OutcomePanelProps {
  pending: Partial<Tag>;
  team: Team;
  onReceiver: (id: number) => void;
  onSuccess: () => void;
  onFail: () => void;
  onCancel: () => void;
}

export default function OutcomePanel({ pending, team, onReceiver, onSuccess, onFail, onCancel }: OutcomePanelProps) {
  const def = pending.event ? EVENTS[pending.event] : null;
  const isPass = !!def?.hasEnd;
  return (
    <div className="bg-gray-800 rounded p-3 border border-blue-500/50">
      <div className="flex justify-between items-center mb-2">
        <div className="text-white text-sm font-semibold">{def?.label} outcome</div>
        <button onClick={onCancel} className="text-gray-400 hover:text-white text-xs">Cancel (Esc)</button>
      </div>
      {isPass && (
        <>
          <div className="text-gray-400 text-xs mb-1">Completed to… (click a player here or on the pitch)</div>
          <div className="grid grid-cols-6 gap-1 mb-2">
            {onPitch(team)
              .filter(p => p.id !== pending.playerId)
              .map(p => (
                <button
                  key={p.id}
                  title={p.name}
                  onClick={() => onReceiver(p.id)}
                  className="bg-gray-700 hover:bg-blue-600 text-white text-xs py-1.5 rounded truncate"
                >
                  {p.number}
                </button>
              ))}
          </div>
        </>
      )}
      <div className="grid grid-cols-2 gap-1">
        <button onClick={onSuccess} className="bg-green-700 hover:bg-green-600 text-white text-xs py-2 rounded">
          {isPass ? 'Completed, no receiver' : 'Won / successful'} <kbd className="opacity-60">Y</kbd>
        </button>
        <button onClick={onFail} className="bg-red-700 hover:bg-red-600 text-white text-xs py-2 rounded">
          {isPass ? 'Incomplete' : 'Lost / unsuccessful'} <kbd className="opacity-60">N</kbd>
        </button>
      </div>
    </div>
  );
}
