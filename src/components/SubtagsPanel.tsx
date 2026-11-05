interface SubtagsPanelProps {
  subtags: string[];
  active: string[];
  target: string;
  disabled: boolean;
  onToggle: (subtag: string) => void;
}

export default function SubtagsPanel({ subtags, active, target, disabled, onToggle }: SubtagsPanelProps) {
  return (
    <div className="bg-gray-800 rounded p-3">
      <div className="flex justify-between text-xs mb-2">
        <span className="text-white font-semibold">Subtags</span>
        <span className="text-gray-400 truncate ml-2">{disabled ? 'Tag an event first' : `on ${target}`}</span>
      </div>
      <div className="grid grid-cols-4 gap-1 max-h-[150px] overflow-y-auto">
        {subtags.map(s => {
          const on = active.includes(s);
          return (
            <button
              key={s}
              onClick={() => onToggle(s)}
              disabled={disabled}
              className={`text-xs px-1 py-1.5 rounded truncate disabled:opacity-40 ${
                on ? 'bg-amber-500 text-gray-900 font-semibold' : 'bg-gray-700 hover:bg-gray-600 text-white'
              }`}
            >
              {s.replace(/_/g, ' ')}
            </button>
          );
        })}
      </div>
    </div>
  );
}
