import { EVENT_HOTKEYS } from '../constants';
import { TagData } from '../types';

interface TimelineProps {
  currentTime: number;
  duration: number;
  tags: TagData[];
  onSeek: (time: number) => void;
}

export default function Timeline({ currentTime, duration, tags, onSeek }: TimelineProps) {
  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    const time = percentage * duration;
    onSeek(time);
  };

  return (
    <div className="bg-gray-800 rounded p-2" style={{ height: '80px' }}>
      <div
        className="relative bg-gray-700 rounded h-full cursor-pointer"
        onClick={handleClick}
      >
        {duration > 0 && (
          <>
            <div
              className="absolute top-0 bottom-0 bg-blue-500 opacity-30"
              style={{ width: `${(currentTime / duration) * 100}%` }}
            />

            <div
              className="absolute top-0 bottom-0 w-0.5 bg-white"
              style={{ left: `${(currentTime / duration) * 100}%` }}
            />

            {tags.map((tag, idx) => {
              const left = (tag.timestamp / duration) * 100;
              const color = EVENT_HOTKEYS[tag.event as keyof typeof EVENT_HOTKEYS]?.color || '#666';

              return (
                <div
                  key={idx}
                  className="absolute top-0 bottom-0 w-1 cursor-pointer hover:w-2 transition-all"
                  style={{
                    left: `${left}%`,
                    backgroundColor: color,
                  }}
                  title={`${tag.event} - Player ${tag.playerId}`}
                />
              );
            })}
          </>
        )}
      </div>
    </div>
  );
}
