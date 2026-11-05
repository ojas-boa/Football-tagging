import { useCallback, useEffect, useRef, useState } from 'react';
import {
  BarChart3,
  Download,
  FolderOpen,
  Pause,
  Play,
  RotateCw,
  Save,
  Settings,
  Undo2,
  Video,
} from 'lucide-react';
import { BODY_PARTS, EVENTS, EVENT_TYPES, FORMATIONS, SHOT_RESULTS, SUBTAGS } from './constants';
import VideoPlayer from './components/VideoPlayer';
import PitchPanel, { Stage } from './components/PitchPanel';
import SubtagsPanel from './components/SubtagsPanel';
import Timeline from './components/Timeline';
import ShotPanel from './components/ShotPanel';
import OutcomePanel from './components/OutcomePanel';
import EventLog from './components/EventLog';
import MatchSetup from './components/MatchSetup';
import Library from './components/Library';
import Report from './report/Report';
import { EventType, Match, Outcome, ShotResult, Tag, TeamSide } from './types';
import { createMatch, formatClock, matchTitle, otherSide, playerLabel, uid } from './lib/match';
import { loadCurrent, loadMatch, saveCurrent, saveToLibrary } from './lib/storage';
import { csvToMatch, downloadText, matchToCSV, safeFileName } from './lib/csv';

const isTyping = (e: KeyboardEvent) => {
  const el = e.target as HTMLElement | null;
  if (!el) return false;
  const tag = el.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || el.isContentEditable;
};

function App() {
  const [match, setMatch] = useState<Match>(() => loadCurrent() || createMatch());
  const undoStack = useRef<Tag[][]>([]);

  const [view, setView] = useState<'tag' | 'report'>('tag');
  const [reportMatch, setReportMatch] = useState<Match | null>(null);
  const [showSetup, setShowSetup] = useState(false);
  const [showLibrary, setShowLibrary] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);

  const [side, setSide] = useState<TeamSide>('home');
  const [half, setHalf] = useState<1 | 2>(() => {
    const last = loadCurrent()?.tags.slice(-1)[0];
    return last?.half ?? 1;
  });
  const [selectedPlayer, setSelectedPlayer] = useState<number | null>(null);
  const [stage, setStage] = useState<Stage>('idle');
  const [pending, setPending] = useState<Partial<Tag> | null>(null);
  const [selectedTagId, setSelectedTagId] = useState<string | null>(null);

  const team = match[side];
  const attacksRight = side === 'home' ? match.homeAttacksRight : !match.homeAttacksRight;

  // Autosave the game in progress.
  useEffect(() => {
    const h = setTimeout(() => saveCurrent(match), 300);
    return () => clearTimeout(h);
  }, [match]);

  // Flush the autosave if the window closes inside the debounce window.
  const matchRef = useRef(match);
  matchRef.current = match;
  useEffect(() => {
    const flush = () => saveCurrent(matchRef.current);
    window.addEventListener('beforeunload', flush);
    return () => window.removeEventListener('beforeunload', flush);
  }, []);

  useEffect(() => {
    if (!toast) return;
    const h = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(h);
  }, [toast]);

  const updateMatch = useCallback((fn: (m: Match) => Match) => {
    setMatch(m => ({ ...fn(m), updatedAt: Date.now() }));
  }, []);

  const commitTags = (fn: (tags: Tag[]) => Tag[]) => {
    undoStack.current.push(match.tags);
    if (undoStack.current.length > 100) undoStack.current.shift();
    updateMatch(m => ({ ...m, tags: fn(m.tags) }));
  };

  const undo = () => {
    const prev = undoStack.current.pop();
    if (!prev) {
      setToast('Nothing to undo');
      return;
    }
    updateMatch(m => ({ ...m, tags: prev }));
    setToast('Undone');
  };

  const cancel = () => {
    setPending(null);
    setStage('idle');
  };

  const resetTagging = () => {
    cancel();
    setSelectedPlayer(null);
    setSelectedTagId(null);
    undoStack.current = [];
  };

  // ---- video -------------------------------------------------------------
  const togglePlay = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) void v.play();
    else v.pause();
  };

  const seek = (t: number) => {
    const v = videoRef.current;
    if (!v) return;
    v.currentTime = Math.max(0, Math.min(t, v.duration || t));
    setCurrentTime(v.currentTime);
  };

  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (videoUrl) URL.revokeObjectURL(videoUrl);
    setVideoUrl(URL.createObjectURL(file));
    updateMatch(m => ({ ...m, videoName: file.name }));
    e.target.value = '';
  };

  // ---- tagging flow ------------------------------------------------------
  const now = () => videoRef.current?.currentTime ?? currentTime;

  const startEvent = (event: EventType) => {
    if (selectedPlayer === null) {
      setToast('Select a player on the pitch first');
      return;
    }
    setPending({
      event,
      playerId: selectedPlayer,
      team: side,
      t: now(),
      half,
      subtags: [],
      formation: team.formation,
    });
    setStage(event === 'SHOT' ? 'shot' : 'start');
  };

  const finalize = (p: Partial<Tag>) => {
    const tag: Tag = { id: uid(), subtags: [], ...p } as Tag;
    commitTags(tags => [...tags, tag]);
    setSelectedTagId(tag.id);
    setPending(null);
    setStage('idle');
    // After a completed pass the receiver usually has the next action.
    setSelectedPlayer(tag.outcome === 'success' && tag.receiverId !== undefined ? tag.receiverId : null);
  };

  const handlePitchClick = (x: number, y: number) => {
    if (!pending?.event) return;
    const def = EVENTS[pending.event];
    if (stage === 'start') {
      const next = { ...pending, x, y };
      if (def.hasEnd) {
        setPending(next);
        setStage('end');
      } else if (def.hasOutcome) {
        setPending(next);
        setStage('outcome');
      } else finalize(next);
    } else if (stage === 'end') {
      setPending({ ...pending, endX: x, endY: y });
      setStage('outcome');
    }
  };

  const setOutcome = (outcome: Outcome, receiverId?: number) => {
    if (!pending) return;
    finalize({ ...pending, outcome, receiverId });
  };

  const handlePlayerClick = (id: number) => {
    if (stage === 'outcome' && pending?.event && EVENTS[pending.event].hasEnd) {
      if (id !== pending.playerId) setOutcome('success', id);
      return;
    }
    if (stage === 'idle') setSelectedPlayer(prev => (prev === id ? null : id));
  };

  const setShotField = (field: { shotResult?: ShotResult; bodyPart?: string }) => {
    if (!pending) return;
    const next = { ...pending, ...field };
    setPending(next);
    if (next.shotResult && next.bodyPart) setStage('start');
  };

  const toggleSubtag = (s: string) => {
    const toggle = (list: string[] = []) => (list.includes(s) ? list.filter(x => x !== s) : [...list, s]);
    if (pending) {
      setPending({ ...pending, subtags: toggle(pending.subtags) });
    } else if (selectedTagId) {
      commitTags(tags => tags.map(t => (t.id === selectedTagId ? { ...t, subtags: toggle(t.subtags) } : t)));
    }
  };

  const deleteTag = (id: string) => {
    commitTags(tags => tags.filter(t => t.id !== id));
    if (selectedTagId === id) setSelectedTagId(null);
  };

  const toggleOutcome = (id: string) =>
    commitTags(tags =>
      tags.map(t => (t.id === id ? { ...t, outcome: t.outcome === 'success' ? 'fail' : 'success' } : t)),
    );

  const changeFormation = (s: TeamSide, formation: string) => {
    if (!FORMATIONS[formation]) return;
    updateMatch(m => ({
      ...m,
      [s]: { ...m[s], formation },
      formationHistory: [...m.formationHistory, { team: s, formation, t: now(), half }],
    }));
  };

  const switchHalf = () => {
    const next = half === 1 ? 2 : 1;
    setHalf(next);
    updateMatch(m => ({ ...m, homeAttacksRight: !m.homeAttacksRight }));
    setToast(`${next === 1 ? '1st' : '2nd'} half · attacking directions swapped`);
  };

  const switchTeam = () => {
    cancel();
    setSelectedPlayer(null);
    setSide(s => otherSide(s));
  };

  // ---- save / export / reports ------------------------------------------
  const saveGame = (openReport = true) => {
    saveToLibrary(match, matchTitle(match));
    setToast('Game saved');
    if (openReport) {
      setReportMatch(null);
      setView('report');
    }
  };

  const exportCSV = () => {
    downloadText(`${safeFileName(matchTitle(match))}_${match.date}.csv`, matchToCSV(match));
    saveToLibrary(match, matchTitle(match));
    setReportMatch(null);
    setView('report');
  };

  const stashCurrent = () => {
    if (match.tags.length > 0) saveToLibrary(match, matchTitle(match));
  };

  const newGame = () => {
    if (!window.confirm('Start a new game? The current one is kept in Saved games.')) return;
    stashCurrent();
    setMatch(createMatch());
    resetTagging();
    setHalf(1);
    setSide('home');
    setShowLibrary(false);
    setShowSetup(true);
  };

  const openGame = (id: string) => {
    const m = loadMatch(id);
    if (!m) return setToast('Could not load that game');
    if (m.id !== match.id) stashCurrent();
    setMatch(m);
    resetTagging();
    setHalf(m.tags.slice(-1)[0]?.half ?? 1);
    setShowLibrary(false);
    setView('tag');
  };

  const reportGame = (id: string) => {
    const m = loadMatch(id);
    if (!m) return setToast('Could not load that game');
    setReportMatch(m.id === match.id ? null : m);
    setShowLibrary(false);
    setView('report');
  };

  const importCSV = async (file: File) => {
    try {
      const m = csvToMatch(await file.text());
      saveToLibrary(m, matchTitle(m));
      setReportMatch(m);
      setShowLibrary(false);
      setView('report');
    } catch (err) {
      window.alert(err instanceof Error ? err.message : 'Could not read that CSV.');
    }
  };

  // ---- keyboard ----------------------------------------------------------
  const keyHandler = useRef<(e: KeyboardEvent) => void>(() => {});
  keyHandler.current = (e: KeyboardEvent) => {
    if (view !== 'tag' || showSetup || showLibrary) return;
    if (e.code === 'ControlRight') {
      e.preventDefault();
      togglePlay();
      return;
    }
    if (isTyping(e)) return;
    // Keep Space/Enter from also "clicking" whichever button has focus.
    if ((e.target as HTMLElement)?.tagName === 'BUTTON') {
      if (e.key === ' ' || e.key === 'Enter') e.preventDefault();
      (e.target as HTMLElement).blur();
    }
    const k = e.key.toUpperCase();

    if (e.key === 'Escape') return cancel();
    if ((e.ctrlKey || e.metaKey) && k === 'Z') {
      e.preventDefault();
      return undo();
    }
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.key === ' ') {
      e.preventDefault();
      return togglePlay();
    }
    if (e.key === 'ArrowLeft') return seek(now() - (e.shiftKey ? 1 : 5));
    if (e.key === 'ArrowRight') return seek(now() + (e.shiftKey ? 1 : 5));

    if (stage === 'shot') {
      const r = SHOT_RESULTS.find(x => x.key === k);
      if (r) return setShotField({ shotResult: r.value });
      const b = BODY_PARTS.find(x => x.key === k);
      if (b) return setShotField({ bodyPart: b.value });
      return;
    }
    if (stage === 'outcome') {
      if (k === 'Y' || e.key === 'Enter') return setOutcome('success');
      if (k === 'N') return setOutcome('fail');
      return;
    }
    if (stage !== 'idle') return;

    if (e.key === 'Delete' && selectedTagId) return deleteTag(selectedTagId);
    if (k === 'Q') return switchTeam();
    if (k === 'H') return switchHalf();
    const ev = EVENT_TYPES.find(t => EVENTS[t].key === k);
    if (ev) {
      e.preventDefault();
      startEvent(ev);
    }
  };

  useEffect(() => {
    const h = (e: KeyboardEvent) => keyHandler.current(e);
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, []);

  // ---- render ------------------------------------------------------------
  const selectedTag = match.tags.find(t => t.id === selectedTagId) || null;
  const subtagTarget = pending
    ? `new ${EVENTS[pending.event as EventType].label.toLowerCase()}`
    : selectedTag
      ? `${EVENTS[selectedTag.event].label.toLowerCase()} at ${formatClock(selectedTag.t)}`
      : '';
  const recentTags = match.tags.filter(t => t.team === side && t.half === half).slice(-6);

  const headerBtn = 'flex items-center gap-1.5 text-sm px-3 py-1.5 rounded text-white';

  return (
    <div className="h-screen bg-gray-900 flex flex-col overflow-hidden">
      <div className={view === 'tag' ? 'flex flex-col flex-1 min-h-0' : 'hidden'}>
        {/* Header */}
        <div className="flex items-center gap-2 px-3 py-2 bg-gray-950 border-b border-gray-800">
          <div className="text-white font-semibold mr-2">⚽ Match Tagger</div>
          <button onClick={() => setShowSetup(true)} className="text-gray-200 hover:text-white text-sm truncate max-w-[40%]">
            <span style={{ color: match.home.color }}>●</span> {matchTitle(match)}{' '}
            <span style={{ color: match.away.color }}>●</span>
            {match.competition && <span className="text-gray-500"> · {match.competition}</span>}
          </button>
          <div className="ml-auto flex gap-2">
            <button onClick={() => setShowSetup(true)} className={`${headerBtn} bg-gray-700 hover:bg-gray-600`}>
              <Settings size={14} /> Teams
            </button>
            <button onClick={() => setShowLibrary(true)} className={`${headerBtn} bg-gray-700 hover:bg-gray-600`}>
              <FolderOpen size={14} /> Saved games
            </button>
            <button onClick={undo} title="Undo (Ctrl+Z)" className={`${headerBtn} bg-gray-700 hover:bg-gray-600`}>
              <Undo2 size={14} />
            </button>
            <button onClick={() => saveGame()} className={`${headerBtn} bg-blue-600 hover:bg-blue-700`}>
              <Save size={14} /> Save game
            </button>
            <button
              onClick={exportCSV}
              disabled={match.tags.length === 0}
              className={`${headerBtn} bg-green-600 hover:bg-green-700 disabled:bg-gray-700 disabled:text-gray-400`}
            >
              <Download size={14} /> Export CSV
            </button>
            <button
              onClick={() => {
                setReportMatch(null);
                setView('report');
              }}
              className={`${headerBtn} bg-emerald-700 hover:bg-emerald-600`}
            >
              <BarChart3 size={14} /> Report
            </button>
          </div>
        </div>

        <div className="flex-1 flex min-h-0">
          {/* Left: video */}
          <div className="flex-1 flex flex-col p-2 gap-2 min-w-0">
            {!videoUrl ? (
              <div className="flex-1 bg-gray-800 rounded flex flex-col items-center justify-center gap-3">
                <label className="cursor-pointer bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded flex items-center gap-2">
                  <input type="file" accept="video/*" onChange={handleVideoUpload} className="hidden" />
                  <Video size={18} /> Load match video
                </label>
                {match.videoName && (
                  <div className="text-gray-400 text-sm">Last video for this game: {match.videoName}</div>
                )}
              </div>
            ) : (
              <VideoPlayer
                ref={videoRef}
                videoFile={videoUrl}
                onTimeUpdate={setCurrentTime}
                onDurationChange={setDuration}
                onPlayState={setIsPlaying}
              />
            )}

            <Timeline currentTime={currentTime} duration={duration} tags={match.tags} onSeek={seek} />

            <div className="flex items-center gap-2">
              <button
                onClick={togglePlay}
                disabled={!videoUrl}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 text-white px-4 py-2 rounded flex items-center gap-2"
              >
                {isPlaying ? <Pause size={16} /> : <Play size={16} />}
                {isPlaying ? 'Pause' : 'Play'}
              </button>
              {[0.5, 1, 1.5, 2].map(r => (
                <button
                  key={r}
                  disabled={!videoUrl}
                  onClick={() => videoRef.current && (videoRef.current.playbackRate = r)}
                  className="bg-gray-700 hover:bg-gray-600 disabled:opacity-40 text-white text-xs px-2 py-2 rounded"
                >
                  {r}×
                </button>
              ))}
              {videoUrl && (
                <label className="cursor-pointer bg-gray-700 hover:bg-gray-600 text-white text-xs px-3 py-2 rounded">
                  <input type="file" accept="video/*" onChange={handleVideoUpload} className="hidden" />
                  Change video
                </label>
              )}
              <div className="text-white text-sm font-mono ml-2">{formatClock(currentTime)}</div>
              <div className="ml-auto text-gray-400 text-xs text-right leading-5">
                Space/Right Ctrl play · ←/→ seek 5s · Q switch team · H half · Ctrl+Z undo · Esc cancel
                <br />
                {EVENT_TYPES.map(t => `${EVENTS[t].key} ${EVENTS[t].label}`).join(' · ')}
              </div>
            </div>
          </div>

          {/* Right: tagging */}
          <div className="w-[460px] flex flex-col p-2 gap-2 min-h-0">
            <div className="bg-gray-800 rounded p-2 space-y-2">
              <div className="flex gap-1">
                {(['home', 'away'] as TeamSide[]).map(s => (
                  <button
                    key={s}
                    onClick={() => s !== side && switchTeam()}
                    className={`flex-1 text-sm px-2 py-1.5 rounded truncate border-2 ${
                      side === s ? 'text-white' : 'text-gray-400 border-transparent bg-gray-700'
                    }`}
                    style={side === s ? { borderColor: match[s].color, background: `${match[s].color}33` } : undefined}
                  >
                    {match[s].name}
                  </button>
                ))}
                <button
                  onClick={switchHalf}
                  title="Switch half (H)"
                  className="bg-gray-700 hover:bg-gray-600 text-white text-sm px-2 rounded"
                >
                  {half === 1 ? '1st' : '2nd'} half
                </button>
                <select
                  value={team.formation}
                  onChange={e => changeFormation(side, e.target.value)}
                  className="bg-gray-700 text-white px-1 rounded text-sm"
                  title="Formation"
                >
                  {Object.keys(FORMATIONS).map(f => (
                    <option key={f} value={f}>
                      {f.split('').join('-')}
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => updateMatch(m => ({ ...m, homeAttacksRight: !m.homeAttacksRight }))}
                  title="Flip attacking direction"
                  className="bg-gray-700 hover:bg-gray-600 text-white px-2 rounded"
                >
                  <RotateCw size={14} />
                </button>
              </div>

              <PitchPanel
                team={team}
                attacksRight={attacksRight}
                stage={stage}
                pending={pending}
                selectedPlayer={selectedPlayer}
                recentTags={recentTags}
                onPlayerClick={handlePlayerClick}
                onPitchClick={handlePitchClick}
              />

              <div className="text-xs text-gray-300 h-4">
                {stage === 'idle' &&
                  (selectedPlayer !== null
                    ? `${playerLabel(team, selectedPlayer)} selected · press an event key`
                    : 'Click a player, then press an event key')}
                {stage !== 'idle' && pending?.event && (
                  <>
                    {EVENTS[pending.event].label} by {playerLabel(team, pending.playerId)} at {formatClock(pending.t ?? 0)}
                  </>
                )}
              </div>

              <div className="grid grid-cols-5 gap-1">
                {EVENT_TYPES.map(t => (
                  <button
                    key={t}
                    disabled={selectedPlayer === null || stage !== 'idle'}
                    onClick={() => startEvent(t)}
                    className="text-white text-xs py-1 rounded disabled:opacity-30 hover:brightness-110"
                    style={{ background: EVENTS[t].color }}
                  >
                    {EVENTS[t].label} <span className="opacity-70">{EVENTS[t].key}</span>
                  </button>
                ))}
              </div>
            </div>

            {stage === 'shot' && pending && (
              <ShotPanel
                result={pending.shotResult}
                bodyPart={pending.bodyPart}
                onResult={r => setShotField({ shotResult: r })}
                onBodyPart={b => setShotField({ bodyPart: b })}
                onCancel={cancel}
              />
            )}
            {stage === 'outcome' && pending && (
              <OutcomePanel
                pending={pending}
                team={team}
                onReceiver={id => setOutcome('success', id)}
                onSuccess={() => setOutcome('success')}
                onFail={() => setOutcome('fail')}
                onCancel={cancel}
              />
            )}

            <SubtagsPanel
              subtags={SUBTAGS}
              active={pending ? pending.subtags || [] : selectedTag?.subtags || []}
              target={subtagTarget}
              disabled={!pending && !selectedTag}
              onToggle={toggleSubtag}
            />

            <EventLog
              match={match}
              selectedId={selectedTagId}
              onSelect={t => {
                setSelectedTagId(t.id);
                seek(t.t);
              }}
              onDelete={deleteTag}
              onToggleOutcome={toggleOutcome}
            />
          </div>
        </div>
      </div>

      {view === 'report' && (
        <Report
          match={reportMatch ?? match}
          onBack={() => setView('tag')}
        />
      )}

      {showSetup && (
        <MatchSetup match={match} onChange={updateMatch} onFormation={changeFormation} onClose={() => setShowSetup(false)} />
      )}
      {showLibrary && (
        <Library
          onOpen={openGame}
          onReport={reportGame}
          onNew={newGame}
          onImport={importCSV}
          onClose={() => setShowLibrary(false)}
        />
      )}
      {toast && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-gray-950 text-white text-sm px-4 py-2 rounded shadow-lg z-50 border border-gray-700">
          {toast}
        </div>
      )}
    </div>
  );
}

export default App;
