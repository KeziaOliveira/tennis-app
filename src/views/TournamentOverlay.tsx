import { useState, useEffect } from "react";
import { useParams } from "react-router";
import { Circle, Clock } from "lucide-react";
import { getEvent, type EventDocument } from "../services/events/eventService";
import "./TournamentOverlay.css";

const TournamentOverlay = () => {
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
  const [isTimerEnabled, setIsTimerEnabled] = useState<boolean>(false);

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

  // Escuta mudanças do localStorage para sincronizar com TournamentAdmin
  useEffect(() => {
    if (!event) return;

    const handleStorageChange = () => {
      const data = localStorage.getItem(`tournament_${eventId}`);
      if (data) {
        try {
          const parsed = JSON.parse(data);
          setTimeElapsed(parsed.timeElapsed || 0);
          setIsRunning(parsed.isRunning || false);
          setActiveAthlete(parsed.activeAthlete || null);
          setTeam1Score(parsed.team1Score || 0);
          setTeam2Score(parsed.team2Score || 0);
          setTeam1Games(parsed.team1Games || 0);
          setTeam2Games(parsed.team2Games || 0);
          setTeam1Sets(parsed.team1Sets || 0);
          setTeam2Sets(parsed.team2Sets || 0);
          // Só atualiza se o evento tiver gameTime habilitado
          if (event.gameTime) {
            setIsTimerEnabled(parsed.isTimerEnabled !== undefined ? parsed.isTimerEnabled : false);
          } else {
            setIsTimerEnabled(false);
          }
        } catch (e) {
          console.error("Erro ao parsear dados do localStorage", e);
        }
      }
    };

    // Verifica imediatamente
    handleStorageChange();

    // Escuta mudanças
    window.addEventListener("storage", handleStorageChange);
    const interval = setInterval(handleStorageChange, 500); // Polling a cada 500ms

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      clearInterval(interval);
    };
  }, [eventId, event]);

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  const formatScore = (score: number): string => {
    return String(score).padStart(2, "0");
  };

  const isTeam1Serving = (): boolean => {
    if (!activeAthlete) return false;
    return activeAthlete.includes("Dupla1");
  };

  const isTeam2Serving = (): boolean => {
    if (!activeAthlete) return false;
    return activeAthlete.includes("Dupla2");
  };

  if (loading) {
    return (
      <div className="overlay-container">
        <div className="overlay-loading">Carregando...</div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="overlay-container">
        <div className="overlay-error">{error || "Evento não encontrado"}</div>
      </div>
    );
  }

  const getTeam1Athletes = (): string[] => {
    if (event.isSingles) {
      return [event.athlete1Dupla1];
    }
    return [event.athlete1Dupla1, event.athlete2Dupla1];
  };

  const getTeam2Athletes = (): string[] => {
    if (event.isSingles) {
      return [event.athlete1Dupla2];
    }
    return [event.athlete1Dupla2, event.athlete2Dupla2];
  };

  // Cores para os indicadores de cada jogador
  const team1Colors = ["#4ade80", "#fb923c"]; // Verde e laranja
  const team2Colors = ["#60a5fa", "#a78bfa"]; // Azul claro e roxo claro

  return (
    <div className="overlay-container">
      {/* Timer no topo esquerdo - apenas se habilitado */}
      {isTimerEnabled && (
        <div className="overlay-timer-box">
          <Clock size={18} className="overlay-timer-icon" />
          <span className="overlay-timer-text">{formatTime(timeElapsed)}</span>
        </div>
      )}

      {/* Times empilhados verticalmente */}
      <div className={`overlay-teams-stacked ${!isTimerEnabled ? "no-timer" : ""}`}>
        {/* Team 1 */}
        <div className="overlay-team-section">
          <div className="overlay-team-players">
            {getTeam1Athletes().map((name, index) => (
              <div key={index} className="overlay-player-row">
                <div
                  className="overlay-player-color-indicator"
                  style={{ backgroundColor: team1Colors[index] || team1Colors[0] }}
                />
                <span className="overlay-player-name">{name}</span>
                {index === 0 && isTeam1Serving() && (
                  <Circle size={16} fill="currentColor" className="overlay-serving-icon" />
                )}
              </div>
            ))}
          </div>
          <div className="overlay-team-scores">
            <div className="overlay-score-box overlay-score-points">
              {formatScore(team1Score)}
            </div>
            <div className="overlay-score-box overlay-score-games">
              {String(team1Games).padStart(2, "0")}
            </div>
            <div className="overlay-score-box overlay-score-sets">
              {String(team1Sets).padStart(2, "0")}
            </div>
          </div>
        </div>

        {/* Team 2 */}
        <div className="overlay-team-section">
          <div className="overlay-team-players">
            {getTeam2Athletes().map((name, index) => (
              <div key={index} className="overlay-player-row">
                <div
                  className="overlay-player-color-indicator"
                  style={{ backgroundColor: team2Colors[index] || team2Colors[0] }}
                />
                <span className="overlay-player-name">{name}</span>
                {index === 0 && isTeam2Serving() && (
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className="overlay-serving-icon"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 2 L12 22 M2 12 L22 12" strokeWidth="1.5" />
                  </svg>
                )}
              </div>
            ))}
          </div>
          <div className="overlay-team-scores">
            <div className="overlay-score-box overlay-score-points">
              {formatScore(team2Score)}
            </div>
            <div className="overlay-score-box overlay-score-games">
              {String(team2Games).padStart(2, "0")}
            </div>
            <div className="overlay-score-box overlay-score-sets">
              {String(team2Sets).padStart(2, "0")}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TournamentOverlay;
