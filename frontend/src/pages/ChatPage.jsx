import { useState } from 'react'
import { toast } from 'react-hot-toast'
import {
  Stethoscope, LogOut, User, ChevronDown, Trash2, Shield,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import { askQuestion } from '../api'
import MessageList from '../components/MessageList'
import ChatInput from '../components/ChatInput'

let msgIdCounter = 0
const newId = () => ++msgIdCounter

export default function ChatPage() {
  const { userEmail, logout } = useAuth()
  const navigate = useNavigate()

  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/login')
    toast.success('Signed out successfully')
  }

  const clearChat = () => {
    setMessages([])
    toast.success('Conversation cleared')
    setMenuOpen(false)
  }

  /**
   * Extracts the best string from whatever the RAG controller returns.
   * The backend may return { answer: "…" }, { response: "…" },
   * { result: "…" }, or a plain string.
   */
  const extractAnswer = (data) => {
    if (typeof data === 'string') return data
    if (typeof data === 'object' && data !== null) {
      return (
        data.answer ??
        data.response ??
        data.result ??
        data.text ??
        JSON.stringify(data, null, 2)
      )
    }
    return String(data)
  }

  const handleSend = async () => {
    const question = input.trim()
    if (!question || isLoading) return

    // Optimistically render the user message
    const userMsg = { id: newId(), role: 'user', content: question }
    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setIsLoading(true)

    try {
      const data = await askQuestion(question)
      const answer = extractAnswer(data)
      const aiMsg = { id: newId(), role: 'assistant', content: answer }
      setMessages((prev) => [...prev, aiMsg])
    } catch (err) {
      if (err.status === 401) {
        toast.error('Session expired. Please sign in again.')
        logout()
        navigate('/login')
      } else {
        toast.error(err.message || 'Failed to get a response')
        // Add an error message to the chat so the conversation stays coherent
        setMessages((prev) => [
          ...prev,
          {
            id: newId(),
            role: 'assistant',
            content: `⚠️ ${err.message || 'Something went wrong. Please try again.'}`,
          },
        ])
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="h-screen flex flex-col bg-surface-900 overflow-hidden">
      {/* ── Top navigation bar ─────────────────────────────────────────── */}
      <header className="flex-shrink-0 border-b border-white/5 bg-surface-800/80 backdrop-blur-sm px-4 py-3">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-600 to-cyan-500 flex items-center justify-center shadow-lg">
              <Stethoscope className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-bold text-white text-lg leading-none">MedRAG</span>
              <div className="flex items-center gap-1 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse-slow" />
                <span className="text-xs text-emerald-400 font-medium">Online</span>
              </div>
            </div>
          </div>

          {/* Right — user menu */}
          <div className="relative">
            <button
              id="user-menu-btn"
              onClick={() => setMenuOpen((v) => !v)}
              className="btn-ghost px-3 py-2 flex items-center gap-2"
              aria-haspopup="true"
              aria-expanded={menuOpen}
            >
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-brand-600 to-cyan-500 flex items-center justify-center">
                <User className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="hidden sm:block text-sm max-w-[160px] truncate text-slate-300">
                {userEmail ?? 'User'}
              </span>
              <ChevronDown
                className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${menuOpen ? 'rotate-180' : ''}`}
              />
            </button>

            {/* Dropdown */}
            {menuOpen && (
              <div className="absolute right-0 top-full mt-2 w-52 glass-card py-1 z-50 animate-fade-in shadow-2xl">
                <div className="px-4 py-2 border-b border-white/5">
                  <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">Signed in as</p>
                  <p className="text-sm text-slate-200 truncate mt-0.5">{userEmail}</p>
                </div>
                <button
                  id="clear-chat-btn"
                  onClick={clearChat}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-300
                             hover:bg-white/5 hover:text-white transition-colors"
                >
                  <Trash2 className="w-4 h-4 text-slate-400" />
                  Clear conversation
                </button>
                <button
                  id="logout-btn"
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-400
                             hover:bg-red-500/10 hover:text-red-300 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ── Disclaimer banner ─────────────────────────────────────────────── */}
      <div className="flex-shrink-0 bg-amber-500/10 border-b border-amber-500/20 px-4 py-2">
        <div className="max-w-5xl mx-auto flex items-center gap-2 text-xs text-amber-300">
          <Shield className="w-3.5 h-3.5 flex-shrink-0" />
          <span>
            <strong>Medical Disclaimer:</strong> This AI assistant is for informational purposes only
            and does not replace professional medical advice, diagnosis, or treatment.
          </span>
        </div>
      </div>

      {/* ── Message area ──────────────────────────────────────────────────── */}
      <div className="flex-1 min-h-0 flex flex-col max-w-3xl w-full mx-auto">
        <MessageList messages={messages} isLoading={isLoading} />
      </div>

      {/* ── Input bar ─────────────────────────────────────────────────────── */}
      <ChatInput
        value={input}
        onChange={setInput}
        onSend={handleSend}
        isLoading={isLoading}
      />
    </div>
  )
}
