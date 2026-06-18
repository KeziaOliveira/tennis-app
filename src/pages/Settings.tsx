import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import {
  AlertTriangle, Camera, ChevronDown, ChevronLeft,
  Check, Globe, HelpCircle, Instagram, Mail, Monitor,
  Moon, Phone, Send, Shield, Sun, Trash2, Upload, User,
} from 'lucide-react'
import { supabase } from '../services/supabase/client'
import { toast } from 'sonner'
import type { User as SupabaseUser } from '@supabase/supabase-js'
import { useTheme, OVERLAY_COLORS } from '../theme/theme-provider'
import type { OverlayColor } from '../theme/theme-provider'
import { COLOR_THEMES } from '../theme/color-themes'
import type { ColorThemeId } from '../theme/color-themes'

type Tab = 'account' | 'appearance' | 'faq'

async function compressImage(file: File, maxW: number, maxH: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      const ratio = Math.min(maxW / img.width, maxH / img.height, 1)
      const w = Math.round(img.width * ratio)
      const h = Math.round(img.height * ratio)
      const canvas = document.createElement('canvas')
      canvas.width = w
      canvas.height = h
      canvas.getContext('2d')!.drawImage(img, 0, 0, w, h)
      URL.revokeObjectURL(url)
      resolve(canvas.toDataURL('image/jpeg', 0.78))
    }
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Falha ao carregar imagem')) }
    img.src = url
  })
}

const TrophyIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" {...props}>
    <path d="M208.3 64L432.3 64C458.8 64 480.4 85.8 479.4 112.2C479.2 117.5 479 122.8 478.7 128L528.3 128C554.4 128 577.4 149.6 575.4 177.8C567.9 281.5 514.9 338.5 457.4 368.3C441.6 376.5 425.5 382.6 410.2 387.1C390 415.7 369 430.8 352.3 438.9L352.3 512L416.3 512C434 512 448.3 526.3 448.3 544C448.3 561.7 434 576 416.3 576L224.3 576C206.6 576 192.3 561.7 192.3 544C192.3 526.3 206.6 512 224.3 512L288.3 512L288.3 438.9C272.3 431.2 252.4 416.9 233 390.6C214.6 385.8 194.6 378.5 175.1 367.5C121 337.2 72.2 280.1 65.2 177.6C63.3 149.5 86.2 127.9 112.3 127.9L161.9 127.9C161.6 122.7 161.4 117.5 161.2 112.1C160.2 85.6 181.8 63.9 208.3 63.9zM165.5 176L113.1 176C119.3 260.7 158.2 303.1 198.3 325.6C183.9 288.3 172 239.6 165.5 176zM444 320.8C484.5 297 521.1 254.7 527.3 176L475 176C468.8 236.9 457.6 284.2 444 320.8z" />
  </svg>
)

const FAQ_ITEMS = [
  {
    q: 'O que é o ScoreboardBT?',
    a: 'O ScoreboardBT é um aplicativo profissional para marcação de placar e estatísticas em tempo real de partidas de Beach Tennis. Registre pontos, acompanhe sets e games, marque o tempo de jogo e compartilhe o placar ao vivo com um link público — perfeito para torneios, treinamentos e transmissões.',
  },
  {
    q: 'O que é o My Análises BT?',
    a: 'O My Análises BT é o módulo de análise estatística avançada do ScoreboardBT. Processa todas as ações registradas durante a partida — aces, winners, erros e tipos de golpe — e apresenta painéis visuais com gráficos de comparação, momentum e distribuição por atleta ou dupla.',
  },
  {
    q: 'Como funciona o Overlay ao vivo?',
    a: 'Cada partida gera um link público de Overlay para ser aberto em qualquer navegador ou inserido como Browser Source no OBS Studio. O placar atualiza em tempo real e suporta fundo cromático (chroma key) para transmissões profissionais.',
  },
  {
    q: 'Como registrar estatísticas durante a partida?',
    a: 'Ative "Fazer estatísticas" no setup da partida. A cada ponto marcado, um painel aparece para registrar o sacador, tipo de saque e o executor do ponto com sua ação (winner, erro, smash, lob, etc.).',
  },
  {
    q: 'Posso usar para simples e duplas?',
    a: 'Sim! Ao criar uma partida, escolha entre simples (1×1) ou duplas (2×2). As estatísticas e nomes dos atletas se adaptam automaticamente ao formato escolhido.',
  },
  {
    q: 'Como funciona a marcação de pontos?',
    a: 'Clique no botão "+" do time que ganhou o ponto. O sistema converte automaticamente pontos em games — com suporte a No AD e tiebreak — e games em sets, seguindo as regras do Beach Tennis.',
  },
]

const inputCls =
  'w-full bg-surface border border-text/10 rounded-xl px-4 py-3 text-sm font-semibold placeholder:text-text-muted/40 focus:outline-none focus:border-primary/50 transition-colors'

export default function Settings() {
  const navigate = useNavigate()
  const { theme, setTheme, colorTheme, setColorTheme, overlayColor, setOverlayColor } = useTheme()

  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [tab, setTab] = useState<Tab>('account')
  const [saving, setSaving] = useState(false)

  const [displayName, setDisplayName] = useState('')
  const [bio, setBio] = useState('')
  const [avatarSrc, setAvatarSrc] = useState<string | null>(null)
  const [bannerSrc, setBannerSrc] = useState<string | null>(null)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [bannerFile, setBannerFile] = useState<File | null>(null)

  const [instagram, setInstagram] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [website, setWebsite] = useState('')
  const [publicEmail, setPublicEmail] = useState('')

  const [openFaq, setOpenFaq] = useState<number | null>(null)

  const [feedbackMood, setFeedbackMood] = useState<string | null>(null)
  const [feedbackMessage, setFeedbackMessage] = useState('')
  const [feedbackSending, setFeedbackSending] = useState(false)
  const [feedbackSent, setFeedbackSent] = useState(false)

  const [showDelete, setShowDelete] = useState(false)
  const [deleteText, setDeleteText] = useState('')
  const [deleting, setDeleting] = useState(false)

  const avatarRef = useRef<HTMLInputElement>(null)
  const bannerRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { navigate('/login'); return }
      setUser(user)
      const m = user.user_metadata || {}
      setDisplayName(m.full_name || m.name || user.email?.split('@')[0] || '')
      setBio(m.bio || '')
      setAvatarSrc(m.avatar_url || null)
      setBannerSrc(m.banner_url || null)
      setInstagram(m.instagram || '')
      setWhatsapp(m.whatsapp || '')
      setWebsite(m.website || '')
      setPublicEmail(m.public_email || '')
    })
  }, [navigate])

  const pickAvatar = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    if (f.size > 6 * 1024 * 1024) { toast.error('Foto muito grande. Máx. 6 MB.'); return }
    setAvatarFile(f)
    setAvatarSrc(URL.createObjectURL(f))
  }

  const pickBanner = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    if (f.size > 12 * 1024 * 1024) { toast.error('Banner muito grande. Máx. 12 MB.'); return }
    setBannerFile(f)
    setBannerSrc(URL.createObjectURL(f))
  }

  const handleSave = async () => {
    if (!user) return
    setSaving(true)
    try {
      const meta = { ...user.user_metadata }
      meta.full_name = displayName.trim()
      meta.bio = bio.trim()
      meta.instagram = instagram.trim()
      meta.whatsapp = whatsapp.trim()
      meta.website = website.trim()
      meta.public_email = publicEmail.trim()

      if (avatarFile) meta.avatar_url = await compressImage(avatarFile, 320, 320)
      if (bannerFile) meta.banner_url = await compressImage(bannerFile, 1000, 333)

      const { data, error } = await supabase.auth.updateUser({ data: meta })
      if (error) throw error
      if (data.user) setUser(data.user)
      setAvatarFile(null)
      setBannerFile(null)
      toast.success('Configurações salvas!')
    } catch (err: any) {
      toast.error('Erro ao salvar: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleResetPassword = async () => {
    if (!user?.email) return
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })
      if (error) throw error
      toast.success('Link enviado para ' + user.email)
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  const handleFeedback = async () => {
    if (!feedbackMood || !feedbackMessage.trim()) return
    setFeedbackSending(true)
    try {
      const { error } = await supabase.from('feedback').insert({
        user_id: user?.id,
        user_email: user?.email,
        mood: feedbackMood,
        message: feedbackMessage.trim(),
        created_at: new Date().toISOString(),
      })
      if (error) throw error
    } catch {
      // Fallback: salva localmente se a tabela não existir ainda
      try {
        const stored = JSON.parse(localStorage.getItem('bt-pending-feedback') || '[]')
        stored.push({ mood: feedbackMood, message: feedbackMessage.trim(), date: new Date().toISOString(), email: user?.email })
        localStorage.setItem('bt-pending-feedback', JSON.stringify(stored))
      } catch { /* sem localStorage disponível */ }
    }
    setFeedbackSent(true)
    setFeedbackSending(false)
  }

  const handleDeleteAccount = async () => {
    if (deleteText !== 'DELETAR' || !user) return
    setDeleting(true)
    try {
      const { data: matches } = await supabase.from('matches').select('id')
      if (matches?.length) {
        const ids = matches.map((m: any) => m.id)
        await supabase.from('points').delete().in('match_id', ids)
        await supabase.from('matches').delete().in('id', ids)
      }
      await supabase.auth.signOut()
      toast.success('Conta removida.')
    } catch (err: any) {
      toast.error('Erro: ' + err.message)
      setDeleting(false)
    }
  }

  const resolvedTheme =
    theme === 'system'
      ? window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
      : theme

  const tabs: { id: Tab; label: string; Icon: React.ElementType }[] = [
    { id: 'account', label: 'Conta', Icon: User },
    { id: 'appearance', label: 'Aparência', Icon: Sun },
    { id: 'faq', label: 'Ajuda', Icon: HelpCircle },
  ]

  return (
    <div className="min-h-screen bg-background">

      {/* ── Sticky header ── */}
      <header className="sticky top-0 z-30 w-full bg-background/80 backdrop-blur-xl border-b border-surface/60 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-3 group"
            >
              <TrophyIcon className="w-5 h-5 fill-current text-primary" />
              <span className="text-sm font-black uppercase tracking-[0.2em] text-text">
                Scoreboard<span className="text-primary">BT</span>
              </span>
            </button>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-surface border border-white/5">
              <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-primary border border-primary/20 shrink-0 overflow-hidden">
                {avatarSrc
                  ? <img src={avatarSrc} alt="" className="w-full h-full object-cover" />
                  : <User className="w-3.5 h-3.5" />
                }
              </div>
              <span className="text-xs font-black truncate max-w-[120px]">
                {user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email?.split('@')[0]}
              </span>
            </div>
            <button
              onClick={() => navigate('/')}
              className="p-2 hover:bg-text/8 rounded-xl transition-colors text-text-muted hover:text-text"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* ── Profile hero ── */}
      <div className="relative">
        {/* Banner */}
        <div
          className="h-44 sm:h-56 w-full relative overflow-hidden bg-surface cursor-pointer group"
          onClick={() => bannerRef.current?.click()}
        >
          {bannerSrc
            ? <img src={bannerSrc} alt="" className="w-full h-full object-cover" />
            : (
              <div className="w-full h-full bg-gradient-to-br from-primary/20 via-surface to-accent/10 flex items-center justify-center">
                <div className="text-center text-text-muted/40">
                  <Upload className="w-8 h-8 mx-auto mb-2" />
                  <p className="text-xs font-bold uppercase tracking-widest">Adicionar banner</p>
                </div>
              </div>
            )
          }
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 text-white text-sm font-bold">
            <Camera className="w-5 h-5" /> Alterar banner
          </div>
          {/* Bottom gradient for readability */}
          <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-background/60 to-transparent pointer-events-none" />
        </div>
        <input ref={bannerRef} type="file" accept="image/*" className="hidden" onChange={pickBanner} />

        {/* Avatar + name strip */}
        <div className="max-w-3xl mx-auto px-6">
          <div className="flex items-end gap-4 -mt-10 relative z-10 pb-4">
            {/* Avatar */}
            <div
              className="w-20 h-20 rounded-2xl overflow-hidden bg-surface border-4 border-background shadow-xl cursor-pointer group relative shrink-0"
              onClick={() => avatarRef.current?.click()}
            >
              {avatarSrc
                ? <img src={avatarSrc} alt="" className="w-full h-full object-cover" />
                : (
                  <div className="w-full h-full flex items-center justify-center bg-primary/15">
                    <User className="w-8 h-8 text-primary/60" />
                  </div>
                )
              }
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Camera className="w-4 h-4 text-white" />
              </div>
            </div>
            <input ref={avatarRef} type="file" accept="image/*" className="hidden" onChange={pickAvatar} />

            {/* Name */}
            <div className="flex-1 min-w-0 pb-1">
              <p className="text-lg font-black truncate leading-none">
                {displayName || user?.email?.split('@')[0]}
              </p>
              {bio && (
                <p className="text-xs text-text-muted mt-0.5 line-clamp-1 font-medium">{bio}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Tab bar ── */}
      <div className="sticky top-16 z-10 bg-background/90 backdrop-blur-sm border-b border-text/8">
        <div className="max-w-3xl mx-auto px-4">
          <div className="flex gap-1 overflow-x-auto scrollbar-none py-3">
            {tabs.map(({ id, label, Icon }) => (
              <button
                key={id}
                onClick={() => setTab(id)}
                className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider whitespace-nowrap transition-all shrink-0 ${
                  tab === id
                    ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20'
                    : 'text-text-muted hover:text-text hover:bg-text/5'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Tab content ── */}
      <div className="max-w-3xl mx-auto px-6 py-8">

        {/* ── CONTA ── (perfil + contatos + segurança) */}
        {tab === 'account' && (
          <div className="space-y-8">
            <div>
              <h2 className="text-xl font-black uppercase tracking-tight mb-1">Conta</h2>
              <p className="text-sm text-text-muted font-medium">Clique no banner ou na foto acima para alterá-los.</p>
            </div>

            {/* Perfil */}
            <section className="space-y-4">
              <p className="text-[10px] font-black uppercase tracking-widest text-text-muted border-b border-text/8 pb-2">Perfil</p>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <p className="text-[10px] font-black uppercase tracking-widest text-text-muted mb-2">Nome de Exibição</p>
                  <input
                    type="text"
                    value={displayName}
                    onChange={e => setDisplayName(e.target.value)}
                    placeholder="Seu nome ou apelido"
                    className={inputCls}
                  />
                </div>
                <div className="sm:col-span-2">
                  <p className="text-[10px] font-black uppercase tracking-widest text-text-muted mb-2">Bio</p>
                  <textarea
                    value={bio}
                    onChange={e => setBio(e.target.value.slice(0, 200))}
                    placeholder="Uma frase sobre você, seu trabalho ou clube..."
                    rows={3}
                    className={`${inputCls} resize-none`}
                  />
                  <p className="text-[10px] text-text-muted text-right mt-1">{bio.length}/200</p>
                </div>
              </div>
            </section>

            {/* Contatos */}
            <section className="space-y-4">
              <p className="text-[10px] font-black uppercase tracking-widest text-text-muted border-b border-text/8 pb-2">Contatos</p>
              <div className="grid sm:grid-cols-2 gap-4">
                {(
                  [
                    { label: 'Instagram', Icon: Instagram, value: instagram, set: (v: string) => setInstagram(v.replace('@', '')), placeholder: 'seuusuario', prefix: '@', type: 'text' },
                    { label: 'WhatsApp', Icon: Phone, value: whatsapp, set: setWhatsapp, placeholder: '+55 (11) 99999-9999', type: 'tel' },
                    { label: 'Website', Icon: Globe, value: website, set: setWebsite, placeholder: 'https://seusite.com.br', type: 'url' },
                    { label: 'E-mail público', Icon: Mail, value: publicEmail, set: setPublicEmail, placeholder: 'contato@dominio.com', type: 'email' },
                  ] as const
                ).map(({ label, Icon, value, set, placeholder, prefix, type }) => (
                  <div key={label}>
                    <p className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-text-muted mb-2">
                      <Icon className="w-3.5 h-3.5" /> {label}
                    </p>
                    <div className="relative">
                      {prefix && (
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted text-sm font-bold pointer-events-none">@</span>
                      )}
                      <input
                        type={type}
                        value={value}
                        onChange={e => set(e.target.value)}
                        placeholder={placeholder}
                        className={`${inputCls} ${prefix ? 'pl-8' : ''}`}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <SaveButton saving={saving} onClick={handleSave} />

            {/* Segurança */}
            <section className="space-y-4">
              <p className="text-[10px] font-black uppercase tracking-widest text-text-muted border-b border-text/8 pb-2">Segurança</p>

              <div className="bg-surface rounded-2xl p-5 border border-text/10">
                <div className="flex items-center gap-3 mb-4">
                  <Mail className="w-4 h-4 text-text-muted shrink-0" />
                  <span className="text-sm font-semibold text-text-muted truncate flex-1">{user?.email}</span>
                  <span className="text-[10px] bg-text/8 text-text-muted px-2 py-0.5 rounded-lg font-bold shrink-0">Somente leitura</span>
                </div>
                <button
                  onClick={handleResetPassword}
                  className="flex items-center gap-2 px-4 py-2.5 bg-primary/10 hover:bg-primary/20 text-primary rounded-xl text-xs font-black uppercase tracking-wider transition-all active:scale-95"
                >
                  <Send className="w-3.5 h-3.5" />
                  Redefinir senha
                </button>
              </div>
            </section>

            {/* Zona de perigo */}
            <section className="space-y-4">
              <p className="text-[10px] font-black uppercase tracking-widest text-error/70 border-b border-error/15 pb-2">Zona de Perigo</p>
              <div className="bg-error/5 rounded-2xl p-5 border border-error/20">
                <p className="text-xs text-text-muted leading-relaxed mb-4 font-medium">
                  Remove permanentemente sua conta, todas as partidas e estatísticas.{' '}
                  <span className="text-error font-bold">Irreversível.</span>
                </p>
                {!showDelete ? (
                  <button
                    onClick={() => setShowDelete(true)}
                    className="flex items-center gap-2 px-4 py-2.5 bg-error/10 hover:bg-error/20 text-error rounded-xl text-xs font-black uppercase tracking-wider transition-all active:scale-95"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Deletar minha conta
                  </button>
                ) : (
                  <div className="space-y-3">
                    <p className="text-xs font-bold">
                      Digite{' '}
                      <kbd className="font-mono font-black bg-error/15 text-error px-1.5 py-0.5 rounded text-[10px]">DELETAR</kbd>
                      {' '}para confirmar:
                    </p>
                    <input
                      type="text"
                      value={deleteText}
                      onChange={e => setDeleteText(e.target.value)}
                      placeholder="DELETAR"
                      autoFocus
                      className="w-full bg-background border border-error/30 focus:border-error rounded-xl px-4 py-3 text-sm font-mono font-black focus:outline-none transition-colors placeholder:opacity-30 max-w-xs"
                    />
                    <div className="flex gap-2 max-w-xs">
                      <button
                        onClick={() => { setShowDelete(false); setDeleteText('') }}
                        className="flex-1 py-2.5 bg-surface hover:bg-text/10 rounded-xl text-xs font-black uppercase tracking-wider transition-all border border-text/10"
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={handleDeleteAccount}
                        disabled={deleteText !== 'DELETAR' || deleting}
                        className="flex-1 py-2.5 bg-error text-white rounded-xl text-xs font-black uppercase tracking-wider disabled:opacity-30 disabled:cursor-not-allowed hover:bg-error/90 active:scale-95 transition-all"
                      >
                        {deleting ? 'Removendo...' : 'Confirmar'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </section>
          </div>
        )}

        {/* ── APARÊNCIA ── */}
        {tab === 'appearance' && (
          <div className="space-y-10">
            <div>
              <h2 className="text-xl font-black uppercase tracking-tight mb-1">Aparência</h2>
              <p className="text-sm text-text-muted font-medium">Personalize o modo de exibição e o tema de cores do aplicativo.</p>
            </div>

            {/* Mode */}
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-text-muted mb-4">Modo de Exibição</p>
              <div className="grid grid-cols-2 gap-3 max-w-xs">
                {(
                  [
                    { id: 'light' as const, label: 'Claro', Icon: Sun },
                    { id: 'dark' as const, label: 'Escuro', Icon: Moon },
                  ]
                ).map(({ id, label, Icon }) => (
                  <button
                    key={id}
                    onClick={() => setTheme(id)}
                    className={`flex flex-col items-center gap-3 p-5 rounded-2xl border-2 transition-all ${
                      theme === id || (theme === 'system' && id === 'dark')
                        ? 'border-primary bg-primary/8 shadow-md shadow-primary/10'
                        : 'border-text/10 hover:border-text/25 hover:bg-text/5'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      theme === id || (theme === 'system' && id === 'dark') ? 'bg-primary text-primary-foreground' : 'bg-text/8 text-text-muted'
                    }`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="text-center">
                      <p className={`text-xs font-black uppercase tracking-wider ${
                        theme === id || (theme === 'system' && id === 'dark') ? 'text-primary' : 'text-text-muted'
                      }`}>
                        {label}
                      </p>
                      {(theme === id || (theme === 'system' && id === 'dark')) && (
                        <p className="text-[10px] text-primary/70 mt-0.5 font-bold">Ativo</p>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Color themes */}
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-text-muted mb-4">Tema de Cores</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {COLOR_THEMES.map((ct) => {
                  const active = colorTheme === ct.id
                  const previewColor = resolvedTheme === 'dark' ? ct.darkColor : ct.lightColor
                  return (
                    <button
                      key={ct.id}
                      onClick={() => setColorTheme(ct.id as ColorThemeId)}
                      className={`flex items-center gap-3 p-4 rounded-2xl border-2 text-left transition-all ${
                        active
                          ? 'border-primary bg-primary/8 shadow-md shadow-primary/10'
                          : 'border-text/10 hover:border-text/25 hover:bg-text/5'
                      }`}
                    >
                      {/* Color swatch */}
                      <div
                        className="w-9 h-9 rounded-xl shrink-0 flex items-center justify-center shadow-sm"
                        style={{ backgroundColor: previewColor }}
                      >
                        {active && <Check className="w-4 h-4 text-white drop-shadow" />}
                      </div>
                      <div className="min-w-0">
                        <p className={`text-xs font-black uppercase tracking-wider truncate ${active ? 'text-primary' : 'text-text'}`}>
                          {ct.label}
                        </p>
                        <p className="text-[10px] text-text-muted font-medium truncate">{ct.description}</p>
                      </div>
                    </button>
                  )
                })}
              </div>

              {/* Live preview strip */}
              <div className="mt-6 p-4 bg-surface rounded-2xl border border-text/10">
                <p className="text-[10px] font-black uppercase tracking-widest text-text-muted mb-3">Pré-visualização</p>
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="px-4 py-2 bg-primary text-primary-foreground rounded-xl text-xs font-black uppercase">Primária</span>
                  <span className="px-4 py-2 bg-accent text-white rounded-xl text-xs font-black uppercase">Accent</span>
                  <span className="px-4 py-2 bg-success/20 text-success rounded-xl text-xs font-black uppercase">Sucesso</span>
                  <span className="px-4 py-2 bg-error/20 text-error rounded-xl text-xs font-black uppercase">Erro</span>
                  <span className="w-3 h-3 rounded-full bg-primary inline-block" />
                  <span className="text-sm font-black text-primary">ScoreboardBT</span>
                </div>
              </div>
            </div>

            {/* Overlay chroma key color */}
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-text-muted mb-1">Cor do Overlay — Chroma Key</p>
              <p className="text-xs text-text-muted font-medium mb-4 leading-relaxed">
                Cor de fundo usada no link público do placar. Escolha uma cor compatível com o seu software de transmissão (OBS, vMix, etc.) para aplicar o efeito de chroma key.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {OVERLAY_COLORS.map((oc) => {
                  const active = overlayColor === oc.id
                  const isTransparent = oc.id === 'transparent'
                  return (
                    <button
                      key={oc.id}
                      onClick={() => setOverlayColor(oc.id as OverlayColor)}
                      className={`flex items-center gap-3 p-4 rounded-2xl border-2 text-left transition-all ${
                        active
                          ? 'border-primary bg-primary/8 shadow-md shadow-primary/10'
                          : 'border-text/10 hover:border-text/25 hover:bg-text/5'
                      }`}
                    >
                      {/* Swatch */}
                      <div
                        className={`w-10 h-10 rounded-xl shrink-0 shadow-sm flex items-center justify-center ${isTransparent ? 'border-2 border-dashed border-text/20' : ''}`}
                        style={{ backgroundColor: isTransparent ? undefined : oc.hex }}
                      >
                        {isTransparent && (
                          <span className="text-[10px] font-black text-text-muted/60 leading-none text-center">α</span>
                        )}
                        {active && !isTransparent && (
                          <Check className="w-4 h-4 text-black drop-shadow" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className={`text-xs font-black uppercase tracking-wider ${active ? 'text-primary' : 'text-text'}`}>
                          {oc.label}
                        </p>
                        <p className="text-[10px] text-text-muted font-medium">{oc.description}</p>
                        {!isTransparent && (
                          <p className="text-[10px] font-mono text-text-muted/60 mt-0.5">{oc.hex}</p>
                        )}
                      </div>
                    </button>
                  )
                })}
              </div>

              {/* Overlay preview */}
              <div className="mt-4 rounded-2xl overflow-hidden border border-text/10 shadow-sm">
                <div
                  className="h-20 flex items-center justify-center transition-all duration-300"
                  style={{
                    backgroundColor: overlayColor === 'transparent' ? undefined : OVERLAY_COLORS.find(o => o.id === overlayColor)?.hex,
                    backgroundImage: overlayColor === 'transparent'
                      ? 'repeating-conic-gradient(#ccc 0% 25%, #fff 0% 50%) 0 0 / 16px 16px'
                      : undefined,
                  }}
                >
                  <span className="text-[10px] font-black uppercase tracking-widest text-black/40 bg-white/20 px-3 py-1 rounded-lg">
                    Pré-visualização do fundo do overlay
                  </span>
                </div>
                <div className="bg-surface px-4 py-2 flex items-center gap-2">
                  <span className="text-[10px] text-text-muted font-medium">Esta cor é usada automaticamente ao copiar o link do overlay no Dashboard.</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── AJUDA / FAQ ── */}
        {tab === 'faq' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-black uppercase tracking-tight mb-1">Ajuda</h2>
              <p className="text-sm text-text-muted font-medium">Tudo o que você precisa saber sobre o ScoreboardBT.</p>
            </div>

            {/* App info cards */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="bg-primary/8 rounded-2xl p-5 border border-primary/15">
                <p className="text-[10px] font-black uppercase tracking-widest text-primary mb-2">My Scoreboards BT</p>
                <p className="text-sm text-text-muted leading-relaxed font-medium">
                  Seu painel central de controle para Beach Tennis. Crie e gerencie partidas em tempo real, gere links de overlay para transmissões profissionais e acesse o histórico completo das suas partidas com um clique.
                </p>
              </div>
              <div className="bg-accent/8 rounded-2xl p-5 border border-accent/15">
                <p className="text-[10px] font-black uppercase tracking-widest text-accent mb-2">My Análises BT</p>
                <p className="text-sm text-text-muted leading-relaxed font-medium">
                  O sistema de análise estatística avançada. Visualize o desempenho por atleta e dupla com gráficos de momentum, comparativos e distribuição de golpes — tudo gerado automaticamente dos dados da partida.
                </p>
              </div>
            </div>

            {/* FAQ accordions */}
            <div className="space-y-2">
              <p className="text-[10px] font-black uppercase tracking-widest text-text-muted pb-1">Perguntas Frequentes</p>
              {FAQ_ITEMS.map((item, i) => (
                <div key={i} className="bg-surface rounded-2xl border border-text/8 overflow-hidden">
                  <button
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    className="w-full flex items-start justify-between gap-4 px-5 py-4 text-left hover:bg-text/5 transition-colors"
                  >
                    <span className="text-sm font-bold leading-snug">{item.q}</span>
                    <ChevronDown
                      className={`w-4 h-4 text-primary shrink-0 mt-0.5 transition-transform duration-300 ${openFaq === i ? 'rotate-180' : ''}`}
                    />
                  </button>
                  {openFaq === i && (
                    <div className="px-5 pb-5">
                      <div className="pt-3 border-t border-text/8">
                        <p className="text-sm text-text-muted leading-relaxed font-medium">{item.a}</p>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Feedback */}
            <FeedbackBlock
              mood={feedbackMood}
              setMood={setFeedbackMood}
              message={feedbackMessage}
              setMessage={setFeedbackMessage}
              sending={feedbackSending}
              sent={feedbackSent}
              onSubmit={handleFeedback}
              onReset={() => { setFeedbackSent(false); setFeedbackMood(null); setFeedbackMessage('') }}
            />
          </div>
        )}
      </div>
    </div>
  )
}

const MOODS = [
  { id: 'ruim',     emoji: '😕', label: 'Ruim' },
  { id: 'regular',  emoji: '😐', label: 'Regular' },
  { id: 'bom',      emoji: '😊', label: 'Bom' },
  { id: 'incrivel', emoji: '🤩', label: 'Incrível' },
]

function FeedbackBlock({
  mood, setMood, message, setMessage, sending, sent, onSubmit, onReset,
}: {
  mood: string | null
  setMood: (m: string) => void
  message: string
  setMessage: (v: string) => void
  sending: boolean
  sent: boolean
  onSubmit: () => void
  onReset: () => void
}) {
  const canSubmit = !!mood && message.trim().length > 0

  return (
    <div className="relative overflow-hidden rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/5 via-surface to-accent/5">
      {/* Decorative blobs */}
      <div className="pointer-events-none absolute -top-10 -right-10 w-40 h-40 rounded-full bg-primary/10 blur-2xl" />
      <div className="pointer-events-none absolute -bottom-8 -left-8 w-32 h-32 rounded-full bg-accent/10 blur-2xl" />

      <div className="relative p-6 sm:p-8">
        {sent ? (
          /* ── Success state ── */
          <div className="flex flex-col items-center text-center py-4 gap-4">
            <div className="text-6xl leading-none select-none animate-bounce">🎾</div>
            <div>
              <p className="text-xl font-black uppercase tracking-tight">Obrigado pelo feedback!</p>
              <p className="text-sm text-text-muted font-medium mt-1 leading-relaxed">
                Sua opinião é muito importante para nós.<br />Vamos continuar melhorando o ScoreboardBT.
              </p>
            </div>
            <button
              onClick={onReset}
              className="text-xs font-black uppercase tracking-wider text-primary hover:underline mt-1"
            >
              Enviar outro feedback
            </button>
          </div>
        ) : (
          /* ── Form ── */
          <div className="space-y-5">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-primary mb-0.5">Envie seu Feedback</p>
              <p className="text-sm text-text-muted font-medium leading-relaxed">
                O que você está achando do ScoreboardBT? Sua opinião nos ajuda a melhorar.
              </p>
            </div>

            {/* Mood picker */}
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-text-muted mb-3">
                Como você avalia o sistema?
              </p>
              <div className="grid grid-cols-4 gap-2">
                {MOODS.map(({ id, emoji, label }) => {
                  const active = mood === id
                  return (
                    <button
                      key={id}
                      onClick={() => setMood(id)}
                      className={`flex flex-col items-center gap-1.5 py-3 px-2 rounded-2xl border-2 transition-all select-none ${
                        active
                          ? 'border-primary bg-primary/10 shadow-md shadow-primary/10 scale-105'
                          : 'border-text/10 hover:border-primary/30 hover:bg-text/5 hover:scale-105'
                      }`}
                    >
                      <span className="text-2xl leading-none">{emoji}</span>
                      <span className={`text-[10px] font-black uppercase tracking-wider ${active ? 'text-primary' : 'text-text-muted'}`}>
                        {label}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Message */}
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-text-muted mb-2">
                Conta mais sobre sua experiência
              </p>
              <textarea
                value={message}
                onChange={e => setMessage(e.target.value.slice(0, 600))}
                placeholder="O que você mais gostou? O que poderia melhorar? Alguma funcionalidade que está faltando?"
                rows={4}
                className="w-full bg-background border border-text/10 rounded-xl px-4 py-3 text-sm font-medium placeholder:text-text-muted/40 focus:outline-none focus:border-primary/50 transition-colors resize-none"
              />
              <p className="text-[10px] text-text-muted text-right mt-1">{message.length}/600</p>
            </div>

            {/* Submit */}
            <button
              onClick={onSubmit}
              disabled={!canSubmit || sending}
              className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground py-3.5 rounded-2xl font-black uppercase tracking-wider text-sm disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 active:scale-[0.98] transition-all shadow-lg shadow-primary/20"
            >
              {sending ? (
                <>
                  <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Enviar Feedback
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

function SaveButton({ saving, onClick }: { saving: boolean; onClick: () => void }) {
  return (
    <div className="pt-2">
      <button
        onClick={onClick}
        disabled={saving}
        className="flex items-center gap-2 bg-primary text-primary-foreground px-8 py-3.5 rounded-2xl font-black uppercase tracking-wider text-sm disabled:opacity-50 hover:opacity-90 active:scale-[0.98] transition-all shadow-lg shadow-primary/20"
      >
        {saving ? (
          <>
            <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
            Salvando...
          </>
        ) : (
          'Salvar Alterações'
        )}
      </button>
    </div>
  )
}
