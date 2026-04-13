import { useEffect, useRef, useCallback } from 'react';
import { usePlayerStore } from '@/stores/playerStore';

interface YouTubePlayerProps {
  videoId: string;
}

let apiLoaded = false;
let apiLoading = false;
const callbacks: (() => void)[] = [];

const loadYouTubeAPI = (): Promise<void> => {
  if (apiLoaded) return Promise.resolve();
  return new Promise((resolve) => {
    if (apiLoading) {
      callbacks.push(resolve);
      return;
    }
    apiLoading = true;
    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    document.head.appendChild(tag);
    window.onYouTubeIframeAPIReady = () => {
      apiLoaded = true;
      resolve();
      callbacks.forEach((cb) => cb());
    };
  });
};

export const YouTubePlayer = ({ videoId }: YouTubePlayerProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<YT.Player | null>(null);
  const intervalRef = useRef<number | null>(null);
  const { setPlayer, setCurrentTime, setPlayerReady, reset } = usePlayerStore();

  const startTimeTracking = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = window.setInterval(() => {
      if (playerRef.current) {
        try {
          setCurrentTime(playerRef.current.getCurrentTime());
        } catch {}
      }
    }, 500);
  }, [setCurrentTime]);

  useEffect(() => {
    let destroyed = false;

    const init = async () => {
      await loadYouTubeAPI();
      if (destroyed || !containerRef.current) return;

      const div = document.createElement('div');
      div.id = 'yt-player-' + Date.now();
      containerRef.current.replaceChildren(div);

      playerRef.current = new window.YT.Player(div.id, {
        videoId,
        width: '100%',
        height: '100%',
        playerVars: {
          autoplay: 0,
          controls: 1,
          modestbranding: 1,
          rel: 0,
        },
        events: {
          onReady: () => {
            if (!destroyed) {
              setPlayer(playerRef.current!);
              setPlayerReady(true);
              startTimeTracking();
            }
          },
        },
      });
    };

    init();

    return () => {
      destroyed = true;
      if (intervalRef.current) clearInterval(intervalRef.current);
      try { playerRef.current?.destroy(); } catch {}
      reset();
    };
  }, [videoId, setPlayer, setCurrentTime, setPlayerReady, reset, startTimeTracking]);

  return (
    <div ref={containerRef} className="w-full h-full rounded-lg overflow-hidden bg-black" />
  );
};
