import { useState, useEffect } from "react";
import { useParams } from "react-router";
import { Circle, ChevronLeft, ChevronRight, Copy, Check, Clock, Plus, Minus } from "lucide-react";
import { getEvent, type EventDocument } from "../services/events/eventService";
import "./TournamentAdmin.css";

interface AthleteListProps {
  event: EventDocument;
  athleteIds: string[];
  activeAthlete: string | null;
  onAthleteClick: (athleteId: string) => void;
  isTeam2?: boolean;
}

const AthleteList = ({ event, athleteIds, activeAthlete, onAthleteClick, isTeam2 = false }: AthleteListProps) => {
  const isAthleteActive = (athleteId: string): boolean => {
    return activeAthlete === athleteId;
  };

  const getAthleteName = (athleteId: string): string => {
    return event[athleteId as keyof EventDocument] as string;
  };

  return (
    <div className="athletes-list">
      {athleteIds.map((athleteId) => (
        <div key={athleteId} className={`athlete-item ${isTeam2 ? "team2" : ""}`}>
          {!isTeam2 && (
            <button
              className={`tennis-button ${isAthleteActive(athleteId) ? "active" : ""}`}
              onClick={() => onAthleteClick(athleteId)}
              aria-label={`Atleta ${athleteId}`}
            >
              <Circle size={20} fill={isAthleteActive(athleteId) ? "currentColor" : "none"} />
            </button>
          )}
          <span className="athlete-name">{getAthleteName(athleteId)}</span>
          {isTeam2 && (
            <button
              className={`tennis-button ${isAthleteActive(athleteId) ? "active" : ""}`}
              onClick={() => onAthleteClick(athleteId)}
              aria-label={`Atleta ${athleteId}`}
            >
              <Circle size={20} fill={isAthleteActive(athleteId) ? "currentColor" : "none"} />
            </button>
          )}
        </div>
      ))}
    </div>
  );
};

interface ScoreControlsProps {
  score: number;
  onIncrement: () => void;
  onDecrement: () => void;
  teamColor: string;
}

const ScoreControls = ({ score, onIncrement, onDecrement, teamColor }: ScoreControlsProps) => {
  const formatScore = (score: number): string => {
    return String(score).padStart(2, "0");
  };

  return (
    <div className="score-controls">
      <button
        onClick={onIncrement}
        className="score-button score-button-plus"
        aria-label="Aumentar pontuação"
      >
        <Plus size={28} />
      </button>
      <div className="score-display" style={{ color: teamColor }}>
        {formatScore(score)}
      </div>
      <button
        onClick={onDecrement}
        className="score-button score-button-minus"
        aria-label="Diminuir pontuação"
        disabled={score === 0}
      >
        <Minus size={28} />
      </button>
    </div>
  );
};

interface SetsDisplayProps {
  sets: number;
}

const SetsDisplay = ({ sets }: SetsDisplayProps) => {
  return (
    <div className="sets-controls">
      <div className="sets-label">Sets</div>
      <div className="sets-display">{String(sets).padStart(2, "0")}</div>
    </div>
  );
};

interface GamesDisplayProps {
  games: number;
}

const GamesDisplay = ({ games }: GamesDisplayProps) => {
  return (
    <div className="games-controls">
      <div className="games-label">Games</div>
      <div className="games-display">{String(games).padStart(2, "0")}</div>
    </div>
  );
};

interface TeamSectionProps {
  event: EventDocument;
  teamLabel: string;
  athleteIds: string[];
  activeAthlete: string | null;
  score: number;
  games: number;
  sets: number;
  onAthleteClick: (athleteId: string) => void;
  onIncrementScore: () => void;
  onDecrementScore: () => void;
  teamColor: string;
  teamColors: string[];
  isTeam2?: boolean;
}

const TeamSection = ({
  event,
  athleteIds,
  activeAthlete,
  score,
  games,
  sets,
  onAthleteClick,
  onIncrementScore,
  onDecrementScore,
  teamColor,
  isTeam2 = false,
}: TeamSectionProps) => {
  return (
    <div className={`team-section ${athleteIds[0].includes("Dupla1") ? "team-left" : "team-right"}`}>
      <AthleteList
        event={event}
        athleteIds={athleteIds}
        activeAthlete={activeAthlete}
        onAthleteClick={onAthleteClick}
        isTeam2={isTeam2}
      />
      <ScoreControls
        score={score}
        onIncrement={onIncrementScore}
        onDecrement={onDecrementScore}
        teamColor={teamColor}
      />
      <div className="sets-games-container">
        <SetsDisplay sets={sets} />
        <GamesDisplay games={games} />
      </div>
    </div>
  );
};

const TournamentAdmin = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const [event, setEvent] = useState<EventDocument | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [activeAthlete, setActiveAthlete] = useState<string | null>(null);
  const [team1Score, setTeam1Score] = useState<number>(0);
  const [team2Score, setTeam2Score] = useState<number>(0);
  const [team1Games, setTeam1Games] = useState<number>(0);
  const [team2Games, setTeam2Games] = useState<number>(0);
  const [team1Sets, setTeam1Sets] = useState<number>(0);
  const [team2Sets, setTeam2Sets] = useState<number>(0);
  const [lastSelectedTeam1, setLastSelectedTeam1] = useState<string | null>(null);
  const [lastSelectedTeam2, setLastSelectedTeam2] = useState<string | null>(null);
  const [isTieBreak, setIsTieBreak] = useState<boolean>(false);
  const [setsWonHistory, setSetsWonHistory] = useState<("team1" | "team2")[]>([]);
  const [linkCopied, setLinkCopied] = useState<boolean>(false);
  const [isTimerEnabled, setIsTimerEnabled] = useState<boolean>(false);

  // Pausa o timer quando ele é desabilitado ou quando o evento não tem gameTime
  useEffect(() => {
    if (event && !event.gameTime) {
      setIsTimerEnabled(false);
      if (isRunning) {
        setIsRunning(false);
      }
    } else if (!isTimerEnabled && isRunning) {
      setIsRunning(false);
    }
  }, [event, isTimerEnabled, isRunning]);

  useEffect(() => {
    const loadEvent = async () => {
      if (!eventId) {
        setError("ID do evento não encontrado");
        setLoading(false);
        return;
      }

      try {
        const eventData = await getEvent(eventId);
        if (eventData) {
          setEvent(eventData);
          // Define o estado do timer baseado na propriedade gameTime do evento
          setIsTimerEnabled(eventData.gameTime || false);
        } else {
          setError("Evento não encontrado");
        }
      } catch (err: any) {
        setError(err.message || "Erro ao carregar evento");
      } finally {
        setLoading(false);
      }
    };

    loadEvent();
  }, [eventId]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;

    if (isRunning) {
      interval = setInterval(() => {
        setTimeElapsed((prev) => prev + 1);
      }, 1000);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isRunning]);

  // Sincroniza dados com localStorage para o overlay
  useEffect(() => {
    if (!eventId) return;

    const data = {
      timeElapsed,
      isRunning,
      activeAthlete,
      team1Score,
      team2Score,
      team1Games,
      team2Games,
      team1Sets,
      team2Sets,
      isTimerEnabled,
    };

    localStorage.setItem(`tournament_${eventId}`, JSON.stringify(data));
  }, [eventId, timeElapsed, isRunning, activeAthlete, team1Score, team2Score, team1Games, team2Games, team1Sets, team2Sets, isTimerEnabled]);

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  const handleTimerClick = () => {
    setIsRunning(!isRunning);
  };

  if (loading) {
    return (
      <div className="tournament-admin-container">
        <div className="loading-message">Carregando...</div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="tournament-admin-container">
        <div className="error-message">{error || "Evento não encontrado"}</div>
      </div>
    );
  }

  const handleAthleteClick = (athleteId: string) => {
    if (!event) return;

    // Identifica qual time o atleta pertence
    const isTeam1 = athleteId.includes("Dupla1");

    // Se for singles, apenas ativa/desativa o atleta
    if (event.isSingles) {
      if (activeAthlete === athleteId) {
        setActiveAthlete(null);
      } else {
        setActiveAthlete(athleteId);
      }
      return;
    }

    // Verifica se já temos seleções de ambos os times (modo de ciclo ativo)
    const isCyclingMode = lastSelectedTeam1 !== null && lastSelectedTeam2 !== null;

    if (isCyclingMode) {
      // Durante o ciclo: atualiza o último selecionado do time e ativa o atleta clicado
      // Se clicamos no time oposto, o jogador que estava ativo antes deve se tornar o lastSelected do seu time
      const previousActiveAthlete = activeAthlete;
      const previousActiveIsTeam1 = previousActiveAthlete?.includes("Dupla1") ?? false;
      
      // Se clicamos no time oposto, atualiza o lastSelected do time original
      if (previousActiveIsTeam1 !== isTeam1 && previousActiveAthlete) {
        // Estamos clicando no time oposto
        // O jogador que estava ativo antes (do time original) deve se tornar o lastSelected
        if (previousActiveIsTeam1) {
          // O time original era team1, então atualiza lastSelectedTeam1
          setLastSelectedTeam1(previousActiveAthlete);
        } else {
          // O time original era team2, então atualiza lastSelectedTeam2
          setLastSelectedTeam2(previousActiveAthlete);
        }
      }
      
      // Atualiza o lastSelected do time clicado
      if (isTeam1) {
        setLastSelectedTeam1(athleteId);
      } else {
        setLastSelectedTeam2(athleteId);
      }
      
      // Ativa o atleta clicado
      setActiveAthlete(athleteId);
    } else {
      // Fase inicial: apenas registra a seleção e ativa o atleta
      if (isTeam1) {
        setLastSelectedTeam1(athleteId);
      } else {
        setLastSelectedTeam2(athleteId);
      }
      setActiveAthlete(athleteId);
    }
  };

  const handleChangeAthlete = () => {
    if (!event) return;

    // Se for singles, usa a sequência simples
    if (event.isSingles) {
      const sequence = ["athlete1Dupla1", "athlete1Dupla2"];
      const currentIndex = activeAthlete ? sequence.indexOf(activeAthlete) : -1;
      if (currentIndex === -1) {
        setActiveAthlete(sequence[0]);
      } else {
        const nextIndex = (currentIndex + 1) % sequence.length;
        setActiveAthlete(sequence[nextIndex]);
      }
      return;
    }

    // Para duplas: verifica se estamos em modo de ciclo
    const isCyclingMode = lastSelectedTeam1 !== null && lastSelectedTeam2 !== null;

    if (!isCyclingMode) {
      // Se não estamos em modo de ciclo, usa a sequência padrão
      const sequence = [
        "athlete1Dupla1",
        "athlete1Dupla2",
        "athlete2Dupla1",
        "athlete2Dupla2",
      ];
      const currentIndex = activeAthlete ? sequence.indexOf(activeAthlete) : -1;
      if (currentIndex === -1) {
        setActiveAthlete(sequence[0]);
      } else {
        const nextIndex = (currentIndex + 1) % sequence.length;
        setActiveAthlete(sequence[nextIndex]);
      }
      return;
    }

    // Modo de ciclo: alterna entre os jogadores que NÃO foram os últimos selecionados de cada time
    const team1Athletes = ["athlete1Dupla1", "athlete2Dupla1"];
    const team2Athletes = ["athlete1Dupla2", "athlete2Dupla2"];

    // Encontra o outro jogador de cada time (o que não foi o último selecionado)
    // IMPORTANTE: Sempre retorna o jogador que NÃO é o último selecionado
    const getOtherPlayer = (athletes: string[], lastSelected: string | null): string => {
      if (!lastSelected) {
        // Se não há último selecionado, retorna o primeiro
        return athletes[0];
      }
      // Retorna o jogador que não é o último selecionado
      const other = athletes.find((id) => id !== lastSelected);
      // Fallback: se por algum motivo não encontrar (não deveria acontecer), retorna o primeiro
      return other || athletes[0];
    };

    const otherTeam1 = getOtherPlayer(team1Athletes, lastSelectedTeam1);
    const otherTeam2 = getOtherPlayer(team2Athletes, lastSelectedTeam2);

    // Determina qual time está ativo atualmente
    const isCurrentlyTeam1 = activeAthlete?.includes("Dupla1") ?? false;

    // Alterna para o outro jogador do time oposto
    // Se estamos no time 1, vai para o outro do time 2, e vice-versa
    if (isCurrentlyTeam1) {
      setActiveAthlete(otherTeam2);
    } else {
      setActiveAthlete(otherTeam1);
    }
  };

  const scoreSequence = [0, 15, 30, 40];

  const handleIncrementScore = (team: "team1" | "team2") => {
    if (isTieBreak) {
      // No tie break, incrementa de 1 em 1
      if (team === "team1") {
        setTeam1Score(team1Score + 1);
      } else {
        setTeam2Score(team2Score + 1);
      }
    } else {
      // Pontuação normal: 0, 15, 30, 40
      if (team === "team1") {
        const currentIndex = scoreSequence.indexOf(team1Score);
        if (currentIndex < scoreSequence.length - 1) {
          setTeam1Score(scoreSequence[currentIndex + 1]);
        } else if (team1Score === 40) {
          // Quando chegar a 40 e clicar novamente, reseta para 00 e incrementa games
          setTeam1Score(0);
          const newGames = team1Games + 1;
          // Se chegou a 7 games, zera games e incrementa sets
          if (newGames >= 7) {
            setTeam1Games(0);
            setTeam1Sets((sets) => sets + 1);
          } else {
            setTeam1Games(newGames);
          }
          handleChangeAthlete();
        }
      } else {
        const currentIndex = scoreSequence.indexOf(team2Score);
        if (currentIndex < scoreSequence.length - 1) {
          setTeam2Score(scoreSequence[currentIndex + 1]);
        } else if (team2Score === 40) {
          // Quando chegar a 40 e clicar novamente, reseta para 00 e incrementa games
          setTeam2Score(0);
          const newGames = team2Games + 1;
          // Se chegou a 7 games, zera games e incrementa sets
          if (newGames >= 7) {
            setTeam2Games(0);
            setTeam2Sets((sets) => sets + 1);
          } else {
            setTeam2Games(newGames);
          }
          handleChangeAthlete();
        }
      }
    }
  };

  const handleDecrementScore = (team: "team1" | "team2") => {
    if (isTieBreak) {
      // No tie break, decrementa de 1 em 1
      if (team === "team1") {
        if (team1Score > 0) {
          setTeam1Score(team1Score - 1);
        }
      } else {
        if (team2Score > 0) {
          setTeam2Score(team2Score - 1);
        }
      }
    } else {
      // Pontuação normal: 0, 15, 30, 40
      if (team === "team1") {
        const currentIndex = scoreSequence.indexOf(team1Score);
        if (currentIndex > 0) {
          setTeam1Score(scoreSequence[currentIndex - 1]);
        }
      } else {
        const currentIndex = scoreSequence.indexOf(team2Score);
        if (currentIndex > 0) {
          setTeam2Score(scoreSequence[currentIndex - 1]);
        }
      }
    }
  };

  const handleIncrementSet = () => {
    if (!isTieBreak) return;
    
    // Determina qual time tem mais pontos
    const winningTeam = team1Score > team2Score ? "team1" : "team2";
    
    if (winningTeam === "team1") {
      setTeam1Sets((sets) => sets + 1);
      setTeam1Score(0); // Reseta os pontos do time vencedor
    } else {
      setTeam2Sets((sets) => sets + 1);
      setTeam2Score(0); // Reseta os pontos do time vencedor
    }
    
    // Salva na lista de histórico
    setSetsWonHistory((history) => [...history, winningTeam]);
  };

  const handleDecrementSet = () => {
    if (!isTieBreak) return;
    if (setsWonHistory.length === 0) return;
    
    // Remove o último set ganho do histórico
    const lastWonTeam = setsWonHistory[setsWonHistory.length - 1];
    setSetsWonHistory((history) => history.slice(0, -1));
    
    // Remove 1 set do time que ganhou por último
    if (lastWonTeam === "team1") {
      setTeam1Sets((sets) => Math.max(0, sets - 1));
    } else {
      setTeam2Sets((sets) => Math.max(0, sets - 1));
    }
  };

  const handleCopyOverlayLink = async () => {
    if (!eventId) return;

    const overlayUrl = `${window.location.origin}/overlay/${eventId}`;
    
    try {
      await navigator.clipboard.writeText(overlayUrl);
      setLinkCopied(true);
      setTimeout(() => {
        setLinkCopied(false);
      }, 2000);
    } catch (err) {
      console.error("Erro ao copiar link:", err);
      // Fallback para navegadores mais antigos
      const textArea = document.createElement("textarea");
      textArea.value = overlayUrl;
      textArea.style.position = "fixed";
      textArea.style.opacity = "0";
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand("copy");
        setLinkCopied(true);
        setTimeout(() => {
          setLinkCopied(false);
        }, 2000);
      } catch (fallbackErr) {
        console.error("Erro ao copiar link (fallback):", fallbackErr);
      }
      document.body.removeChild(textArea);
    }
  };

  // Cores para os times
  const team1Colors = ["#4ade80", "#fb923c"]; // Verde e laranja para jogadores
  const team2Colors = ["#fbbf24", "#f59e0b"]; // Amarelo/bege para jogadores
  const team1ScoreColor = "#3b82f6"; // Azul brilhante
  const team2ScoreColor = "#f97316"; // Laranja brilhante

  return (
    <div className="tournament-admin-container">
      <div className="tournament-main">
        <TeamSection
          event={event}
          teamLabel={event.isSingles ? "Jogador 1" : "Dupla 1"}
          athleteIds={
            event.isSingles
              ? ["athlete1Dupla1"]
              : ["athlete1Dupla1", "athlete2Dupla1"]
          }
          activeAthlete={activeAthlete}
          score={team1Score}
          games={team1Games}
          sets={team1Sets}
          onAthleteClick={handleAthleteClick}
          onIncrementScore={() => handleIncrementScore("team1")}
          onDecrementScore={() => handleDecrementScore("team1")}
          teamColor={team1ScoreColor}
          teamColors={team1Colors}
          isTeam2={false}
        />

        <div className="center-panel">
          {event.gameTime && isTimerEnabled && (
            <div className="timer-section">
              <div className="timer-header">
                <div className="timer-label">TEMPO DE JOGO</div>
                <div 
                  className={`timer-display-container clickable ${isRunning ? "running" : ""}`}
                  onClick={handleTimerClick}
                  style={{ cursor: "pointer" }}
                >
                  <Clock size={24} className="timer-icon" />
                  <div className="timer-display">{formatTime(timeElapsed)}</div>
                </div>
              </div>
            </div>
          )}

          <div className="vs-logo">
            <span className="vs-text">Vs</span>
          </div>

          <div className="sets-control-buttons">
            <button
              onClick={handleDecrementSet}
              className="sets-control-button"
              disabled={!isTieBreak || setsWonHistory.length === 0}
              aria-label="Remover set"
            >
              <ChevronLeft size={24} />
            </button>
            <span className="sets-control-label">Sets</span>
            <button
              onClick={handleIncrementSet}
              className="sets-control-button"
              disabled={!isTieBreak}
              aria-label="Adicionar set"
            >
              <ChevronRight size={24} />
            </button>
          </div>

          <div className="tie-break-control">
            <span className="tie-break-label">Tie break</span>
            <label className="switch" htmlFor="tie-break-checkbox">
              <input
                type="checkbox"
                id="tie-break-checkbox"
                checked={isTieBreak}
                onChange={(e) => setIsTieBreak(e.target.checked)}
              />
              <div className="slider round"></div>
            </label>
          </div>

          <div className="copy-overlay-link-control">
            <div className="my-score-label">MY SCORE BT</div>
            <button
              onClick={handleCopyOverlayLink}
              className="copy-overlay-link-button"
              title="Copiar link da sobreposição"
            >
              {linkCopied ? (
                <>
                  <Check size={20} />
                  <span>Link copiado!</span>
                </>
              ) : (
                <>
                  <Copy size={20} />
                  <span>copy link</span>
                </>
              )}
            </button>
          </div>
        </div>

        <TeamSection
          event={event}
          teamLabel={event.isSingles ? "Jogador 2" : "Dupla 2"}
          athleteIds={
            event.isSingles
              ? ["athlete1Dupla2"]
              : ["athlete1Dupla2", "athlete2Dupla2"]
          }
          activeAthlete={activeAthlete}
          score={team2Score}
          games={team2Games}
          sets={team2Sets}
          onAthleteClick={handleAthleteClick}
          onIncrementScore={() => handleIncrementScore("team2")}
          onDecrementScore={() => handleDecrementScore("team2")}
          teamColor={team2ScoreColor}
          teamColors={team2Colors}
          isTeam2={true}
        />
      </div>
    </div>
  );
};

export default TournamentAdmin;
