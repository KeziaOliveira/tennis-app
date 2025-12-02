import { useAuth } from './contexts/AuthContext'
import { useNavigate } from 'react-router'
import { Settings } from 'lucide-react'
import './App.css'

function App() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const handleSettings = () => {
    // TODO: Implementar navegação para configurações
    console.log('Abrir configurações')
  }

  const handleNewEvent = () => {
    navigate('/new-event')
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
