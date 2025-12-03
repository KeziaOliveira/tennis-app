import { useState, useEffect } from "react";
import { useParams } from "react-router";
import { Circle } from "lucide-react";
import { getEvent, type EventDocument } from "../services/events/eventService";
import "./TournamentAdmin.css";

interface AthleteListProps {
  event: EventDocument;
  athleteIds: string[];
  activeAthlete: string | null;
  onAthleteClick: (athleteId: string) => void;
}

const AthleteList = ({ event, athleteIds, activeAthlete, onAthleteClick }: AthleteListProps) => {
  const isAthleteActive = (athleteId: string): boolean => {
    return activeAthlete === athleteId;
  };

  const getAthleteName = (athleteId: string): string => {
    return event[athleteId as keyof EventDocument] as string;
  };

  return (
    <div className="athletes-list">
      {athleteIds.map((athleteId) => (
        <div key={athleteId} className="athlete-item">
          <button
            className={`tennis-button ${isAthleteActive(athleteId) ? "active" : ""}`}
            onClick={() => onAthleteClick(athleteId)}
            aria-label={`Atleta ${athleteId}`}
          >
            <Circle size={20} fill={isAthleteActive(athleteId) ? "currentColor" : "none"} />
          </button>
          <span className="athlete-name">{getAthleteName(athleteId)}</span>
        </div>
      ))}
    </div>
  );
};

interface ScoreControlsProps {
  score: number;
  onIncrement: () => void;
  onDecrement: () => void;
}

const ScoreControls = ({ score, onIncrement, onDecrement }: ScoreControlsProps) => {
  const formatScore = (score: number): string => {
    return score === 0 ? "00" : String(score);
  };

  return (
    <div className="score-controls">
      <button
        onClick={onIncrement}
        className="score-button score-button-plus"
        aria-label="Aumentar pontuação"
      >
        +
      </button>
      <div className="score-display">{formatScore(score)}</div>
      <button
        onClick={onDecrement}
        className="score-button score-button-minus"
        aria-label="Diminuir pontuação"
        disabled={score === 0}
      >
        −
      </button>
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
  onAthleteClick: (athleteId: string) => void;
  onIncrementScore: () => void;
  onDecrementScore: () => void;
}

const TeamSection = ({
  event,
  teamLabel,
  athleteIds,
  activeAthlete,
  score,
  games,
  onAthleteClick,
  onIncrementScore,
  onDecrementScore,
}: TeamSectionProps) => {
  return (
    <div className={`team-section ${athleteIds[0].includes("Dupla1") ? "team-left" : "team-right"}`}>
      <div className="team-label">{teamLabel}</div>
      <AthleteList
        event={event}
        athleteIds={athleteIds}
        activeAthlete={activeAthlete}
        onAthleteClick={onAthleteClick}
      />
      <ScoreControls
        score={score}
        onIncrement={onIncrementScore}
        onDecrement={onDecrementScore}
      />
      <GamesDisplay games={games} />
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

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  const handleStartPause = () => {
    setIsRunning(!isRunning);
  };

  const handleReset = () => {
    if (window.confirm("Tem certeza que deseja resetar o timer?")) {
      setIsRunning(false);
      setTimeElapsed(0);
    }
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
    if (activeAthlete === athleteId) {
      // Se clicar no mesmo atleta, desativa
      setActiveAthlete(null);
    } else {
      // Ativa o atleta clicado (substitui qualquer ativo anterior)
      setActiveAthlete(athleteId);
    }
  };

  const handleChangeAthlete = () => {
    if (!event) return;

    const sequence = event.isSingles
      ? ["athlete1Dupla1", "athlete1Dupla2"]
      : [
          "athlete1Dupla1",
          "athlete1Dupla2",
          "athlete2Dupla1",
          "athlete2Dupla2",
        ];

    const currentIndex = activeAthlete
      ? sequence.indexOf(activeAthlete)
      : -1;

    if (currentIndex === -1) {
      // Se não há atleta ativo, começa do primeiro
      setActiveAthlete(sequence[0]);
    } else {
      // Move para o próximo na sequência
      const nextIndex = (currentIndex + 1) % sequence.length;
      setActiveAthlete(sequence[nextIndex]);
    }
  };

  const scoreSequence = [0, 15, 30, 40];

  const handleIncrementScore = (team: "team1" | "team2") => {
    if (team === "team1") {
      const currentIndex = scoreSequence.indexOf(team1Score);
      if (currentIndex < scoreSequence.length - 1) {
        setTeam1Score(scoreSequence[currentIndex + 1]);
      } else if (team1Score === 40) {
        // Quando chegar a 40 e clicar novamente, reseta para 00 e incrementa games
        setTeam1Score(0);
        setTeam1Games((games) => games + 1);
        handleChangeAthlete();
      }
    } else {
      const currentIndex = scoreSequence.indexOf(team2Score);
      if (currentIndex < scoreSequence.length - 1) {
        setTeam2Score(scoreSequence[currentIndex + 1]);
      } else if (team2Score === 40) {
        // Quando chegar a 40 e clicar novamente, reseta para 00 e incrementa games
        setTeam2Score(0);
        setTeam2Games((games) => games + 1);
        handleChangeAthlete();
      }
    }
  };

  const handleDecrementScore = (team: "team1" | "team2") => {
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
  };

  return (
    <div className="tournament-admin-container">
      <div className="tournament-header">
        <h1 className="tournament-title">{event.tournamentName}</h1>
      </div>

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
          onAthleteClick={handleAthleteClick}
          onIncrementScore={() => handleIncrementScore("team1")}
          onDecrementScore={() => handleDecrementScore("team1")}
        />

        <div className="timer-section">
          <div className="timer-label">Tempo de jogo</div>
          <div className="timer-display">{formatTime(timeElapsed)}</div>
          <div className="timer-controls">
            <button onClick={handleStartPause} className="timer-button">
              {isRunning ? "Pausar" : "Iniciar"}
            </button>
            <button onClick={handleReset} className="timer-button">
              Resetar
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
          onAthleteClick={handleAthleteClick}
          onIncrementScore={() => handleIncrementScore("team2")}
          onDecrementScore={() => handleDecrementScore("team2")}
        />
      </div>
    </div>
  );
};

export default TournamentAdmin;
