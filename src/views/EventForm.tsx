import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router";
import { createEvent } from "../services/events/eventService";
import "./EventForm.css";

interface EventFormData {
  tournamentName: string;
  athlete1Dupla1: string;
  country1Dupla1: string;
  athlete2Dupla1: string;
  country2Dupla1: string;
  athlete1Dupla2: string;
  country1Dupla2: string;
  athlete2Dupla2: string;
  country2Dupla2: string;
  gamesWithAdvantage: boolean;
  gameTime: boolean;
  gameStatistics: boolean;
  isSingles: boolean;
}

const EventForm = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState<EventFormData>({
    tournamentName: "",
    athlete1Dupla1: "",
    country1Dupla1: "",
    athlete2Dupla1: "",
    country2Dupla1: "",
    athlete1Dupla2: "",
    country1Dupla2: "",
    athlete2Dupla2: "",
    country2Dupla2: "",
    gamesWithAdvantage: false,
    gameTime: false,
    gameStatistics: false,
    isSingles: false,
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleToggleChange = (field: keyof EventFormData) => {
    setFormData((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const eventId = await createEvent(formData);
      navigate(`/tournament/${eventId}`);
    } catch (err: any) {
      setError(err.message || "Erro ao criar evento. Tente novamente.");
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate("/");
  };

  return (
    <div className="event-form-container">
      <div className="event-form-card">
        <h1 className="event-form-title">Novo Evento</h1>

        <form onSubmit={handleSubmit} className="event-form">
          <div className="form-section">
            <div className="form-input-group">
              <label htmlFor="tournamentName">Nome do torneio</label>
              <input
                id="tournamentName"
                name="tournamentName"
                type="text"
                value={formData.tournamentName}
                onChange={handleInputChange}
                required
                placeholder="Digite o nome do torneio"
              />
            </div>
          </div>

          <div className="form-divider">
            <span>Atletas</span>
          </div>

          <div className="form-section">
            {formData.isSingles ? (
              <>
                <div className="athlete-pair">
                  <div className="athlete-pair-header">
                    <span>Atleta 1</span>
                  </div>
                  <div className="athlete-inputs">
                    <div className="athlete-card">
                      <div className="athlete-card-inputs">
                        <div className="form-input-group">
                          <label htmlFor="athlete1Dupla1">Nome</label>
                          <input
                            id="athlete1Dupla1"
                            name="athlete1Dupla1"
                            type="text"
                            value={formData.athlete1Dupla1}
                            onChange={handleInputChange}
                            required
                            placeholder="Nome do atleta"
                          />
                        </div>
                        <div className="form-input-group">
                          <label htmlFor="country1Dupla1">País</label>
                          <input
                            id="country1Dupla1"
                            name="country1Dupla1"
                            type="text"
                            value={formData.country1Dupla1}
                            onChange={handleInputChange}
                            required
                            placeholder="País"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="vs-divider">VS</div>

                <div className="athlete-pair">
                  <div className="athlete-pair-header">
                    <span>Atleta 2</span>
                  </div>
                  <div className="athlete-inputs">
                    <div className="athlete-card">
                      <div className="athlete-card-inputs">
                        <div className="form-input-group">
                          <label htmlFor="athlete1Dupla2">Nome</label>
                          <input
                            id="athlete1Dupla2"
                            name="athlete1Dupla2"
                            type="text"
                            value={formData.athlete1Dupla2}
                            onChange={handleInputChange}
                            required
                            placeholder="Nome do atleta"
                          />
                        </div>
                        <div className="form-input-group">
                          <label htmlFor="country1Dupla2">País</label>
                          <input
                            id="country1Dupla2"
                            name="country1Dupla2"
                            type="text"
                            value={formData.country1Dupla2}
                            onChange={handleInputChange}
                            required
                            placeholder="País"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="athlete-pair">
                  <div className="athlete-pair-header">
                    <span>Dupla 1</span>
                  </div>
                  <div className="athlete-inputs">
                    <div className="athlete-card">
                      <div className="athlete-card-label">Atleta 1</div>
                      <div className="athlete-card-inputs">
                        <div className="form-input-group">
                          <label htmlFor="athlete1Dupla1">Nome</label>
                          <input
                            id="athlete1Dupla1"
                            name="athlete1Dupla1"
                            type="text"
                            value={formData.athlete1Dupla1}
                            onChange={handleInputChange}
                            required
                            placeholder="Nome do atleta"
                          />
                        </div>
                        <div className="form-input-group">
                          <label htmlFor="country1Dupla1">País</label>
                          <input
                            id="country1Dupla1"
                            name="country1Dupla1"
                            type="text"
                            value={formData.country1Dupla1}
                            onChange={handleInputChange}
                            required
                            placeholder="País"
                          />
                        </div>
                      </div>
                    </div>
                    <div className="athlete-card">
                      <div className="athlete-card-label">Atleta 2</div>
                      <div className="athlete-card-inputs">
                        <div className="form-input-group">
                          <label htmlFor="athlete2Dupla1">Nome</label>
                          <input
                            id="athlete2Dupla1"
                            name="athlete2Dupla1"
                            type="text"
                            value={formData.athlete2Dupla1}
                            onChange={handleInputChange}
                            required
                            placeholder="Nome do atleta"
                          />
                        </div>
                        <div className="form-input-group">
                          <label htmlFor="country2Dupla1">País</label>
                          <input
                            id="country2Dupla1"
                            name="country2Dupla1"
                            type="text"
                            value={formData.country2Dupla1}
                            onChange={handleInputChange}
                            required
                            placeholder="País"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="vs-divider">VS</div>

                <div className="athlete-pair">
                  <div className="athlete-pair-header">
                    <span>Dupla 2</span>
                  </div>
                  <div className="athlete-inputs">
                    <div className="athlete-card">
                      <div className="athlete-card-label">Atleta 1</div>
                      <div className="athlete-card-inputs">
                        <div className="form-input-group">
                          <label htmlFor="athlete1Dupla2">Nome</label>
                          <input
                            id="athlete1Dupla2"
                            name="athlete1Dupla2"
                            type="text"
                            value={formData.athlete1Dupla2}
                            onChange={handleInputChange}
                            required
                            placeholder="Nome do atleta"
                          />
                        </div>
                        <div className="form-input-group">
                          <label htmlFor="country1Dupla2">País</label>
                          <input
                            id="country1Dupla2"
                            name="country1Dupla2"
                            type="text"
                            value={formData.country1Dupla2}
                            onChange={handleInputChange}
                            required
                            placeholder="País"
                          />
                        </div>
                      </div>
                    </div>
                    <div className="athlete-card">
                      <div className="athlete-card-label">Atleta 2</div>
                      <div className="athlete-card-inputs">
                        <div className="form-input-group">
                          <label htmlFor="athlete2Dupla2">Nome</label>
                          <input
                            id="athlete2Dupla2"
                            name="athlete2Dupla2"
                            type="text"
                            value={formData.athlete2Dupla2}
                            onChange={handleInputChange}
                            required
                            placeholder="Nome do atleta"
                          />
                        </div>
                        <div className="form-input-group">
                          <label htmlFor="country2Dupla2">País</label>
                          <input
                            id="country2Dupla2"
                            name="country2Dupla2"
                            type="text"
                            value={formData.country2Dupla2}
                            onChange={handleInputChange}
                            required
                            placeholder="País"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="form-divider">
            <span>Formato de Disputa</span>
          </div>

          <div className="form-section">
            <div className="toggle-group">
              <div className="toggle-item">
                <label htmlFor="gamesWithAdvantage" className="toggle-label">
                  GAMES com vantagem
                </label>
                <button
                  type="button"
                  className={`toggle-button ${formData.gamesWithAdvantage ? "active" : ""}`}
                  onClick={() => handleToggleChange("gamesWithAdvantage")}
                  aria-pressed={formData.gamesWithAdvantage}
                >
                  <span className="toggle-slider"></span>
                </button>
              </div>

              <div className="toggle-item">
                <label htmlFor="gameTime" className="toggle-label">
                  Tempo de jogo
                </label>
                <button
                  type="button"
                  className={`toggle-button ${formData.gameTime ? "active" : ""}`}
                  onClick={() => handleToggleChange("gameTime")}
                  aria-pressed={formData.gameTime}
                >
                  <span className="toggle-slider"></span>
                </button>
              </div>

              <div className="toggle-item">
                <label htmlFor="gameStatistics" className="toggle-label">
                  Estatística do jogo
                </label>
                <button
                  type="button"
                  className={`toggle-button ${formData.gameStatistics ? "active" : ""}`}
                  onClick={() => handleToggleChange("gameStatistics")}
                  aria-pressed={formData.gameStatistics}
                >
                  <span className="toggle-slider"></span>
                </button>
              </div>

              <div className="toggle-item">
                <label htmlFor="isSingles" className="toggle-label">
                  Jogo de SIMPLES
                </label>
                <button
                  type="button"
                  className={`toggle-button ${formData.isSingles ? "active" : ""}`}
                  onClick={() => handleToggleChange("isSingles")}
                  aria-pressed={formData.isSingles}
                >
                  <span className="toggle-slider"></span>
                </button>
              </div>
            </div>
          </div>

          {error && <div className="auth-error">{error}</div>}

          <div className="form-actions">
            <button type="button" onClick={handleCancel} className="cancel-button" disabled={loading}>
              Cancelar
            </button>
            <button type="submit" className="submit-button" disabled={loading}>
              {loading ? "Criando..." : "Criar Evento"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EventForm;
