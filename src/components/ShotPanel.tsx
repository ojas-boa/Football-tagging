import { BODY_PARTS, SHOT_RESULTS } from '../constants';
import { ShotResult } from '../types';

interface ShotPanelProps {
  result?: ShotResult;
  bodyPart?: string;
  onResult: (r: ShotResult) => void;
  onBodyPart: (b: string) => void;
  onCancel: () => void;
}

export default function ShotPanel({ result, bodyPart, onResult, onBodyPart, onCancel }: ShotPanelProps) {
  const btn = (active: boolean) =>
    `text-xs px-2 py-2 rounded flex items-center justify-between gap-1 ${
      active ? 'bg-red-600 text-white' : 'bg-gray-700 hover:bg-gray-600 text-white'
    }`;
  return (
    <div className="bg-gray-800 rounded p-3 border border-red-500/50">
      <div className="flex justify-between items-center mb-2">
        <div className="text-white text-sm font-semibold">Shot details</div>
        <button onClick={onCancel} className="text-gray-400 hover:text-white text-xs">Cancel (Esc)</button>
      </div>
      <div className="text-gray-400 text-xs mb-1">Result</div>
      <div className="grid grid-cols-3 gap-1 mb-3">
        {SHOT_RESULTS.map(r => (
          <button key={r.value} onClick={() => onResult(r.value)} className={btn(result === r.value)}>
            {r.value} <kbd className="opacity-60">{r.key}</kbd>
          </button>
        ))}
      </div>
      <div className="text-gray-400 text-xs mb-1">Body part</div>
      <div className="grid grid-cols-2 gap-1">
        {BODY_PARTS.map(b => (
          <button key={b.value} onClick={() => onBodyPart(b.value)} className={btn(bodyPart === b.value)}>
            {b.value} <kbd className="opacity-60">{b.key}</kbd>
          </button>
        ))}
      </div>
      <div className="text-gray-500 text-xs mt-2">Pick both, then click the shot location on the pitch.</div>
    </div>
  );
}
