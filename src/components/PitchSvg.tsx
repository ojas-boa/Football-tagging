import { ReactNode } from 'react';
import { PITCH_L, PITCH_W } from '../constants';

export const px = (x: number) => (x / 100) * PITCH_L;
export const py = (y: number) => (y / 100) * PITCH_W;

interface PitchSvgProps {
  children?: ReactNode;
  /** 'full' pitch, or only the attacking half (for shot maps). */
  view?: 'full' | 'attack';
  variant?: 'tagging' | 'report';
  thirds?: boolean;
  className?: string;
  arrowColors?: Record<string, string>;
}

/**
 * Pitch markings in metres (105 x 68). Children are drawn in the same metre
 * coordinate space; use px()/py() to convert from 0-100 tag coordinates.
 */
export default function PitchSvg({
  children,
  view = 'full',
  variant = 'report',
  thirds = false,
  className,
  arrowColors = {},
}: PitchSvgProps) {
  const line = variant === 'report' ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.55)';
  const grass = variant === 'report' ? '#6aa86a' : '#15803d';
  const stripe = variant === 'report' ? '#72b072' : '#16a34a';
  const pad = 2;
  const vb =
    view === 'full'
      ? `${-pad} ${-pad} ${PITCH_L + pad * 2} ${PITCH_W + pad * 2}`
      : `${PITCH_L / 2 - pad} ${-pad} ${PITCH_L / 2 + pad * 2} ${PITCH_W + pad * 2}`;
  const sw = 0.35;
  return (
    <svg viewBox={vb} className={className} preserveAspectRatio="xMidYMid meet">
      <defs>
        {Object.entries({ default: '#111827', ...arrowColors }).map(([id, color]) => (
          <marker
            key={id}
            id={`arrow-${id}`}
            viewBox="0 0 10 10"
            refX="8"
            refY="5"
            markerUnits="userSpaceOnUse"
            markerWidth="2"
            markerHeight="2"
            orient="auto-start-reverse"
          >
            <path d="M 0 0 L 10 5 L 0 10 z" fill={color} />
          </marker>
        ))}
      </defs>
      <rect x={-pad} y={-pad} width={PITCH_L + pad * 2} height={PITCH_W + pad * 2} fill={grass} />
      {Array.from({ length: 10 }).map((_, i) =>
        i % 2 === 0 ? (
          <rect key={i} x={(PITCH_L / 10) * i} y={0} width={PITCH_L / 10} height={PITCH_W} fill={stripe} />
        ) : null,
      )}
      <g fill="none" stroke={line} strokeWidth={sw}>
        <rect x={0} y={0} width={PITCH_L} height={PITCH_W} />
        <line x1={PITCH_L / 2} y1={0} x2={PITCH_L / 2} y2={PITCH_W} />
        <circle cx={PITCH_L / 2} cy={PITCH_W / 2} r={9.15} />
        <circle cx={PITCH_L / 2} cy={PITCH_W / 2} r={0.4} fill={line} />
        {[0, 1].map(side => {
          const flip = (x: number) => (side === 0 ? x : PITCH_L - x);
          const box = (depth: number, width: number) => {
            const x0 = flip(0);
            const x1 = flip(depth);
            return (
              <rect
                x={Math.min(x0, x1)}
                y={PITCH_W / 2 - width / 2}
                width={depth}
                height={width}
              />
            );
          };
          const spot = flip(11);
          const arcDir = side === 0 ? 1 : -1;
          const ax = flip(16.5);
          const dy = Math.sqrt(9.15 * 9.15 - (16.5 - 11) * (16.5 - 11));
          return (
            <g key={side}>
              {box(16.5, 40.32)}
              {box(5.5, 18.32)}
              <circle cx={spot} cy={PITCH_W / 2} r={0.4} fill={line} />
              <path
                d={`M ${ax} ${PITCH_W / 2 - dy} A 9.15 9.15 0 0 ${arcDir === 1 ? 1 : 0} ${ax} ${PITCH_W / 2 + dy}`}
              />
              <rect
                x={side === 0 ? -1.5 : PITCH_L}
                y={PITCH_W / 2 - 3.66}
                width={1.5}
                height={7.32}
              />
            </g>
          );
        })}
        {thirds && (
          <g strokeDasharray="1 1" strokeWidth={0.25}>
            <line x1={PITCH_L / 3} y1={0} x2={PITCH_L / 3} y2={PITCH_W} />
            <line x1={(PITCH_L * 2) / 3} y1={0} x2={(PITCH_L * 2) / 3} y2={PITCH_W} />
          </g>
        )}
      </g>
      {children}
    </svg>
  );
}
