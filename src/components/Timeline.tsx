import { EVENTS } from '../constants';
import { Tag } from '../types';

interface TimelineProps {
  currentTime: number;
  duration: number;
  tags: Tag[];
  onSeek: (time: number) => void;
}

export default function Timeline({ currentTime, duration, tags, onSeek }: TimelineProps) {
  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    onSeek(((e.clientX - rect.left) / rect.width) * duration);
  };

  return (
    <div className="bg-gray-800 rounded p-2" style={{ height: 56 }}>
      <div className="relative bg-gray-700 rounded h-full cursor-pointer" onClick={handleClick}>
        {duration > 0 && (
          <>
            <div
              className="absolute top-0 bottom-0 bg-blue-500 opacity-30"
              style={{ width: `${(currentTime / duration) * 100}%` }}
            />
            <div className="absolute top-0 bottom-0 w-0.5 bg-white" style={{ left: `${(currentTime / duration) * 100}%` }} />
            {tags.map(tag => (
              <div
                key={tag.id}
                className="absolute w-1 hover:w-2"
                style={{
                  left: `${(tag.t / duration) * 100}%`,
                  top: tag.team === 'home' ? 0 : '50%',
                  height: '50%',
                  backgroundColor: EVENTS[tag.event].color,
                }}
                title={`${EVENTS[tag.event].label}`}
              />
            ))}
          </>
        )}
      </div>
    </div>
  );
}
