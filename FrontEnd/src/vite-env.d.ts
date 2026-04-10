/// <reference types="vite/client" />

declare namespace YT {
  interface PlayerEvent {
    target: Player;
    data: number;
  }

  interface PlayerOptions {
    videoId?: string;
    width?: string | number;
    height?: string | number;
    playerVars?: Record<string, unknown>;
    events?: {
      onReady?: (event: PlayerEvent) => void;
      onStateChange?: (event: PlayerEvent) => void;
    };
  }

  class Player {
    constructor(elementId: string | HTMLElement, options: PlayerOptions);
    getCurrentTime(): number;
    seekTo(seconds: number, allowSeekAhead?: boolean): void;
    playVideo(): void;
    pauseVideo(): void;
    destroy(): void;
    getPlayerState(): number;
  }
}

interface Window {
  YT: typeof YT;
  onYouTubeIframeAPIReady: () => void;
}
