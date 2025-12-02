import { useState, useEffect } from "react";
import { useParams } from "react-router";
import { getEvent, type EventDocument } from "../services/events/eventService";
import "./TournamentAdmin.css";

const TournamentAdmin = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const [event, setEvent] = useState<EventDocument | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [isRunning, setIsRunning] = useState(false);

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
    let interval: NodeJS.Timeout | null = null;

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
    setIsRunning(false);
    setTimeElapsed(0);
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

  const getDupla1Names = (): string => {
    if (event.isSingles) {
      return event.athlete1Dupla1;
    }
    return `${event.athlete1Dupla1} / ${event.athlete2Dupla1}`;
  };

  const getDupla2Names = (): string => {
    if (event.isSingles) {
      return event.athlete1Dupla2;
    }
    return `${event.athlete1Dupla2} / ${event.athlete2Dupla2}`;
  };

  return (
    <div className="tournament-admin-container">
      <div className="tournament-header">
        <h1 className="tournament-title">{event.tournamentName}</h1>
      </div>

      <div className="tournament-main">
        <div className="team-section team-left">
          <div className="team-label">Dupla 1</div>
          <div className="team-names">{getDupla1Names()}</div>
        </div>

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

        <div className="team-section team-right">
          <div className="team-label">Dupla 2</div>
          <div className="team-names">{getDupla2Names()}</div>
        </div>
      </div>
    </div>
  );
};

export default TournamentAdmin;
