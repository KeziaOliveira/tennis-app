import { useState, useEffect } from 'react'
import { useAuth } from './contexts/AuthContext'
import { useNavigate } from 'react-router'
import { Settings } from 'lucide-react'
import { getUserEvents, type EventDocument } from './services/events/eventService'
import './App.css'

function App() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [events, setEvents] = useState<EventDocument[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const loadEvents = async () => {
      if (!user) {
        setLoading(false)
        return
      }

      try {
        const userEvents = await getUserEvents()
        setEvents(userEvents)
      } catch (err: any) {
        setError(err.message || 'Erro ao carregar eventos')
      } finally {
        setLoading(false)
      }
    }

    loadEvents()
  }, [user])

  const handleSettings = () => {
    // TODO: Implementar navegação para configurações
    console.log('Abrir configurações')
  }

  const handleNewEvent = () => {
    navigate('/new-event')
  }

  const handleEventClick = (eventId: string) => {
    navigate(`/tournament/${eventId}`)
  }

  const formatEventDate = (timestamp: any): string => {
    if (!timestamp) return ''
    
    let date: Date
    if (timestamp.toDate) {
      date = timestamp.toDate()
    } else if (timestamp instanceof Date) {
      date = timestamp
    } else {
      return ''
    }

    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date)
  }

  const getEventPreview = (event: EventDocument): string => {
    if (event.isSingles) {
      return `${event.athlete1Dupla1} vs ${event.athlete1Dupla2}`
    }
    return `${event.athlete1Dupla1} / ${event.athlete2Dupla1} vs ${event.athlete1Dupla2} / ${event.athlete2Dupla2}`
  }

  return (
    <div className="app-container">
      <div className="app-header">
        <div className="user-info">
          <p>Olá, <strong>{user?.displayName || user?.email}</strong></p>
        </div>
        <button 
          onClick={handleSettings}
          className="settings-button"
          aria-label="Configurações"
        >
          <Settings size={20} />
        </button>
      </div>
      
      <div className="app-main">
        <div className="logo-container">
          {/* Logo da marca será inserida aqui */}
        </div>

        {loading ? (
          <div className="events-loading">Carregando eventos...</div>
        ) : error ? (
          <div className="events-error">{error}</div>
        ) : events.length > 0 ? (
          <div className="events-section">
            <h2 className="events-title">Eventos em Andamento</h2>
            <div className="events-list">
              {events.map((event) => (
                <div
                  key={event.id}
                  className="event-card"
                  onClick={() => handleEventClick(event.id)}
                >
                  <div className="event-card-header">
                    <h3 className="event-card-title">{event.tournamentName}</h3>
                    <span className="event-card-date">{formatEventDate(event.createdAt)}</span>
                  </div>
                  <div className="event-card-preview">{getEventPreview(event)}</div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="events-empty">
            <p>Nenhum evento em andamento</p>
          </div>
        )}
        
        <button 
          onClick={handleNewEvent}
          className="new-event-button"
        >
          NOVO EVENTO
        </button>
      </div>
    </div>
  )
}

export default App
