import { FileUp, FilePlus, X, Trash2, BarChart3, FolderOpen } from 'lucide-react';
import { useState } from 'react';
import { LibraryEntry, deleteFromLibrary, listLibrary } from '../lib/storage';

interface LibraryProps {
  onOpen: (id: string) => void;
  onReport: (id: string) => void;
  onNew: () => void;
  onImport: (file: File) => void;
  onClose: () => void;
}

export default function Library({ onOpen, onReport, onNew, onImport, onClose }: LibraryProps) {
  const [entries, setEntries] = useState<LibraryEntry[]>(listLibrary());
  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-gray-800 rounded-lg w-full max-w-2xl max-h-[85vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-2 p-3 border-b border-gray-700">
          <div className="text-white font-semibold">Saved games</div>
          <button onClick={onNew} className="ml-auto flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white text-sm px-3 py-1.5 rounded">
            <FilePlus size={14} /> New game
          </button>
          <label className="flex items-center gap-1 bg-gray-700 hover:bg-gray-600 text-white text-sm px-3 py-1.5 rounded cursor-pointer">
            <FileUp size={14} /> Import CSV
            <input
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={e => {
                const f = e.target.files?.[0];
                if (f) onImport(f);
                e.target.value = '';
              }}
            />
          </label>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X size={18} />
          </button>
        </div>
        <div className="overflow-y-auto p-2">
          {entries.length === 0 && <div className="text-gray-400 text-sm p-4">No saved games yet. Use “Save game” while tagging.</div>}
          {entries.map(e => (
            <div key={e.id} className="flex items-center gap-3 p-2 rounded hover:bg-gray-700">
              <div className="flex-1 min-w-0">
                <div className="text-white text-sm truncate">{e.title}</div>
                <div className="text-gray-400 text-xs">
                  {e.date} {e.competition && `· ${e.competition}`} · {e.tagCount} events
                </div>
              </div>
              <button onClick={() => onReport(e.id)} className="flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300">
                <BarChart3 size={14} /> Report
              </button>
              <button onClick={() => onOpen(e.id)} className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300">
                <FolderOpen size={14} /> Open
              </button>
              <button
                onClick={() => {
                  if (window.confirm(`Delete “${e.title}”? This cannot be undone.`)) {
                    deleteFromLibrary(e.id);
                    setEntries(listLibrary());
                  }
                }}
                className="text-gray-500 hover:text-red-400"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
