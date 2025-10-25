import { useState } from 'react';

interface ShotPanelProps {
  onComplete: (result: string, bodyPart: string) => void;
}

export default function ShotPanel({ onComplete }: ShotPanelProps) {
  const [result, setResult] = useState<string>('');
  const [bodyPart, setBodyPart] = useState<string>('');

  const results = ['On Target', 'Off Target', 'Saved'];
  const bodyParts = ['Right Foot', 'Left Foot', 'Header', 'Body'];

  const handleSubmit = () => {
    if (result && bodyPart) {
      onComplete(result, bodyPart);
    }
  };

  return (
    <div className="bg-gray-800 rounded p-3">
      <div className="text-white text-sm font-semibold mb-3">SHOT DETAILS</div>

      <div className="mb-3">
        <div className="text-white text-xs mb-1">Result:</div>
        <div className="grid grid-cols-3 gap-1">
          {results.map((r) => (
            <button
              key={r}
              onClick={() => setResult(r)}
              className={`text-xs px-2 py-2 rounded ${
                result === r
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 hover:bg-gray-600 text-white'
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-3">
        <div className="text-white text-xs mb-1">Body Part:</div>
        <div className="grid grid-cols-2 gap-1">
          {bodyParts.map((bp) => (
            <button
              key={bp}
              onClick={() => setBodyPart(bp)}
              className={`text-xs px-2 py-2 rounded ${
                bodyPart === bp
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 hover:bg-gray-600 text-white'
              }`}
            >
              {bp}
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={handleSubmit}
        disabled={!result || !bodyPart}
        className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-700 disabled:opacity-50 text-white text-sm px-4 py-2 rounded"
      >
        Continue to Coordinate
      </button>
    </div>
  );
}
