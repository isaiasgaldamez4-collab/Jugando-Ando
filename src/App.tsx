import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  Gamepad2,
  Keyboard,
  Code2,
  Download,
  Copy,
  Check,
  Play,
  RotateCcw,
  Volume2,
  VolumeX,
  Sparkles,
  Zap,
  Shield,
  Trophy,
  Users,
  User,
  ShoppingBag,
  ListTodo,
  Flame,
  ArrowRight,
  Target,
  Coins,
  ChevronRight,
  Award,
  Pause,
  Maximize2,
  Minimize2,
  LogOut,
  Info,
  Layers,
  AlertTriangle,
  Radio,
  Clock,
  Compass,
  CheckCircle2,
  Skull
} from 'lucide-react';
import { JUEGO_PREMIUM_PY } from './pythonCode';
import { sound } from './soundEngine';

// =============================================================================
// INTERFACES Y MODELOS DE DATOS
// =============================================================================
interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  initialSize: number;
  lifetime: number;
  maxLifetime: number;
  drag: number;
}

interface Platform {
  baseX: number;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  accent: string;
  moving?: boolean;
  moveRange?: number;
  movePhase?: number;
  collapsible?: boolean;
  collapsed?: boolean;
  collapseTimer?: number;
  standingOn?: boolean;
}

interface Projectile {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  lifetime: number;
  color: string;
}

interface Drone {
  x: number;
  y: number;
  baseY: number;
  patrolLeft: number;
  patrolRight: number;
  speed: number;
  direction: number;
  alertMode: boolean;
  shootTimer: number;
  shootInterval: number;
  hoverPhase: number;
  dead: boolean;
}

interface LaserBarrier {
  x: number;
  yBottom: number;
  yTop: number;
  interval: number;
  timer: number;
  isActive: boolean;
}

interface EMPMineHazard {
  x: number;
  y: number;
  baseY: number;
  phase: number;
  triggered: boolean;
  detonateTimer: number;
  dead: boolean;
}

interface CoinItem {
  x: number;
  y: number;
  baseY: number;
  phase: number;
  collected: boolean;
}

interface CharacterDef {
  id: string;
  name: string;
  title: string;
  price: number;
  hp: number;
  speed: number;
  jumpPower: number;
  color: string;
  colorTail: string;
  badge: string;
  passiveName: string;
  passiveDesc: string;
}

interface WorldDef {
  id: number;
  name: string;
  subtitle: string;
  length: number;
  accentColor: string;
  bgDark: string;
  description: string;
  obstaclesList: string[];
}

interface MissionItem {
  id: string;
  title: string;
  target: number;
  current: number;
  reward: number;
  completed: boolean;
  description: string;
}

interface RankingRecord {
  id: string;
  name: string;
  score: number;
  worldName: string;
  mode: string;
  characterName: string;
  coins: number;
  date: string;
}

interface PlayerState {
  id: number;
  name: string;
  characterId: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  width: number;
  height: number;
  facing: number;
  isOnGround: boolean;
  jumpsLeft: number;
  isDashing: boolean;
  dashTimer: number;
  dashCooldown: number;
  isAttacking: boolean;
  attackTimer: number;
  maxHp: number;
  hp: number;
  displayHp: number;
  comboCount: number;
  comboTimer: number;
  score: number;
  coins: number;
  invulnerableTimer: number;
  dead: boolean;
  reachedGoal: boolean;
}

// =============================================================================
// CATÁLOGO DE PERSONAJES
// =============================================================================
const CHARACTERS: CharacterDef[] = [
  {
    id: 'kage',
    name: 'Kage',
    title: 'Ciber-Ninja Original',
    price: 0,
    hp: 100,
    speed: 7.5,
    jumpPower: 15.5,
    color: '#00f5d4',
    colorTail: '#00c4aa',
    badge: 'EQUILIBRADO',
    passiveName: 'Filo de Frecuencia',
    passiveDesc: 'Katana de plasma de respuesta ultra rápida y dash ágil.'
  },
  {
    id: 'valkyrie',
    name: 'Valkyrie',
    title: 'Ángel de Neón',
    price: 150,
    hp: 90,
    speed: 8.2,
    jumpPower: 17.5,
    color: '#ff0055',
    colorTail: '#ff3377',
    badge: 'SALTO ALTO',
    passiveName: 'Alas Gravitatorias',
    passiveDesc: 'Mayor impulso vertical y desaceleración suave en caída.'
  },
  {
    id: 'ronin',
    name: 'Ronin-X',
    title: 'Androide Pesado',
    price: 300,
    hp: 150,
    speed: 6.8,
    jumpPower: 14.5,
    color: '#ff9900',
    colorTail: '#cc7a00',
    badge: 'TANQUE 150 HP',
    passiveName: 'Blindaje Nano-Titán',
    passiveDesc: '+50% de resistencia vital y tajo sísmico con mayor radio.'
  },
  {
    id: 'ghost',
    name: 'Ghost',
    title: 'Hacker Fantasma',
    price: 500,
    hp: 85,
    speed: 8.8,
    jumpPower: 16.0,
    color: '#b0ff22',
    colorTail: '#88cc11',
    badge: 'DASH CUÁNTICO',
    passiveName: 'Fase Intangible',
    passiveDesc: 'Invulnerable a lásers y proyectiles mientras realiza el Dash.'
  },
  {
    id: 'nova',
    name: 'Nova',
    title: 'Velocista de Plasma',
    price: 750,
    hp: 95,
    speed: 9.4,
    jumpPower: 16.2,
    color: '#ffe600',
    colorTail: '#cca300',
    badge: 'SÚPER VELOCIDAD',
    passiveName: 'Sobrecarga de Iones',
    passiveDesc: 'Velocidad punta récord de 9.4 px/frame y enfriamiento de dash ultra rápido.'
  },
  {
    id: 'cypher',
    name: 'Cypher',
    title: 'Mercenario Neón',
    price: 1000,
    hp: 110,
    speed: 8.0,
    jumpPower: 15.8,
    color: '#38bdf8',
    colorTail: '#0284c7',
    badge: 'IMÁN DE MONEDAS',
    passiveName: 'Radar Criptográfico',
    passiveDesc: 'Atrae monedas de neón a 90 px de distancia y +50% recompensa final.'
  }
];

// =============================================================================
// CATÁLOGO DE MUNDOS Y MAPAS
// =============================================================================
const WORLDS: WorldDef[] = [
  {
    id: 1,
    name: 'Azoteas de Neo-Kyoto',
    subtitle: 'Nivel 1 • 4,800m • Atmósfera Azul Eléctrico',
    length: 4800,
    accentColor: '#00f5d4',
    bgDark: '#0a0a16',
    description: 'Rascacielos elevados bajo lluvia digital de neón. El punto de infiltración principal.',
    obstaclesList: ['Drones patrulla de escaneo', 'Abismos entre azoteas', 'Cripto-monedas en techos']
  },
  {
    id: 2,
    name: 'Reactor Subterráneo Plasma',
    subtitle: 'Nivel 2 • 6,800m • Núcleo Térmico Magenta',
    length: 6800,
    accentColor: '#ff0055',
    bgDark: '#160a14',
    description: 'Túneles energizados donde la radiación genera calor crítico y barreras defensivas activas.',
    obstaclesList: ['Rayos láser intermitentes', 'Plataformas flotantes móviles', 'Drones con ráfagas veloces']
  },
  {
    id: 3,
    name: 'Bastión Megacorporativo',
    subtitle: 'Nivel 3 • 8,800m • Fortaleza Blindada Ámbar',
    length: 8800,
    accentColor: '#ffb703',
    bgDark: '#12121e',
    description: 'La sede del conglomerado tecno-militar defendida con contramedidas automatizadas.',
    obstaclesList: ['Plataformas colapsables que se rompen al pisar', 'Drones tácticos dobles', 'Lásers de alta frecuencia']
  },
  {
    id: 4,
    name: 'Autopista Orbital Neón',
    subtitle: 'Nivel 4 • 10,500m • Vacío Espacial & Hipersonido',
    length: 10500,
    accentColor: '#c084fc',
    bgDark: '#080614',
    description: 'Vía de aceleración suspendida sobre la estratósfera. Velocidad terminal y peligro máximo.',
    obstaclesList: ['Minas de proximidad EMP detonantes', 'Saltos de baja gravedad', 'Plataformas móviles en abismos']
  }
];

// Récords iniciales predeterminados (NUNCA se pierden)
const DEFAULT_RANKINGS: RankingRecord[] = [
  {
    id: 'rank-1',
    name: 'NeoKage_Zero',
    score: 18450,
    worldName: 'Autopista Orbital',
    mode: '1P Solo',
    characterName: 'Ghost',
    coins: 72,
    date: '2026-09-27'
  },
  {
    id: 'rank-2',
    name: 'DuoCyber (Alex & Max)',
    score: 15200,
    worldName: 'Bastión Megacorp',
    mode: '2P Amigos',
    characterName: 'Kage & Ronin-X',
    coins: 64,
    date: '2026-09-26'
  },
  {
    id: 'rank-3',
    name: 'Valkyrie_Queen',
    score: 12900,
    worldName: 'Reactor Plasma',
    mode: '1P Solo',
    characterName: 'Valkyrie',
    coins: 50,
    date: '2026-09-25'
  },
  {
    id: 'rank-4',
    name: 'Nova_Runner',
    score: 10600,
    worldName: 'Azoteas Neo-Kyoto',
    mode: '1P Solo',
    characterName: 'Nova',
    coins: 38,
    date: '2026-09-24'
  },
  {
    id: 'rank-5',
    name: 'CyberRonin99',
    score: 8750,
    worldName: 'Azoteas Neo-Kyoto',
    mode: '1P Solo',
    characterName: 'Ronin-X',
    coins: 29,
    date: '2026-09-23'
  }
];

export default function App() {
  // ===========================================================================
  // ESTADOS PRINCIPALES DE NAVEGACIÓN Y CONFIGURACIÓN
  // ===========================================================================
  const [currentScreen, setCurrentScreen] = useState<'main' | 'game'>('main');
  const [activeTab, setActiveTab] = useState<'lobby' | 'tutorial' | 'shop' | 'ranking' | 'code'>('lobby');
  const [gameState, setGameState] = useState<'playing' | 'paused' | 'countdown' | 'round_over' | 'victory'>('playing');
  const [gameMode, setGameMode] = useState<'1P' | '2P'>('1P');
  const [selectedWorldIdx, setSelectedWorldIdx] = useState<number>(0);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [countdownNum, setCountdownNum] = useState<number>(3);

  // Nombres de personajes editables
  const [p1Name, setP1Name] = useState<string>('Ciber-Kage');
  const [p2Name, setP2Name] = useState<string>('Neon-Fox');

  // Selección de personajes
  const [p1CharId, setP1CharId] = useState<string>('kage');
  const [p2CharId, setP2CharId] = useState<string>('valkyrie');

  // Monedas y personajes comprados (Guardado en localStorage)
  const [walletCoins, setWalletCoins] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('CYBERPUNK_COINS');
      return saved ? parseInt(saved, 10) : 350;
    } catch {
      return 350;
    }
  });

  const [unlockedCharIds, setUnlockedCharIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('CYBERPUNK_UNLOCKED_CHARS');
      return saved ? JSON.parse(saved) : ['kage'];
    } catch {
      return ['kage'];
    }
  });

  // Tablón de Ranking persistente (NUNCA SE BORRA)
  const [rankingList, setRankingList] = useState<RankingRecord[]>(() => {
    try {
      const saved = localStorage.getItem('CYBERPUNK_RANKING_DATA');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // fallback
    }
    return DEFAULT_RANKINGS;
  });

  // Guardar monedas y compras en localStorage
  useEffect(() => {
    try {
      localStorage.setItem('CYBERPUNK_COINS', walletCoins.toString());
      localStorage.setItem('CYBERPUNK_UNLOCKED_CHARS', JSON.stringify(unlockedCharIds));
    } catch (e) {
      console.warn('Storage sync error', e);
    }
  }, [walletCoins, unlockedCharIds]);

  // Guardar ranking en localStorage de forma permanente
  useEffect(() => {
    try {
      localStorage.setItem('CYBERPUNK_RANKING_DATA', JSON.stringify(rankingList));
    } catch (e) {
      console.warn('Ranking save error', e);
    }
  }, [rankingList]);

  // Misiones activas del nivel
  const [missions, setMissions] = useState<MissionItem[]>([
    { id: 'm1', title: 'Cripto-Recolector', target: 8, current: 0, reward: 80, completed: false, description: 'Recolecta monedas de neón en la carrera.' },
    { id: 'm2', title: 'Cazador de Drones', target: 3, current: 0, reward: 120, completed: false, description: 'Destruye drones con ataque o embestida dash.' },
    { id: 'm3', title: 'Rango de Estilo S', target: 1, current: 0, reward: 150, completed: false, description: 'Alcanza un multiplicador de estilo S o superior.' }
  ]);

  // Información de fin de ronda
  const [endRoundInfo, setEndRoundInfo] = useState<{
    winner: 'P1' | 'P2' | 'BOTH' | 'NONE';
    headline: string;
    subline: string;
    p1Score: number;
    p2Score: number;
    coinsEarned: number;
  }>({
    winner: 'NONE',
    headline: '',
    subline: '',
    p1Score: 0,
    p2Score: 0,
    coinsEarned: 0
  });

  // Audio mute
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [copiedCode, setCopiedCode] = useState<boolean>(false);
  const [gamepadsConnected, setGamepadsConnected] = useState<number>(0);

  // Referencias del Canvas de Juego
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const gameFrameRef = useRef<HTMLDivElement | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Teclas actualmente presionadas
  const keysDownRef = useRef<Set<string>>(new Set());

  // Instancias de Jugadores del motor
  const p1Ref = useRef<PlayerState | null>(null);
  const p2Ref = useRef<PlayerState | null>(null);

  // Entidades del mundo
  const platformsRef = useRef<Platform[]>([]);
  const lasersRef = useRef<LaserBarrier[]>([]);
  const minesRef = useRef<EMPMineHazard[]>([]);
  const coinsRef = useRef<CoinItem[]>([]);
  const dronesRef = useRef<Drone[]>([]);
  const projectilesRef = useRef<Projectile[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const cameraRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const goalXRef = useRef<number>(4800);

  const gameStateRef = useRef(gameState);
  gameStateRef.current = gameState;

  // ===========================================================================
  // SISTEMA DE EMISIÓN DE PARTÍCULAS
  // ===========================================================================
  const emitSparks = useCallback((x: number, y: number, count: number, color: string) => {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2.0 + Math.random() * 6.0;
      particlesRef.current.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color,
        size: 2.5 + Math.random() * 3.5,
        initialSize: 2.5 + Math.random() * 3.5,
        lifetime: 0.2 + Math.random() * 0.35,
        maxLifetime: 0.4,
        drag: 0.92
      });
    }
  }, []);

  const emitExplosion = useCallback((x: number, y: number, color: string) => {
    sound.playExplosion();
    for (let i = 0; i < 35; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 3.0 + Math.random() * 8.5;
      particlesRef.current.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color,
        size: 3.5 + Math.random() * 4.5,
        initialSize: 3.5 + Math.random() * 4.5,
        lifetime: 0.3 + Math.random() * 0.45,
        maxLifetime: 0.5,
        drag: 0.9
      });
    }
  }, []);

  // ===========================================================================
  // INICIALIZADOR DE NIVELES Y MUNDOS
  // ===========================================================================
  const initLevel = useCallback((worldIndex: number) => {
    const world = WORLDS[worldIndex];
    goalXRef.current = world.length;

    const p1Char = CHARACTERS.find(c => c.id === p1CharId) || CHARACTERS[0];
    const p2Char = CHARACTERS.find(c => c.id === p2CharId) || CHARACTERS[1];

    p1Ref.current = {
      id: 1,
      name: p1Name.trim() || 'Ciber-Kage',
      characterId: p1Char.id,
      x: 200,
      y: 254,
      vx: 0,
      vy: 0,
      width: 28,
      height: 46,
      facing: 1,
      isOnGround: true,
      jumpsLeft: 2,
      isDashing: false,
      dashTimer: 0,
      dashCooldown: 0,
      isAttacking: false,
      attackTimer: 0,
      maxHp: p1Char.hp,
      hp: p1Char.hp,
      displayHp: p1Char.hp,
      comboCount: 0,
      comboTimer: 0,
      score: 0,
      coins: 0,
      invulnerableTimer: 0,
      dead: false,
      reachedGoal: false
    };

    if (gameMode === '2P') {
      p2Ref.current = {
        id: 2,
        name: p2Name.trim() || 'Neon-Fox',
        characterId: p2Char.id,
        x: 130,
        y: 254,
        vx: 0,
        vy: 0,
        width: 28,
        height: 46,
        facing: 1,
        isOnGround: true,
        jumpsLeft: 2,
        isDashing: false,
        dashTimer: 0,
        dashCooldown: 0,
        isAttacking: false,
        attackTimer: 0,
        maxHp: p2Char.hp,
        hp: p2Char.hp,
        displayHp: p2Char.hp,
        comboCount: 0,
        comboTimer: 0,
        score: 0,
        coins: 0,
        invulnerableTimer: 0,
        dead: false,
        reachedGoal: false
      };
    } else {
      p2Ref.current = null;
    }

    platformsRef.current = [];
    lasersRef.current = [];
    minesRef.current = [];
    coinsRef.current = [];
    dronesRef.current = [];
    projectilesRef.current = [];
    particlesRef.current = [];
    cameraRef.current = {
      x: 200 - (canvasRef.current?.width || 1280) * 0.38,
      y: (canvasRef.current?.height || 720) * 0.5 - 254
    };

    // Plataforma de inicio grande
    platformsRef.current.push({
      baseX: 200,
      x: 200,
      y: 200,
      width: 480,
      height: 60,
      color: '#0f1121',
      accent: world.accentColor
    });

    let curX = 560;
    while (curX < world.length - 300) {
      const w = 220 + Math.random() * 240;
      const h = 42 + Math.random() * 16;
      const y = 180 + Math.random() * 260;
      const isMoving = world.id >= 2 && Math.random() < 0.35;
      const isCollapsible = world.id >= 3 && Math.random() < 0.3;

      const plat: Platform = {
        baseX: curX,
        x: curX,
        y,
        width: w,
        height: h,
        color: '#0f1121',
        accent: world.accentColor,
        moving: isMoving,
        moveRange: 130,
        movePhase: Math.random() * Math.PI * 2,
        collapsible: isCollapsible,
        collapsed: false,
        collapseTimer: 0,
        standingOn: false
      };
      platformsRef.current.push(plat);

      for (let cx = plat.x - w / 2 + 40; cx < plat.x + w / 2 - 30; cx += 70) {
        if (Math.random() < 0.75) {
          coinsRef.current.push({
            x: cx,
            y: y + h / 2 + 25,
            baseY: y + h / 2 + 25,
            phase: Math.random() * Math.PI * 2,
            collected: false
          });
        }
      }

      if (Math.random() < 0.45) {
        dronesRef.current.push({
          x: curX,
          y: y + 90,
          baseY: y + 90,
          patrolLeft: curX - 120,
          patrolRight: curX + 120,
          speed: 2.2 + Math.random() * 1.2,
          direction: Math.random() > 0.5 ? 1 : -1,
          alertMode: false,
          shootTimer: 0,
          shootInterval: 1.4,
          hoverPhase: Math.random() * Math.PI * 2,
          dead: false
        });
      }

      if (world.id >= 2 && Math.random() < 0.32) {
        lasersRef.current.push({
          x: curX + w / 2 + 65,
          yBottom: y - 50,
          yTop: y + 160,
          interval: 2.0,
          timer: Math.random() * 2.0,
          isActive: true
        });
      }

      if (world.id >= 3 && Math.random() < 0.38) {
        minesRef.current.push({
          x: curX + (Math.random() * 80 - 40),
          y: y + 75,
          baseY: y + 75,
          phase: Math.random() * Math.PI * 2,
          triggered: false,
          detonateTimer: 0,
          dead: false
        });
      }

      curX += w + 120 + Math.random() * 140;
    }

    // Plataforma Final de Meta
    platformsRef.current.push({
      baseX: world.length,
      x: world.length,
      y: 220,
      width: 480,
      height: 70,
      color: '#0f1121',
      accent: '#00f5d4'
    });

    setMissions([
      { id: 'm1', title: 'Cripto-Recolector', target: 10, current: 0, reward: 80, completed: false, description: 'Recolecta 10 monedas de neón en la carrera.' },
      { id: 'm2', title: 'Cazador de Drones', target: 3, current: 0, reward: 120, completed: false, description: 'Destruye 3 drones con tu katana o dash.' },
      { id: 'm3', title: 'Rango de Estilo S', target: 1, current: 0, reward: 150, completed: false, description: 'Alcanza un multiplicador de estilo S o superior.' }
    ]);
  }, [p1Name, p2Name, p1CharId, p2CharId, gameMode]);

  // Cargar nivel inicial automáticamente al montar
  useEffect(() => {
    initLevel(selectedWorldIdx);
  }, [initLevel, selectedWorldIdx]);

  // ===========================================================================
  // BOTÓN DE PLAY / JUGAR (AGRANDADO AUTOMÁTICO DE PANTALLA)
  // ===========================================================================
  const handleStartPlay = () => {
    sound.playGameStart();
    initLevel(selectedWorldIdx);

    // Agrandar la pantalla automáticamente del juego
    setCurrentScreen('game');
    setIsFullscreen(true);

    // Cuenta regresiva rápida
    setCountdownNum(3);
    setGameState('countdown');
    sound.playCountdown(false);

    let count = 3;
    const interval = setInterval(() => {
      count -= 1;
      if (count > 0) {
        setCountdownNum(count);
        sound.playCountdown(false);
      } else if (count === 0) {
        setCountdownNum(0);
        sound.playCountdown(true);
      } else {
        clearInterval(interval);
        setGameState('playing');
      }
    }, 700);
  };

  // Salir de la pantalla del juego y volver a la parte principal (pantalla normal)
  const handleExitToMain = () => {
    sound.playPause();
    setCurrentScreen('main');
    setIsFullscreen(false);
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }
  };

  // Alternar pausa
  const togglePause = useCallback(() => {
    if (gameStateRef.current === 'playing') {
      sound.playPause();
      setGameState('paused');
    } else if (gameStateRef.current === 'paused') {
      sound.playResume();
      setGameState('playing');
    }
  }, []);

  const handleRestartLevel = () => {
    sound.playGameStart();
    initLevel(selectedWorldIdx);
    setGameState('playing');
  };

  const handleResetNames = () => {
    sound.playAttack();
    setP1Name('');
    setP2Name('');
  };

  const handleBuyCharacter = (char: CharacterDef) => {
    if (unlockedCharIds.includes(char.id)) return;
    if (walletCoins >= char.price) {
      setWalletCoins(prev => prev - char.price);
      setUnlockedCharIds(prev => [...prev, char.id]);
      sound.playBuySuccess();
    } else {
      sound.playPlayerHit();
    }
  };

  // Acciones universales (teclado, gamepad y botones táctiles en pantalla)
  const actionJump = useCallback((playerId: 1 | 2) => {
    const runner = playerId === 1 ? p1Ref.current : p2Ref.current;
    if (!runner || runner.dead) return;
    const char = CHARACTERS.find(c => c.id === runner.characterId) || CHARACTERS[0];
    if (runner.jumpsLeft > 0 && !runner.isDashing) {
      runner.vy = char.jumpPower;
      runner.jumpsLeft -= 1;
      runner.isOnGround = false;
      sound.playJump();
      emitSparks(runner.x, runner.y - runner.height / 2, 8, '#ffe600');
    }
  }, [emitSparks]);

  const actionDash = useCallback((playerId: 1 | 2) => {
    const runner = playerId === 1 ? p1Ref.current : p2Ref.current;
    if (!runner || runner.dead) return;
    const char = CHARACTERS.find(c => c.id === runner.characterId) || CHARACTERS[0];
    if (runner.dashCooldown <= 0 && !runner.isDashing) {
      runner.isDashing = true;
      runner.dashTimer = 0.22;
      runner.dashCooldown = char.id === 'nova' ? 0.45 : 0.70;
      runner.vy = 0;
      runner.vx = runner.facing * 22;
      sound.playDash();
      emitSparks(runner.x, runner.y, 16, char.color);
    }
  }, [emitSparks]);

  const actionAttack = useCallback((playerId: 1 | 2) => {
    const runner = playerId === 1 ? p1Ref.current : p2Ref.current;
    if (!runner || runner.dead) return;
    const char = CHARACTERS.find(c => c.id === runner.characterId) || CHARACTERS[0];
    if (!runner.isAttacking) {
      runner.isAttacking = true;
      runner.attackTimer = 0.18;
      sound.playAttack();
      emitSparks(runner.x + runner.facing * 24, runner.y, 8, char.color);
    }
  }, [emitSparks]);

  const pressKey = useCallback((code: string) => {
    keysDownRef.current.add(code);
  }, []);

  const releaseKey = useCallback((code: string) => {
    keysDownRef.current.delete(code);
  }, []);

  // ===========================================================================
  // DETECCIÓN DE ENTRADA (TECLADO Y MANDOS)
  // ===========================================================================
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignorar si el usuario está escribiendo su nombre en los inputs
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) {
        return;
      }

      keysDownRef.current.add(e.code);

      // Tecla de pausa rápida (P o Escape)
      if (e.code === 'KeyP' || e.code === 'Escape') {
        if (gameStateRef.current === 'playing' || gameStateRef.current === 'paused') {
          e.preventDefault();
          togglePause();
          return;
        }
      }

      if (gameStateRef.current !== 'playing') return;

      // Jugador 1
      if (e.code === 'KeyW' || e.code === 'Space') {
        actionJump(1);
      }
      if (e.code === 'KeyQ' || e.code === 'ShiftLeft') {
        actionDash(1);
      }
      if (e.code === 'KeyF' || e.code === 'KeyE') {
        actionAttack(1);
      }

      // Jugador 2
      if (gameMode === '2P') {
        if (e.code === 'ArrowUp') {
          e.preventDefault();
          actionJump(2);
        }
        if (e.code === 'ArrowDown' || e.code === 'ShiftRight' || e.code === 'KeyM') {
          e.preventDefault();
          actionDash(2);
        }
        if (e.code === 'Enter' || e.code === 'KeyL') {
          e.preventDefault();
          actionAttack(2);
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysDownRef.current.delete(e.code);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [actionAttack, actionDash, actionJump, gameMode, togglePause]);

  // Polling de Gamepads
  useEffect(() => {
    const checkGamepads = () => {
      if (typeof navigator !== 'undefined' && navigator.getGamepads) {
        const gps = navigator.getGamepads();
        let connectedCount = 0;
        for (let i = 0; i < gps.length; i++) {
          if (gps[i]) connectedCount++;
        }
        setGamepadsConnected(connectedCount);
      }
    };
    const gpInterval = setInterval(checkGamepads, 1000);
    return () => clearInterval(gpInterval);
  }, []);

  // ===========================================================================
  // BUCLE DE FÍSICA Y RENDERIZADO CANVAS A 60 FPS
  // ===========================================================================
  useEffect(() => {
    if (currentScreen !== 'game') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let lastTime = performance.now();

    const loop = (now: number) => {
      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;

      const targetW = canvas.parentElement?.clientWidth || 1280;
      const targetH = canvas.parentElement?.clientHeight || 620;
      if (canvas.width !== targetW || canvas.height !== targetH) {
        canvas.width = targetW;
        canvas.height = targetH;
      }

      if (gameStateRef.current === 'playing') {
        const p1 = p1Ref.current;
        const p2 = p2Ref.current;
        const keys = keysDownRef.current;

        let p1InputX = 0;
        if (keys.has('KeyA')) p1InputX -= 1;
        if (keys.has('KeyD')) p1InputX += 1;

        let p2InputX = 0;
        if (keys.has('ArrowLeft')) p2InputX -= 1;
        if (keys.has('ArrowRight')) p2InputX += 1;

        if (typeof navigator !== 'undefined' && navigator.getGamepads) {
          const gps = navigator.getGamepads();
          if (gps[0]) {
            const axisX = gps[0].axes[0];
            if (Math.abs(axisX) > 0.2) p1InputX = axisX;
            if (gps[0].buttons[0]?.pressed && p1 && p1.jumpsLeft > 0 && !p1.isDashing) {
              p1.vy = 15.5;
              p1.jumpsLeft = 0;
              p1.isOnGround = false;
            }
          }
          if (gps[1] && p2) {
            const axisX2 = gps[1].axes[0];
            if (Math.abs(axisX2) > 0.2) p2InputX = axisX2;
          }
        }

        if (p1 && !p1.dead) {
          const charP1 = CHARACTERS.find(c => c.id === p1.characterId) || CHARACTERS[0];
          if (!p1.isDashing) {
            if (Math.abs(p1InputX) > 0.05) {
              p1.vx = p1InputX * charP1.speed;
              p1.facing = p1InputX > 0 ? 1 : -1;
            } else {
              p1.vx *= 0.72;
            }
          }
        }

        if (p2 && !p2.dead && gameMode === '2P') {
          const charP2 = CHARACTERS.find(c => c.id === p2.characterId) || CHARACTERS[1];
          if (!p2.isDashing) {
            if (Math.abs(p2InputX) > 0.05) {
              p2.vx = p2InputX * charP2.speed;
              p2.facing = p2InputX > 0 ? 1 : -1;
            } else {
              p2.vx *= 0.72;
            }
          }
        }

        // Actualizar plataformas
        for (const pl of platformsRef.current) {
          if (pl.moving && pl.moveRange) {
            pl.movePhase = (pl.movePhase || 0) + dt * 1.8;
            pl.x = pl.baseX + Math.sin(pl.movePhase) * pl.moveRange;
          }
          if (pl.collapsible && pl.standingOn && !pl.collapsed) {
            pl.collapseTimer = (pl.collapseTimer || 0) + dt;
            if (pl.collapseTimer >= 0.8) {
              pl.collapsed = true;
              emitExplosion(pl.x, pl.y, '#ff0055');
            }
          }
          pl.standingOn = false;
        }

        // Actualizar Lásers
        for (const l of lasersRef.current) {
          l.timer += dt;
          if (l.timer >= l.interval) {
            l.timer = 0;
            l.isActive = !l.isActive;
          }
        }

        // Actualizar Minas EMP
        for (const m of minesRef.current) {
          if (!m.dead) {
            m.phase += dt * 3.5;
            m.y = m.baseY + Math.sin(m.phase) * 6;

            const checkRunnerNear = (runner: PlayerState) => {
              const d = Math.hypot(runner.x - m.x, runner.y - m.y);
              if (d < 65 && !m.triggered) {
                m.triggered = true;
              }
            };
            if (p1 && !p1.dead) checkRunnerNear(p1);
            if (p2 && !p2.dead) checkRunnerNear(p2);

            if (m.triggered) {
              m.detonateTimer += dt;
              if (m.detonateTimer >= 0.45) {
                m.dead = true;
                emitExplosion(m.x, m.y, '#ff0055');
                const damageIfNear = (runner: PlayerState) => {
                  if (Math.hypot(runner.x - m.x, runner.y - m.y) < 85 && runner.invulnerableTimer <= 0) {
                    runner.hp = Math.max(0, runner.hp - 35);
                    runner.invulnerableTimer = 1.0;
                    sound.playPlayerHit();
                    if (runner.hp <= 0) runner.dead = true;
                  }
                };
                if (p1 && !p1.dead) damageIfNear(p1);
                if (p2 && !p2.dead) damageIfNear(p2);
              }
            }
          }
        }

        // Actualizar Monedas
        for (const c of coinsRef.current) {
          c.phase += dt * 4;
          c.y = c.baseY + Math.sin(c.phase) * 5;

          const checkCoin = (runner: PlayerState) => {
            if (c.collected || runner.dead) return;
            const magnetRadius = runner.characterId === 'cypher' ? 90 : 32;
            const dist = Math.hypot(runner.x - c.x, runner.y - c.y);
            if (dist < magnetRadius) {
              c.collected = true;
              runner.coins += 1;
              runner.score += 100;
              setWalletCoins(prev => prev + 1);
              sound.playCoin();
              emitSparks(c.x, c.y, 8, '#ffe600');
              setMissions(prev => prev.map(m => m.id === 'm1' ? { ...m, current: Math.min(m.target, m.current + 1), completed: m.current + 1 >= m.target } : m));
            }
          };
          if (p1) checkCoin(p1);
          if (p2) checkCoin(p2);
        }

        // Actualizar Drones
        for (const drone of dronesRef.current) {
          if (drone.dead) continue;
          drone.hoverPhase += dt * 3;
          drone.y = drone.baseY + Math.sin(drone.hoverPhase) * 12;
          drone.x += drone.speed * drone.direction;
          if (drone.x <= drone.patrolLeft) {
            drone.x = drone.patrolLeft;
            drone.direction = 1;
          } else if (drone.x >= drone.patrolRight) {
            drone.x = drone.patrolRight;
            drone.direction = -1;
          }

          let targetRunner = p1 && !p1.dead ? p1 : null;
          if (p2 && !p2.dead) {
            if (!targetRunner || Math.hypot(p2.x - drone.x, p2.y - drone.y) < Math.hypot(targetRunner.x - drone.x, targetRunner.y - drone.y)) {
              targetRunner = p2;
            }
          }

          if (targetRunner) {
            const dist = Math.hypot(targetRunner.x - drone.x, targetRunner.y - drone.y);
            if (dist < 380) {
              drone.alertMode = true;
              drone.shootTimer += dt;
              if (drone.shootTimer >= drone.shootInterval) {
                drone.shootTimer = 0;
                const dx = targetRunner.x - drone.x;
                const dy = (targetRunner.y + 10) - drone.y;
                const len = Math.max(1, Math.hypot(dx, dy));
                projectilesRef.current.push({
                  x: drone.x,
                  y: drone.y - 4,
                  vx: (dx / len) * 7.5,
                  vy: (dy / len) * 7.5,
                  radius: 5,
                  lifetime: 4.0,
                  color: '#ff1744'
                });
                sound.playLaser();
              }
            } else {
              drone.alertMode = false;
            }
          }

          const checkAttackDrone = (runner: PlayerState) => {
            if (runner.dead) return;
            if (runner.isAttacking) {
              const dSlash = Math.hypot((runner.x + runner.facing * 24) - drone.x, runner.y - drone.y);
              if (dSlash < 42 && !drone.dead) {
                drone.dead = true;
                runner.score += 500;
                runner.comboCount += 3;
                emitExplosion(drone.x, drone.y, '#ffe600');
                setMissions(prev => prev.map(m => m.id === 'm2' ? { ...m, current: Math.min(m.target, m.current + 1), completed: m.current + 1 >= m.target } : m));
              }
            }
            if (runner.isDashing) {
              const dDash = Math.hypot(runner.x - drone.x, runner.y - drone.y);
              if (dDash < 36 && !drone.dead) {
                drone.dead = true;
                runner.score += 800;
                runner.comboCount += 5;
                emitExplosion(drone.x, drone.y, '#00f5d4');
                setMissions(prev => prev.map(m => m.id === 'm2' ? { ...m, current: Math.min(m.target, m.current + 1), completed: m.current + 1 >= m.target } : m));
              }
            }
          };
          if (p1) checkAttackDrone(p1);
          if (p2) checkAttackDrone(p2);
        }

        // Actualizar Proyectiles
        for (const b of projectilesRef.current) {
          b.x += b.vx;
          b.y += b.vy;
          b.lifetime -= dt;

          const checkHit = (runner: PlayerState) => {
            if (runner.dead || runner.invulnerableTimer > 0) return;
            if (runner.characterId === 'ghost' && runner.isDashing) return;

            if (Math.hypot(runner.x - b.x, runner.y - b.y) < 22) {
              b.lifetime = 0;
              runner.hp = Math.max(0, runner.hp - 18);
              runner.invulnerableTimer = 1.0;
              runner.comboCount = Math.max(0, runner.comboCount - 2);
              sound.playPlayerHit();
              emitSparks(runner.x, runner.y, 18, '#ff1744');
              if (runner.hp <= 0) runner.dead = true;
            }
          };
          if (p1) checkHit(p1);
          if (p2) checkHit(p2);
        }
        projectilesRef.current = projectilesRef.current.filter(b => b.lifetime > 0);

        // Física de corredores
        const updateRunnerPhysics = (runner: PlayerState) => {
          if (runner.dead) return;

          if (runner.invulnerableTimer > 0) runner.invulnerableTimer -= dt;
          if (runner.dashCooldown > 0) runner.dashCooldown -= dt;
          if (runner.attackTimer > 0) {
            runner.attackTimer -= dt;
            if (runner.attackTimer <= 0) runner.isAttacking = false;
          }

          if (runner.displayHp > runner.hp) {
            runner.displayHp -= (runner.displayHp - runner.hp) * 0.15;
          }

          if (runner.isDashing) {
            runner.dashTimer -= dt;
            runner.x += runner.vx;
            emitSparks(runner.x, runner.y, 2, runner.id === 1 ? '#00f5d4' : '#ff0055');
            if (runner.dashTimer <= 0) {
              runner.isDashing = false;
              runner.vx = runner.facing * 7.5;
            }
          } else {
            runner.vy -= 0.85;
            runner.x += runner.vx;
            runner.y += runner.vy;
          }

          runner.isOnGround = false;
          const rLeft = runner.x - runner.width / 2;
          const rRight = runner.x + runner.width / 2;
          const rBottom = runner.y - runner.height / 2;

          for (const pl of platformsRef.current) {
            if (pl.collapsed) continue;
            const pLeft = pl.x - pl.width / 2;
            const pRight = pl.x + pl.width / 2;
            const pTop = pl.y + pl.height / 2;

            if (rRight > pLeft && rLeft < pRight) {
              if (runner.vy <= 0 && rBottom <= pTop + 18 && rBottom >= pTop - Math.max(24, Math.abs(runner.vy) + 12)) {
                runner.y = pTop + runner.height / 2;
                runner.vy = 0;
                runner.isOnGround = true;
                runner.jumpsLeft = 2;
                pl.standingOn = true;
              }
            }
          }

          for (const l of lasersRef.current) {
            if (l.isActive && runner.invulnerableTimer <= 0) {
              if (runner.characterId === 'ghost' && runner.isDashing) continue;
              if (Math.abs(runner.x - l.x) < 14 && runner.y >= l.yBottom && runner.y <= l.yTop) {
                runner.hp = Math.max(0, runner.hp - 25);
                runner.invulnerableTimer = 1.0;
                sound.playPlayerHit();
                emitSparks(runner.x, runner.y, 22, '#ff1744');
                if (runner.hp <= 0) runner.dead = true;
              }
            }
          }

          if (runner.y < -350) {
            runner.hp = 0;
            runner.dead = true;
            sound.playGameOver();
          }

          if (runner.x >= goalXRef.current - 90) {
            runner.reachedGoal = true;
          }
        };

        if (p1) updateRunnerPhysics(p1);
        if (p2) updateRunnerPhysics(p2);

        // Reglas de victoria
        const world = WORLDS[selectedWorldIdx];
        if (gameMode === '2P' && p1 && p2) {
          if (p1.dead && !p2.dead) {
            sound.playLevelWin();
            setEndRoundInfo({
              winner: 'P2',
              headline: `¡${p2.name} HA GANADO LA RONDA!`,
              subline: `${p1.name} fue neutralizado. ${p2.name} se corona como vencedor.`,
              p1Score: p1.score,
              p2Score: p2.score + 2000,
              coinsEarned: p2.coins + 15
            });
            setWalletCoins(prev => prev + 15);
            setGameState('round_over');

            const newRecord: RankingRecord = {
              id: `rec-${Date.now()}`,
              name: p2.name,
              score: p2.score + 2000,
              worldName: world.name,
              mode: '2P Amigos',
              characterName: CHARACTERS.find(c => c.id === p2.characterId)?.name || 'Valkyrie',
              coins: p2.coins + 15,
              date: new Date().toISOString().split('T')[0]
            };
            setRankingList(prev => [newRecord, ...prev].sort((a, b) => b.score - a.score).slice(0, 50));
          } else if (p2.dead && !p1.dead) {
            sound.playLevelWin();
            setEndRoundInfo({
              winner: 'P1',
              headline: `¡${p1.name} HA GANADO LA RONDA!`,
              subline: `${p2.name} fue neutralizado. ${p1.name} se corona como vencedor.`,
              p1Score: p1.score + 2000,
              p2Score: p2.score,
              coinsEarned: p1.coins + 15
            });
            setWalletCoins(prev => prev + 15);
            setGameState('round_over');

            const newRecord: RankingRecord = {
              id: `rec-${Date.now()}`,
              name: p1.name,
              score: p1.score + 2000,
              worldName: world.name,
              mode: '2P Amigos',
              characterName: CHARACTERS.find(c => c.id === p1.characterId)?.name || 'Kage',
              coins: p1.coins + 15,
              date: new Date().toISOString().split('T')[0]
            };
            setRankingList(prev => [newRecord, ...prev].sort((a, b) => b.score - a.score).slice(0, 50));
          } else if (p1.dead && p2.dead) {
            sound.playGameOver();
            setEndRoundInfo({
              winner: 'NONE',
              headline: '¡AMBOS CORREDORES HAN CAÍDO!',
              subline: 'Ambos fueron neutralizados. ¡Pulsa reiniciar para la revancha!',
              p1Score: p1.score,
              p2Score: p2.score,
              coinsEarned: 0
            });
            setGameState('round_over');
          } else if (p1.reachedGoal && p2.reachedGoal) {
            sound.playLevelWin();
            setEndRoundInfo({
              winner: 'BOTH',
              headline: '¡MISIÓN CUMPLIDA EN EQUIPO!',
              subline: `¡${p1.name} y ${p2.name} cruzaron el portal juntos! Nivel superado.`,
              p1Score: p1.score + 1500,
              p2Score: p2.score + 1500,
              coinsEarned: p1.coins + p2.coins + 30
            });
            setWalletCoins(prev => prev + 30);
            setGameState('victory');

            const newRecord: RankingRecord = {
              id: `rec-${Date.now()}`,
              name: `${p1.name} & ${p2.name}`,
              score: p1.score + p2.score + 3000,
              worldName: world.name,
              mode: '2P Amigos',
              characterName: 'Dúo Cooperativo',
              coins: p1.coins + p2.coins + 30,
              date: new Date().toISOString().split('T')[0]
            };
            setRankingList(prev => [newRecord, ...prev].sort((a, b) => b.score - a.score).slice(0, 50));
          }
        } else if (p1) {
          if (p1.dead) {
            sound.playGameOver();
            setEndRoundInfo({
              winner: 'NONE',
              headline: 'SISTEMA CRÍTICO // INTENTO FALLIDO',
              subline: `${p1.name} no sobrevivió a los obstáculos de ${world.name}.`,
              p1Score: p1.score,
              p2Score: 0,
              coinsEarned: p1.coins
            });
            setGameState('round_over');
          } else if (p1.reachedGoal) {
            sound.playLevelWin();
            setEndRoundInfo({
              winner: 'P1',
              headline: `¡${p1.name} COMPLETÓ EL NIVEL CON ÉXITO!`,
              subline: `Has conquistado ${world.name}. ¡Siguiente nivel desbloqueado!`,
              p1Score: p1.score + 2500,
              p2Score: 0,
              coinsEarned: p1.coins + 25
            });
            setWalletCoins(prev => prev + 25);
            setGameState('victory');

            const newRecord: RankingRecord = {
              id: `rec-${Date.now()}`,
              name: p1.name,
              score: p1.score + 2500,
              worldName: world.name,
              mode: '1P Solo',
              characterName: CHARACTERS.find(c => c.id === p1.characterId)?.name || 'Kage',
              coins: p1.coins + 25,
              date: new Date().toISOString().split('T')[0]
            };
            setRankingList(prev => [newRecord, ...prev].sort((a, b) => b.score - a.score).slice(0, 50));
          }
        }

        // Partículas
        for (const pt of particlesRef.current) {
          pt.x += pt.vx;
          pt.y += pt.vy;
          pt.vx *= pt.drag;
          pt.vy *= pt.drag;
          pt.lifetime -= dt;
          pt.size = Math.max(0.5, pt.initialSize * (pt.lifetime / pt.maxLifetime));
        }
        particlesRef.current = particlesRef.current.filter(p => p.lifetime > 0);

        // Cámara Lerp (Centrado dinámico suave y reactivo que sube y baja con el salto)
        let targetX = 0;
        let targetY = 0;
        if (p1 && p2 && !p1.dead && !p2.dead && gameMode === '2P') {
          const midX = (p1.x + p2.x) / 2;
          const midY = (p1.y + p2.y) / 2;
          targetX = midX - canvas.width * 0.4;
          targetY = canvas.height * 0.5 - midY;
        } else if (p1 && !p1.dead) {
          targetX = p1.x - canvas.width * 0.38 + (p1.facing * 40);
          targetY = canvas.height * 0.5 - p1.y;
        } else if (p2 && !p2.dead) {
          targetX = p2.x - canvas.width * 0.38 + (p2.facing * 40);
          targetY = canvas.height * 0.5 - p2.y;
        }

        // Seguimiento fluido tanto horizontal como vertical para que la pantalla suba y baje con el personaje
        cameraRef.current.x += (targetX - cameraRef.current.x) * 0.12;
        cameraRef.current.y += (targetY - cameraRef.current.y) * 0.15;
      }

      // =======================================================================
      // DIBUJO EN CANVAS
      // =======================================================================
      const curWorld = WORLDS[selectedWorldIdx];
      ctx.fillStyle = curWorld.bgDark;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.save();
      ctx.translate(-cameraRef.current.x, canvas.height - cameraRef.current.y);
      ctx.scale(1, -1);

      // Cuadrícula de fondo
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
      ctx.lineWidth = 1;
      const startGridX = Math.floor((cameraRef.current.x - 200) / 120) * 120;
      for (let gx = startGridX; gx < startGridX + canvas.width + 400; gx += 120) {
        ctx.beginPath();
        ctx.moveTo(gx, -300);
        ctx.lineTo(gx, 1200);
        ctx.stroke();
      }

      // Plataformas
      for (const pl of platformsRef.current) {
        if (pl.collapsed) continue;
        ctx.fillStyle = pl.color;
        ctx.fillRect(pl.x - pl.width / 2, pl.y - pl.height / 2, pl.width, pl.height);

        const accentCol = pl.collapsible && pl.standingOn && Math.floor((pl.collapseTimer || 0) * 15) % 2 === 0
          ? '#ff0055'
          : pl.accent;

        ctx.strokeStyle = accentCol;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(pl.x - pl.width / 2, pl.y + pl.height / 2);
        ctx.lineTo(pl.x + pl.width / 2, pl.y + pl.height / 2);
        ctx.stroke();

        ctx.strokeStyle = `${accentCol}44`;
        ctx.lineWidth = 8;
        ctx.stroke();
      }

      // Lásers
      for (const l of lasersRef.current) {
        ctx.fillStyle = '#262c4c';
        ctx.fillRect(l.x - 8, l.yBottom - 6, 16, 12);
        ctx.fillRect(l.x - 8, l.yTop - 6, 16, 12);

        if (l.isActive) {
          ctx.strokeStyle = 'rgba(255, 23, 68, 0.25)';
          ctx.lineWidth = 10;
          ctx.beginPath();
          ctx.moveTo(l.x, l.yBottom);
          ctx.lineTo(l.x, l.yTop);
          ctx.stroke();

          ctx.strokeStyle = '#ff1744';
          ctx.lineWidth = 3;
          ctx.stroke();

          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 1;
          ctx.stroke();
        } else {
          if (Math.floor(l.timer * 8) % 2 === 0) {
            ctx.strokeStyle = 'rgba(255, 23, 68, 0.3)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(l.x, l.yBottom);
            ctx.lineTo(l.x, l.yTop);
            ctx.stroke();
          }
        }
      }

      // Minas EMP
      for (const m of minesRef.current) {
        if (m.dead) continue;
        const col = m.triggered ? '#ff0055' : '#ffb703';
        ctx.fillStyle = '#161a2e';
        ctx.beginPath();
        ctx.arc(m.x, m.y, 14, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = col;
        ctx.beginPath();
        ctx.arc(m.x, m.y, 7, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = `${col}88`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(m.x, m.y, 18, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Monedas
      for (const c of coinsRef.current) {
        if (c.collected) continue;
        ctx.fillStyle = '#ffe600';
        ctx.beginPath();
        ctx.arc(c.x, c.y, 8, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(c.x, c.y, 4, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = 'rgba(255, 230, 0, 0.4)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(c.x, c.y, 12, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Drones
      for (const d of dronesRef.current) {
        if (d.dead) continue;
        const eyeColor = d.alertMode ? '#ff1744' : '#00f5d4';

        if (d.alertMode && p1Ref.current) {
          ctx.strokeStyle = 'rgba(255, 23, 68, 0.35)';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(d.x, d.y);
          ctx.lineTo(p1Ref.current.x, p1Ref.current.y);
          ctx.stroke();
        }

        ctx.fillStyle = '#1a1f36';
        ctx.beginPath();
        ctx.ellipse(d.x, d.y, 18, 10, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#3b476e';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.fillStyle = eyeColor;
        ctx.beginPath();
        ctx.arc(d.x, d.y, 4.5, 0, Math.PI * 2);
        ctx.fill();
      }

      // Proyectiles
      for (const pr of projectilesRef.current) {
        ctx.fillStyle = pr.color;
        ctx.beginPath();
        ctx.arc(pr.x, pr.y, pr.radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(pr.x, pr.y, pr.radius * 0.4, 0, Math.PI * 2);
        ctx.fill();
      }

      // Portal Meta
      const gX = goalXRef.current;
      ctx.fillStyle = 'rgba(0, 245, 212, 0.2)';
      ctx.fillRect(gX - 16, 220, 32, 140);
      ctx.strokeStyle = '#00f5d4';
      ctx.lineWidth = 3;
      ctx.strokeRect(gX - 16, 220, 32, 140);

      // Partículas
      for (const pt of particlesRef.current) {
        ctx.fillStyle = pt.color;
        ctx.fillRect(pt.x - pt.size / 2, pt.y - pt.size / 2, pt.size, pt.size);
      }

      // Jugadores
      const drawPlayer = (runner: PlayerState) => {
        if (runner.dead) return;
        if (runner.invulnerableTimer > 0 && Math.floor(runner.invulnerableTimer * 15) % 2 === 0) return;

        const charData = CHARACTERS.find(c => c.id === runner.characterId) || CHARACTERS[0];
        const cx = runner.x;
        const cy = runner.y;
        const f = runner.facing;

        // Bufanda
        ctx.fillStyle = runner.id === 1 ? '#00f5d4' : '#ff0055';
        ctx.beginPath();
        ctx.moveTo(cx - f * 4, cy + 12);
        ctx.lineTo(cx - f * 4, cy + 4);
        ctx.lineTo(cx - f * (22 + Math.abs(runner.vx) * 1.5), cy + 8);
        ctx.closePath();
        ctx.fill();

        // Torso
        ctx.fillStyle = '#121626';
        ctx.fillRect(cx - 8, cy - 18, 16, 26);
        ctx.strokeStyle = '#2d3752';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(cx - 8, cy - 18, 16, 26);

        // Casco
        ctx.fillStyle = '#0a0d18';
        ctx.fillRect(cx + f * 1 - 7, cy + 8, 15, 14);

        // Visor
        ctx.strokeStyle = charData.color;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(cx + f * 1, cy + 15);
        ctx.lineTo(cx + f * 8, cy + 15);
        ctx.stroke();

        // Tajo Katana
        if (runner.isAttacking) {
          ctx.strokeStyle = charData.color;
          ctx.lineWidth = 4;
          ctx.beginPath();
          ctx.arc(cx + f * 24, cy, 26, f > 0 ? -Math.PI / 2 : Math.PI / 2, f > 0 ? Math.PI / 2 : 1.5 * Math.PI);
          ctx.stroke();
        }

        // Etiqueta de Nombre del Personaje (Acompaña siempre al jugador, sube y baja con el salto)
        ctx.save();
        ctx.translate(cx, cy + 34);
        ctx.scale(1, -1); // Voltear texto para lectura normal
        ctx.font = 'bold 11px system-ui, sans-serif';
        ctx.textAlign = 'center';
        const txtWidth = ctx.measureText(runner.name).width;
        ctx.fillStyle = 'rgba(10, 13, 24, 0.85)';
        ctx.fillRect(-txtWidth / 2 - 5, -12, txtWidth + 10, 15);
        ctx.strokeStyle = runner.id === 1 ? 'rgba(0, 245, 212, 0.6)' : 'rgba(255, 0, 85, 0.6)';
        ctx.lineWidth = 1;
        ctx.strokeRect(-txtWidth / 2 - 5, -12, txtWidth + 10, 15);
        ctx.fillStyle = runner.id === 1 ? '#00f5d4' : '#ff0055';
        ctx.fillText(runner.name, 0, 0);
        ctx.restore();
      };

      if (p1Ref.current) drawPlayer(p1Ref.current);
      if (p2Ref.current) drawPlayer(p2Ref.current);

      ctx.restore();

      animFrameRef.current = requestAnimationFrame(loop);
    };

    animFrameRef.current = requestAnimationFrame(loop);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [selectedWorldIdx, gameMode, emitExplosion, emitSparks, currentScreen]);

  const p1 = p1Ref.current;
  const p2 = p2Ref.current;
  const currentWorld = WORLDS[selectedWorldIdx];

  // ===========================================================================
  // PANTALLA AGRANDADA DEL JUEGO (SE AGRANDA AUTOMÁTICAMENTE AL PULSAR JUGAR)
  // ===========================================================================
  if (currentScreen === 'game') {
    return (
      <div className="fixed inset-0 z-50 w-screen h-screen overflow-hidden bg-[#0a0a16] flex flex-col font-sans select-none">
        {/* Canvas donde corre el motor del juego a 60 FPS */}
        <canvas
          ref={canvasRef}
          tabIndex={0}
          onClick={() => canvasRef.current?.focus()}
          className="w-full h-full flex-1 block cursor-crosshair focus:outline-none"
        />

        {/* HUD SUPERIOR IN-GAME */}
        <div className="absolute top-3 left-4 right-4 flex items-center justify-between pointer-events-none z-20 gap-3">
          {/* BOTÓN SALIR A LA PARTE PRINCIPAL */}
          <button
            onClick={handleExitToMain}
            className="px-3.5 py-2 rounded-xl bg-[#0d0f1fe6] backdrop-blur-md border border-rose-500/70 text-rose-300 hover:bg-rose-900/90 hover:text-white font-extrabold text-xs flex items-center gap-1.5 pointer-events-auto shadow-lg shadow-rose-950/50 transition cursor-pointer"
            title="Salir a la Parte Principal"
          >
            <LogOut className="w-3.5 h-3.5 rotate-180" />
            <span>SALIR AL MENÚ PRINCIPAL</span>
          </button>

          {/* BARRA DE LA CARRERA Y MINIMAPA EN TIEMPO REAL */}
          <div className="bg-[#0d0f1fe6] backdrop-blur-md border border-cyan-500/50 px-4 py-1.5 rounded-xl pointer-events-auto shadow-lg shadow-cyan-950/40 flex-1 max-w-lg hidden sm:block">
            <div className="flex items-center justify-between text-[11px] font-black text-cyan-300 mb-1">
              <span className="flex items-center gap-1.5">
                <Compass className="w-3.5 h-3.5 text-cyan-400" />
                {currentWorld.name}
              </span>
              <span className="text-yellow-300 flex items-center gap-1 font-bold">
                <Coins className="w-3.5 h-3.5 text-yellow-400" />
                {walletCoins} ◈
              </span>
            </div>
            {/* Pista de carrera visual con posición de los corredores */}
            <div className="w-full h-2.5 bg-slate-950 rounded-full border border-slate-700 relative overflow-visible">
              <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 text-[11px]">🏁</div>
              {/* Marcador P1 */}
              {p1 && (
                <div
                  className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-cyan-400 border border-black shadow-sm shadow-cyan-400 flex items-center justify-center text-[9px] font-black text-black transition-all"
                  style={{ left: `${Math.min(98, Math.max(0, (p1.x / goalXRef.current) * 100))}%` }}
                  title={`${p1.name}: ${Math.floor(p1.x)}m`}
                >
                  1
                </div>
              )}
              {/* Marcador P2 */}
              {p2 && gameMode === '2P' && (
                <div
                  className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-fuchsia-500 border border-black shadow-sm shadow-fuchsia-500 flex items-center justify-center text-[9px] font-black text-black transition-all"
                  style={{ left: `${Math.min(98, Math.max(0, (p2.x / goalXRef.current) * 100))}%` }}
                  title={`${p2.name}: ${Math.floor(p2.x)}m`}
                >
                  2
                </div>
              )}
            </div>
            <div className="flex justify-between text-[9px] text-slate-400 mt-0.5">
              <span>0m</span>
              <span className="text-cyan-300 font-bold">{Math.floor(p1 ? Math.min(goalXRef.current, p1.x) : 0)}m recorrido</span>
              <span>Meta: {goalXRef.current}m</span>
            </div>
          </div>

          {/* ESTADO DE SALUD Y BOTONES DE CONTROL */}
          <div className="flex items-center gap-2 pointer-events-auto">
            {/* Barra Salud P1 */}
            <div className="hidden md:flex items-center gap-2 bg-[#0d0f1fe6] backdrop-blur-md border border-cyan-500/40 px-3 py-1.5 rounded-xl shadow-lg">
              <span className="text-[10px] font-black text-cyan-400">P1 {p1Name}:</span>
              <div className="w-20 h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-700">
                <div
                  className="h-full bg-cyan-400 transition-all duration-75"
                  style={{ width: `${p1 ? Math.max(0, (p1.hp / p1.maxHp) * 100) : 100}%` }}
                />
              </div>
            </div>

            {/* Barra Salud P2 si está en 2P */}
            {gameMode === '2P' && (
              <div className="hidden md:flex items-center gap-2 bg-[#0d0f1fe6] backdrop-blur-md border border-fuchsia-500/40 px-3 py-1.5 rounded-xl shadow-lg">
                <span className="text-[10px] font-black text-fuchsia-400">P2 {p2Name}:</span>
                <div className="w-20 h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-700">
                  <div
                    className="h-full bg-fuchsia-500 transition-all duration-75"
                    style={{ width: `${p2 ? Math.max(0, (p2.hp / p2.maxHp) * 100) : 100}%` }}
                  />
                </div>
              </div>
            )}

            {/* Botón de Pausa */}
            <button
              onClick={togglePause}
              className="px-3 py-1.5 rounded-xl bg-cyan-950/90 border border-cyan-500/60 text-cyan-300 hover:bg-cyan-900 hover:text-white font-extrabold text-xs flex items-center gap-1.5 shadow-lg shadow-cyan-950/50 transition cursor-pointer"
              title="Pausar Juego (Tecla P o ESC)"
            >
              <Pause className="w-3.5 h-3.5 fill-cyan-400" />
              <span>PAUSA [P]</span>
            </button>

            {/* Botón Reiniciar Carrera */}
            <button
              onClick={handleRestartLevel}
              className="p-1.5 rounded-xl bg-slate-800/90 border border-slate-700 text-slate-300 hover:text-white transition shadow-lg cursor-pointer"
              title="Reiniciar Carrera"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* OVERLAY DE CUENTA REGRESIVA */}
        {gameState === 'countdown' && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center z-30 pointer-events-none">
            <span className="text-8xl font-black italic tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-yellow-300 to-fuchsia-500 animate-pulse">
              {countdownNum > 0 ? countdownNum : '¡RUN!'}
            </span>
            <p className="mt-4 text-xs text-cyan-200 tracking-wider uppercase font-bold">
              {currentWorld.name} • {gameMode === '1P' ? 'MODO SOLO' : 'MODO 2P AMIGOS'}
            </p>
          </div>
        )}

        {/* MODAL DE PAUSA */}
        {gameState === 'paused' && (
          <div className="absolute inset-0 bg-black/75 backdrop-blur-md flex items-center justify-center z-40">
            <div className="w-[420px] bg-[#0f1224] border-2 border-cyan-500 rounded-2xl p-6 shadow-2xl shadow-cyan-500/20 text-center">
              <div className="w-12 h-12 rounded-xl bg-cyan-950 border border-cyan-400 mx-auto flex items-center justify-center mb-3">
                <Pause className="w-6 h-6 text-cyan-300 fill-cyan-400" />
              </div>
              <h2 className="text-2xl font-black text-cyan-400 tracking-wider mb-1">
                SISTEMA EN PAUSA
              </h2>
              <p className="text-xs text-slate-400 mb-6">
                {currentWorld.name} • Carrera detenida
              </p>

              <div className="space-y-3">
                <button
                  onClick={() => {
                    sound.playResume();
                    setGameState('playing');
                  }}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-600 text-black font-extrabold text-xs flex items-center justify-center gap-2 hover:opacity-95 transition shadow-lg shadow-cyan-500/25 cursor-pointer"
                >
                  <Play className="w-4 h-4 fill-black" />
                  CONTINUAR JUEGO (RESUME)
                </button>

                <button
                  onClick={handleRestartLevel}
                  className="w-full py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 font-bold text-xs flex items-center justify-center gap-2 hover:bg-slate-700 transition cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
                  REINICIAR ESTE NIVEL
                </button>

                <button
                  onClick={() => {
                    const next = !soundEnabled;
                    setSoundEnabled(next);
                    sound.enabled = next;
                  }}
                  className="w-full py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 font-bold text-xs flex items-center justify-center gap-2 hover:bg-slate-700 transition cursor-pointer"
                >
                  {soundEnabled ? <Volume2 className="w-4 h-4 text-cyan-400" /> : <VolumeX className="w-4 h-4 text-rose-400" />}
                  SONIDO: {soundEnabled ? 'ACTIVADO' : 'MUTED'}
                </button>

                <button
                  onClick={handleExitToMain}
                  className="w-full py-2.5 rounded-xl bg-rose-950/70 border border-rose-600/50 text-rose-300 font-bold text-xs flex items-center justify-center gap-2 hover:bg-rose-900 transition cursor-pointer"
                >
                  <LogOut className="w-4 h-4 rotate-180" />
                  SALIR AL MENÚ PRINCIPAL
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL DE FIN DE RONDA */}
        {(gameState === 'round_over' || gameState === 'victory') && (
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-40 p-4">
            <div className="w-[500px] bg-[#0f1226] border-2 border-cyan-400 rounded-2xl p-6 shadow-2xl shadow-cyan-500/20 text-center">
              <div className="w-14 h-14 rounded-2xl bg-cyan-950 border-2 border-cyan-400 mx-auto flex items-center justify-center mb-3">
                {gameState === 'victory' || endRoundInfo.winner !== 'NONE' ? (
                  <Trophy className="w-7 h-7 text-yellow-400 animate-bounce" />
                ) : (
                  <Skull className="w-7 h-7 text-rose-400" />
                )}
              </div>

              <h2 className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-yellow-300 to-fuchsia-500 mb-1">
                {endRoundInfo.headline}
              </h2>
              <p className="text-xs text-slate-300 mb-5">{endRoundInfo.subline}</p>

              <div className="grid grid-cols-2 gap-3 bg-[#151930] p-3 rounded-xl border border-slate-700/60 mb-5 text-center">
                <div>
                  <div className="text-[11px] text-cyan-400 font-bold">{p1Name || 'P1'}</div>
                  <div className="text-lg font-black text-white">{endRoundInfo.p1Score} pts</div>
                </div>
                {gameMode === '2P' ? (
                  <div>
                    <div className="text-[11px] text-fuchsia-400 font-bold">{p2Name || 'P2'}</div>
                    <div className="text-lg font-black text-white">{endRoundInfo.p2Score} pts</div>
                  </div>
                ) : (
                  <div>
                    <div className="text-[11px] text-yellow-400 font-bold">Monedas Ganadas</div>
                    <div className="text-lg font-black text-yellow-300">+{endRoundInfo.coinsEarned} ◈</div>
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleRestartLevel}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-600 text-black font-extrabold text-xs flex items-center justify-center gap-2 hover:opacity-95 transition shadow-lg shadow-cyan-500/20 cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4 fill-black" />
                  REVANCHA / REINTENTAR
                </button>

                <button
                  onClick={handleExitToMain}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 font-bold text-xs hover:bg-slate-700 transition cursor-pointer"
                >
                  VOLVER A LA PARTE PRINCIPAL
                </button>
              </div>
            </div>
          </div>
        )}

        {/* BARRA DE CONTROLES EN PANTALLA TÁCTIL / RATÓN (IN-GAME DOCK) */}
        <div className="bg-[#0b0d1e]/95 border-t border-slate-800/80 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs z-20">
          {/* Controles Jugador 1 (Cyan) */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <span className="text-[10px] font-black text-cyan-400 mr-1 hidden sm:inline">P1:</span>
            <button
              onMouseDown={() => pressKey('KeyA')}
              onMouseUp={() => releaseKey('KeyA')}
              onMouseLeave={() => releaseKey('KeyA')}
              onTouchStart={() => pressKey('KeyA')}
              onTouchEnd={() => releaseKey('KeyA')}
              className="px-2.5 py-1.5 rounded-lg bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 active:bg-cyan-500 active:text-black font-bold text-xs transition select-none"
              title="Mover Izquierda (Tecla A)"
            >
              ◀ A
            </button>
            <button
              onMouseDown={() => pressKey('KeyD')}
              onMouseUp={() => releaseKey('KeyD')}
              onMouseLeave={() => releaseKey('KeyD')}
              onTouchStart={() => pressKey('KeyD')}
              onTouchEnd={() => releaseKey('KeyD')}
              className="px-2.5 py-1.5 rounded-lg bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 active:bg-cyan-500 active:text-black font-bold text-xs transition select-none"
              title="Mover Derecha (Tecla D)"
            >
              D ▶
            </button>
            <button
              onClick={() => actionJump(1)}
              className="px-3 py-1.5 rounded-lg bg-cyan-500/20 border border-cyan-400 text-cyan-200 active:bg-cyan-400 active:text-black font-extrabold text-xs transition select-none"
              title="Saltar (Tecla W o Espacio)"
            >
              ▲ SALTO
            </button>
            <button
              onClick={() => actionDash(1)}
              className="px-2.5 py-1.5 rounded-lg bg-yellow-500/20 border border-yellow-400/80 text-yellow-300 active:bg-yellow-400 active:text-black font-extrabold text-xs transition select-none"
              title="Dash Sónico (Tecla Q o Shift)"
            >
              ⚡ DASH
            </button>
            <button
              onClick={() => actionAttack(1)}
              className="px-2.5 py-1.5 rounded-lg bg-rose-500/20 border border-rose-400/80 text-rose-300 active:bg-rose-500 active:text-white font-extrabold text-xs transition select-none"
              title="Ataque Katana (Tecla F o E)"
            >
              ⚔ ATAQUE
            </button>
          </div>

          {/* Controles Jugador 2 (Magenta, si está activo 2P) */}
          {gameMode === '2P' && (
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className="text-[10px] font-black text-fuchsia-400 mr-1 hidden sm:inline">P2:</span>
              <button
                onMouseDown={() => pressKey('ArrowLeft')}
                onMouseUp={() => releaseKey('ArrowLeft')}
                onMouseLeave={() => releaseKey('ArrowLeft')}
                onTouchStart={() => pressKey('ArrowLeft')}
                onTouchEnd={() => releaseKey('ArrowLeft')}
                className="px-2.5 py-1.5 rounded-lg bg-fuchsia-950/80 border border-fuchsia-500/40 text-fuchsia-300 active:bg-fuchsia-500 active:text-black font-bold text-xs transition select-none"
                title="Mover Izquierda (Flecha Izq)"
              >
                ◀ ◄
              </button>
              <button
                onMouseDown={() => pressKey('ArrowRight')}
                onMouseUp={() => releaseKey('ArrowRight')}
                onMouseLeave={() => releaseKey('ArrowRight')}
                onTouchStart={() => pressKey('ArrowRight')}
                onTouchEnd={() => releaseKey('ArrowRight')}
                className="px-2.5 py-1.5 rounded-lg bg-fuchsia-950/80 border border-fuchsia-500/40 text-fuchsia-300 active:bg-fuchsia-500 active:text-black font-bold text-xs transition select-none"
                title="Mover Derecha (Flecha Der)"
              >
                ► ▶
              </button>
              <button
                onClick={() => actionJump(2)}
                className="px-3 py-1.5 rounded-lg bg-fuchsia-500/20 border border-fuchsia-400 text-fuchsia-200 active:bg-fuchsia-400 active:text-black font-extrabold text-xs transition select-none"
                title="Saltar (Flecha Arriba)"
              >
                ▲ SALTO
              </button>
              <button
                onClick={() => actionDash(2)}
                className="px-2.5 py-1.5 rounded-lg bg-amber-500/20 border border-amber-400/80 text-amber-300 active:bg-amber-400 active:text-black font-extrabold text-xs transition select-none"
                title="Dash (Flecha Abajo o M)"
              >
                ⚡ DASH
              </button>
              <button
                onClick={() => actionAttack(2)}
                className="px-2.5 py-1.5 rounded-lg bg-rose-500/20 border border-rose-400/80 text-rose-300 active:bg-rose-500 active:text-white font-extrabold text-xs transition select-none"
                title="Ataque (Enter o L)"
              >
                ⚔ ATAQUE
              </button>
            </div>
          )}

          {/* Estado de mandos */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-400 flex items-center gap-1">
              <Gamepad2 className={`w-3.5 h-3.5 ${gamepadsConnected > 0 ? 'text-emerald-400 animate-pulse' : 'text-slate-500'}`} />
              <span className="hidden md:inline">
                {gamepadsConnected > 0 ? `${gamepadsConnected} Mando(s) Xbox/PS Conectado(s)` : 'Mando o Teclado'}
              </span>
            </span>
          </div>
        </div>
      </div>
    );
  }

  // ===========================================================================
  // PARTE PRINCIPAL (LOBBY, INFORMACIÓN, MAPAS, PERSONAJES Y RANKING)
  // ===========================================================================
  return (
    <div className="min-h-screen bg-[#070712] text-slate-100 flex flex-col font-sans select-none">
      {/* =================================================================== */}
      {/* BARRA SUPERIOR (HEADER CYBERPUNK)                                  */}
      {/* =================================================================== */}
      {!isFullscreen && (
        <header className="border-b border-cyan-900/40 bg-[#0d0f1f]/90 backdrop-blur-md px-6 py-3 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-cyan-400 to-fuchsia-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <Zap className="w-5 h-5 text-black stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-yellow-300 to-fuchsia-500">
                  NEON SHURIKEN
                </h1>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-700/50">
                  60 FPS ARCADE
                </span>
              </div>
              <p className="text-[11px] text-slate-400">Cyberpunk Platformer • 1P Solo / 2P Amigos</p>
            </div>
          </div>

          {/* Navegación por pestañas */}
          <nav className="flex items-center gap-1 bg-[#14172e] p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setActiveTab('lobby')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'lobby'
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-black shadow-md shadow-cyan-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Compass className="w-3.5 h-3.5" />
              Mundos & Juego
            </button>
            <button
              onClick={() => setActiveTab('tutorial')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'tutorial'
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-black shadow-md shadow-cyan-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Info className="w-3.5 h-3.5" />
              Cómo se Juega
            </button>
            <button
              onClick={() => setActiveTab('shop')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'shop'
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-black shadow-md shadow-cyan-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              Personajes
            </button>
            <button
              onClick={() => setActiveTab('ranking')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'ranking'
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-black shadow-md shadow-cyan-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Trophy className="w-3.5 h-3.5" />
              Ranking
            </button>
            <button
              onClick={() => setActiveTab('code')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'code'
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-black shadow-md shadow-cyan-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Code2 className="w-3.5 h-3.5" />
              Python Arcade
            </button>
          </nav>

          {/* Saldo de monedas y Controles de Audio */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 bg-yellow-500/10 border border-yellow-500/30 px-3 py-1.5 rounded-lg text-yellow-300 font-bold text-xs">
              <Coins className="w-4 h-4 text-yellow-400" />
              <span>{walletCoins} ◈</span>
            </div>

            <button
              onClick={() => {
                const next = !soundEnabled;
                setSoundEnabled(next);
                sound.enabled = next;
              }}
              className="p-2 rounded-lg bg-slate-800/80 border border-slate-700 text-slate-300 hover:text-white transition"
              title={soundEnabled ? 'Silenciar SFX' : 'Activar SFX'}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4 text-cyan-400" /> : <VolumeX className="w-4 h-4 text-rose-400" />}
            </button>
          </div>
        </header>
      )}

      {/* =================================================================== */}
      {/* SECCIÓN HERO CON PREVIEW DEL MAPA / CARRERA Y BOTÓN PLAY GIGANTE    */}
      {/* =================================================================== */}
      <section className="max-w-6xl w-full mx-auto px-6 pt-6">
        <div className="bg-gradient-to-r from-[#0d1026] via-[#121638] to-[#1a0e28] border-2 border-cyan-500/50 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-cyan-500/10 flex flex-col lg:flex-row items-center justify-between gap-6 relative overflow-hidden">
          <div className="relative z-10 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/90 border border-cyan-400/50 text-cyan-300 text-xs font-black mb-3 shadow-md shadow-cyan-950">
              <Compass className="w-3.5 h-3.5 text-cyan-400" />
              <span>MAPA SELECCIONADO PARA CORRER: {currentWorld.name}</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-white to-fuchsia-400 mb-2">
              {currentWorld.name} • {currentWorld.subtitle}
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed mb-4">
              {currentWorld.description} Pista extendida de <span className="text-cyan-300 font-bold">{currentWorld.length} metros</span> con aceleración OpenGL a 60 FPS.
            </p>

            {/* Lista visual de obstáculos */}
            <div className="flex flex-wrap items-center gap-1.5 mb-4">
              <span className="text-[10px] font-bold text-slate-400">Obstáculos del Mapa:</span>
              {currentWorld.obstaclesList.map((obs, i) => (
                <span key={i} className="text-[10px] px-2.5 py-0.5 rounded-full bg-slate-900/90 border border-cyan-500/30 text-cyan-200 font-medium">
                  {obs}
                </span>
              ))}
            </div>

            {/* Configuración activa */}
            <div className="text-[11px] text-slate-400 flex flex-wrap items-center gap-4 bg-[#0a0d1e]/80 p-2.5 rounded-xl border border-slate-800">
              <span>Modo: <strong className="text-white">{gameMode === '1P' ? '1P Solo' : '2P Amigos'}</strong></span>
              <span>P1: <strong className="text-cyan-300">{p1Name || 'Ciber-Kage'}</strong></span>
              {gameMode === '2P' && <span>P2: <strong className="text-fuchsia-300">{p2Name || 'Neon-Fox'}</strong></span>}
              <span className="text-yellow-400 font-bold">Monedas: {walletCoins} ◈</span>
            </div>
          </div>

          {/* BOTÓN PLAY GIGANTE QUE AGRANDA LA PANTALLA */}
          <div className="relative z-10 flex flex-col items-center gap-2 text-center">
            <button
              onClick={handleStartPlay}
              className="px-9 py-5 rounded-2xl bg-gradient-to-r from-cyan-400 via-yellow-300 to-fuchsia-500 text-black font-black text-lg tracking-wider flex items-center gap-3.5 shadow-2xl shadow-cyan-500/40 hover:scale-105 active:scale-95 transition-all cursor-pointer animate-pulse"
              title="Agrandar pantalla y empezar carrera"
            >
              <Play className="w-8 h-8 fill-black" />
              <span>¡JUGAR / PLAY!</span>
            </button>
            <span className="text-[11px] text-cyan-300 font-bold">
              ⛶ Se agranda la pantalla automáticamente para jugar a 60 FPS
            </span>
          </div>
        </div>
      </section>

      {/* =================================================================== */}
      {/* SECCIONES PRINCIPALES (INFORMACIÓN, MAPAS, TIENDA, RANKING)         */}
      {/* =================================================================== */}
      <main className="max-w-6xl w-full mx-auto p-6 flex flex-col gap-6">
          {/* PESTAÑA 1: MUNDOS, NOMBRES Y MODOS */}
          {activeTab === 'lobby' && (
            <div className="space-y-6">
              {/* CONFIGURACIÓN DE NOMBRES Y MODO */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Selector de Modo */}
                <div className="bg-[#0f1226] border border-slate-800 rounded-2xl p-5 shadow-lg">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-black text-cyan-400 tracking-wider">MODO DE JUEGO</span>
                    <Users className="w-4 h-4 text-cyan-400" />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setGameMode('1P')}
                      className={`p-3 rounded-xl border text-left transition ${
                        gameMode === '1P'
                          ? 'bg-cyan-950/80 border-cyan-400 text-white shadow-md shadow-cyan-500/20'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <User className="w-4 h-4 mb-1 text-cyan-400" />
                      <div className="text-xs font-bold">1 Jugador</div>
                      <div className="text-[10px] text-slate-400">Campaña Solo</div>
                    </button>

                    <button
                      onClick={() => setGameMode('2P')}
                      className={`p-3 rounded-xl border text-left transition ${
                        gameMode === '2P'
                          ? 'bg-fuchsia-950/80 border-fuchsia-400 text-white shadow-md shadow-fuchsia-500/20'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <Users className="w-4 h-4 mb-1 text-fuchsia-400" />
                      <div className="text-xs font-bold">2 Jugadores</div>
                      <div className="text-[10px] text-slate-400">Amigos en Teclado</div>
                    </button>
                  </div>

                  <p className="text-[11px] text-slate-400 mt-3">
                    {gameMode === '2P'
                      ? 'Regla de amigos: si uno cae gana el otro, si ambos llegan pasan de nivel.'
                      : 'Supera los obstáculos y llega al portal final sin perder tu salud.'}
                  </p>
                </div>

                {/* Formulario de Nombres de Personajes */}
                <div className="md:col-span-2 bg-[#0f1226] border border-slate-800 rounded-2xl p-5 shadow-lg">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-black text-cyan-400 tracking-wider">
                      IDENTIFICACIÓN DE PERSONAJES (NOMBRES)
                    </span>
                    <button
                      onClick={handleResetNames}
                      className="text-xs text-rose-400 hover:text-rose-300 font-bold flex items-center gap-1 transition"
                      title="Limpia los campos para escribir otros nombres (El ranking nunca se borra)"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      Reiniciar Nombres
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[11px] font-bold text-cyan-300 block mb-1">
                        Nombre Jugador 1 (Cyan / Teclas WASD)
                      </label>
                      <input
                        type="text"
                        value={p1Name}
                        onChange={e => setP1Name(e.target.value)}
                        placeholder="Ej: Ciber-Kage"
                        maxLength={16}
                        className="w-full bg-[#161a33] border border-cyan-500/40 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 font-bold"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-fuchsia-300 block mb-1">
                        Nombre Jugador 2 (Magenta / Flechas)
                      </label>
                      <input
                        type="text"
                        value={p2Name}
                        disabled={gameMode !== '2P'}
                        onChange={e => setP2Name(e.target.value)}
                        placeholder={gameMode === '2P' ? 'Ej: Neon-Fox' : 'Activa Modo 2P para P2'}
                        maxLength={16}
                        className={`w-full bg-[#161a33] border rounded-xl px-3.5 py-2.5 text-xs font-bold focus:outline-none transition ${
                          gameMode === '2P'
                            ? 'border-fuchsia-500/40 text-white placeholder-slate-500 focus:border-fuchsia-400'
                            : 'border-slate-800 text-slate-600 cursor-not-allowed opacity-50'
                        }`}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-400 mt-3 pt-3 border-t border-slate-800">
                    <span>💡 Puedes cambiar los nombres cuantas veces quieras antes de jugar.</span>
                    <span className="text-yellow-400 font-bold">El Tablón de Ranking queda guardado siempre.</span>
                  </div>
                </div>
              </div>

              {/* SELECTOR DE MUNDOS Y MAPAS */}
              <div className="bg-[#0f1226] border border-slate-800 rounded-2xl p-6 shadow-lg">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-black text-cyan-400 tracking-wider">
                      SELECCIONA EL MUNDO / MAPA
                    </h3>
                    <p className="text-xs text-slate-400">Cada mundo cuenta con una longitud mayor y obstáculos más desafiantes.</p>
                  </div>
                  <Layers className="w-5 h-5 text-cyan-400" />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {WORLDS.map((w, idx) => {
                    const isSelected = selectedWorldIdx === idx;
                    return (
                      <button
                        key={w.id}
                        onClick={() => {
                          setSelectedWorldIdx(idx);
                          sound.playAttack();
                        }}
                        className={`p-4 rounded-xl border text-left transition-all relative overflow-hidden flex flex-col justify-between ${
                          isSelected
                            ? 'bg-[#151936] border-cyan-400 shadow-lg shadow-cyan-500/20'
                            : 'bg-[#11142a] border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        {isSelected && (
                          <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-cyan-400 shadow-sm shadow-cyan-400" />
                        )}
                        <div>
                          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                            {w.subtitle}
                          </div>
                          <div className="text-sm font-black text-white mb-2">{w.name}</div>
                          <p className="text-[11px] text-slate-300 leading-snug mb-3">{w.description}</p>
                        </div>

                        <div>
                          <div className="text-[10px] font-bold text-slate-400 mb-1">Obstáculos:</div>
                          <ul className="text-[10px] text-slate-300 space-y-0.5">
                            {w.obstaclesList.map((obs, i) => (
                              <li key={i} className="flex items-center gap-1 text-slate-400">
                                <span className="w-1 h-1 rounded-full bg-cyan-400" />
                                {obs}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* PESTAÑA 2: CÓMO SE JUEGA (TUTORIAL COMPLETO) */}
          {activeTab === 'tutorial' && (
            <div className="space-y-6">
              <div className="bg-[#0f1226] border border-slate-800 rounded-2xl p-6 shadow-lg">
                <h3 className="text-lg font-black text-cyan-400 tracking-wider mb-2">
                  GUÍA COMPLETA DE CONTROLES & MECÁNICAS
                </h3>
                <p className="text-xs text-slate-300 mb-6">
                  Puedes jugar con el teclado en la misma computadora o conectar dos mandos USB/Bluetooth de Xbox o PlayStation.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Jugador 1 Teclado */}
                  <div className="bg-[#141833] border border-cyan-500/30 rounded-xl p-5">
                    <div className="flex items-center gap-2 text-cyan-300 font-black text-sm mb-4">
                      <Keyboard className="w-4 h-4" />
                      JUGADOR 1 (CYAN) • CONTROLES DE TECLADO
                    </div>
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between py-1.5 border-b border-slate-800">
                        <span className="text-slate-400">Moverse Horizontal</span>
                        <span className="font-bold text-white bg-slate-800 px-2 py-0.5 rounded">Teclas A y D</span>
                      </div>
                      <div className="flex justify-between py-1.5 border-b border-slate-800">
                        <span className="text-slate-400">Saltar / Doble Salto</span>
                        <span className="font-bold text-white bg-slate-800 px-2 py-0.5 rounded">Tecla W</span>
                      </div>
                      <div className="flex justify-between py-1.5 border-b border-slate-800">
                        <span className="text-slate-400">Dash de Neón</span>
                        <span className="font-bold text-white bg-slate-800 px-2 py-0.5 rounded">Tecla Q o Shift Izq</span>
                      </div>
                      <div className="flex justify-between py-1.5">
                        <span className="text-slate-400">Ataque Katana</span>
                        <span className="font-bold text-white bg-slate-800 px-2 py-0.5 rounded">Tecla F o E</span>
                      </div>
                    </div>
                  </div>

                  {/* Jugador 2 Teclado */}
                  <div className="bg-[#141833] border border-fuchsia-500/30 rounded-xl p-5">
                    <div className="flex items-center gap-2 text-fuchsia-300 font-black text-sm mb-4">
                      <Keyboard className="w-4 h-4" />
                      JUGADOR 2 (MAGENTA) • CONTROLES DE TECLADO
                    </div>
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between py-1.5 border-b border-slate-800">
                        <span className="text-slate-400">Moverse Horizontal</span>
                        <span className="font-bold text-white bg-slate-800 px-2 py-0.5 rounded">Flechas ◄ y ►</span>
                      </div>
                      <div className="flex justify-between py-1.5 border-b border-slate-800">
                        <span className="text-slate-400">Saltar / Doble Salto</span>
                        <span className="font-bold text-white bg-slate-800 px-2 py-0.5 rounded">Flecha ▲ Arriba</span>
                      </div>
                      <div className="flex justify-between py-1.5 border-b border-slate-800">
                        <span className="text-slate-400">Dash de Neón</span>
                        <span className="font-bold text-white bg-slate-800 px-2 py-0.5 rounded">Flecha ▼ o Shift Der</span>
                      </div>
                      <div className="flex justify-between py-1.5">
                        <span className="text-slate-400">Ataque Katana</span>
                        <span className="font-bold text-white bg-slate-800 px-2 py-0.5 rounded">Enter o Tecla L</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Mandos Xbox y PlayStation */}
                <div className="mt-6 bg-[#141833] border border-yellow-500/30 rounded-xl p-5">
                  <div className="flex items-center gap-2 text-yellow-300 font-black text-sm mb-3">
                    <Gamepad2 className="w-4 h-4" />
                    SOPORTE DE MANDOS USB / BLUETOOTH (XBOX & PLAYSTATION)
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-slate-300">
                    <div className="bg-[#0f1226] p-3 rounded-lg border border-slate-800">
                      <div className="font-bold text-cyan-300 mb-1">Moverse</div>
                      <div>Stick Analógico Izquierdo en cualquier dirección.</div>
                    </div>
                    <div className="bg-[#0f1226] p-3 rounded-lg border border-slate-800">
                      <div className="font-bold text-cyan-300 mb-1">Salto y Dash</div>
                      <div>Botón A (Cruz en PS) para saltar. Botón B (Círculo) para Dash.</div>
                    </div>
                    <div className="bg-[#0f1226] p-3 rounded-lg border border-slate-800">
                      <div className="font-bold text-cyan-300 mb-1">Ataque Katana</div>
                      <div>Botón X (Cuadrado en PS) para tajo de alta frecuencia.</div>
                    </div>
                  </div>
                </div>

                {/* Reglas de Amigos y Obstáculos */}
                <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="bg-[#141833] p-4 rounded-xl border border-slate-800">
                    <div className="font-bold text-cyan-300 mb-1">👑 Reglas de 2 Jugadores (Amigos)</div>
                    <p className="text-slate-300 leading-relaxed">
                      Si un amigo cae al vacío o su barra de vida llega a cero, ¡el otro amigo gana la ronda inmediatamente y recibe monedas de victoria! Si ambos sobreviven y llegan al portal, ambos avanzan al siguiente mundo.
                    </p>
                  </div>
                  <div className="bg-[#141833] p-4 rounded-xl border border-slate-800">
                    <div className="font-bold text-rose-300 mb-1">⚠️ Nuevos Obstáculos</div>
                    <p className="text-slate-300 leading-relaxed">
                      Cuidado con las <strong className="text-rose-400">Minas de Proximidad EMP</strong> (parpadean en rojo y explotan si te acercas), los <strong className="text-cyan-400">Rayos Láser</strong> intermitentes y las <strong className="text-yellow-400">Plataformas Colapsables</strong> que caen tras pisarlas.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* PESTAÑA 3: TIENDA Y GARAJE DE PERSONAJES */}
          {activeTab === 'shop' && (
            <div className="space-y-6">
              <div className="bg-[#0f1226] border border-slate-800 rounded-2xl p-6 shadow-lg">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-black text-cyan-400 tracking-wider">
                      TIENDA & GARAJE DE CIBER-PERSONAJES
                    </h3>
                    <p className="text-xs text-slate-400">
                      Gana Cripto-Monedas ◈ durante las carreras y desbloquea personajes con habilidades especiales.
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 bg-yellow-500/10 border border-yellow-500/30 px-3 py-1.5 rounded-lg text-yellow-300 font-bold text-xs">
                    <Coins className="w-4 h-4 text-yellow-400" />
                    <span>Tu Saldo: {walletCoins} ◈</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {CHARACTERS.map(char => {
                    const isUnlocked = unlockedCharIds.includes(char.id);
                    const isP1Selected = p1CharId === char.id;
                    const isP2Selected = p2CharId === char.id;

                    return (
                      <div
                        key={char.id}
                        className={`rounded-2xl border p-5 flex flex-col justify-between transition ${
                          isP1Selected || isP2Selected
                            ? 'bg-[#151938] border-cyan-400 shadow-lg shadow-cyan-500/10'
                            : 'bg-[#11142a] border-slate-800'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-[10px] font-black px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800/50">
                              {char.badge}
                            </span>
                            <div className="text-xs font-bold text-yellow-300 flex items-center gap-1">
                              {isUnlocked ? (
                                <span className="text-emerald-400 flex items-center gap-1">
                                  <Check className="w-3.5 h-3.5" /> Desbloqueado
                                </span>
                              ) : (
                                <span>{char.price} ◈</span>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-3 mb-3">
                            <div
                              className="w-12 h-12 rounded-xl flex items-center justify-center font-black text-black text-lg shadow-md"
                              style={{ backgroundColor: char.color }}
                            >
                              {char.name[0]}
                            </div>
                            <div>
                              <div className="text-base font-black text-white">{char.name}</div>
                              <div className="text-xs text-slate-400">{char.title}</div>
                            </div>
                          </div>

                          <div className="space-y-1.5 text-xs text-slate-300 mb-4 bg-[#0a0c1a] p-3 rounded-xl border border-slate-800">
                            <div className="flex justify-between text-[11px]">
                              <span className="text-slate-400">Puntos de Salud</span>
                              <span className="font-bold text-cyan-300">{char.hp} HP</span>
                            </div>
                            <div className="flex justify-between text-[11px]">
                              <span className="text-slate-400">Velocidad</span>
                              <span className="font-bold text-yellow-300">{char.speed} px/f</span>
                            </div>
                            <div className="flex justify-between text-[11px]">
                              <span className="text-slate-400">Potencia de Salto</span>
                              <span className="font-bold text-fuchsia-300">{char.jumpPower}</span>
                            </div>
                          </div>

                          <div className="text-xs text-slate-300 mb-4">
                            <span className="text-cyan-400 font-bold">{char.passiveName}: </span>
                            {char.passiveDesc}
                          </div>
                        </div>

                        <div className="pt-3 border-t border-slate-800/80">
                          {isUnlocked ? (
                            <div className="grid grid-cols-2 gap-2">
                              <button
                                onClick={() => {
                                  setP1CharId(char.id);
                                  sound.playAttack();
                                }}
                                className={`py-1.5 rounded-lg text-xs font-bold transition ${
                                  isP1Selected
                                    ? 'bg-cyan-400 text-black'
                                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                                }`}
                              >
                                {isP1Selected ? 'P1 Equipado' : 'Equipar P1'}
                              </button>
                              <button
                                onClick={() => {
                                  setP2CharId(char.id);
                                  sound.playAttack();
                                }}
                                className={`py-1.5 rounded-lg text-xs font-bold transition ${
                                  isP2Selected
                                    ? 'bg-fuchsia-500 text-black'
                                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                                }`}
                              >
                                {isP2Selected ? 'P2 Equipado' : 'Equipar P2'}
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => handleBuyCharacter(char)}
                              disabled={walletCoins < char.price}
                              className={`w-full py-2 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition ${
                                walletCoins >= char.price
                                  ? 'bg-gradient-to-r from-yellow-400 to-amber-500 text-black hover:opacity-95 shadow-lg shadow-yellow-500/20'
                                  : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                              }`}
                            >
                              <Coins className="w-3.5 h-3.5" />
                              COMPRAR POR {char.price} ◈
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* PESTAÑA 4: TABLÓN DE RANKING PERSISTENTE (NUNCA SE BORRA) */}
          {activeTab === 'ranking' && (
            <div className="space-y-6">
              <div className="bg-[#0f1226] border border-slate-800 rounded-2xl p-6 shadow-lg">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                  <div>
                    <h3 className="text-lg font-black text-cyan-400 tracking-wider flex items-center gap-2">
                      <Trophy className="w-5 h-5 text-yellow-400" />
                      TABLÓN DE RANKING (SALÓN DE LA FAMA CIBERNÉTICO)
                    </h3>
                    <p className="text-xs text-slate-400">
                      Récords guardados de forma permanente en la memoria de la aplicación. NUNCA se borran.
                    </p>
                  </div>
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-950/60 border border-emerald-600/40 text-emerald-300 text-xs font-bold">
                    <CheckCircle2 className="w-4 h-4" />
                    Persistencia Permanente Activa
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-300">
                    <thead className="bg-[#141833] text-cyan-300 font-bold uppercase tracking-wider text-[10px] border-b border-slate-800">
                      <tr>
                        <th className="py-3 px-4">Rango</th>
                        <th className="py-3 px-4">Ciber-Corredor(es)</th>
                        <th className="py-3 px-4">Puntuación</th>
                        <th className="py-3 px-4">Mundo Superado</th>
                        <th className="py-3 px-4">Modo</th>
                        <th className="py-3 px-4">Personaje</th>
                        <th className="py-3 px-4">Monedas</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {rankingList.map((rec, i) => (
                        <tr key={rec.id || i} className="hover:bg-slate-800/40 transition">
                          <td className="py-3 px-4 font-black">
                            {i === 0 ? (
                              <span className="text-yellow-400 text-sm">🥇 #1</span>
                            ) : i === 1 ? (
                              <span className="text-slate-300 text-sm">🥈 #2</span>
                            ) : i === 2 ? (
                              <span className="text-amber-500 text-sm">🥉 #3</span>
                            ) : (
                              <span className="text-slate-500">#{i + 1}</span>
                            )}
                          </td>
                          <td className="py-3 px-4 font-bold text-white">{rec.name}</td>
                          <td className="py-3 px-4 font-black text-cyan-300">{rec.score.toLocaleString()} pts</td>
                          <td className="py-3 px-4 text-slate-300">{rec.worldName}</td>
                          <td className="py-3 px-4">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                rec.mode === '2P Amigos'
                                  ? 'bg-fuchsia-950 text-fuchsia-300 border border-fuchsia-800/40'
                                  : 'bg-cyan-950 text-cyan-300 border border-cyan-800/40'
                              }`}
                            >
                              {rec.mode}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-slate-400">{rec.characterName}</td>
                          <td className="py-3 px-4 text-yellow-300 font-bold">{rec.coins} ◈</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* PESTAÑA 5: CÓDIGO PYTHON ARCADE (juego_premium.py) */}
          {activeTab === 'code' && (
            <div className="space-y-6">
              <div className="bg-[#0f1226] border border-slate-800 rounded-2xl p-6 shadow-lg">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
                  <div>
                    <h3 className="text-lg font-black text-cyan-400 tracking-wider">
                      CÓDIGO FUENTE: juego_premium.py
                    </h3>
                    <p className="text-xs text-slate-400">
                      Archivo de Python completo con Arcade, OpenGL, soporte dual 1P/2P, pausa y ranking en JSON.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(JUEGO_PREMIUM_PY);
                        setCopiedCode(true);
                        setTimeout(() => setCopiedCode(false), 2000);
                      }}
                      className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 flex items-center gap-1.5 transition"
                    >
                      {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      {copiedCode ? '¡Copiado!' : 'Copiar Código'}
                    </button>
                    <a
                      href={`data:text/plain;charset=utf-8,${encodeURIComponent(JUEGO_PREMIUM_PY)}`}
                      download="juego_premium.py"
                      className="px-3.5 py-1.5 rounded-lg bg-cyan-400 hover:bg-cyan-300 text-black text-xs font-black flex items-center gap-1.5 transition shadow-md shadow-cyan-500/20"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Descargar juego_premium.py
                    </a>
                  </div>
                </div>

                <div className="bg-[#0a0c1a] border border-slate-800 rounded-xl p-4 overflow-x-auto max-h-[500px]">
                  <pre className="text-[11px] font-mono text-cyan-300 leading-relaxed">
                    {JUEGO_PREMIUM_PY}
                  </pre>
                </div>
              </div>
            </div>
          )}
        </main>
    </div>
  );
}
