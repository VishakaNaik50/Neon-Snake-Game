import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Trophy, RefreshCw, Music } from 'lucide-react';

// --- Types & Constants ---
type Point = { x: number; y: number };
type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';

const GRID_SIZE = 20;
const INITIAL_SNAKE: Point[] = [{ x: 10, y: 10 }];
const INITIAL_DIRECTION: Direction = 'RIGHT';
const GAME_SPEED = 120;

const TRACKS = [
  {
    id: 1,
    title: "Neon Drive (AI Gen)",
    artist: "CyberMinds",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
    cover: "https://picsum.photos/seed/neon1/200/200"
  },
  {
    id: 2,
    title: "Digital Horizon (AI Gen)",
    artist: "NeuralNet",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
    cover: "https://picsum.photos/seed/neon2/200/200"
  },
  {
    id: 3,
    title: "Synthwave Protocol (AI Gen)",
    artist: "AlgoRhythm",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
    cover: "https://picsum.photos/seed/neon3/200/200"
  }
];

// --- Custom Hook for Snake Game ---
function useSnakeGame() {
  const [snake, setSnake] = useState<Point[]>(INITIAL_SNAKE);
  const [direction, setDirection] = useState<Direction>(INITIAL_DIRECTION);
  const directionRef = useRef<Direction>(INITIAL_DIRECTION);
  const [food, setFood] = useState<Point>({ x: 15, y: 10 });
  const [gameOver, setGameOver] = useState<boolean>(false);
  const [score, setScore] = useState<number>(0);
  const [highScore, setHighScore] = useState<number>(() => {
    const saved = localStorage.getItem('snakeHighScore');
    return saved ? parseInt(saved, 10) : 0;
  });
  const [isPaused, setIsPaused] = useState<boolean>(false);

  useEffect(() => {
    localStorage.setItem('snakeHighScore', highScore.toString());
  }, [highScore]);

  const generateFood = useCallback((currentSnake: Point[]): Point => {
    let newFood: Point;
    while (true) {
      newFood = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE),
      };
      const isOnSnake = currentSnake.some(segment => segment.x === newFood.x && segment.y === newFood.y);
      if (!isOnSnake) break;
    }
    return newFood;
  }, []);

  const resetGame = useCallback(() => {
    setSnake(INITIAL_SNAKE);
    setDirection(INITIAL_DIRECTION);
    directionRef.current = INITIAL_DIRECTION;
    setFood(generateFood(INITIAL_SNAKE));
    setGameOver(false);
    setScore(0);
    setIsPaused(false);
  }, [generateFood]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " "].includes(e.key)) {
        e.preventDefault();
      }

      if (e.key === ' ') {
        if (gameOver) resetGame();
        else setIsPaused(p => !p);
        return;
      }

      if (gameOver || isPaused) return;

      const currentDir = directionRef.current;

      switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          if (currentDir !== 'DOWN') setDirection('UP');
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          if (currentDir !== 'UP') setDirection('DOWN');
          break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
          if (currentDir !== 'RIGHT') setDirection('LEFT');
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          if (currentDir !== 'LEFT') setDirection('RIGHT');
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameOver, isPaused, resetGame]);

  useEffect(() => {
    if (gameOver || isPaused) return;

    const moveSnake = () => {
      setSnake(prevSnake => {
        const head = prevSnake[0];
        const newHead = { ...head };

        directionRef.current = direction;

        switch (direction) {
          case 'UP': newHead.y -= 1; break;
          case 'DOWN': newHead.y += 1; break;
          case 'LEFT': newHead.x -= 1; break;
          case 'RIGHT': newHead.x += 1; break;
        }

        if (newHead.x < 0 || newHead.x >= GRID_SIZE || newHead.y < 0 || newHead.y >= GRID_SIZE) {
          setGameOver(true);
          return prevSnake;
        }

        if (prevSnake.some(segment => segment.x === newHead.x && segment.y === newHead.y)) {
          setGameOver(true);
          return prevSnake;
        }

        const newSnake = [newHead, ...prevSnake];

        if (newHead.x === food.x && newHead.y === food.y) {
          setScore(s => {
            const newScore = s + 10;
            if (newScore > highScore) setHighScore(newScore);
            return newScore;
          });
          setFood(generateFood(newSnake));
        } else {
          newSnake.pop();
        }

        return newSnake;
      });
    };

    const intervalId = setInterval(moveSnake, GAME_SPEED);
    return () => clearInterval(intervalId);
  }, [direction, food, gameOver, isPaused, generateFood, highScore]);

  return { snake, food, gameOver, score, highScore, isPaused, resetGame };
}

// --- Main App Component ---
export default function App() {
  // Music Player State
  const [currentTrackIdx, setCurrentTrackIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.5);
  const [isMuted, setIsMuted] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Snake Game State
  const { snake, food, gameOver, score, highScore, isPaused, resetGame } = useSnakeGame();

  // Audio Effect
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  useEffect(() => {
    if (isPlaying) {
      audioRef.current?.play().catch(e => console.error("Audio play error:", e));
    } else {
      audioRef.current?.pause();
    }
  }, [isPlaying, currentTrackIdx]);

  const togglePlay = () => setIsPlaying(!isPlaying);
  const nextTrack = () => setCurrentTrackIdx((prev) => (prev + 1) % TRACKS.length);
  const prevTrack = () => setCurrentTrackIdx((prev) => (prev - 1 + TRACKS.length) % TRACKS.length);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans flex flex-col overflow-hidden selection:bg-fuchsia-500/30">
      {/* Header */}
      <header className="p-6 flex items-center justify-between border-b border-white/5 bg-zinc-900/50 backdrop-blur-md z-10">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-fuchsia-500/20 rounded-lg border border-fuchsia-500/50 shadow-[0_0_15px_rgba(217,70,239,0.4)]">
            <Music className="w-6 h-6 text-fuchsia-400" />
          </div>
          <h1 className="text-2xl font-bold tracking-wider bg-gradient-to-r from-fuchsia-400 to-cyan-400 bg-clip-text text-transparent">
            NEON SNAKE
          </h1>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]">
            <span className="text-sm uppercase tracking-widest opacity-80">Score</span>
            <span className="text-2xl font-mono font-bold">{score.toString().padStart(4, '0')}</span>
          </div>
          <div className="flex items-center gap-2 text-fuchsia-400 drop-shadow-[0_0_8px_rgba(217,70,239,0.8)]">
            <Trophy className="w-5 h-5" />
            <span className="text-2xl font-mono font-bold">{highScore.toString().padStart(4, '0')}</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center p-6 relative">
        {/* Background decorative elements */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-fuchsia-600/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-600/10 rounded-full blur-[100px] pointer-events-none" />

        {/* Game Board Container */}
        <div className="relative p-1 rounded-xl bg-gradient-to-br from-fuchsia-500/30 to-cyan-500/30 shadow-[0_0_30px_rgba(217,70,239,0.15)] backdrop-blur-sm w-full max-w-[400px]">
          <div
            className="bg-zinc-950 rounded-lg overflow-hidden relative w-full aspect-square"
            style={{ boxShadow: 'inset 0 0 20px rgba(0,0,0,0.8)' }}
          >
            {/* Grid Lines */}
            <div className="absolute inset-0 opacity-20" style={{
              backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
              backgroundSize: `${100 / GRID_SIZE}% ${100 / GRID_SIZE}%`
            }} />

            {/* Food */}
            <div
              className="absolute bg-fuchsia-500 rounded-full shadow-[0_0_10px_rgba(217,70,239,0.8)]"
              style={{
                width: `${100 / GRID_SIZE}%`,
                height: `${100 / GRID_SIZE}%`,
                left: `${(food.x / GRID_SIZE) * 100}%`,
                top: `${(food.y / GRID_SIZE) * 100}%`,
                transform: 'scale(0.8)'
              }}
            />

            {/* Snake */}
            {snake.map((segment, i) => {
              const isHead = i === 0;
              return (
                <div
                  key={`${segment.x}-${segment.y}-${i}`}
                  className={`absolute rounded-sm ${isHead ? 'bg-cyan-300 z-10' : 'bg-cyan-500'}`}
                  style={{
                    width: `${100 / GRID_SIZE}%`,
                    height: `${100 / GRID_SIZE}%`,
                    left: `${(segment.x / GRID_SIZE) * 100}%`,
                    top: `${(segment.y / GRID_SIZE) * 100}%`,
                    boxShadow: isHead ? '0 0 15px rgba(34,211,238,0.8)' : '0 0 5px rgba(34,211,238,0.4)',
                    transform: 'scale(0.9)'
                  }}
                />
              )
            })}

            {/* Overlays */}
            {gameOver && (
              <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center z-20 backdrop-blur-sm">
                <h2 className="text-4xl font-bold text-fuchsia-500 mb-2 drop-shadow-[0_0_10px_rgba(217,70,239,0.8)]">SYSTEM FAILURE</h2>
                <p className="text-zinc-400 mb-6 font-mono">Final Score: {score}</p>
                <button
                  onClick={resetGame}
                  className="flex items-center gap-2 px-6 py-3 bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 rounded-lg hover:bg-cyan-500/30 transition-all shadow-[0_0_15px_rgba(34,211,238,0.3)] hover:shadow-[0_0_25px_rgba(34,211,238,0.5)]"
                >
                  <RefreshCw className="w-5 h-5" />
                  <span>REBOOT SEQUENCE</span>
                </button>
              </div>
            )}

            {isPaused && !gameOver && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-20 backdrop-blur-sm">
                <h2 className="text-3xl font-bold text-cyan-500 tracking-widest drop-shadow-[0_0_10px_rgba(34,211,238,0.8)]">PAUSED</h2>
              </div>
            )}
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-8 text-zinc-500 text-sm flex items-center gap-6 font-mono z-10">
          <span className="flex items-center gap-2">
            <span className="px-2 py-1 bg-zinc-800 rounded text-zinc-300">W A S D</span>
            to move
          </span>
          <span className="flex items-center gap-2">
            <span className="px-2 py-1 bg-zinc-800 rounded text-zinc-300">SPACE</span>
            to pause
          </span>
        </div>
      </main>

      {/* Footer / Music Player */}
      <footer className="h-24 border-t border-white/5 bg-zinc-900/80 backdrop-blur-xl flex items-center justify-between px-6 z-10">
        {/* Track Info */}
        <div className="flex items-center gap-4 w-1/3">
          <div className="relative w-14 h-14 rounded-md overflow-hidden border border-white/10 group flex-shrink-0">
            <img 
              src={TRACKS[currentTrackIdx].cover} 
              alt="Cover" 
              className={`w-full h-full object-cover transition-transform duration-700 ${isPlaying ? 'scale-110' : 'scale-100'}`} 
            />
            <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors" />
          </div>
          <div className="min-w-0">
            <h3 className="font-medium text-zinc-100 truncate">{TRACKS[currentTrackIdx].title}</h3>
            <p className="text-sm text-zinc-400 truncate">{TRACKS[currentTrackIdx].artist}</p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-col items-center justify-center w-1/3 gap-2">
          <div className="flex items-center gap-6">
            <button onClick={prevTrack} className="text-zinc-400 hover:text-cyan-400 transition-colors">
              <SkipBack className="w-6 h-6" />
            </button>
            <button
              onClick={togglePlay}
              className="w-12 h-12 flex items-center justify-center rounded-full bg-zinc-100 text-zinc-900 hover:scale-105 transition-transform shadow-[0_0_15px_rgba(255,255,255,0.3)]"
            >
              {isPlaying ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current ml-1" />}
            </button>
            <button onClick={nextTrack} className="text-zinc-400 hover:text-cyan-400 transition-colors">
              <SkipForward className="w-6 h-6" />
            </button>
          </div>
          {/* Audio Element */}
          <audio
            ref={audioRef}
            src={TRACKS[currentTrackIdx].url}
            onEnded={nextTrack}
            preload="metadata"
          />
        </div>

        {/* Volume */}
        <div className="flex items-center justify-end gap-3 w-1/3">
          <button onClick={() => setIsMuted(!isMuted)} className="text-zinc-400 hover:text-zinc-100 transition-colors">
            {isMuted || volume === 0 ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
          </button>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={isMuted ? 0 : volume}
            onChange={(e) => {
              setVolume(parseFloat(e.target.value));
              if (isMuted) setIsMuted(false);
            }}
            className="w-24 h-1 bg-zinc-700 rounded-full appearance-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-cyan-400 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:shadow-[0_0_10px_rgba(34,211,238,0.8)] cursor-pointer"
          />
        </div>
      </footer>
    </div>
  );
}
