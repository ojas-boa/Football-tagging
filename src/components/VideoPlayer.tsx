import { forwardRef } from 'react';

interface VideoPlayerProps {
  videoFile: string;
  onTimeUpdate: (time: number) => void;
  onDurationChange: (duration: number) => void;
  onPlayState: (playing: boolean) => void;
}

const VideoPlayer = forwardRef<HTMLVideoElement, VideoPlayerProps>(
  ({ videoFile, onTimeUpdate, onDurationChange, onPlayState }, ref) => (
    <div className="flex-1 min-h-0 bg-black rounded overflow-hidden flex items-center justify-center">
      <video
        ref={ref}
        src={videoFile}
        className="max-w-full max-h-full"
        onTimeUpdate={e => onTimeUpdate(e.currentTarget.currentTime)}
        onLoadedMetadata={e => onDurationChange(e.currentTarget.duration)}
        onPlay={() => onPlayState(true)}
        onPause={() => onPlayState(false)}
      />
    </div>
  ),
);

VideoPlayer.displayName = 'VideoPlayer';

export default VideoPlayer;
