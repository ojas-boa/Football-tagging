import { forwardRef } from 'react';

interface VideoPlayerProps {
  videoFile: string;
  isPlaying: boolean;
  onTimeUpdate: (time: number) => void;
  onDurationChange: (duration: number) => void;
}

const VideoPlayer = forwardRef<HTMLVideoElement, VideoPlayerProps>(
  ({ videoFile, isPlaying, onTimeUpdate, onDurationChange }, ref) => {
    return (
      <div className="flex-1 bg-black rounded overflow-hidden flex items-center justify-center">
        <video
          ref={ref}
          src={videoFile}
          className="max-w-full max-h-full"
          onTimeUpdate={(e) => onTimeUpdate(e.currentTarget.currentTime)}
          onLoadedMetadata={(e) => onDurationChange(e.currentTarget.duration)}
        />
      </div>
    );
  }
);

VideoPlayer.displayName = 'VideoPlayer';

export default VideoPlayer;
