interface SubtagsPanelProps {
  subtags: string[];
  onSubtagClick: (subtag: string) => void;
  disabled: boolean;
}

export default function SubtagsPanel({ subtags, onSubtagClick, disabled }: SubtagsPanelProps) {
  return (
    <div className="bg-gray-800 rounded p-3">
      <div className="text-white text-xs font-semibold mb-2">SUBTAGS</div>
      <div className="grid grid-cols-4 gap-1 max-h-[180px] overflow-y-auto">
        {subtags.map((subtag) => (
          <button
            key={subtag}
            onClick={() => onSubtagClick(subtag)}
            disabled={disabled}
            className="bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:opacity-50 text-white text-xs px-2 py-1.5 rounded"
          >
            {subtag}
          </button>
        ))}
      </div>
    </div>
  );
}
