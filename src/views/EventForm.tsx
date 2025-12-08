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
    gameTime: true,
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
        <h1 className="event-form-title">CRIAR TORNEIO</h1>

        <form onSubmit={handleSubmit} className="event-form">
          <div className="form-section">
            <div className="form-input-group horizontal">
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

          <div className="form-section-title">Atletas</div>

          <div className="form-section">
            {formData.isSingles ? (
              <>
                <div className="athlete-row">
                  <label className="athlete-label">Atleta 1 - Dupla 1</label>
                  <input
                    id="athlete1Dupla1"
                    name="athlete1Dupla1"
                    type="text"
                    value={formData.athlete1Dupla1}
                    onChange={handleInputChange}
                    required
                    placeholder="Nome do atleta"
                  />
                  <input
                    id="country1Dupla1"
                    name="country1Dupla1"
                    type="text"
                    value={formData.country1Dupla1}
                    onChange={handleInputChange}
                    required
                    placeholder="País"
                    className="country-input"
                  />
                </div>
                <div className="vs-divider">-VS-</div>
                <div className="athlete-row">
                  <label className="athlete-label">Atleta 1 - Dupla 2</label>
                  <input
                    id="athlete1Dupla2"
                    name="athlete1Dupla2"
                    type="text"
                    value={formData.athlete1Dupla2}
                    onChange={handleInputChange}
                    required
                    placeholder="Nome do atleta"
                  />
                  <input
                    id="country1Dupla2"
                    name="country1Dupla2"
                    type="text"
                    value={formData.country1Dupla2}
                    onChange={handleInputChange}
                    required
                    placeholder="País"
                    className="country-input"
                  />
                </div>
              </>
            ) : (
              <>
                <div className="athlete-row">
                  <label className="athlete-label">Atleta 1 - Dupla 1</label>
                  <input
                    id="athlete1Dupla1"
                    name="athlete1Dupla1"
                    type="text"
                    value={formData.athlete1Dupla1}
                    onChange={handleInputChange}
                    required
                    placeholder="Nome do atleta"
                  />
                  <input
                    id="country1Dupla1"
                    name="country1Dupla1"
                    type="text"
                    value={formData.country1Dupla1}
                    onChange={handleInputChange}
                    required
                    placeholder="País"
                    className="country-input"
                  />
                </div>
                <div className="athlete-row">
                  <label className="athlete-label">Atleta 2 - Dupla 1</label>
                  <input
                    id="athlete2Dupla1"
                    name="athlete2Dupla1"
                    type="text"
                    value={formData.athlete2Dupla1}
                    onChange={handleInputChange}
                    required
                    placeholder="Nome do atleta"
                  />
                  <input
                    id="country2Dupla1"
                    name="country2Dupla1"
                    type="text"
                    value={formData.country2Dupla1}
                    onChange={handleInputChange}
                    required
                    placeholder="País"
                    className="country-input"
                  />
                </div>
                <div className="vs-divider">-VS-</div>
                <div className="athlete-row">
                  <label className="athlete-label">Atleta 1 - Dupla 2</label>
                  <input
                    id="athlete1Dupla2"
                    name="athlete1Dupla2"
                    type="text"
                    value={formData.athlete1Dupla2}
                    onChange={handleInputChange}
                    required
                    placeholder="Nome do atleta"
                  />
                  <input
                    id="country1Dupla2"
                    name="country1Dupla2"
                    type="text"
                    value={formData.country1Dupla2}
                    onChange={handleInputChange}
                    required
                    placeholder="País"
                    className="country-input"
                  />
                </div>
                <div className="athlete-row">
                  <label className="athlete-label">Atleta 2 - Dupla 2</label>
                  <input
                    id="athlete2Dupla2"
                    name="athlete2Dupla2"
                    type="text"
                    value={formData.athlete2Dupla2}
                    onChange={handleInputChange}
                    required
                    placeholder="Nome do atleta"
                  />
                  <input
                    id="country2Dupla2"
                    name="country2Dupla2"
                    type="text"
                    value={formData.country2Dupla2}
                    onChange={handleInputChange}
                    required
                    placeholder="País"
                    className="country-input"
                  />
                </div>
              </>
            )}
          </div>

          <div className="form-section-title">FORMATO DE DISPUTA</div>

          <div className="form-section">
            <div className="toggle-group">
              <div className="toggle-item">
                <label htmlFor="gamesWithAdvantage" className="toggle-label">
                  GAMES com vantagem:
                </label>
                <div className="toggle-control">
                  <label className="switch" htmlFor="gamesWithAdvantage">
                    <input
                      type="checkbox"
                      id="gamesWithAdvantage"
                      checked={formData.gamesWithAdvantage}
                      onChange={(e) => setFormData((prev) => ({ ...prev, gamesWithAdvantage: e.target.checked }))}
                    />
                    <div className="slider round"></div>
                  </label>
                  <span className={`toggle-status ${formData.gamesWithAdvantage ? "on" : "off"}`}>{formData.gamesWithAdvantage ? "AD" : "NO AD"}</span>
                </div>
              </div>

              <div className="toggle-item">
                <label htmlFor="gameTime" className="toggle-label">
                  Tempo de jogo:
                </label>
                <div className="toggle-control">
                  <label className="switch" htmlFor="gameTime">
                    <input
                      type="checkbox"
                      id="gameTime"
                      checked={formData.gameTime}
                      onChange={(e) => setFormData((prev) => ({ ...prev, gameTime: e.target.checked }))}
                    />
                    <div className="slider round"></div>
                  </label>
                  <span className={`toggle-status ${formData.gameTime ? "on" : "off"}`}>{formData.gameTime ? "ON" : "OFF"}</span>
                </div>
              </div>

              <div className="toggle-item">
                <label htmlFor="gameStatistics" className="toggle-label">
                  Estatística do jogo:
                </label>
                <div className="toggle-control">
                  <label className="switch" htmlFor="gameStatistics">
                    <input
                      type="checkbox"
                      id="gameStatistics"
                      checked={formData.gameStatistics}
                      onChange={(e) => setFormData((prev) => ({ ...prev, gameStatistics: e.target.checked }))}
                    />
                    <div className="slider round"></div>
                  </label>
                  <span className={`toggle-status ${formData.gameStatistics ? "on" : "off"}`}>{formData.gameStatistics ? "ON" : "OFF"}</span>
                </div>
              </div>

              <div className="toggle-item">
                <label htmlFor="isSingles" className="toggle-label">
                  Jogo de SIMPLES:
                </label>
                <div className="toggle-control">
                  <label className="switch" htmlFor="isSingles">
                    <input
                      type="checkbox"
                      id="isSingles"
                      checked={formData.isSingles}
                      onChange={(e) => setFormData((prev) => ({ ...prev, isSingles: e.target.checked }))}
                    />
                    <div className="slider round"></div>
                  </label>
                  <span className={`toggle-status ${formData.isSingles ? "on" : "off"}`}>{formData.isSingles ? "ON" : "OFF"}</span>
                </div>
              </div>
            </div>
          </div>

          {error && <div className="auth-error">{error}</div>}

          <div className="form-actions">
            <button type="button" onClick={handleCancel} className="cancel-button" disabled={loading}>
              Cancelar
            </button>
            <button type="submit" className="submit-button" disabled={loading}>
              {loading ? "Criando..." : "CRIAR TORNEIO"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EventForm;
