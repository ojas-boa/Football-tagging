import { FORMATIONS } from '../constants';

interface PitchPanelProps {
  formation: string;
  flipped: boolean;
  playerNumbers: Record<number, string>;
  selectedPlayer: number | null;
  coordinateMode: boolean;
  onPlayerSelect: (id: number) => void;
  onPitchClick: (x: number, y: number) => void;
}

export default function PitchPanel({
  formation,
  flipped,
  playerNumbers,
  selectedPlayer,
  coordinateMode,
  onPlayerSelect,
  onPitchClick,
}: PitchPanelProps) {
  const positions = FORMATIONS[formation] || FORMATIONS['442'];

  const handlePitchClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (coordinateMode) {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      onPitchClick(x, y);
    }
  };

  return (
    <div
      className="relative bg-green-600 rounded overflow-hidden"
      style={{
        height: '280px',
      }}
      onClick={handlePitchClick}
    >
      <div className="absolute inset-0 border-4 border-white opacity-50" />

      <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-white opacity-50" />

      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 border-2 border-white opacity-50 rounded-full" />

      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[15%] h-[40%] border-4 border-r-0 border-white opacity-50" />
      <div className="absolute right-0 top-1/2 -translate-y-1/2 w-[15%] h-[40%] border-4 border-l-0 border-white opacity-50" />

      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[5%] h-[20%] border-4 border-r-0 border-white opacity-50" />
      <div className="absolute right-0 top-1/2 -translate-y-1/2 w-[5%] h-[20%] border-4 border-l-0 border-white opacity-50" />

      {!coordinateMode && positions.map((pos, idx) => {
        const playerId = idx + 1;
        const xPos = flipped ? 100 - pos.x : pos.x;
        const isSelected = selectedPlayer === playerId;

        return (
          <button
            key={playerId}
            className={`absolute transform -translate-x-1/2 -translate-y-1/2 transition-all rounded flex items-center justify-center font-bold border-2 ${
              isSelected
                ? 'bg-yellow-400 border-yellow-600 text-gray-900 shadow-lg scale-110 z-10'
                : 'bg-blue-600 border-blue-800 text-white hover:bg-blue-500 hover:scale-105'
            }`}
            style={{
              left: `${xPos}%`,
              top: `${pos.y}%`,
              width: '50px',
              height: '36px',
              pointerEvents: coordinateMode ? 'none' : 'auto',
            }}
            onClick={(e) => {
              e.stopPropagation();
              onPlayerSelect(playerId);
            }}
          >
            {playerNumbers[playerId] || playerId}
          </button>
        );
      })}

      {coordinateMode && (
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center cursor-crosshair">
          <div className="text-white text-xl font-bold bg-gray-900 bg-opacity-75 px-6 py-3 rounded">
            Click to place marker
          </div>
        </div>
      )}
    </div>
  );
}
