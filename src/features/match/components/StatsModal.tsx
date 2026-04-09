import { useState } from 'react'
import { supabase } from '../../../services/supabase/client'
import { X, User, Zap, AlertCircle, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'

interface StatsModalProps {
  matchId: string
  isOpen: boolean
  onClose: () => void
}

const STROKE_TYPES = [
  { id: 'ace', label: 'Ace', icon: <Zap className="w-4 h-4" /> },
  { id: 'error', label: 'Erro', icon: <AlertCircle className="w-4 h-4 text-error" /> },
  { id: 'smash_in', label: 'Smash In', icon: <CheckCircle2 className="w-4 h-4" /> },
  { id: 'smash_out', label: 'Smash Out', icon: <AlertCircle className="w-4 h-4 opacity-50" /> },
  { id: 'lob', label: 'Lob', icon: <Activity className="w-4 h-4" /> },
  { id: 'curta', label: 'Curta', icon: <Activity className="w-4 h-4" /> },
]

import { Activity } from 'lucide-react'

export default function StatsModal({ matchId, isOpen, onClose }: StatsModalProps) {
  const [loading, setLoading] = useState(false)
  const [selectedStroke, setSelectedStroke] = useState('')
  const [executor, setExecutor] = useState('')

  if (!isOpen) return null

  const handleSave = async () => {
    if (!selectedStroke) return toast.error('Selecione o tipo de jogada')
    
    setLoading(true)
    const { error } = await supabase
      .from('points')
      .insert({
        match_id: matchId,
        stroke_type: selectedStroke,
        winner: null, // Logic for which team won can be refined
        type: 'stat'
      })
    
    setLoading(false)
    if (error) {
      toast.error('Erro ao salvar estatística')
    } else {
      toast.success('Estatística registrada!')
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center p-0 md:p-6 bg-background/80 backdrop-blur-sm">
      <div className="bg-surface w-full max-w-lg rounded-t-[2.5rem] md:rounded-[2.5rem] p-8 shadow-2xl border border-white/5 animate-in slide-in-from-bottom duration-300">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-2xl font-black italic uppercase tracking-tighter">Registrar Ação</h2>
            <p className="text-xs text-text-muted">Detalhes do último ponto</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="space-y-8">
          {/* Stroke Type */}
          <div className="grid grid-cols-2 gap-3">
            {STROKE_TYPES.map((stroke) => (
              <button
                key={stroke.id}
                onClick={() => setSelectedStroke(stroke.id)}
                className={`flex items-center gap-3 p-4 rounded-2xl border-2 transition-all ${selectedStroke === stroke.id ? 'bg-primary/10 border-primary text-primary' : 'bg-background border-transparent text-text-muted hover:bg-white/5'}`}
              >
                {stroke.icon}
                <span className="font-bold text-sm tracking-tight">{stroke.label}</span>
              </button>
            ))}
          </div>

          <button
            onClick={handleSave}
            disabled={loading}
            className="w-full bg-primary text-primary-foreground p-5 rounded-[1.5rem] font-black uppercase italic text-lg shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
          >
            {loading ? 'Salvando...' : 'Confirmar Registro'}
          </button>
        </div>
      </div>
    </div>
  )
}
