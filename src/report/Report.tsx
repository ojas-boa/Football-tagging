import { useState } from 'react';
import { ArrowLeft, Printer } from 'lucide-react';
import { Match, TeamSide } from '../types';
import { HalfFilter, filterTags, teamStats } from '../lib/stats';
import { goals } from '../lib/match';
import { safeFileName } from '../lib/csv';
import { Section } from './common';
import StatsComparison from './StatsComparison';
import PassNetwork from './PassNetwork';
import PassMatrix from './PassMatrix';
import PassMap from './PassMap';
import ShotMap from './ShotMap';
import PlayerTable from './PlayerTable';

interface ReportProps {
  match: Match;
  onBack: () => void;
}

export default function Report({ match, onBack }: ReportProps) {
  const [half, setHalf] = useState<HalfFilter>('all');
  const homeTags = filterTags(match, 'home', half);
  const awayTags = filterTags(match, 'away', half);
  const score = goals({ ...match, tags: [...homeTags, ...awayTags] });
  const sides = (['home', 'away'] as TeamSide[]).filter(s => (s === 'home' ? homeTags : awayTags).length > 0);
  const halfLabel = half === 'all' ? 'Full match' : half === 1 ? '1st half' : '2nd half';

  const pill = (v: HalfFilter, label: string) => (
    <button
      onClick={() => setHalf(v)}
      className={`px-3 py-1 rounded-full text-xs ${half === v ? 'bg-slate-800 text-white' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'}`}
    >
      {label}
    </button>
  );

  return (
    <div className="report flex-1 overflow-y-auto bg-slate-100 text-slate-800">
      <div className="sticky top-0 z-20 bg-white/95 backdrop-blur border-b border-slate-200 print:hidden">
        <div className="max-w-6xl mx-auto px-4 py-2 flex items-center gap-3">
          <button onClick={onBack} className="flex items-center gap-1 text-sm text-slate-600 hover:text-slate-900">
            <ArrowLeft size={16} /> Back to tagging
          </button>
          <div className="flex gap-1 ml-4">
            {pill('all', 'Full match')}
            {pill(1, '1st half')}
            {pill(2, '2nd half')}
          </div>
          <nav className="hidden xl:flex gap-3 text-xs text-slate-500 ml-4">
            <a href="#team-stats" className="hover:text-slate-900">Team stats</a>
            {sides.map(s => (
              <a key={s} href={`#team-${s}`} className="hover:text-slate-900">
                {match[s].name}
              </a>
            ))}
          </nav>
          <button
            onClick={() => {
              const name = `${safeFileName(`${match.home.name} ${score.home}-${score.away} ${match.away.name}`)}_${match.date}.pdf`;
              if (window.desktop) void window.desktop.savePdf(name);
              else window.print();
            }}
            className="ml-auto flex items-center gap-1 text-sm bg-slate-800 text-white px-3 py-1.5 rounded hover:bg-slate-700"
          >
            <Printer size={14} /> Save PDF
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-4">
        {/* Cover */}
        <section className="report-section bg-white rounded-lg border border-slate-200 p-6 mb-5">
          <div className="text-xs tracking-[0.3em] text-slate-500 uppercase">Match report</div>
          <div className="flex items-center justify-center gap-8 py-6">
            <div className="text-right flex-1">
              <div className="text-2xl font-semibold" style={{ color: match.home.color }}>
                {match.home.name}
              </div>
              <div className="text-xs text-slate-500">{match.home.formation.split('').join('-')}</div>
            </div>
            <div className="text-5xl font-light tabular-nums">
              {score.home}–{score.away}
            </div>
            <div className="flex-1">
              <div className="text-2xl font-semibold" style={{ color: match.away.color }}>
                {match.away.name}
              </div>
              <div className="text-xs text-slate-500">{match.away.formation.split('').join('-')}</div>
            </div>
          </div>
          <div className="text-center text-sm text-slate-500">
            {[match.competition, match.date, halfLabel].filter(Boolean).join(' · ')}
          </div>
        </section>

        {sides.length === 0 && (
          <div className="bg-white rounded-lg border border-slate-200 p-8 text-center text-slate-500">
            No events tagged{half !== 'all' ? ' in this half' : ''} yet. Tag some passes, crosses and shots, then come back.
          </div>
        )}

        {sides.length > 0 && (
          <Section id="team-stats" title="Team stats" subtitle={halfLabel}>
            <StatsComparison match={match} home={teamStats(homeTags, awayTags)} away={teamStats(awayTags, homeTags)} />
          </Section>
        )}

        {sides.map(s => {
          const team = match[s];
          const tags = s === 'home' ? homeTags : awayTags;
          const sub = `${team.name} · ${halfLabel}`;
          return (
            <div key={s} id={`team-${s}`}>
              <div className="report-team-title flex items-center gap-2 mt-8 mb-3">
                <span className="w-3 h-3 rounded-full" style={{ background: team.color }} />
                <h1 className="text-xl font-semibold">{team.name}</h1>
              </div>
              <Section title="Passing network" subtitle={sub}>
                <div className="grid lg:grid-cols-[3fr_2fr] gap-5 print:grid-cols-1">
                  <PassNetwork team={team} tags={tags} />
                  <div>
                    <div className="text-xs text-slate-500 mb-2">Pass combinations (completed passes, passer → receiver)</div>
                    <PassMatrix team={team} tags={tags} />
                  </div>
                </div>
              </Section>
              <Section title="Passes" subtitle={sub}>
                <PassMap team={team} tags={tags} event="PASS" />
              </Section>
              <Section title="Crosses" subtitle={sub}>
                <PassMap team={team} tags={tags} event="CROSS" />
              </Section>
              <Section title="Shots" subtitle={sub}>
                <ShotMap team={team} tags={tags} />
              </Section>
              <Section title="Player stats" subtitle={sub}>
                <PlayerTable team={team} tags={tags} />
              </Section>
            </div>
          );
        })}
        <div className="text-[11px] text-slate-400 text-center py-4">
          Forward/back/lateral passes use 45° sectors. Progressive pass: ball moved 30m closer to goal (own half), 15m
          (across halves) or 10m (opponent half). Final third = last 35m. xG is a simple distance/angle estimate.
        </div>
      </div>
    </div>
  );
}
