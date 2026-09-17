import React, { useState } from 'react';
import { MazeGame } from './components/Game';
import { Compass, Sparkles, Award, User, GraduationCap, RotateCcw, BookOpen } from 'lucide-react';

interface Character {
  id: string;
  name: string;
  title: string;
  avatar: string;
  description: string;
  color: string;
}

const CHARACTERS: Character[] = [
  {
    id: 'tupi',
    name: 'Moara',
    title: 'Guardiã da Floresta',
    avatar: '🏹',
    description: 'Conhecedora das trilhas e dos saberes indígenas',
    color: 'from-emerald-500 to-teal-600'
  },
  {
    id: 'bantu',
    name: 'Akin',
    title: 'Mestre dos Ritmos',
    avatar: '🥁',
    description: 'Explorador da rica herança linguística afro-brasileira',
    color: 'from-amber-500 to-orange-600'
  },
  {
    id: 'arqueo',
    name: 'Kauê',
    title: 'Arqueólogo Jovem',
    avatar: '🧭',
    description: 'Detetive da história e dos enigmas das palavras',
    color: 'from-sky-500 to-indigo-600'
  },
  {
    id: 'biologa',
    name: 'Dandara',
    title: 'Pesquisadora Cultural',
    avatar: '📜',
    description: 'Apaixonada pela literatura e raízes do Brasil',
    color: 'from-purple-500 to-pink-600'
  }
];

export default function App() {
  const [studentInfo, setStudentInfo] = useState({ name: '', class: '' });
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);
  const [showGame, setShowGame] = useState(false);
  const [finalScore, setFinalScore] = useState<{score: number, time: number, scrollsCollected: number} | null>(null);

  const requestFullScreen = () => {
    try {
      const elem = document.documentElement as HTMLElement & {
        webkitRequestFullscreen?: () => Promise<void>;
        msRequestFullscreen?: () => Promise<void>;
      };
      if (elem.requestFullscreen) {
        elem.requestFullscreen().catch(() => {});
      } else if (elem.webkitRequestFullscreen) {
        elem.webkitRequestFullscreen().catch(() => {});
      } else if (elem.msRequestFullscreen) {
        elem.msRequestFullscreen().catch(() => {});
      }
    } catch {
      // Ignora silenciosamente restrições do navegador
    }
  };

  const exitFullScreen = () => {
    try {
      const doc = document as Document & {
        webkitExitFullscreen?: () => Promise<void>;
        msExitFullscreen?: () => Promise<void>;
      };
      if (document.fullscreenElement) {
        if (doc.exitFullscreen) {
          doc.exitFullscreen().catch(() => {});
        } else if (doc.webkitExitFullscreen) {
          doc.webkitExitFullscreen().catch(() => {});
        } else if (doc.msExitFullscreen) {
          doc.msExitFullscreen().catch(() => {});
        }
      }
    } catch {
      // Ignora silenciosamente
    }
  };

  const handleStartGame = () => {
    if (!studentInfo.name.trim()) return;
    if (!selectedCharacter) {
      setSelectedCharacter(CHARACTERS[0]);
    }
    requestFullScreen();
    setShowGame(true);
  };

  const handleGameOver = (score: number, time: number, scrollsCollected: number) => {
    exitFullScreen();
    setShowGame(false);
    setFinalScore({ score, time, scrollsCollected });
  };

  const handleReset = () => {
    exitFullScreen();
    setFinalScore(null);
    setShowGame(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-amber-50/70 to-teal-50 flex flex-col text-slate-800 font-sans">
      {/* Header Alegre e Vibrante (apenas na tela inicial e no resultado final) */}
      {!showGame && (
        <header className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white shadow-lg border-b-4 border-amber-400">
          <div className="max-w-6xl mx-auto px-4 py-4 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-400 text-emerald-900 flex items-center justify-center text-2xl shadow-inner font-bold">
                🗺️
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-2">
                  Mapeando Origens
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-400 text-emerald-950 uppercase tracking-wider">
                    7º ao 9º Ano
                  </span>
                </h1>
                <p className="text-xs sm:text-sm text-emerald-100 font-medium">
                  Caça ao Tesouro das Palavras Indígenas e Africanas no Brasil
                </p>
              </div>
            </div>
          </div>
        </header>
      )}

      {/* Área Principal */}
      <main className={showGame ? "fixed inset-0 z-40 bg-gradient-to-br from-emerald-100/90 via-amber-50/80 to-teal-100/90 overflow-y-auto sm:overflow-hidden flex flex-col justify-between" : "flex-grow flex flex-col items-center justify-center p-3 sm:p-6 w-full max-w-7xl mx-auto"}>
        {/* Tela Inicial: Nome, Turma e Personagem */}
        {!showGame && !finalScore && (
          <div className="w-full max-w-2xl bg-white/90 backdrop-blur-md rounded-3xl shadow-xl border-2 border-emerald-100 p-6 sm:p-8">
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold uppercase tracking-wider mb-3">
                <Sparkles className="w-3.5 h-3.5" /> Desafio de Língua Portuguesa & Cultura
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-emerald-900 mb-2">
                Pronto para a Expedição?
              </h2>
              <p className="text-slate-600 text-sm sm:text-base max-w-md mx-auto">
                Explore o labirinto, desvie dos guardiões e resgate pergaminhos sagrados decifrando o <b>significado</b> e a <b>origem</b> de palavras do nosso dia a dia!
              </p>
            </div>

            {/* Formulário de Identificação */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1.5 flex items-center gap-1.5">
                  <User className="w-4 h-4 text-emerald-600" /> Nome do(a) Aluno(a) *
                </label>
                <input 
                  type="text"
                  className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl focus:border-emerald-500 focus:bg-white focus:outline-none transition font-medium"
                  placeholder="Ex: Mariana Silva"
                  value={studentInfo.name}
                  onChange={(e) => setStudentInfo({...studentInfo, name: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1.5 flex items-center gap-1.5">
                  <GraduationCap className="w-4 h-4 text-emerald-600" /> Turma / Série
                </label>
                <input 
                  type="text"
                  className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl focus:border-emerald-500 focus:bg-white focus:outline-none transition font-medium"
                  placeholder="Ex: 8º Ano B"
                  value={studentInfo.class}
                  onChange={(e) => setStudentInfo({...studentInfo, class: e.target.value})}
                />
              </div>
            </div>

            {/* Escolha do Personagem */}
            <div className="mb-8">
              <label className="block text-xs font-bold uppercase text-slate-600 mb-3 flex items-center gap-1.5">
                <Compass className="w-4 h-4 text-emerald-600" /> Escolha seu(sua) Personagem:
              </label>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {CHARACTERS.map((char) => {
                  const isSelected = selectedCharacter?.id === char.id;
                  return (
                    <button
                      key={char.id}
                      type="button"
                      onClick={() => setSelectedCharacter(char)}
                      className={`flex flex-col items-center text-center p-3 rounded-2xl border-2 transition-all cursor-pointer ${
                        isSelected 
                          ? 'border-emerald-500 bg-emerald-50/80 shadow-md scale-102 ring-2 ring-emerald-400' 
                          : 'border-slate-200 bg-white hover:border-emerald-300 hover:bg-slate-50'
                      }`}
                    >
                      <div className="text-4xl mb-1.5 filter drop-shadow-sm">{char.avatar}</div>
                      <span className="font-bold text-sm text-slate-800 leading-tight">{char.name}</span>
                      <span className="text-[11px] text-emerald-700 font-semibold">{char.title}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Botão de Início */}
            <button 
              disabled={!studentInfo.name.trim()}
              onClick={handleStartGame}
              className={`w-full py-4 rounded-2xl text-lg font-black text-white shadow-lg transition-all flex items-center justify-center gap-3 ${
                studentInfo.name.trim()
                  ? 'bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-600 hover:to-teal-700 hover:shadow-emerald-200 hover:shadow-xl cursor-pointer active:scale-98'
                  : 'bg-slate-300 cursor-not-allowed opacity-70'
              }`}
            >
              <Sparkles className="w-5 h-5 text-amber-300" />
              Entrar no Labirinto
            </button>
          </div>
        )}

        {/* Jogo do Labirinto Ativo */}
        {showGame && studentInfo.name && (
          <MazeGame 
            studentName={studentInfo.name} 
            character={selectedCharacter?.avatar || '🧭'} 
            onGameOver={handleGameOver} 
          />
        )}

        {/* Tela de Pontuação Final */}
        {finalScore && (
          <div className="bg-white/95 backdrop-blur-md p-8 sm:p-10 rounded-3xl shadow-2xl border-2 border-emerald-200 w-full max-w-lg text-center animate-fade-in">
            <div className="w-20 h-20 mx-auto mb-4 rounded-3xl bg-gradient-to-br from-amber-400 to-amber-500 text-white flex items-center justify-center text-4xl shadow-lg">
              🏆
            </div>
            
            <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold uppercase tracking-wider">
              Missão Concluída com Sucesso!
            </span>
            
            <h2 className="text-3xl font-black text-emerald-950 mt-2 mb-1">
              Sensacional, {studentInfo.name}!
            </h2>
            <p className="text-sm text-slate-600 mb-6">
              Você desvendou as raízes das palavras que moldam a identidade do Brasil.
            </p>

            {/* Painel de Resultados */}
            <div className="grid grid-cols-3 gap-3 bg-emerald-50/80 p-4 rounded-2xl border border-emerald-200/80 mb-6 text-center">
              <div className="p-2">
                <p className="text-[11px] font-bold text-slate-500 uppercase">Pontos</p>
                <p className="text-2xl font-black text-emerald-700">{finalScore.score}</p>
              </div>
              <div className="p-2 border-x border-emerald-200">
                <p className="text-[11px] font-bold text-slate-500 uppercase">Tempo</p>
                <p className="text-2xl font-black text-teal-700">{finalScore.time}s</p>
              </div>
              <div className="p-2">
                <p className="text-[11px] font-bold text-slate-500 uppercase">Pergaminhos</p>
                <p className="text-2xl font-black text-amber-600">{finalScore.scrollsCollected} / 10</p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button 
                className="flex-1 px-6 py-3.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold rounded-xl hover:from-emerald-600 hover:to-teal-700 transition shadow-md flex items-center justify-center gap-2 cursor-pointer"
                onClick={() => { setFinalScore(null); setShowGame(true); }}
              >
                <RotateCcw className="w-4 h-4" /> Jogar Novamente
              </button>
              
              <button 
                className="px-6 py-3.5 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition border border-slate-200 cursor-pointer"
                onClick={handleReset}
              >
                Novo Explorador
              </button>
            </div>
          </div>
        )}
        {showGame && (
          <footer className="p-4 mt-auto bg-transparent flex justify-center text-xs text-slate-600 max-w-7xl mx-auto w-full px-6">
            <div className="text-base font-serif font-bold text-emerald-950">
              by Fabiana Couto
            </div>
          </footer>
        )}
      </main>

      {/* Rodapé com Assinatura Autoral Solicitada */}
      {!showGame && (
        <footer className="p-4 mt-6 bg-white/70 backdrop-blur-sm border-t border-emerald-100 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-600 max-w-7xl mx-auto w-full px-6">
          <div className="flex items-center gap-1.5 font-medium text-emerald-800">
            <BookOpen className="w-4 h-4 text-emerald-600" />
            <span>Atividade Pedagógica: Língua Portuguesa & Diversidade Étnico-Racial</span>
          </div>
          <div className="mt-2 sm:mt-0 text-base font-serif font-bold text-emerald-950">
            by Fabiana Couto
          </div>
        </footer>
      )}
    </div>
  );
}
