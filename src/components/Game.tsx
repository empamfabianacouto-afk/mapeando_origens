import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { wordList, WordEntry } from '../data';
import { 
  Trophy, Clock, Sparkles, Volume2, VolumeX, 
  ArrowUp, ArrowDown, ArrowLeft, ArrowRight, 
  CheckCircle2, XCircle, HelpCircle, AlertTriangle, ShieldCheck,
  Maximize, Minimize
} from 'lucide-react';

interface MazeProps {
  studentName: string;
  character: string;
  onGameOver: (score: number, time: number, scrollsCollected: number) => void;
}

// 24 colunas x 13 linhas - Layout Horizontal Widescreen
const COLS = 24;
const ROWS = 13;

// 1 = Parede de Arbustos, 0 = Trilha de Areia, 2 = Portal da Saída
const BASE_MAZE: number[][] = [
  // 0
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  // 1: Início em (1,1)
  [1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  // 2
  [1, 0, 1, 1, 1, 0, 1, 0, 1, 1, 1, 1, 0, 1, 0, 1, 1, 1, 1, 1, 1, 1, 0, 1],
  // 3
  [1, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 1],
  // 4
  [1, 0, 1, 0, 1, 1, 1, 1, 1, 0, 0, 1, 1, 1, 0, 1, 0, 1, 1, 1, 0, 1, 0, 1],
  // 5
  [1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1],
  // 6
  [1, 1, 1, 0, 1, 0, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 0, 1, 0, 1, 1, 1, 1, 1],
  // 7
  [1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1],
  // 8
  [1, 0, 1, 1, 1, 0, 1, 0, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 0, 1, 0, 1],
  // 9
  [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 1],
  // 10
  [1, 1, 1, 0, 1, 1, 1, 0, 1, 0, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 0, 1],
  // 11: Saída Dourada em (22, 11)
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 1],
  // 12
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
];

// Síntese de áudio simples usando Web Audio API para feedbacks educativos
function playSound(type: 'correct' | 'wrong' | 'scroll' | 'alert' | 'fanfare', soundEnabled: boolean) {
  if (!soundEnabled) return;
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    if (ctx.state === 'suspended') {
      ctx.resume();
    }
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === 'correct') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(523.25, now);
      osc.frequency.setValueAtTime(659.25, now + 0.08);
      osc.frequency.setValueAtTime(783.99, now + 0.16);
      osc.frequency.setValueAtTime(1046.50, now + 0.24);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
      osc.start(now);
      osc.stop(now + 0.45);
    } else if (type === 'wrong') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.linearRampToValueAtTime(150, now + 0.22);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
      osc.start(now);
      osc.stop(now + 0.25);
    } else if (type === 'scroll') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(660, now);
      osc.frequency.exponentialRampToValueAtTime(990, now + 0.14);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
      osc.start(now);
      osc.stop(now + 0.22);
    } else if (type === 'alert') {
      osc.type = 'square';
      osc.frequency.setValueAtTime(160, now);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
      osc.start(now);
      osc.stop(now + 0.16);
    } else if (type === 'fanfare') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(523.25, now);
      osc.frequency.setValueAtTime(659.25, now + 0.1);
      osc.frequency.setValueAtTime(783.99, now + 0.2);
      osc.frequency.setValueAtTime(1046.50, now + 0.35);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
      osc.start(now);
      osc.stop(now + 0.6);
    }
  } catch {
    // Ignora silenciosamente se o navegador bloquear autoplay
  }
}

interface CollectibleItem extends WordEntry {
  id: number;
  x: number;
  y: number;
}

interface EnemyConfig {
  id: number;
  name: string;
  avatar: string;
  x: number;
  y: number;
  aggroDist: number;
  chaseRate: number;
  isChasing?: boolean;
}

interface ActiveQuizState {
  item: CollectibleItem;
  stage: 'meaning' | 'origin';
  meaningOptions: string[];
  selectedMeaning: string | null;
  meaningFeedback: { isCorrect: boolean; message: string } | null;
  selectedOrigin: string | null;
  originFeedback: { isCorrect: boolean; message: string } | null;
}

export const MazeGame: React.FC<MazeProps> = ({ studentName, character, onGameOver }) => {
  const [playerPos, setPlayerPos] = useState({ x: 1, y: 1 });
  const [score, setScore] = useState(0);
  const [timer, setTimer] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [notification, setNotification] = useState<string | null>(null);
  const [isInvulnerable, setIsInvulnerable] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const notificationTimeoutRef = useRef<number | null>(null);
  const lastHitTimeRef = useRef<number>(0);
  const playerPosRef = useRef(playerPos);

  // Monitora alterações de tela cheia do navegador
  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    document.addEventListener('webkitfullscreenchange', handleFsChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFsChange);
      document.removeEventListener('webkitfullscreenchange', handleFsChange);
    };
  }, []);

  const toggleFullscreen = () => {
    try {
      const elem = document.documentElement as HTMLElement & {
        webkitRequestFullscreen?: () => Promise<void>;
        msRequestFullscreen?: () => Promise<void>;
      };
      const doc = document as Document & {
        webkitExitFullscreen?: () => Promise<void>;
        msExitFullscreen?: () => Promise<void>;
      };

      if (!document.fullscreenElement) {
        if (elem.requestFullscreen) {
          elem.requestFullscreen().catch(() => {});
        } else if (elem.webkitRequestFullscreen) {
          elem.webkitRequestFullscreen().catch(() => {});
        } else if (elem.msRequestFullscreen) {
          elem.msRequestFullscreen().catch(() => {});
        }
      } else {
        if (doc.exitFullscreen) {
          doc.exitFullscreen().catch(() => {});
        } else if (doc.webkitExitFullscreen) {
          doc.webkitExitFullscreen().catch(() => {});
        } else if (doc.msExitFullscreen) {
          doc.msExitFullscreen().catch(() => {});
        }
      }
    } catch {
      // Ignora restrições do navegador
    }
  };

  // Mantém a posição do jogador sempre atualizada para o timer dos inimigos
  useEffect(() => {
    playerPosRef.current = playerPos;
  }, [playerPos]);

  // Inimigos com personalidades guardiãs da fauna brasileira e inteligência de perseguição
  const [enemies, setEnemies] = useState<EnemyConfig[]>([
    { id: 1, name: 'Onça Guardiã', avatar: '🐆', x: 8, y: 3, aggroDist: 8, chaseRate: 0.70 },
    { id: 2, name: 'Jacaré do Pantanal', avatar: '🐊', x: 13, y: 7, aggroDist: 6, chaseRate: 0.55 },
    { id: 3, name: 'Sagui Brincalhão', avatar: '🐒', x: 18, y: 3, aggroDist: 7, chaseRate: 0.65 }
  ]);

  // Lista de posições válidas de caminhos
  const validPathCells = useMemo(() => {
    const cells: { x: number; y: number }[] = [];
    for (let y = 0; y < ROWS; y++) {
      for (let x = 0; x < COLS; x++) {
        if (BASE_MAZE[y][x] === 0 && !(x === 1 && y === 1) && !(x === 22 && y === 11)) {
          cells.push({ x, y });
        }
      }
    }
    return cells;
  }, []);

  // 10 Pergaminhos distribuídos aleatoriamente no início da partida
  const [collectibles, setCollectibles] = useState<CollectibleItem[]>(() => {
    // Escolhe 10 palavras aleatórias da lista
    const shuffledWords = [...wordList].sort(() => Math.random() - 0.5).slice(0, 10);
    const availablePositions = [...validPathCells].sort(() => Math.random() - 0.5);

    return shuffledWords.map((word, idx) => {
      const pos = availablePositions[idx] || { x: 5 + idx * 2, y: 5 };
      return {
        ...word,
        id: idx,
        x: pos.x,
        y: pos.y
      };
    });
  });

  const totalScrolls = 10;
  const collectedCount = totalScrolls - collectibles.length;

  // Estado do Quiz que sobrepõe o Labirinto
  const [activeQuiz, setActiveQuiz] = useState<ActiveQuizState | null>(null);

  // Helper para disparar notificações visuais
  const showNotification = useCallback((msg: string) => {
    setNotification(msg);
    if (notificationTimeoutRef.current) {
      window.clearTimeout(notificationTimeoutRef.current);
    }
    notificationTimeoutRef.current = window.setTimeout(() => {
      setNotification(null);
    }, 2800);
  }, []);

  // Função centralizada de colisão e ataque dos animais guardiões
  const triggerHit = useCallback((enemyName: string) => {
    const now = Date.now();
    if (now - lastHitTimeRef.current < 2000) return; // Período de invulnerabilidade
    lastHitTimeRef.current = now;
    setIsInvulnerable(true);
    setTimeout(() => setIsInvulnerable(false), 2000);
    setScore((s) => Math.max(0, s - 15));
    playSound('alert', soundEnabled);
    showNotification(`🐾 ${enemyName} pegou você! Você voltou ao início do labirinto (-15 pontos)`);
    
    // Retorna imediatamente o personagem ao início do labirinto
    playerPosRef.current = { x: 1, y: 1 };
    setPlayerPos({ x: 1, y: 1 });
  }, [soundEnabled, showNotification]);

  // Cronômetro do jogo
  useEffect(() => {
    const interval = setInterval(() => {
      if (!activeQuiz) {
        setTimer((t) => t + 1);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [activeQuiz]);

  // Movimento inteligente dos Inimigos (patrulham e tentam pegar o jogador quando perto)
  useEffect(() => {
    if (activeQuiz) return;
    const interval = setInterval(() => {
      const currentPlayer = playerPosRef.current;

      setEnemies((prev) =>
        prev.map((enemy) => {
          const moves = [
            [0, 1],
            [0, -1],
            [1, 0],
            [-1, 0]
          ];
          const validMoves = moves.filter(([dx, dy]) => {
            const nextX = enemy.x + dx;
            const nextY = enemy.y + dy;
            return (
              nextX >= 0 &&
              nextX < COLS &&
              nextY >= 0 &&
              nextY < ROWS &&
              BASE_MAZE[nextY][nextX] === 0 &&
              !(nextX === 1 && nextY === 1) // Não bloqueia o ponto de início (spawn) do jogador
            );
          });
          if (validMoves.length === 0) return enemy;

          // Distância Manhattan até o jogador
          const currentDist =
            Math.abs(enemy.x - currentPlayer.x) + Math.abs(enemy.y - currentPlayer.y);

          // Se estiver na área de agressão, tenta perseguir o jogador
          const shouldChase =
            currentDist <= enemy.aggroDist && Math.random() < enemy.chaseRate;

          let chosenMove: number[];

          if (shouldChase) {
            // Ordena os movimentos pelo que mais se aproxima do jogador
            const sortedMoves = [...validMoves].sort(([dxA, dyA], [dxB, dyB]) => {
              const distA =
                Math.abs(enemy.x + dxA - currentPlayer.x) +
                Math.abs(enemy.y + dyA - currentPlayer.y);
              const distB =
                Math.abs(enemy.x + dxB - currentPlayer.x) +
                Math.abs(enemy.y + dyB - currentPlayer.y);
              return distA - distB;
            });
            chosenMove = sortedMoves[0];
          } else {
            // Patrulha exploratória aleatória
            chosenMove = validMoves[Math.floor(Math.random() * validMoves.length)];
          }

          const nextX = enemy.x + chosenMove[0];
          const nextY = enemy.y + chosenMove[1];

          // Verifica se o animal pegou o jogador neste passo
          if (nextX === currentPlayer.x && nextY === currentPlayer.y) {
            triggerHit(enemy.name);
          }

          return {
            ...enemy,
            x: nextX,
            y: nextY,
            isChasing: shouldChase
          };
        })
      );
    }, 550);

    return () => clearInterval(interval);
  }, [activeQuiz, triggerHit]);

  // Função para mover o jogador
  const movePlayer = useCallback(
    (dx: number, dy: number) => {
      if (activeQuiz) return;

      const nextX = playerPos.x + dx;
      const nextY = playerPos.y + dy;

      // Verifica limites e paredes
      if (nextX < 0 || nextX >= COLS || nextY < 0 || nextY >= ROWS) return;
      if (BASE_MAZE[nextY][nextX] === 1) return;

      // Verifica se o jogador cruzou com algum animal guardião
      const collidedEnemy = enemies.find((e) => e.x === nextX && e.y === nextY);
      if (collidedEnemy) {
        if (Date.now() - lastHitTimeRef.current >= 2000) {
          triggerHit(collidedEnemy.name);
          return; // Retorna imediatamente pois o jogador foi enviado ao início
        }
      }

      setPlayerPos({ x: nextX, y: nextY });

      // Verifica coleta de pergaminho
      const foundIdx = collectibles.findIndex((c) => c.x === nextX && c.y === nextY);
      if (foundIdx !== -1) {
        const item = collectibles[foundIdx];
        playSound('scroll', soundEnabled);

        // Gera 3 opções de significado (1 correta e 2 distratores)
        const distractors = wordList
          .filter((w) => w.word !== item.word && w.meaning !== item.meaning)
          .map((w) => w.meaning)
          .sort(() => Math.random() - 0.5)
          .slice(0, 2);

        const options = [item.meaning, ...distractors].sort(() => Math.random() - 0.5);

        setActiveQuiz({
          item,
          stage: 'meaning',
          meaningOptions: options,
          selectedMeaning: null,
          meaningFeedback: null,
          selectedOrigin: null,
          originFeedback: null
        });
        return;
      }

      // Verifica chegada ao Portal de Saída (2)
      if (BASE_MAZE[nextY][nextX] === 2) {
        if (collectibles.length === 0) {
          playSound('fanfare', soundEnabled);
          onGameOver(score + 100, timer, totalScrolls);
        } else {
          showNotification(`✨ O Portal exige todos os pergaminhos! Faltam ${collectibles.length} para desbloquear a saída.`);
        }
      }
    },
    [
      playerPos,
      activeQuiz,
      collectibles,
      enemies,
      score,
      timer,
      soundEnabled,
      onGameOver,
      showNotification,
      triggerHit
    ]
  );

  // Escuta teclas de setas e WASD
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (activeQuiz) return;
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        e.preventDefault();
        movePlayer(0, -1);
      } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
        e.preventDefault();
        movePlayer(0, 1);
      } else if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        e.preventDefault();
        movePlayer(-1, 0);
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        e.preventDefault();
        movePlayer(1, 0);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [movePlayer, activeQuiz]);

  // Resposta da Etapa 1: Significado da Palavra
  const handleMeaningAnswer = (option: string) => {
    if (!activeQuiz || activeQuiz.meaningFeedback?.isCorrect) return;

    const isCorrect = option === activeQuiz.item.meaning;

    if (isCorrect) {
      playSound('correct', soundEnabled);
      setScore((s) => s + 25);
      setActiveQuiz({
        ...activeQuiz,
        selectedMeaning: option,
        meaningFeedback: {
          isCorrect: true,
          message: `✨ Parabéns! O significado de "${activeQuiz.item.word}" é "${option}". (+25 pontos)`
        }
      });
    } else {
      playSound('wrong', soundEnabled);
      setScore((s) => Math.max(0, s - 10));
      setActiveQuiz({
        ...activeQuiz,
        selectedMeaning: option,
        meaningFeedback: {
          isCorrect: false,
          message: `❌ Ops! "${option}" não é o significado correto de "${activeQuiz.item.word}". (-10 pontos). Tente outra alternativa!`
        }
      });
    }
  };

  // Avança da Etapa 1 para a Etapa 2
  const advanceToOriginStage = () => {
    if (!activeQuiz) return;
    setActiveQuiz({
      ...activeQuiz,
      stage: 'origin',
      selectedOrigin: null,
      originFeedback: null
    });
  };

  // Resposta da Etapa 2: Origem Cultural
  const handleOriginAnswer = (originChoice: 'Indígena' | 'Africana') => {
    if (!activeQuiz || activeQuiz.originFeedback?.isCorrect) return;

    const isCorrect = originChoice === activeQuiz.item.origin;

    if (isCorrect) {
      playSound('correct', soundEnabled);
      setScore((s) => s + 25);
      setActiveQuiz({
        ...activeQuiz,
        selectedOrigin: originChoice,
        originFeedback: {
          isCorrect: true,
          message: `🎉 Sensacional! A palavra "${activeQuiz.item.word}" é de herança ${originChoice}! (+25 pontos)`
        }
      });
    } else {
      playSound('wrong', soundEnabled);
      setScore((s) => Math.max(0, s - 10));
      setActiveQuiz({
        ...activeQuiz,
        selectedOrigin: originChoice,
        originFeedback: {
          isCorrect: false,
          message: `❌ Quase lá! "${activeQuiz.item.word}" não é de origem ${originChoice}. (-10 pontos). Escolha a outra opção!`
        }
      });
    }
  };

  // Conclui o Quiz e recolhe o pergaminho
  const handleFinishQuiz = () => {
    if (!activeQuiz) return;

    const completedWord = activeQuiz.item.word;
    setCollectibles((prev) => {
      const next = prev.filter((item) => item.id !== activeQuiz.item.id);
      if (next.length === 0) {
        showNotification(`🌟 Todos os 6 pergaminhos foram resgatados! Vá até o Portal de Saída Dourado!`);
      } else {
        showNotification(`📜 Pergaminho "${completedWord}" registrado no seu diário! Restam ${next.length}.`);
      }
      return next;
    });

    setActiveQuiz(null);
  };

  return (
    <div className="w-full h-full flex flex-col items-center justify-between">
      {/* HUD Superior: Painel alegre e bem estruturado */}
      <div className="w-full max-w-6xl bg-white/95 backdrop-blur-md rounded-2xl shadow-md border-2 border-emerald-200 px-3 py-2 sm:px-4 sm:py-2.5 mb-2 flex flex-wrap items-center justify-between gap-2 sm:gap-3 flex-shrink-0">
        {/* Explorador & Pontos */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-amber-400 text-slate-900 flex items-center justify-center text-lg sm:text-xl shadow-inner font-bold">
            {character}
          </div>
          <div>
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Explorador(a)</div>
            <div className="text-xs sm:text-base font-extrabold text-emerald-950 leading-tight">
              {studentName}
            </div>
          </div>
        </div>

        {/* Indicadores Principais */}
        <div className="flex items-center gap-1.5 sm:gap-3 flex-wrap">
          {/* Pontuação */}
          <div className="flex items-center gap-1.5 bg-emerald-50 px-2.5 sm:px-3.5 py-1.5 rounded-xl border border-emerald-200">
            <Trophy className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600" />
            <span className="text-[11px] sm:text-xs font-bold text-slate-600 uppercase">Pontos:</span>
            <span className="text-sm sm:text-lg font-black text-emerald-800">{score}</span>
          </div>

          {/* Tempo */}
          <div className="flex items-center gap-1.5 bg-amber-50 px-2.5 sm:px-3.5 py-1.5 rounded-xl border border-amber-200">
            <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-600" />
            <span className="text-[11px] sm:text-xs font-bold text-slate-600 uppercase">Tempo:</span>
            <span className="text-sm sm:text-lg font-black text-amber-800 font-mono">{timer}s</span>
          </div>

          {/* Pergaminhos Coletados */}
          <div className="flex items-center gap-1.5 bg-teal-50 px-2.5 sm:px-3.5 py-1.5 rounded-xl border border-teal-200">
            <span className="text-base sm:text-lg">📜</span>
            <span className="text-[11px] sm:text-xs font-bold text-slate-600 uppercase">Pergaminhos:</span>
            <span className="text-sm sm:text-lg font-black text-teal-800 font-mono">
              {collectedCount}/{totalScrolls}
            </span>
          </div>

          {/* Som Ativar/Desativar */}
          <button
            type="button"
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-1.5 sm:p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer"
            title={soundEnabled ? 'Desativar Som' : 'Ativar Som'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-700" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
          </button>

          {/* Botão de Tela Cheia */}
          <button
            type="button"
            onClick={toggleFullscreen}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-amber-100 hover:bg-amber-200 active:bg-amber-300 text-amber-900 border border-amber-300 font-bold text-xs transition cursor-pointer shadow-sm"
            title={isFullscreen ? 'Sair da Tela Cheia' : 'Entrar em Tela Cheia'}
          >
            {isFullscreen ? (
              <>
                <Minimize className="w-3.5 h-3.5 text-amber-800" />
                <span className="hidden sm:inline">Normal</span>
              </>
            ) : (
              <>
                <Maximize className="w-3.5 h-3.5 text-amber-800" />
                <span className="hidden sm:inline">Tela Cheia</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Alerta de Notificação Flutuante */}
      {notification && (
        <div className="fixed top-16 z-40 bg-emerald-900 text-amber-200 px-5 py-2 rounded-full shadow-xl border-2 border-amber-400 font-bold text-xs sm:text-sm flex items-center gap-2 animate-bounce">
          <Sparkles className="w-4 h-4 text-amber-300" />
          <span>{notification}</span>
        </div>
      )}

      {/* Container Principal do Labirinto (Horizontal e Alegre) */}
      <div className="relative w-full max-w-6xl bg-emerald-900/10 p-2 sm:p-3 rounded-2xl shadow-xl border-4 border-emerald-600/60 bg-gradient-to-br from-emerald-100/80 via-amber-50/60 to-teal-100/80 my-auto flex items-center justify-center">
        
        {/* O Labirinto em Grid 24 colunas x 13 linhas */}
        <div 
          className="grid w-full aspect-[24/13] max-h-[calc(100vh-210px)] gap-[1.5px] sm:gap-[2.5px] bg-emerald-800/40 p-1.5 sm:p-2.5 rounded-xl shadow-inner select-none mx-auto"
          style={{
            gridTemplateColumns: `repeat(${COLS}, minmax(0, 1fr))`,
            gridTemplateRows: `repeat(${ROWS}, minmax(0, 1fr))`
          }}
        >
          {BASE_MAZE.map((row, y) =>
            row.map((cell, x) => {
              const isWall = cell === 1;
              const isExit = cell === 2;
              const isPlayer = playerPos.x === x && playerPos.y === y;
              const enemyOnCell = enemies.find((e) => e.x === x && e.y === y);
              const collectibleOnCell = collectibles.find((c) => c.x === x && c.y === y);

              return (
                <div
                  key={`${x}-${y}`}
                  className={`relative flex items-center justify-center transition-all ${
                    isWall
                      ? 'bg-emerald-600 border border-emerald-700/70 rounded-[4px] sm:rounded-[6px] shadow-sm'
                      : 'bg-amber-100/90 border border-amber-200/50 rounded-[3px] sm:rounded-[5px]'
                  }`}
                >
                  {/* Saída Dourada */}
                  {isExit && (
                    <div 
                      className={`w-full h-full flex items-center justify-center rounded-[4px] font-bold text-sm sm:text-lg transition-all ${
                        collectibles.length === 0 
                          ? 'bg-amber-400 text-amber-950 animate-pulse ring-2 ring-amber-300 shadow-md' 
                          : 'bg-amber-200/70 text-amber-800'
                      }`}
                      title={collectibles.length === 0 ? 'Portal Aberto!' : 'Colete todos os pergaminhos primeiro'}
                    >
                      🏆
                    </div>
                  )}

                  {/* Pergaminho Colecionável */}
                  {!isWall && collectibleOnCell && (
                    <div className="relative flex items-center justify-center animate-pulse z-10">
                      <span className="text-sm sm:text-lg filter drop-shadow-md cursor-pointer transform hover:scale-125 transition">
                        📜
                      </span>
                    </div>
                  )}

                  {/* Inimigo Guardião */}
                  {!isWall && enemyOnCell && (
                    <div 
                      className="absolute inset-0 flex items-center justify-center z-20 transition-all pointer-events-none"
                      title={`${enemyOnCell.name} ${enemyOnCell.isChasing ? '(À espreita - perseguindo!)' : ''}`}
                    >
                      <div className={`relative flex items-center justify-center transition-transform duration-200 ${
                        enemyOnCell.isChasing ? 'scale-125' : 'hover:scale-110'
                      }`}>
                        <span className="text-sm sm:text-lg filter drop-shadow-sm">
                          {enemyOnCell.avatar}
                        </span>
                        {enemyOnCell.isChasing && (
                          <span 
                            className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-rose-500 text-white text-[8px] font-black flex items-center justify-center shadow animate-ping"
                            title="Em perseguição!"
                          >
                            !
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Jogador(a) */}
                  {isPlayer && (
                    <div className="absolute inset-0 flex items-center justify-center z-30 pointer-events-none">
                      <div className={`w-full h-full rounded-full flex items-center justify-center shadow-md transition-all ${
                        isInvulnerable 
                          ? 'bg-rose-400/90 ring-4 ring-rose-500 animate-pulse scale-110' 
                          : 'bg-amber-400/90 ring-2 ring-emerald-600 animate-bounce'
                      }`}>
                        <span className="text-sm sm:text-lg leading-none filter drop-shadow">
                          {character}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* MODAL DO QUIZ: SOBREPONDO A TELA TOTALMENTE VISÍVEL E SEM NECESSIDADE DE ROLAGEM */}
      {activeQuiz && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto animate-fade-in">
          <div className="w-full max-w-lg bg-white rounded-2xl sm:rounded-3xl shadow-2xl border-4 border-emerald-400 p-4 sm:p-5 flex flex-col text-slate-800 my-auto">
            
            {/* Cabeçalho do Quiz */}
            <div className="flex items-center justify-between border-b border-emerald-100 pb-2.5 mb-3">
              <div className="flex items-center gap-2">
                <span className="text-2xl">📜</span>
                <div>
                  <span className="text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    {activeQuiz.stage === 'meaning' ? 'Etapa 1 de 2: Significado' : 'Etapa 2 de 2: Origem Cultural'}
                  </span>
                  <h3 className="text-base sm:text-lg font-black text-emerald-950 leading-tight mt-0.5">
                    Palavra: <span className="text-emerald-600 underline decoration-amber-400 decoration-2">{activeQuiz.item.word}</span>
                  </h3>
                </div>
              </div>

              <div className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                +25 pts
              </div>
            </div>

            {/* ETAPA 1: PERGUNTA DO SIGNIFICADO */}
            {activeQuiz.stage === 'meaning' && (
              <div className="flex flex-col">
                <p className="text-xs sm:text-sm text-slate-700 font-medium mb-3">
                  Qual é o <b>significado correto</b> da palavra <span className="font-bold text-emerald-800">"{activeQuiz.item.word}"</span> no vocabulário brasileiro?
                </p>

                {/* Opções de Múltipla Escolha */}
                <div className="flex flex-col gap-2 mb-3">
                  {activeQuiz.meaningOptions.map((option, idx) => {
                    const isSelected = activeQuiz.selectedMeaning === option;
                    const isCorrectChoice = option === activeQuiz.item.meaning;
                    const hasAnswered = activeQuiz.meaningFeedback !== null;

                    let btnStyle = 'bg-slate-50 hover:bg-emerald-50 border-slate-200 text-slate-800';
                    if (hasAnswered && isSelected) {
                      btnStyle = isCorrectChoice
                        ? 'bg-emerald-100 border-emerald-500 text-emerald-950 font-bold ring-2 ring-emerald-400'
                        : 'bg-rose-50 border-rose-400 text-rose-950 font-bold';
                    }

                    return (
                      <button
                        key={option}
                        type="button"
                        disabled={activeQuiz.meaningFeedback?.isCorrect}
                        onClick={() => handleMeaningAnswer(option)}
                        className={`w-full text-left p-2.5 sm:p-3 rounded-xl border-2 transition-all flex items-center justify-between text-xs sm:text-sm font-semibold cursor-pointer ${btnStyle}`}
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 text-[11px] font-black flex items-center justify-center shrink-0">
                            {String.fromCharCode(65 + idx)}
                          </span>
                          <span className="leading-snug">{option}</span>
                        </div>

                        {hasAnswered && isSelected && (
                          <span className="shrink-0 ml-2">
                            {isCorrectChoice ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            ) : (
                              <XCircle className="w-4 h-4 text-rose-600" />
                            )}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Feedback explícito de erro ou acerto */}
                {activeQuiz.meaningFeedback && (
                  <div
                    className={`p-2.5 rounded-xl mb-3 text-xs font-semibold flex items-start gap-2 ${
                      activeQuiz.meaningFeedback.isCorrect
                        ? 'bg-emerald-50 border-2 border-emerald-300 text-emerald-900'
                        : 'bg-rose-50 border-2 border-rose-300 text-rose-900'
                    }`}
                  >
                    {activeQuiz.meaningFeedback.isCorrect ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    )}
                    <div className="leading-tight">{activeQuiz.meaningFeedback.message}</div>
                  </div>
                )}

                {/* Botão para Avançar quando acertou o significado */}
                {activeQuiz.meaningFeedback?.isCorrect && (
                  <button
                    type="button"
                    onClick={advanceToOriginStage}
                    className="w-full py-2.5 sm:py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-black text-xs sm:text-sm rounded-xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                  >
                    <span>Avançar para a Pergunta de Origem</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            )}

            {/* ETAPA 2: PERGUNTA DA ORIGEM (INDÍGENA OU AFRICANA) */}
            {activeQuiz.stage === 'origin' && (
              <div className="flex flex-col">
                <div className="bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200 mb-2.5 text-xs text-emerald-900 flex items-center gap-1.5">
                  <span className="font-bold">Significado descoberto:</span> 
                  <span className="truncate">"{activeQuiz.item.meaning}"</span>
                </div>

                <p className="text-xs sm:text-sm text-slate-700 font-medium mb-3">
                  De qual matriz cultural vem a palavra <span className="font-bold text-emerald-800">"{activeQuiz.item.word}"</span>?
                </p>

                {/* Botões de Escolha: Indígena ou Africana */}
                <div className="grid grid-cols-2 gap-2.5 mb-3">
                  {/* Opção Indígena */}
                  <button
                    type="button"
                    disabled={activeQuiz.originFeedback?.isCorrect}
                    onClick={() => handleOriginAnswer('Indígena')}
                    className={`p-2.5 sm:p-3 rounded-xl border-2 transition-all flex flex-col items-center text-center cursor-pointer ${
                      activeQuiz.selectedOrigin === 'Indígena'
                        ? activeQuiz.originFeedback?.isCorrect
                          ? 'bg-emerald-100 border-emerald-500 text-emerald-950 font-bold ring-2 ring-emerald-400 shadow-sm'
                          : 'bg-rose-50 border-rose-400 text-rose-950 font-bold'
                        : 'bg-gradient-to-b from-emerald-50 to-white border-emerald-200 hover:border-emerald-400 hover:shadow-sm'
                    }`}
                  >
                    <span className="text-2xl sm:text-3xl mb-0.5">🏹</span>
                    <span className="font-black text-xs sm:text-sm text-emerald-900">Origem Indígena</span>
                    <span className="text-[10px] text-slate-500 mt-0.5 hidden sm:block">Tupi, Guarani e outros</span>
                  </button>

                  {/* Opção Africana */}
                  <button
                    type="button"
                    disabled={activeQuiz.originFeedback?.isCorrect}
                    onClick={() => handleOriginAnswer('Africana')}
                    className={`p-2.5 sm:p-3 rounded-xl border-2 transition-all flex flex-col items-center text-center cursor-pointer ${
                      activeQuiz.selectedOrigin === 'Africana'
                        ? activeQuiz.originFeedback?.isCorrect
                          ? 'bg-amber-100 border-amber-500 text-amber-950 font-bold ring-2 ring-amber-400 shadow-sm'
                          : 'bg-rose-50 border-rose-400 text-rose-950 font-bold'
                        : 'bg-gradient-to-b from-amber-50 to-white border-amber-200 hover:border-amber-400 hover:shadow-sm'
                    }`}
                  >
                    <span className="text-2xl sm:text-3xl mb-0.5">🥁</span>
                    <span className="font-black text-xs sm:text-sm text-amber-900">Origem Africana</span>
                    <span className="text-[10px] text-slate-500 mt-0.5 hidden sm:block">Iorubá, Quimbundo, Bantu</span>
                  </button>
                </div>

                {/* Feedback explícito da Origem */}
                {activeQuiz.originFeedback && (
                  <div
                    className={`p-2.5 rounded-xl mb-3 text-xs font-semibold flex items-start gap-2 ${
                      activeQuiz.originFeedback.isCorrect
                        ? 'bg-emerald-50 border-2 border-emerald-300 text-emerald-900'
                        : 'bg-rose-50 border-2 border-rose-300 text-rose-900'
                    }`}
                  >
                    {activeQuiz.originFeedback.isCorrect ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    )}
                    <div className="leading-tight">
                      <div>{activeQuiz.originFeedback.message}</div>
                      {activeQuiz.originFeedback.isCorrect && (
                        <div className="mt-1 text-slate-600 font-normal text-[11px]">
                          💡 Mais de 20 mil palavras do português brasileiro têm raízes indígenas e africanas!
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Botão para Guardar o Pergaminho e Voltar ao Labirinto */}
                {activeQuiz.originFeedback?.isCorrect && (
                  <button
                    type="button"
                    onClick={handleFinishQuiz}
                    className="w-full py-2.5 sm:py-3 bg-gradient-to-r from-amber-500 via-emerald-500 to-teal-600 hover:from-amber-600 hover:to-teal-700 text-white font-black text-xs sm:text-sm rounded-xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                  >
                    <Sparkles className="w-4 h-4 text-amber-200" />
                    <span>Coletar Pergaminho e Continuar no Labirinto</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Controles Virtuais na Tela (D-PAD) e Instruções */}
      <div className="w-full max-w-6xl mt-2 flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-4 bg-white/90 backdrop-blur-sm px-3.5 py-2 rounded-2xl border border-emerald-200 flex-shrink-0">
        <div className="text-xs text-slate-600 flex items-center gap-2">
          <HelpCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>
            Use as <b>setas do teclado</b> ou <b>W, A, S, D</b> para mover seu explorador. Cuidado com os animais guardiões: se for pego, perde 15 pontos e volta ao início!
          </span>
        </div>

        {/* D-Pad Virtual */}
        <div className="flex flex-col items-center gap-1 select-none flex-shrink-0">
          <button
            type="button"
            onClick={() => movePlayer(0, -1)}
            disabled={!!activeQuiz}
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-emerald-100 hover:bg-emerald-200 active:bg-emerald-300 text-emerald-800 flex items-center justify-center shadow-sm border border-emerald-300 cursor-pointer disabled:opacity-50"
            title="Mover para Cima"
          >
            <ArrowUp className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
          <div className="flex gap-1">
            <button
              type="button"
              onClick={() => movePlayer(-1, 0)}
              disabled={!!activeQuiz}
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-emerald-100 hover:bg-emerald-200 active:bg-emerald-300 text-emerald-800 flex items-center justify-center shadow-sm border border-emerald-300 cursor-pointer disabled:opacity-50"
              title="Mover para Esquerda"
            >
              <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
            <button
              type="button"
              onClick={() => movePlayer(0, 1)}
              disabled={!!activeQuiz}
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-emerald-100 hover:bg-emerald-200 active:bg-emerald-300 text-emerald-800 flex items-center justify-center shadow-sm border border-emerald-300 cursor-pointer disabled:opacity-50"
              title="Mover para Baixo"
            >
              <ArrowDown className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
            <button
              type="button"
              onClick={() => movePlayer(1, 0)}
              disabled={!!activeQuiz}
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-emerald-100 hover:bg-emerald-200 active:bg-emerald-300 text-emerald-800 flex items-center justify-center shadow-sm border border-emerald-300 cursor-pointer disabled:opacity-50"
              title="Mover para Direita"
            >
              <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
