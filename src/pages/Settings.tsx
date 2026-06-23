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
import { OVERLAY_THEMES } from './Overlay'

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

const ArrowDownIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" {...props}>
    <path d="M297.4 566.6C309.9 579.1 330.2 579.1 342.7 566.6L502.7 406.6C515.2 394.1 515.2 373.8 502.7 361.3C490.2 348.8 469.9 348.8 457.4 361.3L352 466.7L352 96C352 78.3 337.7 64 320 64C302.3 64 288 78.3 288 96L288 466.7L182.6 361.3C170.1 348.8 149.8 348.8 137.3 361.3C124.8 373.8 124.8 394.1 137.3 406.6L297.3 566.6z" />
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
  const [offersMessage, setOffersMessage] = useState('')

  const [ovTheme, setOvTheme] = useState('navy-yellow')
  const [ovPosition, setOvPosition] = useState('top-left')
  const [ovScale, setOvScale] = useState(1.0)
  const [ovBgColor, setOvBgColor] = useState<OverlayColor>(overlayColor)
  const [ovSaving, setOvSaving] = useState(false)

  const persistThemePref = (key: string, value: string) => {
    if (!user) return
    supabase.auth.updateUser({ data: { [key]: value } }).catch(() => {})
  }

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
      setOffersMessage(m.offers_message || '')
      const oc = m.overlayConfig || {}
      setOvTheme(oc.theme || 'navy-yellow')
      setOvPosition(oc.position || 'top-left')
      setOvScale(oc.scale || 1.0)
      setOvBgColor((oc.bgColor as OverlayColor) || overlayColor || 'green')
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
      const updates: Record<string, unknown> = {
        full_name: displayName.trim(),
        bio: bio.trim(),
        instagram: instagram.trim(),
        whatsapp: whatsapp.trim(),
        website: website.trim(),
        public_email: publicEmail.trim(),
        offers_message: offersMessage.trim(),
      }
      if (avatarFile) updates.avatar_url = await compressImage(avatarFile, 320, 320)
      if (bannerFile) updates.banner_url = await compressImage(bannerFile, 1000, 333)

      const { data, error } = await supabase.auth.updateUser({ data: updates })
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

  const handleSaveOverlay = async () => {
    if (!user) return
    setOvSaving(true)
    try {
      const overlayConfig = { theme: ovTheme, position: ovPosition, scale: ovScale, bgColor: ovBgColor }
      setOverlayColor(ovBgColor)
      const { data, error } = await supabase.auth.updateUser({ data: { overlayConfig, overlayColor: ovBgColor } })
      if (error) throw error
      if (data.user) setUser(data.user)

      // Propagate to all user matches so overlay reads it immediately
      const { data: matches } = await supabase.from('matches').select('id, settings')
      if (matches?.length) {
        await Promise.all(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          matches.map((m: any) =>
            supabase.from('matches').update({ settings: { ...m.settings, overlayConfig } }).eq('id', m.id)
          )
        )
      }
      toast.success('Aparência do overlay salva!')
    } catch (err: any) {
      toast.error('Erro ao salvar: ' + err.message)
    } finally {
      setOvSaving(false)
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
          <div className="flex gap-1 py-3">
            {tabs.map(({ id, label, Icon }) => (
              <button
                key={id}
                onClick={() => setTab(id)}
                className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-2.5 rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-wider transition-all ${
                  tab === id
                    ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20'
                    : 'text-text-muted hover:text-text hover:bg-text/5'
                }`}
              >
                <Icon className="w-3.5 h-3.5 hidden sm:block" />
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

            {/* Divulgação */}
            <section className="space-y-4">
              <p className="text-[10px] font-black uppercase tracking-widest text-text-muted border-b border-text/8 pb-2">Divulgação</p>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-text-muted mb-2">Nossas Ofertas</p>
                <textarea
                  value={offersMessage}
                  onChange={e => setOffersMessage(e.target.value.slice(0, 300))}
                  placeholder="Ex: Inscrições abertas para a Copa Arena! Pacotes especiais para duplas. Garanta sua vaga."
                  rows={3}
                  className={`${inputCls} resize-none`}
                />
                <p className="text-[10px] text-text-muted text-right mt-1">{offersMessage.length}/300</p>
                <p className="text-[10px] text-text-muted mt-1 leading-relaxed">
                  Essa mensagem aparece como banner no seu Dashboard quando preenchida.
                </p>
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
              <div className="grid grid-cols-3 gap-3 w-full">
                {(
                  [
                    { id: 'light' as const, label: 'Claro', Icon: Sun },
                    { id: 'gray'  as const, label: 'Padrão', Icon: Monitor },
                    { id: 'dark'  as const, label: 'Escuro', Icon: Moon },
                  ]
                ).map(({ id, label, Icon }) => (
                  <button
                    key={id}
                    onClick={() => { setTheme(id); persistThemePref('theme', id) }}
                    className={`flex flex-col items-center gap-3 p-5 rounded-2xl border-2 transition-all ${
                      theme === id
                        ? 'border-primary bg-primary/8 shadow-md shadow-primary/10'
                        : 'border-text/10 hover:border-text/25 hover:bg-text/5'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      theme === id ? 'bg-primary text-primary-foreground' : 'bg-text/8 text-text-muted'
                    }`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="text-center">
                      <p className={`text-xs font-black uppercase tracking-wider ${
                        theme === id ? 'text-primary' : 'text-text-muted'
                      }`}>
                        {label}
                      </p>
                      {theme === id && (
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
                      onClick={() => { setColorTheme(ct.id as ColorThemeId); persistThemePref('colorTheme', ct.id) }}
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
                  const active = ovBgColor === oc.id
                  return (
                    <button
                      key={oc.id}
                      onClick={() => setOvBgColor(oc.id as OverlayColor)}
                      className={`flex items-center gap-3 p-4 rounded-2xl border-2 text-left transition-all ${
                        active
                          ? 'border-primary bg-primary/8 shadow-md shadow-primary/10'
                          : 'border-text/10 hover:border-text/25 hover:bg-text/5'
                      }`}
                    >
                      <div
                        className="w-10 h-10 rounded-xl shrink-0 shadow-sm flex items-center justify-center"
                        style={{ backgroundColor: oc.hex }}
                      >
                        {active && <Check className="w-4 h-4 text-black drop-shadow" />}
                      </div>
                      <div className="min-w-0">
                        <p className={`text-xs font-black uppercase tracking-wider ${active ? 'text-primary' : 'text-text'}`}>
                          {oc.label}
                        </p>
                        <p className="text-[10px] text-text-muted font-medium">{oc.description}</p>
                        <p className="text-[10px] font-mono text-text-muted/60 mt-0.5">{oc.hex}</p>
                      </div>
                    </button>
                  )
                })}
              </div>

              <p className="text-[10px] text-text-muted mt-3">Esta cor é aplicada automaticamente ao copiar o link do overlay no Dashboard.</p>
            </div>

            {/* Overlay appearance */}
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-text-muted mb-1">Overlay — Aparência do Placar</p>
              <p className="text-xs text-text-muted font-medium mb-4 leading-relaxed">
                Defina o tema de cores, posição e tamanho do placar. Aplica-se a todas as suas partidas.
              </p>

              <div className="space-y-3">

                {/* Cores */}
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-black uppercase tracking-widest text-text-muted w-14 shrink-0">Cores</span>
                  <div className="flex gap-2.5">
                    {Object.entries(OVERLAY_THEMES).map(([key, t]) => (
                      <button
                        key={key}
                        onClick={() => setOvTheme(key)}
                        title={t.label}
                        className="relative w-8 h-8 rounded-full transition-all shrink-0"
                        style={{
                          background: t.bg,
                          boxShadow: ovTheme === key
                            ? `0 0 0 2px white, 0 0 0 3.5px ${t.accent}`
                            : '0 0 0 1.5px rgba(0,0,0,0.15)',
                          transform: ovTheme === key ? 'scale(1.15)' : undefined,
                        }}
                      >
                        <div className="absolute bottom-0.5 right-0.5 w-2.5 h-2.5 rounded-full border border-black/20" style={{ background: t.accent }} />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Posição + Tamanho na mesma linha */}
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="text-[10px] font-black uppercase tracking-widest text-text-muted w-14 shrink-0">Posição</span>
                  <div className="flex gap-1">
                    {([
                      { key: 'top-left',     rot: 135  },
                      { key: 'top-right',    rot: -135 },
                      { key: 'center',       rot: null },
                      { key: 'bottom-left',  rot: 45   },
                      { key: 'bottom-right', rot: -45  },
                    ] as const).map(({ key, rot }) => (
                      <button
                        key={key}
                        onClick={() => setOvPosition(key)}
                        className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all border-2 ${
                          ovPosition === key
                            ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                            : 'bg-background text-text-muted border-text/10 hover:border-text/25 hover:text-text'
                        }`}
                      >
                        {rot === null ? (
                          <span className="text-xs font-black">⊙</span>
                        ) : (
                          <ArrowDownIcon
                            style={{ width: 13, height: 13, transform: `rotate(${rot}deg)` }}
                            fill="currentColor"
                          />
                        )}
                      </button>
                    ))}
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-text-muted shrink-0">Tam.</span>
                  <div className="flex gap-1">
                    {([{ v: 0.8, l: 'P' }, { v: 1.0, l: 'M' }, { v: 1.25, l: 'G' }] as const).map(({ v, l }) => (
                      <button
                        key={l}
                        onClick={() => setOvScale(v)}
                        className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all border-2 ${
                          ovScale === v
                            ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                            : 'bg-background text-text-muted border-text/10 hover:border-text/25 hover:text-text'
                        }`}
                      >
                        {l}
                      </button>
                    ))}
                  </div>
                </div>

              </div>

              {/* Pré-visualização unificada */}
              <div className="mt-4 p-4 bg-surface rounded-2xl border border-text/10">
                <p className="text-[10px] font-black uppercase tracking-widest text-text-muted mb-3">Pré-visualização</p>
                <div
                  className="rounded-xl overflow-hidden relative w-full"
                  style={{
                    aspectRatio: '16/9',
                    backgroundColor: OVERLAY_COLORS.find(o => o.id === ovBgColor)?.hex,
                  }}
                >
                  <div
                    className="absolute flex items-center gap-0.5 sm:gap-1 px-1.5 sm:px-3 py-1 sm:py-1.5 rounded-lg sm:rounded-xl shadow-xl"
                    style={{
                      background: OVERLAY_THEMES[ovTheme]?.bg || '#0B3B60',
                      ...(ovPosition === 'center'
                        ? { top: '50%', left: '50%', transform: `translate(-50%, -50%) scale(${ovScale})` }
                        : ovPosition === 'top-right'
                        ? { top: 6, right: 6, transformOrigin: 'top right', transform: `scale(${ovScale})` }
                        : ovPosition === 'bottom-left'
                        ? { bottom: 6, left: 6, transformOrigin: 'bottom left', transform: `scale(${ovScale})` }
                        : ovPosition === 'bottom-right'
                        ? { bottom: 6, right: 6, transformOrigin: 'bottom right', transform: `scale(${ovScale})` }
                        : { top: 6, left: 6, transformOrigin: 'top left', transform: `scale(${ovScale})` }
                      ),
                    }}
                  >
                    <span className="text-[7px] sm:text-[13px] text-white font-black italic uppercase whitespace-nowrap" style={{ letterSpacing: '-0.01em' }}>Atleta A</span>
                    <div className="flex gap-0.5 sm:gap-1 shrink-0">
                      <div className="w-5 h-3.5 sm:w-9 sm:h-6 rounded sm:rounded-md flex items-center justify-center font-black text-[7px] sm:text-[13px]" style={{ background: OVERLAY_THEMES[ovTheme]?.accent, color: OVERLAY_THEMES[ovTheme]?.accentText, letterSpacing: '-0.03em' }}>15</div>
                      <div className="w-4 h-3.5 sm:w-7 sm:h-6 rounded sm:rounded-md flex items-center justify-center font-black text-[7px] sm:text-[13px] text-white" style={{ background: 'rgba(255,255,255,0.12)' }}>2</div>
                      <div className="w-4 h-3.5 sm:w-7 sm:h-6 rounded sm:rounded-md flex items-center justify-center font-black text-[7px] sm:text-[13px]" style={{ background: 'rgba(255,255,255,0.92)', color: OVERLAY_THEMES[ovTheme]?.bg }}>1</div>
                    </div>
                    <span className="text-[7px] sm:text-[13px] text-white font-black italic uppercase whitespace-nowrap" style={{ letterSpacing: '-0.01em' }}>Atleta B</span>
                  </div>
                </div>
              </div>

              <button
                onClick={handleSaveOverlay}
                disabled={ovSaving}
                className="mt-4 w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground py-2.5 rounded-xl font-black uppercase tracking-wider text-xs disabled:opacity-50 hover:opacity-90 active:scale-[0.98] transition-all shadow-md shadow-primary/15"
              >
                {ovSaving ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                    Salvando...
                  </>
                ) : 'Salvar Aparência do Overlay'}
              </button>
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

const FaceSVG = ({ path, className }: { path: string; className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" fill="currentColor" className={className}>
    <path d={path} />
  </svg>
)

const MOODS = [
  {
    id: 'ruim', label: 'Ruim',
    path: 'M320 112C434.9 112 528 205.1 528 320C528 434.9 434.9 528 320 528C205.1 528 112 434.9 112 320C112 205.1 205.1 112 320 112zM320 576C461.4 576 576 461.4 576 320C576 178.6 461.4 64 320 64C178.6 64 64 178.6 64 320C64 461.4 178.6 576 320 576zM320 432C344.1 432 365.4 443.8 378.5 462C386.2 472.8 401.2 475.2 412 467.5C422.8 459.8 425.2 444.8 417.5 434C395.8 403.8 360.2 384 320 384C279.8 384 244.3 403.8 222.5 434C214.8 444.8 217.2 459.8 228 467.5C238.8 475.2 253.8 472.8 261.5 462C274.6 443.8 295.9 432 320 432zM240 336C257.7 336 272 321.7 272 304L272 303.7L281.7 306.9C292.2 310.4 303.5 304.7 307 294.3C310.5 283.9 304.8 272.5 294.4 269L198.4 237C187.9 233.5 176.6 239.2 173.1 249.6C169.6 260 175.3 271.4 185.7 274.9L214.6 284.5C210.5 289.9 208 296.6 208 303.9C208 321.6 222.3 335.9 240 335.9zM432 304C432 296.7 429.6 290 425.4 284.6L454.3 275C464.8 271.5 470.4 260.2 466.9 249.7C463.4 239.2 452.1 233.6 441.6 237.1L345.6 269.1C335.1 272.6 329.5 283.9 333 294.4C336.5 304.9 347.8 310.5 358.3 307L368 303.8L368 304.1C368 321.8 382.3 336.1 400 336.1C417.7 336.1 432 321.8 432 304.1z',
  },
  {
    id: 'regular', label: 'Regular',
    path: 'M528 320C528 434.9 434.9 528 320 528C205.1 528 112 434.9 112 320C112 205.1 205.1 112 320 112C434.9 112 528 205.1 528 320zM320 64C178.6 64 64 178.6 64 320C64 461.4 178.6 576 320 576C461.4 576 576 461.4 576 320C576 178.6 461.4 64 320 64zM240 304C257.7 304 272 289.7 272 272C272 254.3 257.7 240 240 240C222.3 240 208 254.3 208 272C208 289.7 222.3 304 240 304zM432 272C432 254.3 417.7 240 400 240C382.3 240 368 254.3 368 272C368 289.7 382.3 304 400 304C417.7 304 432 289.7 432 272zM248 384C234.7 384 224 394.7 224 408C224 421.3 234.7 432 248 432L392 432C405.3 432 416 421.3 416 408C416 394.7 405.3 384 392 384L248 384z',
  },
  {
    id: 'bom', label: 'Bom',
    path: 'M528 320C528 205.1 434.9 112 320 112C205.1 112 112 205.1 112 320C112 434.9 205.1 528 320 528C434.9 528 528 434.9 528 320zM64 320C64 178.6 178.6 64 320 64C461.4 64 576 178.6 576 320C576 461.4 461.4 576 320 576C178.6 576 64 461.4 64 320zM241.3 383.4C256.3 399 282.4 416 320 416C357.6 416 383.7 399 398.7 383.4C407.9 373.8 423.1 373.5 432.6 382.7C442.1 391.9 442.5 407.1 433.3 416.6C411.2 439.6 373.3 464 320 464C266.7 464 228.8 439.6 206.7 416.6C197.5 407 197.8 391.8 207.4 382.7C217 373.6 232.2 373.8 241.3 383.4zM240 244C224.5 244 212 256.5 212 272L212 280C212 291 203 300 192 300C181 300 172 291 172 280L172 272C172 234.4 202.4 204 240 204C277.6 204 308 234.4 308 272L308 280C308 291 299 300 288 300C277 300 268 291 268 280L268 272C268 256.5 255.5 244 240 244zM372 272L372 280C372 291 363 300 352 300C341 300 332 291 332 280L332 272C332 234.4 362.4 204 400 204C437.6 204 468 234.4 468 272L468 280C468 291 459 300 448 300C437 300 428 291 428 280L428 272C428 256.5 415.5 244 400 244C384.5 244 372 256.5 372 272z',
  },
  {
    id: 'incrivel', label: 'Incrível',
    path: 'M528 320C528 205.1 434.9 112 320 112C205.1 112 112 205.1 112 320C112 434.9 205.1 528 320 528C434.9 528 528 434.9 528 320zM64 320C64 178.6 178.6 64 320 64C461.4 64 576 178.6 576 320C576 461.4 461.4 576 320 576C178.6 576 64 461.4 64 320zM189.2 396.4C182.7 382.4 194.2 368 209.6 368L430.4 368C445.8 368 457.2 382.4 450.8 396.4C428 445.8 378 480 320 480C262 480 212.1 445.8 189.2 396.4zM186.6 223.2C191.1 216.4 199.9 214 207.2 217.7L286.8 257.7C292.2 260.4 295.6 265.9 295.6 272C295.6 278.1 292.2 283.6 286.8 286.3L207.2 326.3C199.9 329.9 191.1 327.6 186.6 320.8C182.1 314 183.5 304.9 189.7 299.7L223 272L189.8 244.3C183.6 239.1 182.2 230 186.7 223.2zM450.2 244.3L417 272L450.2 299.7C456.4 304.9 457.8 314 453.3 320.8C448.8 327.6 440 330 432.7 326.3L353.1 286.3C347.7 283.6 344.3 278.1 344.3 272C344.3 265.9 347.7 260.4 353.1 257.7L432.7 217.7C440 214.1 448.8 216.4 453.3 223.2C457.8 230 456.4 239.1 450.2 244.3z',
  },
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
                {MOODS.map(({ id, path, label }) => {
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
                      <FaceSVG path={path} className={`w-8 h-8 ${active ? 'text-primary' : 'text-text-muted'}`} />
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
