import { useState, useRef, useEffect } from 'react';
import { Play, Pause, RotateCw, Download } from 'lucide-react';
import { FORMATIONS, EVENT_HOTKEYS, SUBTAGS } from './constants';
import VideoPlayer from './components/VideoPlayer';
import PitchPanel from './components/PitchPanel';
import SubtagsPanel from './components/SubtagsPanel';
import Timeline from './components/Timeline';
import ShotPanel from './components/ShotPanel';
import { FormationData, TagData, PlayerPosition } from './types';

function App() {
  const [videoFile, setVideoFile] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [formation, setFormation] = useState('442');
  const [flipped, setFlipped] = useState(false);
  const [playerNumbers, setPlayerNumbers] = useState<Record<number, string>>({});
  const [playerNames, setPlayerNames] = useState<Record<number, string>>({});
  const [showRoster, setShowRoster] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<number | null>(null);
  const [coordinateMode, setCoordinateMode] = useState(false);
  const [pendingTag, setPendingTag] = useState<Partial<TagData> | null>(null);
  const [shotPanelActive, setShotPanelActive] = useState(false);
  const [tags, setTags] = useState<TagData[]>([]);
  const [formationHistory, setFormationHistory] = useState<FormationData[]>([]);
  const [lastFormationTime, setLastFormationTime] = useState(0);

  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'ControlRight' || (e.ctrlKey && e.location === 2)) {
        e.preventDefault();
        togglePlayPause();
      }

      if (!selectedPlayer || coordinateMode || shotPanelActive) return;

      const eventKey = Object.keys(EVENT_HOTKEYS).find(
        key => EVENT_HOTKEYS[key as keyof typeof EVENT_HOTKEYS].key.toLowerCase() === e.key.toLowerCase()
      );

      if (eventKey) {
        const event = eventKey as keyof typeof EVENT_HOTKEYS;
        if (event === 'SHOT') {
          setPendingTag({
            timestamp: currentTime,
            playerId: selectedPlayer,
            event: 'SHOT',
          });
          setShotPanelActive(true);
        } else {
          setPendingTag({
            timestamp: currentTime,
            playerId: selectedPlayer,
            event,
          });
          setCoordinateMode(true);
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [selectedPlayer, coordinateMode, shotPanelActive, currentTime]);

  useEffect(() => {
    const initNumbers: Record<number, string> = {};
    const initNames: Record<number, string> = {};
    const count = parseInt(formation[0]) + parseInt(formation[1]) + parseInt(formation[2]) + 1;
    for (let i = 1; i <= count; i++) {
      if (!playerNumbers[i]) initNumbers[i] = i.toString();
      if (!playerNames[i]) initNames[i] = `Player ${i}`;
    }
    if (Object.keys(initNumbers).length > 0) setPlayerNumbers(prev => ({ ...prev, ...initNumbers }));
    if (Object.keys(initNames).length > 0) setPlayerNames(prev => ({ ...prev, ...initNames }));
  }, [formation]);

  const togglePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setVideoFile(url);
    }
  };

  const handleFormationChange = (newFormation: string) => {
    if (formationHistory.length > 0 || currentTime > 0) {
      setFormationHistory(prev => [...prev, {
        formation,
        startTime: lastFormationTime,
        endTime: currentTime,
      }]);
    }
    setFormation(newFormation);
    setLastFormationTime(currentTime);
  };

  const handlePitchClick = (x: number, y: number) => {
    if (coordinateMode && pendingTag) {
      const newTag: TagData = {
        ...pendingTag,
        x,
        y,
      } as TagData;
      setTags(prev => [...prev, newTag]);
      setCoordinateMode(false);
      setPendingTag(null);
      setSelectedPlayer(null);
    }
  };

  const handleSubtagClick = (subtag: string) => {
    if (pendingTag && !shotPanelActive) {
      setPendingTag({
        ...pendingTag,
        subtag,
      });
      setCoordinateMode(true);
    }
  };

  const handleShotComplete = (result: string, bodyPart: string) => {
    if (pendingTag) {
      setPendingTag({
        ...pendingTag,
        shotResult: result,
        bodyPart,
      });
      setShotPanelActive(false);
      setCoordinateMode(true);
    }
  };

  const exportToCSV = () => {
    const headers = ['Timestamp', 'Formation', 'Player', 'Event', 'Subtag', 'Shot Result', 'Body Part', 'X', 'Y'];

    const rows = tags.map(tag => [
      formatTime(tag.timestamp),
      formation,
      playerNumbers[tag.playerId] || tag.playerId,
      tag.event,
      tag.subtag || '',
      tag.shotResult || '',
      tag.bodyPart || '',
      tag.x?.toFixed(2) || '',
      tag.y?.toFixed(2) || '',
    ]);

    const formationRows = formationHistory.map(fh => [
      formatTime(fh.startTime),
      fh.formation,
      'FORMATION CHANGE',
      `${fh.formation} (${formatTime(fh.startTime)} - ${formatTime(fh.endTime)})`,
      '', '', '', '', ''
    ]);

    const csvContent = [
      headers.join(','),
      ...formationRows.map(row => row.join(',')),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `football_tags_${Date.now()}.csv`;
    a.click();
  };

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 100);
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
  };

  return (
    <div className="h-screen bg-gray-900 flex flex-col overflow-hidden">
      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 flex flex-col p-2 gap-2">
          {!videoFile ? (
            <div className="flex-1 bg-gray-800 rounded flex items-center justify-center">
              <label className="cursor-pointer bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded">
                <input
                  type="file"
                  accept="video/*"
                  onChange={handleVideoUpload}
                  className="hidden"
                />
                Load Video
              </label>
            </div>
          ) : (
            <VideoPlayer
              ref={videoRef}
              videoFile={videoFile}
              isPlaying={isPlaying}
              onTimeUpdate={setCurrentTime}
              onDurationChange={setDuration}
            />
          )}

          <Timeline
            currentTime={currentTime}
            duration={duration}
            tags={tags}
            onSeek={(time) => {
              if (videoRef.current) {
                videoRef.current.currentTime = time;
                setCurrentTime(time);
              }
            }}
          />
        </div>

        <div className="w-[500px] flex flex-col p-2 gap-2">
          <div className="bg-gray-800 rounded p-3">
            <div className="flex gap-2 mb-2">
              <select
                value={formation}
                onChange={(e) => handleFormationChange(e.target.value)}
                className="flex-1 bg-gray-700 text-white px-3 py-1 rounded text-sm"
              >
                {Object.keys(FORMATIONS).map(f => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </select>
              <button
                onClick={() => setShowRoster(!showRoster)}
                className="bg-gray-700 hover:bg-gray-600 text-white px-3 py-1 rounded text-sm"
              >
                Roster
              </button>
              <button
                onClick={() => setFlipped(!flipped)}
                className="bg-gray-700 hover:bg-gray-600 text-white px-3 py-1 rounded text-sm flex items-center gap-1"
              >
                <RotateCw size={14} /> Flip
              </button>
            </div>

            {showRoster && (
              <div className="mb-2 bg-gray-700 rounded p-2 max-h-[150px] overflow-y-auto">
                <div className="grid grid-cols-2 gap-2">
                  {Array.from({ length: parseInt(formation[0]) + parseInt(formation[1]) + parseInt(formation[2]) + 1 }).map((_, idx) => {
                    const playerId = idx + 1;
                    return (
                      <div key={playerId} className="flex gap-1">
                        <input
                          type="text"
                          value={playerNumbers[playerId] || playerId}
                          onChange={(e) => setPlayerNumbers(prev => ({ ...prev, [playerId]: e.target.value }))}
                          className="w-12 bg-gray-600 text-white px-2 py-1 rounded text-xs"
                          placeholder="#"
                          maxLength={3}
                        />
                        <input
                          type="text"
                          value={playerNames[playerId] || ''}
                          onChange={(e) => setPlayerNames(prev => ({ ...prev, [playerId]: e.target.value }))}
                          className="flex-1 bg-gray-600 text-white px-2 py-1 rounded text-xs"
                          placeholder="Name"
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <PitchPanel
              formation={formation}
              flipped={flipped}
              playerNumbers={playerNumbers}
              selectedPlayer={selectedPlayer}
              coordinateMode={coordinateMode}
              onPlayerSelect={setSelectedPlayer}
              onPitchClick={handlePitchClick}
            />
          </div>

          {shotPanelActive ? (
            <ShotPanel onComplete={handleShotComplete} />
          ) : (
            <SubtagsPanel
              subtags={SUBTAGS}
              onSubtagClick={handleSubtagClick}
              disabled={!selectedPlayer || coordinateMode}
            />
          )}

          <div className="flex gap-2">
            <button
              onClick={togglePlayPause}
              disabled={!videoFile}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 text-white px-4 py-2 rounded flex items-center justify-center gap-2"
            >
              {isPlaying ? <Pause size={16} /> : <Play size={16} />}
              {isPlaying ? 'Pause' : 'Play'}
            </button>
            <button
              onClick={exportToCSV}
              disabled={tags.length === 0}
              className="bg-green-600 hover:bg-green-700 disabled:bg-gray-700 text-white px-4 py-2 rounded flex items-center gap-2"
            >
              <Download size={16} /> Export CSV
            </button>
          </div>

          <div className="bg-gray-800 rounded p-2 text-white text-xs">
            <div>Time: {formatTime(currentTime)}</div>
            <div>Formation: {formation}</div>
            <div>Tags: {tags.length}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
