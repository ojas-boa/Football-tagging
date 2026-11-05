/// <reference types="vite/client" />

interface Window {
  /** Present only when running inside the desktop (Electron) app. */
  desktop?: {
    savePdf: (suggestedName: string) => Promise<string | null>;
  };
}
