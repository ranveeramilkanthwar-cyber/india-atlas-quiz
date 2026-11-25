// tslint:disable
/* eslint-disable */
import {
  Award,
  Compass,
  HelpCircle,
  Map,
  MapPin,
  Menu,
  Play,
  RotateCw,
  Send,
  Sparkles,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';
import React, {
  ChangeEvent,
  PointerEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import LeafletMap from './LeafletMap';
import {getConfig, THEME} from './constants';
import {
  createIndiaProjection,
  haversineKm,
  INDIA_INTERNAL_BORDERS,
  INDIA_ISLANDS,
  INDIA_SOVEREIGN_MAINLAND,
  INDIA_STATE_REGIONS,
  INDIAN_CITIES,
  IndianCity,
  LonLat,
  NEIGHBORING_COUNTRIES,
} from './indiaGeoData';
import BackgroundMusic from './utils/BackgroundMusic';
import {
  clamp,
  createFixedStepper,
  drawAsset,
  gameAudio,
  GameState,
  MenuOverlay,
  Overlay,
  prepareCanvas,
  shuffle,
  useAssets,
  useInput,
  useIsMobile,
} from './utils/helper';
import {
  usePlayground,
  usePlaygroundGameLifecycle,
  usePlaygroundResume,
  useRpc,
} from './utils/usePlayground';

const BACKGROUND_MUSIC_URL = 'assets/audio/bgm_cartography.mp3';

const ASSETS_MANIFEST: Record<string, string> = {
  cityPinMarker: 'assets/images/city_pin_marker.png',
  compassRoseIcon: 'assets/images/compass_rose_icon.png',
};

const TOTAL_LEVELS = 1;

interface CustomWindow extends Window {
  canHandleBackKey?: boolean;
}

interface QuizQuestion {
  index: number;
  cityA: IndianCity;
  cityB: IndianCity;
  actualKm: number;
}

interface QuestionResult extends QuizQuestion {
  guessKm: number;
  accuracy: number;
  rating: number;
  isPerfectBand: boolean;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
}

type TurnPhase = 'GUESSING' | 'REVEALED';

function generateQuizQuestions(minQ: number, maxQ: number): QuizQuestion[] {
  const safeMin = Math.max(1, Math.min(minQ, maxQ));
  const safeMax = Math.max(safeMin, maxQ);
  const count =
    safeMin + Math.floor(Math.random() * (safeMax - safeMin + 1));

  // Build all unique unordered pairs and shuffle
  const pairs: Array<[IndianCity, IndianCity]> = [];
  for (let i = 0; i < INDIAN_CITIES.length; i += 1) {
    for (let j = i + 1; j < INDIAN_CITIES.length; j += 1) {
      pairs.push([INDIAN_CITIES[i], INDIAN_CITIES[j]]);
    }
  }
  const picked = shuffle(pairs).slice(0, count);

  return picked.map(([a, b], idx) => {
    const flip = Math.random() < 0.5;
    const cityA = flip ? a : b;
    const cityB = flip ? b : a;
    return {
      index: idx + 1,
      cityA,
      cityB,
      actualKm: haversineKm(cityA.lat, cityA.lon, cityB.lat, cityB.lon),
    };
  });
}

function drawRoundedRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  const radius = Math.max(0, Math.min(r, w / 2, h / 2));
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + w - radius, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
  ctx.lineTo(x + w, y + h - radius);
  ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
  ctx.lineTo(x + radius, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const canvasWrapperRef = useRef<HTMLDivElement>(null);
  const sliderTrackRef = useRef<HTMLDivElement>(null);
  const stepperRef = useRef<ReturnType<typeof createFixedStepper>>();
  const isMobile = useIsMobile();

  // --- CANVAS & CONFIG ---
  const canvasWidth = getConfig('baseCanvasWidth') as number;
  const canvasHeight = getConfig('baseCanvasHeight') as number;
  const maxDistanceKm = getConfig('maxDistanceKm') as number;
  const defaultGuessKm = getConfig('defaultGuessKm') as number;
  const minQuestionsPerQuiz = getConfig('minQuestionsPerQuiz') as number;
  const maxQuestionsPerQuiz = getConfig('maxQuestionsPerQuiz') as number;
  const perfectThreshold = getConfig('perfectAccuracyThreshold') as number;
  const maxQuestionRating = getConfig('maxQuestionRating') as number;
  const keyboardStepKm = getConfig('keyboardStepKm') as number;
  const keyboardShiftStepKm = getConfig('keyboardShiftStepKm') as number;
  const revealDuration = getConfig('revealAnimationDuration') as number;
  const defaultMusicVolume = getConfig('defaultMusicVolume') as number;
  const defaultSfxVolume = getConfig('defaultSfxVolume') as number;

  // --- PLAYGROUND SDK INTEGRATION ---
  const {sdk, isReady} = usePlayground();
  const [exitChat] = useRpc<Record<string, unknown>, void>('ExitChat');

  // --- ASSETS ---
  const {assets, isReady: assetsReady} = useAssets(ASSETS_MANIFEST);

  if (!stepperRef.current) {
    const stepMs = getConfig('stepMs') as number;
    const maxSubSteps = getConfig('maxSubSteps') as number;
    stepperRef.current = createFixedStepper(stepMs, maxSubSteps);
  }

  // Inject Google Fonts for clean geometric sans-serif cartographic typography
  useEffect(() => {
    const linkId = 'india-atlas-fonts';
    const existing = document.getElementById(linkId) as HTMLLinkElement | null;
    const desiredHref =
      'https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap';
    if (!existing) {
      const link = document.createElement('link');
      link.id = linkId;
      link.rel = 'stylesheet';
      link.href = desiredHref;
      document.head.appendChild(link);
    } else if (existing.href !== desiredHref) {
      existing.href = desiredHref;
    }
    gameAudio.setVolume(defaultSfxVolume);
  }, [defaultSfxVolume]);

  // Measure canvas container cleanly to preserve 1:1 aspect ratio and exact pointer mapping
  const [fittedCanvasSize, setFittedCanvasSize] = useState<{
    width: number;
    height: number;
  } | null>(null);

  useEffect(() => {
    const el = canvasWrapperRef.current;
    if (!el) return;
    const updateSize = () => {
      const rect = el.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;
      const aspect = canvasWidth / canvasHeight;
      let w = rect.width;
      let h = w / aspect;
      if (h > rect.height) {
        h = rect.height;
        w = h * aspect;
      }
      setFittedCanvasSize({
        width: Math.floor(w),
        height: Math.floor(h),
      });
    };
    updateSize();
    const ro = new ResizeObserver(updateSize);
    ro.observe(el);
    window.addEventListener('resize', updateSize);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', updateSize);
    };
  }, [canvasWidth, canvasHeight]);

  // --- QUIZ & UI STATE ---
  const [questions, setQuestions] = useState<QuizQuestion[]>(() =>
    generateQuizQuestions(minQuestionsPerQuiz, maxQuestionsPerQuiz),
  );
  const [currentQIdx, setCurrentQIdx] = useState(0);
  const [turnPhase, setTurnPhase] = useState<TurnPhase>('GUESSING');
  const [guessKm, setGuessKm] = useState<number>(defaultGuessKm);
  const [kmInputText, setKmInputText] = useState<string>(String(defaultGuessKm));
  const [results, setResults] = useState<QuestionResult[]>([]);
  const [bestRating, setBestRating] = useState<number>(0);
  const [isGameMenuOpen, setIsGameMenuOpen] = useState(false);
  const [isHowToPlayOpen, setIsHowToPlayOpen] = useState(false);
  const [isMusicMuted, setIsMusicMuted] = useState(false);
  const [isSfxMuted, setIsSfxMuted] = useState(() => gameAudio.getMuteState());
  const [mapMode, setMapMode] = useState<'leaflet' | 'canvas'>('leaflet');

  // --- REFS FOR 60FPS CANVAS & PHYSICS ENGINE ANIMATION ---
  const sliderPhysicsRef = useRef({
    posKm: defaultGuessKm,
    velocityKmS: 0,
    isDragging: false,
    lastClientX: 0,
    lastTime: 0,
    dragVelocityKmS: 0,
  });

  const pinPhysicsRef = useRef({
    pinA: {yOffset: 0, vy: 0, squish: 1, settled: true},
    pinB: {yOffset: 0, vy: 0, squish: 1, settled: true},
  });

  const compassPhysicsRef = useRef({
    angleRad: 0,
    angularVel: 0,
  });
  const questionsRef = useRef<QuizQuestion[]>(questions);
  questionsRef.current = questions;
  const currentQIdxRef = useRef(currentQIdx);
  currentQIdxRef.current = currentQIdx;
  const turnPhaseRef = useRef<TurnPhase>(turnPhase);
  turnPhaseRef.current = turnPhase;
  const guessKmRef = useRef<number>(guessKm);
  guessKmRef.current = guessKm;
  const isPausedOverlayRef = useRef(false);
  isPausedOverlayRef.current = isGameMenuOpen || isHowToPlayOpen;

  const animTimeRef = useRef(0);
  const revealProgressRef = useRef(0);
  const particlesRef = useRef<Particle[]>([]);
  const hoveredCityRef = useRef<IndianCity | null>(null);
  const lastClickSoundKmRef = useRef<number>(defaultGuessKm);
  const repeatTimerRef = useRef<{
    timeout: number | null;
    interval: number | null;
  }>({timeout: null, interval: null});

  // Projection memoized for logical canvas dimensions
  const projection = useMemo(
    () => createIndiaProjection(canvasWidth, canvasHeight),
    [canvasWidth, canvasHeight],
  );
  const projectionRef = useRef(projection);
  projectionRef.current = projection;

  // Do not remove: Playground save/resume
  const {initialLevel, initialScore, persistenceEnabled, autoStartPending} =
    usePlaygroundResume({
      isReady,
      assetsReady,
      onAutoStart: () => {
        if (gameStateRef.current.status === 'START') {
          initGame();
        }
      },
    });

  const startLevel = Math.min(initialLevel, TOTAL_LEVELS);
  const startScore = initialScore;

  const levelStartScoreRef = useRef(startScore);
  const prevLevelRef = useRef(startLevel);
  const runWonRef = useRef(false);

  const [gameState, setGameState] = useState<GameState>({
    status: 'START',
    score: startScore,
    level: startLevel,
  });

  const gameStateRef = useRef(gameState);
  gameStateRef.current = gameState;

  useEffect(() => {
    if (gameState.level !== prevLevelRef.current) {
      prevLevelRef.current = gameState.level;
      levelStartScoreRef.current = gameStateRef.current.score;
    }
  }, [gameState.level]);

  useEffect(() => {
    if (gameState.status === 'VICTORY') {
      runWonRef.current = true;
    }
  }, [gameState.status]);

  useEffect(() => {
    const canHandleBackKey = gameState.status !== 'START';
    (window as CustomWindow).canHandleBackKey = canHandleBackKey;
    if (window.parent && window.parent !== window) {
      window.parent.postMessage(
        {
          type: 'PLAYGROUND_CAN_HANDLE_BACK_KEY',
          value: canHandleBackKey,
        },
        '*',
      );
    }
  }, [gameState.status]);

  const inputRef = useInput(canvasRef, true, {
    width: canvasWidth,
    height: canvasHeight,
  });

  const updateGuessValue = useCallback(
    (nextKm: number, withClickSound = false) => {
      const clamped = Math.round(clamp(nextKm, 0, maxDistanceKm));
      setGuessKm(clamped);
      setKmInputText(String(clamped));
      if (
        withClickSound &&
        Math.abs(clamped - lastClickSoundKmRef.current) >= 40
      ) {
        lastClickSoundKmRef.current = clamped;
        gameAudio.playCrispClick();
      }
    },
    [maxDistanceKm],
  );

  // --- CORE QUIZ RUN CONTROL ---
  const startRun = useCallback(
    (level: number, score: number) => {
      const freshQuestions = generateQuizQuestions(
        minQuestionsPerQuiz,
        maxQuestionsPerQuiz,
      );
      levelStartScoreRef.current = score;
      prevLevelRef.current = level;
      runWonRef.current = false;

      setQuestions(freshQuestions);
      setCurrentQIdx(0);
      setTurnPhase('GUESSING');
      setResults([]);
      setIsGameMenuOpen(false);
      setIsHowToPlayOpen(false);
      particlesRef.current = [];
      revealProgressRef.current = 0;
      updateGuessValue(defaultGuessKm, false);

      // Trigger Pin Drop & Compass magnetic kick physics
      pinPhysicsRef.current.pinA = {yOffset: -240, vy: 0, squish: 1, settled: false};
      pinPhysicsRef.current.pinB = {yOffset: -300, vy: 0, squish: 1, settled: false};
      compassPhysicsRef.current.angularVel += (Math.random() - 0.5) * 8;

      setGameState((prev) => ({
        ...prev,
        status: 'PLAYING',
        level: clamp(level, 1, TOTAL_LEVELS),
        score,
      }));

      if (sdk) {
        sdk.startGame();
      }
    },
    [
      sdk,
      minQuestionsPerQuiz,
      maxQuestionsPerQuiz,
      defaultGuessKm,
      updateGuessValue,
    ],
  );

  const initGame = useCallback(() => {
    gameAudio.resume();
    gameAudio.playConfirmSelect();
    if (persistenceEnabled && !runWonRef.current) {
      startRun(gameStateRef.current.level, levelStartScoreRef.current);
    } else {
      startRun(1, 0);
    }
  }, [startRun, persistenceEnabled]);

  const resetGame = useCallback(() => {
    gameAudio.resume();
    gameAudio.playConfirmSelect();
    startRun(1, 0);
  }, [startRun]);

  usePlaygroundGameLifecycle(gameState, sdk);

  // Auto-start when ?autoplay is in URL
  const hasAutoplayed = useRef(false);
  useEffect(() => {
    if (
      !hasAutoplayed.current &&
      new URLSearchParams(window.location.search).has('autoplay')
    ) {
      hasAutoplayed.current = true;
      initGame();
    }
  }, [initGame]);

  // Spawn celebratory particle burst around target cities (strictly 3-color palette)
  const spawnCelebrationParticles = useCallback(
    (cityA: IndianCity, cityB: IndianCity, isPerfect: boolean) => {
      const proj = projectionRef.current;
      const pA = proj.project(cityA.lon, cityA.lat);
      const pB = proj.project(cityB.lon, cityB.lat);
      const count = isPerfect ? 32 : 14;
      const colors = isPerfect
        ? [THEME.teal, THEME.ink, '#56A39A', THEME.mintTint]
        : [THEME.teal, '#56A39A'];

      const next: Particle[] = [];
      [pA, pB].forEach((pt) => {
        for (let i = 0; i < count; i += 1) {
          const angle = (Math.PI * 2 * i) / count + Math.random() * 0.35;
          const speed = (isPerfect ? 62 : 36) + Math.random() * 85;
          next.push({
            x: pt.x,
            y: pt.y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            life: 0,
            maxLife: 0.75 + Math.random() * 0.55,
            size: (isPerfect ? 3.4 : 2.4) + Math.random() * 2.2,
            color: colors[i % colors.length],
          });
        }
      });
      particlesRef.current = [...particlesRef.current, ...next];
    },
    [],
  );

  // Submit current estimate or advance to next question
  const handleSubmitEstimate = useCallback(() => {
    if (
      gameStateRef.current.status !== 'PLAYING' ||
      isPausedOverlayRef.current
    ) {
      return;
    }
    const q = questionsRef.current[currentQIdxRef.current];
    if (!q || turnPhaseRef.current !== 'GUESSING') return;

    const currentGuess = clamp(guessKmRef.current, 0, maxDistanceKm);
    const actual = Math.max(1, q.actualKm);
    const accuracy = Math.max(
      0,
      100 - (Math.abs(currentGuess - actual) / actual) * 100,
    );
    const isPerfectBand = accuracy >= perfectThreshold;
    const rating = isPerfectBand
      ? maxQuestionRating
      : Math.round((accuracy / perfectThreshold) * (maxQuestionRating * 0.9));

    const newResult: QuestionResult = {
      ...q,
      guessKm: currentGuess,
      accuracy,
      rating,
      isPerfectBand,
    };

    revealProgressRef.current = 0;
    setTurnPhase('REVEALED');
    setResults((prev) => [...prev, newResult]);
    setGameState((prev) => {
      const updatedScore = prev.score + rating;
      setBestRating((b) => Math.max(b, updatedScore));
      return {
        ...prev,
        score: updatedScore,
      };
    });

    if (isPerfectBand) {
      gameAudio.playPowerupChime();
      spawnCelebrationParticles(q.cityA, q.cityB, true);
    } else if (accuracy >= 50) {
      gameAudio.playCoinPickup();
      spawnCelebrationParticles(q.cityA, q.cityB, false);
    } else {
      gameAudio.playErrorBuzz();
    }
  }, [
    maxDistanceKm,
    perfectThreshold,
    maxQuestionRating,
    spawnCelebrationParticles,
  ]);

  const handleNextQuestion = useCallback(() => {
    if (
      gameStateRef.current.status !== 'PLAYING' ||
      isPausedOverlayRef.current ||
      turnPhaseRef.current !== 'REVEALED'
    ) {
      return;
    }
    const isLast = currentQIdxRef.current >= questionsRef.current.length - 1;
    if (isLast) {
      gameAudio.playVictoryFanfare();
      setGameState((prev) => ({
        ...prev,
        status: 'VICTORY',
      }));
    } else {
      gameAudio.playConfirmSelect();
      setCurrentQIdx((idx) => idx + 1);
      setTurnPhase('GUESSING');
      revealProgressRef.current = 0;
      particlesRef.current = [];
      updateGuessValue(defaultGuessKm, false);

      // Trigger Pin Drop & Compass magnetic kick physics
      pinPhysicsRef.current.pinA = {yOffset: -240, vy: 0, squish: 1, settled: false};
      pinPhysicsRef.current.pinB = {yOffset: -300, vy: 0, squish: 1, settled: false};
      compassPhysicsRef.current.angularVel += (Math.random() - 0.5) * 8;
    }
  }, [defaultGuessKm, updateGuessValue]);

  // --- KEYBOARD SHORTCUTS (Escape for Game Menu, Arrows for Slider, Enter to Submit/Next) ---
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const status = gameStateRef.current.status;

      if (e.key === 'Escape') {
        if (status === 'PLAYING') {
          e.preventDefault();
          if (isHowToPlayOpen) {
            setIsHowToPlayOpen(false);
          } else {
            setIsGameMenuOpen((open) => !open);
          }
          gameAudio.playCrispClick();
        } else if (status === 'START') {
          if (isHowToPlayOpen) {
            e.preventDefault();
            setIsHowToPlayOpen(false);
          } else {
            exitChat({}).catch(() => {});
          }
        } else if (status === 'VICTORY' || status === 'GAME_OVER') {
          e.preventDefault();
          setGameState((prev) => ({...prev, status: 'START'}));
        }
        return;
      }

      if (status !== 'PLAYING' || isGameMenuOpen || isHowToPlayOpen) return;

      const activeTag = document.activeElement?.tagName;
      const isTypingInBox = activeTag === 'INPUT' || activeTag === 'TEXTAREA';

      if (e.key === 'Enter') {
        // Ignore Enter on a focused button so native button click isn't fired twice
        if (activeTag === 'BUTTON') return;
        e.preventDefault();
        if (turnPhaseRef.current === 'GUESSING') {
          handleSubmitEstimate();
        } else {
          handleNextQuestion();
        }
        return;
      }

      if (turnPhaseRef.current === 'GUESSING' && !isTypingInBox) {
        const step = e.shiftKey ? keyboardShiftStepKm : keyboardStepKm;
        if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
          e.preventDefault();
          updateGuessValue(guessKmRef.current - step, true);
        } else if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
          e.preventDefault();
          updateGuessValue(guessKmRef.current + step, true);
        }
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [
    isGameMenuOpen,
    isHowToPlayOpen,
    exitChat,
    handleSubmitEstimate,
    handleNextQuestion,
    keyboardStepKm,
    keyboardShiftStepKm,
    updateGuessValue,
  ]);

  // --- MOBILE VIRTUAL STEP BUTTON REPEAT HANDLERS ---
  const clearStepRepeat = useCallback(() => {
    if (repeatTimerRef.current.timeout !== null) {
      window.clearTimeout(repeatTimerRef.current.timeout);
      repeatTimerRef.current.timeout = null;
    }
    if (repeatTimerRef.current.interval !== null) {
      window.clearInterval(repeatTimerRef.current.interval);
      repeatTimerRef.current.interval = null;
    }
  }, []);

  useEffect(() => {
    window.addEventListener('blur', clearStepRepeat);
    return () => {
      clearStepRepeat();
      window.removeEventListener('blur', clearStepRepeat);
    };
  }, [clearStepRepeat]);

  const startStepAdjust = useCallback(
    (deltaKm: number) => {
      clearStepRepeat();
      if (turnPhaseRef.current !== 'GUESSING') return;
      updateGuessValue(guessKmRef.current + deltaKm, false);
      gameAudio.playCrispClick();

      repeatTimerRef.current.timeout = window.setTimeout(() => {
        repeatTimerRef.current.interval = window.setInterval(() => {
          if (turnPhaseRef.current !== 'GUESSING') {
            clearStepRepeat();
            return;
          }
          updateGuessValue(guessKmRef.current + deltaKm, true);
        }, 70);
      }, 300);
    },
    [clearStepRepeat, updateGuessValue],
  );

  // --- SLIDER TRACK POINTER DRAG & KINETIC PHYSICS ---
  const isDraggingSliderRef = useRef(false);

  const updateSliderFromClientX = useCallback(
    (clientX: number) => {
      const track = sliderTrackRef.current;
      if (!track || turnPhaseRef.current !== 'GUESSING') return;
      const rect = track.getBoundingClientRect();
      if (rect.width <= 0) return;
      const ratio = clamp((clientX - rect.left) / rect.width, 0, 1);
      const targetKm = ratio * maxDistanceKm;
      sliderPhysicsRef.current.posKm = targetKm;
      updateGuessValue(targetKm, true);
    },
    [maxDistanceKm, updateGuessValue],
  );

  const handleSliderPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (turnPhase !== 'GUESSING' || isGameMenuOpen || isHowToPlayOpen) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    isDraggingSliderRef.current = true;
    sliderPhysicsRef.current.isDragging = true;
    sliderPhysicsRef.current.velocityKmS = 0;
    sliderPhysicsRef.current.dragVelocityKmS = 0;
    sliderPhysicsRef.current.lastClientX = e.clientX;
    sliderPhysicsRef.current.lastTime = performance.now();
    updateSliderFromClientX(e.clientX);
    gameAudio.playCrispClick();
    compassPhysicsRef.current.angularVel += (Math.random() - 0.5) * 4;
  };

  const handleSliderPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (!isDraggingSliderRef.current) return;
    const now = performance.now();
    const dt = Math.max(0.001, (now - sliderPhysicsRef.current.lastTime) / 1000);
    const track = sliderTrackRef.current;
    if (track) {
      const rect = track.getBoundingClientRect();
      if (rect.width > 0) {
        const deltaX = e.clientX - sliderPhysicsRef.current.lastClientX;
        const deltaKm = (deltaX / rect.width) * maxDistanceKm;
        sliderPhysicsRef.current.dragVelocityKmS = deltaKm / dt;
      }
    }
    sliderPhysicsRef.current.lastClientX = e.clientX;
    sliderPhysicsRef.current.lastTime = now;
    updateSliderFromClientX(e.clientX);
  };

  const handleSliderPointerUp = (e: PointerEvent<HTMLDivElement>) => {
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    isDraggingSliderRef.current = false;
    sliderPhysicsRef.current.isDragging = false;
    // Impart kinetic throw momentum with velocity damping
    sliderPhysicsRef.current.velocityKmS = clamp(
      sliderPhysicsRef.current.dragVelocityKmS * 0.35,
      -6000,
      6000,
    );
  };

  // --- NUMERIC INPUT HANDLER ---
  const handleKmInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (turnPhase !== 'GUESSING') return;
    const raw = e.target.value.replace(/[^0-9]/g, '');
    if (raw === '') {
      setKmInputText('');
      setGuessKm(0);
      return;
    }
    const num = clamp(parseInt(raw, 10), 0, maxDistanceKm);
    setGuessKm(num);
    setKmInputText(String(num));
  };

  const handleKmInputBlur = () => {
    setKmInputText(String(guessKm));
  };

  // --- CANVAS UPDATE & RENDER LOOP ---
  const update = (deltaTime: number) => {
    animTimeRef.current += deltaTime;

    // Hover city detection on canvas
    const ptr = inputRef.current?.pointer;
    const proj = projectionRef.current;
    if (ptr && proj) {
      let nearest: IndianCity | null = null;
      let nearestDist = 22;
      for (let i = 0; i < INDIAN_CITIES.length; i += 1) {
        const city = INDIAN_CITIES[i];
        if (!city) continue;
        const pos = proj.project(city.lon, city.lat);
        const d = Math.hypot(ptr.x - pos.x, ptr.y - pos.y);
        if (d < nearestDist) {
          nearestDist = d;
          nearest = city;
        }
      }
      hoveredCityRef.current = nearest;
    }

    if (
      gameStateRef.current.status !== 'PLAYING' ||
      isPausedOverlayRef.current
    ) {
      return;
    }

    // Animate straight-line sweep on answer reveal
    if (turnPhaseRef.current === 'REVEALED') {
      const dur = Math.max(0.1, revealDuration);
      if (revealProgressRef.current < 1) {
        revealProgressRef.current = Math.min(
          1,
          revealProgressRef.current + deltaTime / dur,
        );
      }
    }

    // --- PHYSICS ENGINE TICK ---
    // 1. Slider kinetic momentum & spring boundary bounce
    const sp = sliderPhysicsRef.current;
    if (!sp.isDragging && Math.abs(sp.velocityKmS) > 0.5) {
      sp.posKm += sp.velocityKmS * deltaTime;

      if (sp.posKm < 0) {
        const springK = 35;
        const dampingC = 12;
        const springForce = -springK * sp.posKm - dampingC * sp.velocityKmS;
        sp.velocityKmS += springForce * deltaTime * 60;
        sp.velocityKmS *= Math.pow(0.85, deltaTime * 60);
        if (Math.abs(sp.posKm) < 1 && Math.abs(sp.velocityKmS) < 5) {
          sp.posKm = 0;
          sp.velocityKmS = 0;
        }
      } else if (sp.posKm > maxDistanceKm) {
        const springK = 35;
        const dampingC = 12;
        const springForce =
          -springK * (sp.posKm - maxDistanceKm) - dampingC * sp.velocityKmS;
        sp.velocityKmS += springForce * deltaTime * 60;
        sp.velocityKmS *= Math.pow(0.85, deltaTime * 60);
        if (
          Math.abs(sp.posKm - maxDistanceKm) < 1 &&
          Math.abs(sp.velocityKmS) < 5
        ) {
          sp.posKm = maxDistanceKm;
          sp.velocityKmS = 0;
        }
      } else {
        sp.velocityKmS *= Math.pow(0.88, deltaTime * 60);
      }

      const roundedKm = Math.round(clamp(sp.posKm, 0, maxDistanceKm));
      if (roundedKm !== guessKmRef.current) {
        updateGuessValue(roundedKm, true);
      }
    }

    // 2. Pin drop gravity & restitution squash bounce
    const pinGrav = 1800;
    const pinRestitution = 0.5;
    const pp = pinPhysicsRef.current;
    [pp.pinA, pp.pinB].forEach((pin) => {
      if (!pin.settled) {
        pin.vy += pinGrav * deltaTime;
        pin.yOffset += pin.vy * deltaTime;
        pin.squish += (1 - pin.squish) * Math.min(1, deltaTime * 12);
        if (pin.yOffset >= 0) {
          pin.yOffset = 0;
          pin.vy = -pin.vy * pinRestitution;
          pin.squish = Math.max(0.65, 1 - Math.abs(pin.vy) / 1000);
          if (Math.abs(pin.vy) > 80) {
            gameAudio.playCrispClick();
          }
          if (Math.abs(pin.vy) < 40) {
            pin.vy = 0;
            pin.settled = true;
            pin.squish = 1;
          }
        }
      }
    });

    // 3. Magnetic compass needle spring & damping
    const cp = compassPhysicsRef.current;
    const springTorque = -36 * cp.angleRad - 8 * cp.angularVel;
    cp.angularVel += springTorque * deltaTime;
    cp.angularVel *= Math.pow(0.95, deltaTime * 60);
    cp.angleRad += cp.angularVel * deltaTime;

    // 4. Update celebration particles with gravity and ground bounce
    if (particlesRef.current.length > 0) {
      const surviving: Particle[] = [];
      const particleGravity = 320;
      for (let i = 0; i < particlesRef.current.length; i += 1) {
        const p = particlesRef.current[i];
        if (!p) continue;
        const nextLife = p.life + deltaTime;
        if (nextLife < p.maxLife) {
          let nextVy = p.vy + particleGravity * deltaTime;
          let nextX = p.x + p.vx * deltaTime;
          let nextY = p.y + nextVy * deltaTime;
          let nextVx = p.vx * 0.98;

          if (nextY >= canvasHeight - 20) {
            nextY = canvasHeight - 20;
            nextVy = -nextVy * 0.45;
          }

          surviving.push({
            ...p,
            x: nextX,
            y: nextY,
            vx: nextVx,
            vy: nextVy,
            life: nextLife,
          });
        }
      }
      particlesRef.current = surviving;
    }
  };

  const drawPolygon = (
    ctx: CanvasRenderingContext2D,
    coords: LonLat[],
    proj: ReturnType<typeof createIndiaProjection>,
  ) => {
    if (!coords.length) return;
    const first = proj.project(coords[0][0], coords[0][1]);
    ctx.beginPath();
    ctx.moveTo(first.x, first.y);
    for (let i = 1; i < coords.length; i += 1) {
      const pt = proj.project(coords[i][0], coords[i][1]);
      ctx.lineTo(pt.x, pt.y);
    }
    ctx.closePath();
  };

  const drawPolyline = (
    ctx: CanvasRenderingContext2D,
    coords: LonLat[],
    proj: ReturnType<typeof createIndiaProjection>,
  ) => {
    if (coords.length < 2) return;
    const first = proj.project(coords[0][0], coords[0][1]);
    ctx.beginPath();
    ctx.moveTo(first.x, first.y);
    for (let i = 1; i < coords.length; i += 1) {
      const pt = proj.project(coords[i][0], coords[i][1]);
      ctx.lineTo(pt.x, pt.y);
    }
  };

  const draw = (ctx: CanvasRenderingContext2D) => {
    prepareCanvas(ctx, canvasWidth, canvasHeight);
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);

    // 1. Serene Minimalist Light Ocean Backdrop (Pure Warm Alabaster #F6F4EF)
    ctx.fillStyle = THEME.alabaster;
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    const proj = projectionRef.current;
    const t = animTimeRef.current;

    // 2. Delicate Cartographic Lat/Lon Graticule (5% Deep Charcoal Slate)
    ctx.save();
    ctx.strokeStyle = THEME.graticuleStroke;
    ctx.lineWidth = 1;
    ctx.font = `500 11px ${THEME.fontMono}`;
    ctx.fillStyle = THEME.graticuleLabel;
    for (let lon = 70; lon <= 95; lon += 5) {
      const top = proj.project(lon, 37.6);
      const bot = proj.project(lon, 6.4);
      ctx.beginPath();
      ctx.moveTo(top.x, 12);
      ctx.lineTo(bot.x, canvasHeight - 12);
      ctx.stroke();
      ctx.fillText(`${lon}°E`, top.x + 5, 22);
    }
    for (let lat = 10; lat <= 35; lat += 5) {
      const left = proj.project(67.5, lat);
      const right = proj.project(98.0, lat);
      ctx.beginPath();
      ctx.moveTo(24, left.y);
      ctx.lineTo(canvasWidth - 24, right.y);
      ctx.stroke();
      ctx.fillText(`${lat}°N`, 26, left.y - 6);
    }
    ctx.restore();

    // 2b. Neighboring Countries (Softly Differentiated #EAE6DC Terrain & Hairline Borders)
    ctx.save();
    for (let i = 0; i < NEIGHBORING_COUNTRIES.length; i += 1) {
      const country = NEIGHBORING_COUNTRIES[i];
      if (!country) continue;
      drawPolygon(ctx, country.polygon, proj);
      ctx.fillStyle = THEME.neighborTerrain;
      ctx.fill();
      ctx.strokeStyle = THEME.neighborStroke;
      ctx.lineWidth = 1;
      ctx.lineJoin = 'round';
      ctx.stroke();
    }

    // Subtle Neighboring Country Labels (rgba(30, 41, 59, 0.55))
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = THEME.neighborLabel;
    for (let i = 0; i < NEIGHBORING_COUNTRIES.length; i += 1) {
      const country = NEIGHBORING_COUNTRIES[i];
      if (!country || country.hideLabel || !country.name) continue;
      const pt = proj.project(country.labelCoord[0], country.labelCoord[1]);
      const sz = country.fontSize ?? 11;
      ctx.font = `600 ${sz}px ${THEME.fontDisplay}`;
      ctx.fillText(country.name, pt.x, pt.y);
    }

    // Subtle Sea & Ocean Water Labels
    ctx.font = `italic 600 11px ${THEME.fontDisplay}`;
    ctx.fillStyle = THEME.waterLabel;
    const arabianPt = proj.project(66.2, 16.2);
    ctx.fillText('ARABIAN SEA', arabianPt.x, arabianPt.y);
    const bengalPt = proj.project(87.6, 14.8);
    ctx.fillText('BAY OF BENGAL', bengalPt.x, bengalPt.y);
    ctx.restore();

    // 3. Sovereign Mainland Outer Soft Elevation & Crisp Ivory Base Fill
    ctx.save();
    ctx.shadowColor = THEME.sovereignShadow;
    ctx.shadowBlur = 20;
    ctx.shadowOffsetY = 4;
    drawPolygon(ctx, INDIA_SOVEREIGN_MAINLAND, proj);
    ctx.fillStyle = THEME.cardBg;
    ctx.fill();
    ctx.restore();

    // 4. Clipped Internal State & Union Territory Fills + Single-Pass Hairline Boundaries
    ctx.save();
    drawPolygon(ctx, INDIA_SOVEREIGN_MAINLAND, proj);
    ctx.clip();

    for (let i = 0; i < INDIA_STATE_REGIONS.length; i += 1) {
      const region = INDIA_STATE_REGIONS[i];
      if (!region) continue;
      const fill = THEME.stateFills[region.toneIndex % THEME.stateFills.length];
      drawPolygon(ctx, region.polygon, proj);
      ctx.fillStyle = fill;
      ctx.fill();
      if (region.extraPolygons) {
        for (let k = 0; k < region.extraPolygons.length; k += 1) {
          const extra = region.extraPolygons[k];
          if (!extra) continue;
          drawPolygon(ctx, extra, proj);
          ctx.fillStyle = fill;
          ctx.fill();
        }
      }
    }

    // Single-pass 1px hairline internal inter-state & inter-UT borders
    ctx.strokeStyle = THEME.stateStroke;
    ctx.lineWidth = 1;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    for (let i = 0; i < INDIA_INTERNAL_BORDERS.length; i += 1) {
      const borderArc = INDIA_INTERNAL_BORDERS[i];
      if (!borderArc) continue;
      drawPolyline(ctx, borderArc, proj);
      ctx.stroke();
    }
    // Stroke enclave UT polygons (Dadra & Nagar Haveli / Daman & Diu, Puducherry)
    for (let i = 0; i < INDIA_STATE_REGIONS.length; i += 1) {
      const region = INDIA_STATE_REGIONS[i];
      if (!region?.extraPolygons) continue;
      drawPolygon(ctx, region.polygon, proj);
      ctx.stroke();
      for (let k = 0; k < region.extraPolygons.length; k += 1) {
        const extra = region.extraPolygons[k];
        if (!extra) continue;
        drawPolygon(ctx, extra, proj);
        ctx.stroke();
      }
    }

    // Subtle State Abbreviation Labels cleanly centered inside states
    ctx.font = `600 9.5px ${THEME.fontDisplay}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = 'rgba(30, 41, 59, 0.38)';
    for (let i = 0; i < INDIA_STATE_REGIONS.length; i += 1) {
      const region = INDIA_STATE_REGIONS[i];
      if (!region || region.hideLabel) continue;
      const pt = proj.project(region.labelCoord[0], region.labelCoord[1]);
      ctx.fillText(region.abbr, pt.x, pt.y);
    }
    ctx.restore();

    // 5. Sovereign Mainland & Island International Borders
    ctx.save();
    drawPolygon(ctx, INDIA_SOVEREIGN_MAINLAND, proj);
    ctx.strokeStyle = THEME.sovereignBorder;
    ctx.lineWidth = 1.8;
    ctx.lineJoin = 'round';
    ctx.stroke();

    for (let i = 0; i < INDIA_ISLANDS.length; i += 1) {
      const isl = INDIA_ISLANDS[i];
      if (!isl) continue;
      drawPolygon(ctx, isl.polygon, proj);
      ctx.fillStyle = THEME.whiteCard;
      ctx.fill();
      ctx.strokeStyle = THEME.sovereignBorder;
      ctx.lineWidth = 1.4;
      ctx.lineJoin = 'round';
      ctx.stroke();
    }
    ctx.restore();

    // Island Group Watermark Labels
    ctx.save();
    ctx.font = `500 10px ${THEME.fontMono}`;
    ctx.fillStyle = THEME.neighborLabel;
    ctx.textAlign = 'left';
    const anLabel = proj.project(93.75, 10.6);
    ctx.fillText('ANDAMAN &', anLabel.x, anLabel.y);
    ctx.fillText('NICOBAR IS.', anLabel.x, anLabel.y + 12);
    const lkLabel = proj.project(69.2, 10.2);
    ctx.fillText('LAKSHADWEEP', lkLabel.x, lkLabel.y);
    ctx.restore();

    // 6. All Indian Cities (municipal boundary rings + precision ink dots)
    const activeQ = questionsRef.current[currentQIdxRef.current];
    const isPlayingOrVictory =
      gameStateRef.current.status === 'PLAYING' ||
      gameStateRef.current.status === 'VICTORY';
    const activeIdA = isPlayingOrVictory ? activeQ?.cityA.id : undefined;
    const activeIdB = isPlayingOrVictory ? activeQ?.cityB.id : undefined;

    for (let i = 0; i < INDIAN_CITIES.length; i += 1) {
      const city = INDIAN_CITIES[i];
      if (!city) continue;
      const isTarget = city.id === activeIdA || city.id === activeIdB;
      const isHovered = hoveredCityRef.current?.id === city.id;
      const pt = proj.project(city.lon, city.lat);
      const municipalPx = Math.max(
        4,
        city.municipalRadiusKm * proj.pixelsPerKm,
      );

      // Municipal boundary ring
      ctx.save();
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, Math.max(0, municipalPx), 0, Math.PI * 2);
      ctx.strokeStyle = isHovered
        ? 'rgba(30, 127, 116, 0.5)'
        : THEME.cityRing;
      ctx.lineWidth = isHovered ? 1.25 : 0.8;
      ctx.setLineDash([2, 2]);
      ctx.stroke();
      ctx.restore();

      if (!isTarget) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(
          pt.x,
          pt.y,
          Math.max(0, isHovered ? 4.2 : city.tier === 1 ? 2.8 : 2),
          0,
          Math.PI * 2,
        );
        ctx.fillStyle = isHovered
          ? THEME.cityHover
          : city.tier === 1
            ? THEME.cityDot
            : THEME.cityDotSecondary;
        ctx.fill();
        ctx.restore();
      }
    }

    // 7. Active Target Cities, Straight-Line Connection (ONLY after answer submitted) & Distance Badge
    if (isPlayingOrVictory && activeQ) {
      const pA = proj.project(activeQ.cityA.lon, activeQ.cityA.lat);
      const pB = proj.project(activeQ.cityB.lon, activeQ.cityB.lat);
      const isRevealed = turnPhaseRef.current === 'REVEALED';
      const rawSweep = isRevealed ? revealProgressRef.current : 0;
      const sweep = 1 - Math.pow(1 - rawSweep, 3);

      // Straight Line drawn ONLY AFTER the user submits their answer
      if (isRevealed) {
        ctx.save();
        const curX = pA.x + (pB.x - pA.x) * sweep;
        const curY = pA.y + (pB.y - pA.y) * sweep;

        // Soft mint highlight wash beneath line
        ctx.beginPath();
        ctx.moveTo(pA.x, pA.y);
        ctx.lineTo(curX, curY);
        ctx.strokeStyle = THEME.tealWash;
        ctx.lineWidth = 9;
        ctx.lineCap = 'round';
        ctx.stroke();

        // Crisp mineral teal straight line
        ctx.beginPath();
        ctx.moveTo(pA.x, pA.y);
        ctx.lineTo(curX, curY);
        ctx.strokeStyle = THEME.teal;
        ctx.lineWidth = 2.8;
        ctx.lineCap = 'round';
        ctx.stroke();

        if (rawSweep < 1) {
          ctx.beginPath();
          ctx.arc(curX, curY, 4.5, 0, Math.PI * 2);
          ctx.fillStyle = THEME.teal;
          ctx.fill();
          ctx.lineWidth = 1.5;
          ctx.strokeStyle = THEME.whiteCard;
          ctx.stroke();
        }
        ctx.restore();
      }

      // City A (solid #1E7F74 circle + mineral teal pin) & City B (crisp #1E293B ringed marker)
      const pinW = getConfig('assetCityPinWidth') as number;
      const pinH = getConfig('assetCityPinHeight') as number;

      const targets = [
        {city: activeQ.cityA, pt: pA, tag: 'A' as const, isTeal: true},
        {city: activeQ.cityB, pt: pB, tag: 'B' as const, isTeal: false},
      ];

      targets.forEach((item, idx) => {
        const pulse = 1 + 0.3 * Math.sin(t * 3.8 + idx * 1.4);
        const baseRing = Math.max(
          11,
          item.city.municipalRadiusKm * proj.pixelsPerKm,
        );
        const ringColor = item.isTeal ? THEME.teal : THEME.ink;
        const pinState = item.isTeal
          ? pinPhysicsRef.current.pinA
          : pinPhysicsRef.current.pinB;

        // Soft municipal boundary fill wash
        ctx.save();
        ctx.beginPath();
        ctx.arc(item.pt.x, item.pt.y, Math.max(0, baseRing), 0, Math.PI * 2);
        ctx.fillStyle = item.isTeal
          ? THEME.tealWash
          : 'rgba(30, 41, 59, 0.06)';
        ctx.fill();
        ctx.restore();

        // Outer subtle pulse ring
        ctx.save();
        ctx.beginPath();
        ctx.arc(
          item.pt.x,
          item.pt.y,
          Math.max(0, baseRing * pulse),
          0,
          Math.PI * 2,
        );
        ctx.strokeStyle = ringColor;
        ctx.globalAlpha = 0.48 - 0.25 * Math.sin(t * 3.8 + idx * 1.4);
        ctx.lineWidth = 1.6;
        ctx.stroke();
        ctx.restore();

        if (item.isTeal) {
          // City A: solid #1E7F74 circle + clean mineral teal teardrop pin with physics drop & squash
          ctx.save();
          ctx.beginPath();
          ctx.arc(item.pt.x, item.pt.y, 5.5, 0, Math.PI * 2);
          ctx.fillStyle = THEME.teal;
          ctx.fill();
          ctx.lineWidth = 1.8;
          ctx.strokeStyle = THEME.whiteCard;
          ctx.stroke();
          ctx.restore();

          const bob = pinState.settled ? Math.sin(t * 3.2) * 2 : 0;
          ctx.save();
          ctx.translate(item.pt.x, item.pt.y + pinState.yOffset + bob);
          ctx.scale(2 - pinState.squish, pinState.squish);
          drawAsset(
            ctx,
            assets['cityPinMarker'],
            -pinW / 2,
            -pinH - 5,
            pinW,
            pinH,
            (fCtx) => {
              fCtx.save();
              fCtx.fillStyle = THEME.teal;
              fCtx.beginPath();
              fCtx.arc(0, -18, 8, 0, Math.PI * 2);
              fCtx.fill();
              fCtx.restore();
            },
          );
          ctx.restore();
        } else {
          // City B: crisp #1E293B ringed target marker with physics drop & squash
          ctx.save();
          const bob = pinState.settled ? Math.sin(t * 3.2 + 1) * 2 : 0;
          ctx.translate(item.pt.x, item.pt.y + pinState.yOffset + bob);
          ctx.scale(2 - pinState.squish, pinState.squish);

          ctx.beginPath();
          ctx.arc(0, 0, 8, 0, Math.PI * 2);
          ctx.fillStyle = THEME.whiteCard;
          ctx.fill();
          ctx.lineWidth = 2.4;
          ctx.strokeStyle = THEME.ink;
          ctx.stroke();

          ctx.beginPath();
          ctx.arc(0, 0, 3, 0, Math.PI * 2);
          ctx.fillStyle = THEME.ink;
          ctx.fill();
          ctx.restore();
        }
      });

      // Smart non-overlapping callout badges for City A & City B
      const dx = pB.x - pA.x;
      const dy = pB.y - pA.y;
      const labelDirA = dy >= 0 ? -1 : 1;
      const labelDirB = -labelDirA;

      targets.forEach((item, idx) => {
        const dirY = idx === 0 ? labelDirA : labelDirB;
        const alignRight =
          idx === 0 ? (dx > 0 ? -1 : 1) : dx > 0 ? 1 : -1;
        const cityName = item.city.name;
        ctx.save();
        ctx.font = `700 12px ${THEME.fontDisplay}`;
        const nameW = ctx.measureText(cityName).width;
        const pillW = 20;
        const boxW = pillW + nameW + 20;
        const boxH = 26;
        let bx = item.pt.x + (alignRight > 0 ? 16 : -boxW - 16);
        let by = item.pt.y + (dirY > 0 ? 10 : -boxH - 12);
        bx = clamp(bx, 18, canvasWidth - boxW - 18);
        by = clamp(by, 18, canvasHeight - boxH - 18);

        ctx.shadowColor = 'rgba(30, 41, 59, 0.08)';
        ctx.shadowBlur = 12;
        ctx.shadowOffsetY = 3;
        drawRoundedRectPath(ctx, bx, by, boxW, boxH, 8);
        ctx.fillStyle = THEME.whiteCard;
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.shadowOffsetY = 0;

        ctx.strokeStyle = item.isTeal
          ? 'rgba(30, 127, 116, 0.45)'
          : 'rgba(30, 41, 59, 0.25)';
        ctx.lineWidth = 1.1;
        ctx.stroke();

        // A / B badge pill inside label card
        const badgeX = bx + 5;
        const badgeY = by + 4;
        const badgeSize = 18;
        drawRoundedRectPath(ctx, badgeX, badgeY, badgeSize, badgeSize, 5);
        if (item.isTeal) {
          ctx.fillStyle = THEME.teal;
          ctx.fill();
          ctx.fillStyle = THEME.whiteCard;
        } else {
          ctx.fillStyle = THEME.whiteCard;
          ctx.fill();
          ctx.strokeStyle = THEME.ink;
          ctx.lineWidth = 1.5;
          ctx.stroke();
          ctx.fillStyle = THEME.ink;
        }
        ctx.font = `700 11px ${THEME.fontDisplay}`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(
          item.tag,
          badgeX + badgeSize / 2,
          badgeY + badgeSize / 2 + 0.5,
        );

        // City name in Deep Charcoal Slate
        ctx.fillStyle = THEME.ink;
        ctx.font = `600 12px ${THEME.fontDisplay}`;
        ctx.textAlign = 'left';
        ctx.fillText(cityName, badgeX + badgeSize + 7, by + boxH / 2 + 0.5);
        ctx.restore();
      });

      // Midpoint Distance Badge (ONLY shown after answer is submitted & line sweeps across)
      const midX = (pA.x + pB.x) / 2;
      const midY = (pA.y + pB.y) / 2;
      if (isRevealed && sweep >= 0.72) {
        const badgeText = `${activeQ.actualKm.toLocaleString()} km`;
        ctx.save();
        ctx.font = `700 13px ${THEME.fontMono}`;
        const tw = ctx.measureText(badgeText).width;
        const bw = tw + 24;
        const bh = 28;
        const bx = clamp(midX - bw / 2, 16, canvasWidth - bw - 16);
        const by = clamp(midY - bh / 2, 16, canvasHeight - bh - 16);

        ctx.shadowColor = 'rgba(30, 41, 59, 0.08)';
        ctx.shadowBlur = 12;
        ctx.shadowOffsetY = 3;
        drawRoundedRectPath(ctx, bx, by, bw, bh, 14);
        ctx.fillStyle = THEME.whiteCard;
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.shadowOffsetY = 0;
        ctx.strokeStyle = THEME.teal;
        ctx.lineWidth = 1.5;
        ctx.stroke();

        ctx.fillStyle = THEME.teal;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(badgeText, bx + bw / 2, by + bh / 2 + 0.5);
        ctx.restore();
      }
    }

    // 8. Celebration Particles
    for (let i = 0; i < particlesRef.current.length; i += 1) {
      const p = particlesRef.current[i];
      if (!p) continue;
      const alpha = Math.max(0, 1 - p.life / p.maxLife);
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, Math.max(0, p.size), 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // 9. Hovered City Tooltip (non-spoiler helper)
    if (hoveredCityRef.current) {
      const hc = hoveredCityRef.current;
      const pt = proj.project(hc.lon, hc.lat);
      const label = `${hc.name}, ${hc.state}`;
      ctx.save();
      ctx.font = `600 12px ${THEME.fontDisplay}`;
      const tw = ctx.measureText(label).width;
      const bw = tw + 18;
      const bh = 24;
      const bx = clamp(pt.x - bw / 2, 12, canvasWidth - bw - 12);
      const by = clamp(pt.y - 36, 12, canvasHeight - bh - 12);
      ctx.shadowColor = 'rgba(30, 41, 59, 0.06)';
      ctx.shadowBlur = 8;
      drawRoundedRectPath(ctx, bx, by, bw, bh, 6);
      ctx.fillStyle = THEME.whiteCard;
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.strokeStyle = 'rgba(30, 41, 59, 0.18)';
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.fillStyle = THEME.ink;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(label, bx + bw / 2, by + bh / 2);
      ctx.restore();
    }

    // 10. Compass Rose Emblem (Bottom-Left) with dynamic magnetic needle physics
    const compassW = getConfig('assetCompassRoseWidth') as number;
    const compassH = getConfig('assetCompassRoseHeight') as number;
    const compassX = 28;
    const compassY = canvasHeight - compassH - 28;
    ctx.save();
    ctx.translate(compassX + compassW / 2, compassY + compassH / 2);
    ctx.rotate(compassPhysicsRef.current.angleRad);
    ctx.translate(-compassW / 2, -compassH / 2);
    drawAsset(
      ctx,
      assets['compassRoseIcon'],
      0,
      0,
      compassW,
      compassH,
      (fCtx) => {
        fCtx.save();
        fCtx.strokeStyle = THEME.ink;
        fCtx.lineWidth = 1.5;
        fCtx.beginPath();
        fCtx.arc(
          compassW / 2,
          compassH / 2,
          compassW * 0.42,
          0,
          Math.PI * 2,
        );
        fCtx.stroke();
        fCtx.restore();
      },
    );
    ctx.restore();

    // 11. Fairness Scale Bar (0 - 500 - 1000 km) in Bottom-Right
    const scale1000Px = 1000 * proj.pixelsPerKm;
    const scaleX = canvasWidth - scale1000Px - 34;
    const scaleY = canvasHeight - 36;
    ctx.save();
    ctx.shadowColor = 'rgba(30, 41, 59, 0.06)';
    ctx.shadowBlur = 12;
    drawRoundedRectPath(
      ctx,
      scaleX - 16,
      scaleY - 26,
      scale1000Px + 34,
      44,
      8,
    );
    ctx.fillStyle = THEME.whiteCard;
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = THEME.stateStroke;
    ctx.lineWidth = 1;
    ctx.stroke();

    // Scale segments
    ctx.fillStyle = THEME.ink;
    ctx.fillRect(scaleX, scaleY, scale1000Px * 0.5, 4);
    ctx.fillStyle = THEME.alabaster;
    ctx.fillRect(scaleX + scale1000Px * 0.5, scaleY, scale1000Px * 0.5, 4);
    ctx.strokeStyle = THEME.ink;
    ctx.lineWidth = 1;
    ctx.strokeRect(scaleX, scaleY, scale1000Px, 4);

    ctx.font = `600 10px ${THEME.fontMono}`;
    ctx.fillStyle = THEME.ink;
    ctx.textAlign = 'center';
    ctx.fillText('0', scaleX, scaleY - 8);
    ctx.fillText('500', scaleX + scale1000Px * 0.5, scaleY - 8);
    ctx.fillText('1000 km', scaleX + scale1000Px, scaleY - 8);
    ctx.restore();
  };

  // --- GAME LOOP ---
  const updateRef = useRef(update);
  const drawRef = useRef(draw);
  updateRef.current = update;
  drawRef.current = draw;

  useEffect(() => {
    let raf = 0;
    const loop = (time: number) => {
      stepperRef.current?.(time, (dt) => updateRef.current(dt));
      const ctx = canvasRef.current?.getContext('2d');
      if (ctx) drawRef.current(ctx);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  // --- DERIVED QUIZ METRICS ---
  const activeQuestion = questions[currentQIdx];
  const latestResult =
    turnPhase === 'REVEALED' ? results[results.length - 1] : undefined;
  const maxRoundScore = questions.length * maxQuestionRating;
  const averageAccuracy =
    results.length > 0
      ? results.reduce((acc, r) => acc + r.accuracy, 0) / results.length
      : 0;

  const sliderPercent = clamp((guessKm / maxDistanceKm) * 100, 0, 100);
  const actualPercent =
    latestResult != null
      ? clamp((latestResult.actualKm / maxDistanceKm) * 100, 0, 100)
      : null;

  const isMusicPlaying =
    assetsReady && gameState.status === 'PLAYING' && !isGameMenuOpen;

  return (
    <div
      className="fixed inset-0 w-screen h-screen overflow-hidden touch-none flex flex-col bg-[#F6F4EF] text-[#1E293B] select-none"
      style={{fontFamily: getConfig('fontFamily') as string}}>
      {!assetsReady && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-[#F6F4EF] text-[#1E293B]">
          <Compass className="w-10 h-10 animate-spin mb-3 text-[#1E7F74]" />
          <div className="text-xs font-semibold tracking-widest uppercase text-[#1E293B]/70">
            Charting Sovereign Map...
          </div>
        </div>
      )}

      <BackgroundMusic
        url={BACKGROUND_MUSIC_URL}
        isPlaying={isMusicPlaying}
        isMuted={isMusicMuted}
        volume={defaultMusicVolume}
      />

      {/* TOP HUD BAR (Airy alabaster card header, hairline border, top-right Menu button) */}
      <header className="w-full bg-[#FAF9F6]/95 border-b border-[#1E293B]/[0.14] px-4 py-1.5 flex flex-wrap items-center justify-between gap-2 z-20 shrink-0">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 bg-[#E0F0EE] border border-[#1E7F74]/25 rounded-lg px-2.5 py-1">
            <Compass className="w-4 h-4 text-[#1E7F74] shrink-0" />
            <span
              className="text-xs font-bold tracking-wide text-[#1E293B] uppercase"
              style={{fontFamily: THEME.fontDisplay}}>
              India Atlas
            </span>
          </div>

          <div className="bg-[#FFFFFF] border border-[#1E293B]/[0.14] rounded-lg px-2.5 py-1 text-xs font-medium text-[#1E293B]/70">
            Q{' '}
            <span className="text-[#1E7F74] font-bold tabular-nums">
              {Math.min(currentQIdx + 1, questions.length)}/{questions.length}
            </span>
          </div>

          <div className="bg-[#FFFFFF] border border-[#1E293B]/[0.14] rounded-lg px-2.5 py-1 text-xs font-medium text-[#1E293B]/70">
            Rating:{' '}
            <span className="text-[#1E7F74] font-bold tabular-nums">
              {gameState.score.toLocaleString()}
            </span>
            <span className="text-[#1E293B]/45 text-[11px] tabular-nums">
              /{maxRoundScore.toLocaleString()}
            </span>
          </div>

          {bestRating > 0 && (
            <div className="hidden sm:flex items-center gap-1 bg-[#E0F0EE]/70 border border-[#1E7F74]/25 rounded-lg px-2.5 py-1 text-[11px] font-semibold text-[#1E7F74] tabular-nums">
              <Award className="w-3.5 h-3.5" />
              Best: {bestRating.toLocaleString()}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Map Mode Switcher (Leaflet Real Map vs Atlas Canvas) */}
          <button
            type="button"
            onClick={() => {
              gameAudio.playCrispClick();
              setMapMode((m) => (m === 'leaflet' ? 'canvas' : 'leaflet'));
            }}
            aria-label="Toggle Map View"
            className="min-h-[40px] px-3.5 py-1.5 rounded-xl bg-[#FFFFFF] hover:bg-[#E0F0EE]/70 active:scale-[0.98] border border-[#1E7F74]/35 text-[#1E7F74] text-xs font-bold flex items-center gap-1.5 shadow-[0_2px_8px_rgba(30,127,116,0.08)] transition-all cursor-pointer">
            <Map className="w-4 h-4 text-[#1E7F74]" />
            <span>
              {mapMode === 'leaflet' ? 'Real Leaflet Map' : 'Atlas Canvas Map'}
            </span>
          </button>

          {/* Top-Right Exclusive Menu Trigger */}
          <button
            type="button"
            onClick={() => {
              gameAudio.playCrispClick();
              setIsGameMenuOpen(true);
            }}
            aria-label="Open Game Menu"
            className="min-w-[48px] min-h-[48px] px-3.5 py-2 mr-1 rounded-xl bg-[#FFFFFF] hover:bg-[#E0F0EE]/60 active:scale-[0.98] border border-[#1E293B]/[0.14] text-[#1E293B] text-xs font-semibold flex items-center justify-center gap-1.5 shadow-[0_2px_8px_rgba(30,41,59,0.04)] transition-colors cursor-pointer">
            <Menu className="w-4 h-4 text-[#1E7F74]" />
            <span>Menu</span>
          </button>
        </div>
      </header>

      {/* CENTRAL MAP VIEWPORT (Leaflet Real Map with accurate state boundaries or Atlas Canvas Map) */}
      <div
        ref={canvasWrapperRef}
        className="flex-1 w-full min-h-0 flex items-center justify-center relative bg-[#F6F4EF] overflow-hidden">
        {mapMode === 'leaflet' ? (
          <LeafletMap
            cityA={activeQuestion?.cityA}
            cityB={activeQuestion?.cityB}
            actualKm={activeQuestion?.actualKm}
            guessKm={guessKm}
            turnPhase={turnPhase}
          />
        ) : (
          assetsReady && (
            <canvas
              ref={canvasRef}
              width={canvasWidth}
              height={canvasHeight}
              style={
                fittedCanvasSize
                  ? {
                      width: `${fittedCanvasSize.width}px`,
                      height: `${fittedCanvasSize.height}px`,
                    }
                  : {
                      aspectRatio: `${canvasWidth} / ${canvasHeight}`,
                      width: `min(100%, calc(100vh * ${canvasWidth} / ${canvasHeight}))`,
                    }
              }
              className="h-auto max-w-full max-h-full block"
            />
          )
        )}
      </div>

      {/* BOTTOM DISTANCE ESTIMATION DOCK (Dedicated minimalist light panel outside map canvas) */}
      <footer className="w-full bg-[#FAF9F6]/95 border-t border-[#1E293B]/[0.14] px-8 py-2.5 z-20 shrink-0 flex flex-col gap-2 shadow-[0_-8px_24px_rgba(30,41,59,0.04)]">
        {/* Compact Prompt or Reveal Feedback Strip */}
        <div className="w-full max-w-5xl mx-auto flex flex-wrap items-center justify-between gap-2">
          {activeQuestion && turnPhase === 'GUESSING' && (
            <div className="flex flex-wrap items-center gap-1.5 text-xs">
              <span className="text-[#1E293B]/60 font-medium">Measure:</span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#E0F0EE] border border-[#1E7F74]/30 text-[#1E293B] font-semibold">
                <span className="w-4 h-4 rounded-full bg-[#1E7F74] text-[#FFFFFF] text-[10px] font-bold flex items-center justify-center">
                  A
                </span>
                <span>{activeQuestion.cityA.name}</span>
                <span className="text-[#1E293B]/55 font-normal text-[11px]">
                  ({activeQuestion.cityA.state})
                </span>
              </span>
              <span className="text-[#1E7F74] font-bold px-0.5">↔</span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#FFFFFF] border border-[#1E293B]/25 text-[#1E293B] font-semibold">
                <span className="w-4 h-4 rounded-full bg-[#FFFFFF] border-[1.5px] border-[#1E293B] text-[#1E293B] text-[10px] font-bold flex items-center justify-center">
                  B
                </span>
                <span>{activeQuestion.cityB.name}</span>
                <span className="text-[#1E293B]/55 font-normal text-[11px]">
                  ({activeQuestion.cityB.state})
                </span>
              </span>
            </div>
          )}

          {latestResult && turnPhase === 'REVEALED' && (
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="px-2.5 py-1 rounded-lg bg-[#E0F0EE] border border-[#1E7F74]/35 text-[#1E7F74] font-bold tabular-nums">
                Actual: {latestResult.actualKm.toLocaleString()} km
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-[#FFFFFF] border border-[#1E293B]/[0.14] text-[#1E293B] font-semibold tabular-nums">
                Guess: {latestResult.guessKm.toLocaleString()} km
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-[#FFFFFF] border border-[#1E293B]/[0.14] text-[#1E293B] font-semibold tabular-nums">
                Accuracy: {latestResult.accuracy.toFixed(1)}%
              </span>
              {latestResult.isPerfectBand ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#1E7F74] text-[#FFFFFF] font-bold tabular-nums shadow-[0_4px_12px_rgba(30,127,116,0.2)]">
                  <Sparkles className="w-3.5 h-3.5" />
                  1000 / 1000 Precision!
                </span>
              ) : (
                <span className="px-2.5 py-1 rounded-lg bg-[#EAE6DC] border border-[#1E293B]/[0.14] text-[#1E293B] font-bold tabular-nums">
                  +{latestResult.rating} pts
                </span>
              )}
            </div>
          )}

          {!isMobile && (
            <div className="hidden lg:block text-[11px] text-[#1E293B]/55">
              Drag arrow or type 0–{maxDistanceKm} km · ←/→ (±{keyboardStepKm}
              km, Shift ±{keyboardShiftStepKm}km) · Enter to confirm
            </div>
          )}
        </div>

        {/* 0–6000 km Sliding Arrow Bar + Synchronized Numeric KM Box + Action Button */}
        <div className="w-full max-w-5xl mx-auto flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* Custom Tactile 0–6000 km Slidebar */}
          <div className="flex-1 flex flex-col justify-center min-w-0">
            <div
              ref={sliderTrackRef}
              onPointerDown={handleSliderPointerDown}
              onPointerMove={handleSliderPointerMove}
              onPointerUp={handleSliderPointerUp}
              onPointerCancel={handleSliderPointerUp}
              role="slider"
              aria-label="Estimated Distance in Kilometers"
              aria-valuemin={0}
              aria-valuemax={maxDistanceKm}
              aria-valuenow={guessKm}
              className={`relative w-full h-12 flex items-center touch-none select-none ${
                turnPhase === 'GUESSING'
                  ? 'cursor-ew-resize'
                  : 'cursor-default opacity-90'
              }`}>
              {/* Track Rail */}
              <div className="w-full h-2.5 bg-[#EAE6DC] rounded-full border border-[#1E293B]/[0.14] overflow-hidden relative">
                <div
                  className="h-full bg-[#1E7F74] rounded-full"
                  style={{width: `${sliderPercent}%`}}
                />
              </div>

              {/* Scale Ticks */}
              <div className="absolute inset-x-0 bottom-0 flex justify-between pointer-events-none px-0.5">
                {[0, 1000, 2000, 3000, 4000, 5000, 6000].map((tick) => (
                  <div key={tick} className="flex flex-col items-center">
                    <div className="w-px h-1.5 bg-[#1E293B]/35" />
                    <span className="text-[10px] text-[#1E293B]/55 leading-none tabular-nums font-medium">
                      {tick === 0 ? '0' : `${tick / 1000}k`}
                    </span>
                  </div>
                ))}
              </div>

              {/* Actual Distance Comparison Pin (only when revealed) */}
              {actualPercent !== null && (
                <div
                  className="absolute top-1 -translate-x-1/2 pointer-events-none flex flex-col items-center z-10"
                  style={{left: `${actualPercent}%`}}>
                  <div className="w-0.5 h-6 bg-[#1E293B]" />
                  <div className="w-2.5 h-2.5 rounded-full bg-[#FFFFFF] border-2 border-[#1E293B] -mt-1" />
                </div>
              )}

              {/* Sliding Arrow Indicator Thumb */}
              <div
                className="absolute top-0.5 -translate-x-1/2 pointer-events-none flex flex-col items-center z-20"
                style={{left: `${sliderPercent}%`}}>
                <div className="w-7 h-7 rounded-full bg-[#1E7F74] border-2 border-[#FFFFFF] shadow-[0_4px_12px_rgba(30,41,59,0.2)] flex items-center justify-center">
                  <svg
                    viewBox="0 0 16 16"
                    className="w-3.5 h-3.5 text-[#FFFFFF] fill-current">
                    <path d="M8 2 L13 11 L8 8.5 L3 11 Z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Synchronized KM Box & Submit / Next Button */}
          <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0">
            <label className="flex items-center bg-[#FFFFFF] border border-[#1E293B]/[0.18] focus-within:border-[#1E7F74] focus-within:ring-2 focus-within:ring-[#1E7F74]/15 rounded-xl px-3 min-h-[48px] transition-all shadow-[0_2px_8px_rgba(30,41,59,0.03)]">
              <input
                type="text"
                inputMode="numeric"
                aria-label="Distance in kilometers"
                value={kmInputText}
                disabled={turnPhase !== 'GUESSING'}
                onChange={handleKmInputChange}
                onBlur={handleKmInputBlur}
                className="w-20 bg-transparent text-right text-sm font-bold text-[#1E293B] tabular-nums focus:outline-none disabled:opacity-75"
              />
              <span className="ml-1.5 text-xs font-semibold text-[#1E293B]/55">
                km
              </span>
            </label>

            {turnPhase === 'GUESSING' ? (
              <button
                type="button"
                onClick={handleSubmitEstimate}
                className="min-w-[48px] min-h-[48px] px-5 rounded-xl bg-[#1E7F74] hover:bg-[#17665D] active:scale-[0.98] text-[#FFFFFF] font-bold text-xs tracking-wide uppercase flex items-center justify-center gap-1.5 shadow-[0_6px_16px_rgba(30,127,116,0.2)] transition-all cursor-pointer">
                <Send className="w-4 h-4" />
                <span>Lock In</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleNextQuestion}
                className="min-w-[48px] min-h-[48px] px-5 rounded-xl bg-[#1E7F74] hover:bg-[#17665D] active:scale-[0.98] text-[#FFFFFF] font-bold text-xs tracking-wide uppercase flex items-center justify-center gap-1.5 shadow-[0_6px_16px_rgba(30,127,116,0.2)] transition-all cursor-pointer">
                <Sparkles className="w-4 h-4" />
                <span>
                  {currentQIdx >= questions.length - 1
                    ? 'Summary'
                    : 'Next Pair'}
                </span>
              </button>
            )}
          </div>
        </div>

        {/* MOBILE ONLY VIRTUAL STEP BUTTONS (via useIsMobile()) */}
        {isMobile && turnPhase === 'GUESSING' && (
          <div className="w-full max-w-5xl mx-auto flex items-center justify-center gap-2 pointer-events-none pt-0.5">
            {[-100, -10, 10, 100].map((step) => (
              <button
                key={step}
                type="button"
                onPointerDown={(e) => {
                  e.preventDefault();
                  startStepAdjust(step);
                }}
                onPointerUp={clearStepRepeat}
                onPointerLeave={clearStepRepeat}
                onPointerCancel={clearStepRepeat}
                className="w-16 h-12 min-w-[48px] min-h-[48px] touch-none pointer-events-auto rounded-xl bg-[#FFFFFF] hover:bg-[#E0F0EE] active:bg-[#1E7F74] active:text-[#FFFFFF] border border-[#1E293B]/[0.16] text-[#1E293B] text-xs font-bold tabular-nums flex items-center justify-center shadow-[0_2px_6px_rgba(30,41,59,0.04)] transition-colors">
                {step > 0 ? `+${step}` : step}
              </button>
            ))}
          </div>
        )}
      </footer>

      {/* START OVERLAY */}
      {gameState.status === 'START' && !autoStartPending && assetsReady && (
        <MenuOverlay tone="neutral" zIndex={40}>
          <div className="w-full max-w-md bg-[#FFFFFF] border border-[#1E293B]/[0.14] rounded-2xl p-6 md:p-8 shadow-[0_8px_24px_rgba(30,41,59,0.06)] flex flex-col items-center text-center">
            <div className="flex items-center justify-center gap-4 px-5 py-3 mb-5 rounded-2xl bg-[#FAF9F6] border border-[#1E293B]/[0.1]">
              <img
                src="assets/images/compass_rose_icon.png"
                alt="Compass Rose"
                className="w-12 h-12 object-contain"
              />
              <div className="w-px h-8 bg-[#1E293B]/[0.12]" />
              <img
                src="assets/images/city_pin_marker.png"
                alt="Target Pin"
                className="w-8 h-12 object-contain"
              />
            </div>

            <h1
              className="text-3xl md:text-4xl font-extrabold text-[#1E293B] tracking-tight mb-1.5"
              style={{fontFamily: THEME.fontDisplay}}>
              INDIA ATLAS
            </h1>
            <p className="text-[11px] uppercase tracking-[0.2em] text-[#1E7F74] font-bold mb-4">
              Minimalist Distance Cartography Quiz
            </p>
            <p className="text-sm text-[#1E293B]/75 leading-relaxed mb-6">
              Measure straight-line distances between random Indian cities on
              the 0–{maxDistanceKm.toLocaleString()} km sliding scale. Score
              90%+ accuracy on any pair for a perfect{' '}
              <span className="text-[#1E7F74] font-bold tabular-nums">
                {maxQuestionRating} / {maxQuestionRating}
              </span>{' '}
              precision rating.
            </p>

            <div className="w-full bg-[#FAF9F6] border border-[#1E293B]/[0.12] rounded-xl p-3.5 mb-6 text-left text-xs text-[#1E293B]/80 space-y-2">
              <div className="flex items-center gap-2.5">
                <MapPin className="w-4 h-4 text-[#1E7F74] shrink-0" />
                <span>5–10 random city pairs per expedition</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Compass className="w-4 h-4 text-[#1E293B] shrink-0" />
                <span>
                  {isMobile
                    ? 'Drag slider, tap step buttons, or type km'
                    : 'Drag arrow, type km, or use ←/→ & Enter'}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={initGame}
              autoFocus
              data-testid="start-button"
              className="w-full min-h-[48px] bg-[#1E7F74] hover:bg-[#17665D] active:scale-[0.98] text-[#FFFFFF] px-6 py-3 rounded-full font-bold text-base tracking-wide transition-all flex items-center justify-center gap-2 shadow-[0_8px_20px_rgba(30,127,116,0.2)] cursor-pointer">
              <Play className="w-4 h-4 fill-current" />
              START QUIZ
            </button>

            <button
              type="button"
              onClick={() => {
                gameAudio.playCrispClick();
                setIsHowToPlayOpen(true);
              }}
              className="mt-3 w-full min-h-[48px] bg-[#FAF9F6] hover:bg-[#E0F0EE]/60 text-[#1E293B] px-5 py-2.5 rounded-full font-semibold text-sm border border-[#1E293B]/[0.14] flex items-center justify-center gap-2 transition-colors cursor-pointer">
              <HelpCircle className="w-4 h-4 text-[#1E7F74]" />
              HOW TO PLAY
            </button>
          </div>
        </MenuOverlay>
      )}

      {/* IN-GAME MENU OVERLAY (Always keeps primary gameState === 'PLAYING') */}
      {isGameMenuOpen && gameState.status === 'PLAYING' && (
        <MenuOverlay tone="neutral" zIndex={1000}>
          <div className="w-full max-w-md bg-[#FFFFFF] border border-[#1E293B]/[0.14] rounded-2xl p-6 m-4 shadow-[0_8px_24px_rgba(30,41,59,0.06)] flex flex-col items-center gap-3">
            <h2
              className="text-2xl font-bold text-[#1E293B] tracking-tight mb-1"
              style={{fontFamily: THEME.fontDisplay}}>
              Game Menu
            </h2>

            <button
              type="button"
              autoFocus
              onClick={() => {
                gameAudio.playCrispClick();
                setIsGameMenuOpen(false);
              }}
              className="w-full min-h-[48px] bg-[#1E7F74] hover:bg-[#17665D] active:scale-[0.98] text-[#FFFFFF] font-bold text-base rounded-xl px-4 py-3 flex items-center justify-center gap-2 shadow-[0_6px_16px_rgba(30,127,116,0.18)] transition-all cursor-pointer">
              <Play className="w-4 h-4 fill-current" />
              Resume
            </button>

            <div className="w-full grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  const nextMuted = !isMusicMuted;
                  setIsMusicMuted(nextMuted);
                  gameAudio.playCrispClick();
                }}
                className={`min-h-[48px] border font-semibold text-sm rounded-xl px-3 py-2 flex items-center justify-center gap-2 transition-colors cursor-pointer ${
                  isMusicMuted
                    ? 'bg-[#FAF9F6] border-[#1E293B]/[0.14] text-[#1E293B]/65 hover:bg-[#EAE6DC]/60'
                    : 'bg-[#E0F0EE]/75 border-[#1E7F74]/30 text-[#1E293B] hover:bg-[#E0F0EE]'
                }`}>
                {isMusicMuted ? (
                  <VolumeX className="w-4 h-4 text-[#1E293B]/55" />
                ) : (
                  <Volume2 className="w-4 h-4 text-[#1E7F74]" />
                )}
                Music: {isMusicMuted ? 'Off' : 'On'}
              </button>

              <button
                type="button"
                onClick={() => {
                  const muted = gameAudio.toggleMute();
                  setIsSfxMuted(muted);
                  if (!muted) gameAudio.playCrispClick();
                }}
                className={`min-h-[48px] border font-semibold text-sm rounded-xl px-3 py-2 flex items-center justify-center gap-2 transition-colors cursor-pointer ${
                  isSfxMuted
                    ? 'bg-[#FAF9F6] border-[#1E293B]/[0.14] text-[#1E293B]/65 hover:bg-[#EAE6DC]/60'
                    : 'bg-[#E0F0EE]/75 border-[#1E7F74]/30 text-[#1E293B] hover:bg-[#E0F0EE]'
                }`}>
                {isSfxMuted ? (
                  <VolumeX className="w-4 h-4 text-[#1E293B]/55" />
                ) : (
                  <Volume2 className="w-4 h-4 text-[#1E7F74]" />
                )}
                SFX: {isSfxMuted ? 'Off' : 'On'}
              </button>
            </div>

            <button
              type="button"
              onClick={() => {
                gameAudio.playConfirmSelect();
                setIsGameMenuOpen(false);
                startRun(
                  gameStateRef.current.level,
                  levelStartScoreRef.current,
                );
              }}
              className="w-full min-h-[48px] bg-[#FAF9F6] hover:bg-[#E0F0EE]/60 border border-[#1E293B]/[0.14] text-[#1E293B] font-semibold text-base rounded-xl px-4 py-3 flex items-center justify-center gap-2 transition-colors cursor-pointer">
              <RotateCw className="w-4 h-4 text-[#1E7F74]" />
              Try Level Again
            </button>

            <button
              type="button"
              onClick={() => {
                gameAudio.playCrispClick();
                setIsHowToPlayOpen(true);
              }}
              className="w-full min-h-[48px] bg-[#FAF9F6] hover:bg-[#E0F0EE]/60 border border-[#1E293B]/[0.14] text-[#1E293B] font-semibold text-base rounded-xl px-4 py-3 flex items-center justify-center gap-2 transition-colors cursor-pointer">
              <HelpCircle className="w-4 h-4 text-[#1E7F74]" />
              How to Play
            </button>

            <button
              type="button"
              onClick={() => {
                gameAudio.playCrispClick();
                setIsGameMenuOpen(false);
                setIsHowToPlayOpen(false);
                setGameState((prev) => ({...prev, status: 'START'}));
              }}
              className="w-full min-h-[48px] bg-[#EAE6DC]/75 hover:bg-[#EAE6DC] border border-[#1E293B]/[0.16] text-[#1E293B] font-semibold text-base rounded-xl px-4 py-3 flex items-center justify-center gap-2 transition-colors cursor-pointer">
              <X className="w-4 h-4 text-[#1E293B]/75" />
              Quit to Menu
            </button>
          </div>
        </MenuOverlay>
      )}

      {/* HOW TO PLAY OVERLAY (Stacks cleanly at zIndex 1001 above Game Menu or Start) */}
      {isHowToPlayOpen && (
        <MenuOverlay tone="neutral" zIndex={1001}>
          <div className="w-full max-w-md bg-[#FFFFFF] border border-[#1E293B]/[0.14] rounded-2xl p-6 m-4 shadow-[0_8px_24px_rgba(30,41,59,0.06)] flex flex-col gap-4">
            <h2
              className="text-2xl font-bold text-[#1E293B] text-center"
              style={{fontFamily: THEME.fontDisplay}}>
              How to Play
            </h2>
            <div className="bg-[#FAF9F6] border border-[#1E293B]/[0.12] rounded-xl p-4 text-sm text-[#1E293B]/80 space-y-3 leading-relaxed">
              <p>
                <strong className="text-[#1E7F74]">1. Inspect the Map:</strong>{' '}
                Two Indian cities (<strong>A</strong> &amp; <strong>B</strong>)
                are marked on the sovereign map of India. Use the 0–1000 km
                scale bar and state borders to judge the span.
              </p>
              <p>
                <strong className="text-[#1E7F74]">
                  2. Estimate Distance:
                </strong>{' '}
                Drag the arrow across the{' '}
                <strong className="tabular-nums">
                  0–{maxDistanceKm.toLocaleString()} km
                </strong>{' '}
                bar, type directly into the KM box, or use{' '}
                <strong>Left/Right Arrows</strong> (hold Shift for 100 km
                steps).
              </p>
              <p>
                <strong className="text-[#1E7F74]">
                  3. Precision Rating:
                </strong>{' '}
                Each pair is worth up to{' '}
                <strong className="tabular-nums">
                  {maxQuestionRating} points
                </strong>
                . Reaching{' '}
                <strong className="tabular-nums">
                  {perfectThreshold}%+ accuracy
                </strong>{' '}
                awards the full {maxQuestionRating}!
              </p>
            </div>

            <button
              type="button"
              autoFocus
              onClick={() => {
                gameAudio.playCrispClick();
                setIsHowToPlayOpen(false);
              }}
              className="w-full min-h-[48px] bg-[#1E7F74] hover:bg-[#17665D] text-[#FFFFFF] font-bold text-base rounded-xl px-4 py-3 flex items-center justify-center gap-2 transition-colors cursor-pointer">
              Back
            </button>
          </div>
        </MenuOverlay>
      )}

      {/* END-OF-QUIZ SUMMARY (VICTORY OVERLAY) */}
      {gameState.status === 'VICTORY' && (
        <Overlay
          title="EXPEDITION COMPLETE"
          description={`Total Rating: ${gameState.score.toLocaleString()} / ${maxRoundScore.toLocaleString()}`}
          actionLabel="PLAY AGAIN"
          onAction={resetGame}
          icon={<RotateCw size={20} />}
          tone="victory">
          <div className="w-full mt-5 bg-[#FAF9F6] border border-[#1E293B]/[0.14] rounded-2xl p-4 text-left">
            <div className="grid grid-cols-3 gap-2 text-center mb-3">
              <div className="bg-[#FFFFFF] border border-[#1E293B]/[0.12] rounded-xl p-2.5">
                <div className="text-[10px] uppercase tracking-wider text-[#1E293B]/55 font-bold">
                  Questions
                </div>
                <div className="text-base font-bold text-[#1E293B] tabular-nums">
                  {results.length}
                </div>
              </div>
              <div className="bg-[#FFFFFF] border border-[#1E293B]/[0.12] rounded-xl p-2.5">
                <div className="text-[10px] uppercase tracking-wider text-[#1E293B]/55 font-bold">
                  Avg Accuracy
                </div>
                <div className="text-base font-bold text-[#1E7F74] tabular-nums">
                  {averageAccuracy.toFixed(1)}%
                </div>
              </div>
              <div className="bg-[#FFFFFF] border border-[#1E293B]/[0.12] rounded-xl p-2.5">
                <div className="text-[10px] uppercase tracking-wider text-[#1E293B]/55 font-bold">
                  Avg Rating
                </div>
                <div className="text-base font-bold text-[#1E293B] tabular-nums">
                  {results.length > 0
                    ? Math.round(gameState.score / results.length)
                    : 0}
                </div>
              </div>
            </div>

            <div className="max-h-52 overflow-y-auto touch-auto space-y-1.5 pr-1">
              {results.map((r) => (
                <div
                  key={`${r.cityA.id}-${r.cityB.id}`}
                  className="flex items-center justify-between gap-2 bg-[#FFFFFF] border border-[#1E293B]/[0.1] rounded-lg px-3 py-2 text-xs">
                  <div className="min-w-0">
                    <div className="font-semibold text-[#1E293B] truncate">
                      {r.index}. {r.cityA.name} ↔ {r.cityB.name}
                    </div>
                    <div className="text-[11px] text-[#1E293B]/55 tabular-nums">
                      Guess {r.guessKm} km · Actual {r.actualKm} km (
                      {r.accuracy.toFixed(0)}%)
                    </div>
                  </div>
                  <div
                    className={`shrink-0 font-bold px-2.5 py-1 rounded-md text-xs tabular-nums ${
                      r.isPerfectBand
                        ? 'bg-[#1E7F74] text-[#FFFFFF]'
                        : 'bg-[#E0F0EE] text-[#1E7F74] border border-[#1E7F74]/25'
                    }`}>
                    {r.rating}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Overlay>
      )}
    </div>
  );
}
