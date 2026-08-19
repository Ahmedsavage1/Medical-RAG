import { useRef, useEffect, useCallback } from 'react'
import { Stethoscope, Bot, User } from 'lucide-react'

// ── Typing indicator ────────────────────────────────────────────────────────
function TypingIndicator() {
  return (
    <div className="flex items-end gap-3">
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-600 to-cyan-500 flex items-center justify-center flex-shrink-0 shadow-lg">
        <Bot className="w-4 h-4 text-white" />
      </div>
      <div className="glass-card px-4 py-3 flex items-center gap-1.5 text-brand-300">
        <span className="dot" />
        <span className="dot" />
        <span className="dot" />
      </div>
    </div>
  )
}

// ── Individual message bubble ───────────────────────────────────────────────
function MessageBubble({ role, content }) {
  const isUser = role === 'user'

  return (
    <div
      className={`flex items-end gap-3 animate-slide-up ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
    >
      {/* Avatar */}
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg
          ${isUser
            ? 'bg-surface-600 border border-white/10'
            : 'bg-gradient-to-br from-brand-600 to-cyan-500'
          }`}
      >
        {isUser
          ? <User className="w-4 h-4 text-slate-300" />
          : <Bot className="w-4 h-4 text-white" />
        }
      </div>

      {/* Bubble */}
      <div
        className={`max-w-[82%] px-4 py-3 rounded-2xl text-sm leading-relaxed
          ${isUser
            ? 'bg-brand-600/80 text-white rounded-br-sm shadow-lg shadow-brand-900/30'
            : 'glass-card text-slate-200 rounded-bl-sm prose-medical'
          }`}
        dangerouslySetInnerHTML={isUser ? undefined : undefined}
      >
        {content}
      </div>
    </div>
  )
}

// ── Main message list ───────────────────────────────────────────────────────
export default function MessageList({ messages, isLoading }) {
  const bottomRef = useRef(null)

  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, isLoading, scrollToBottom])

  if (messages.length === 0 && !isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center px-4 animate-fade-in">
        <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-brand-600/30 to-cyan-500/20 border border-white/10 flex items-center justify-center mb-6 shadow-xl">
          <Stethoscope className="w-9 h-9 text-brand-400" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">How can I help you?</h2>
        <p className="text-slate-400 text-sm max-w-sm">
          Ask any medical question. I'm backed by a curated medical knowledge base
          and will provide evidence-grounded answers.
        </p>
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-lg">
          {EXAMPLE_PROMPTS.map((p) => (
            <div
              key={p}
              className="glass-card px-4 py-3 text-sm text-slate-300 text-left cursor-default
                         hover:border-brand-500/40 hover:text-white transition-all"
            >
              {p}
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto px-4 py-6 space-y-5">
      {messages.map((msg) => (
        <MessageBubble key={msg.id} role={msg.role} content={msg.content} />
      ))}
      {isLoading && <TypingIndicator />}
      <div ref={bottomRef} />
    </div>
  )
}

const EXAMPLE_PROMPTS = [
  '🫁  What are the first-line treatments for community-acquired pneumonia?',
  '💊  Explain the mechanism of action of metformin.',
  '🧬  What genes are associated with BRCA breast cancer risk?',
  '🩺  Differential diagnosis for acute-onset chest pain.',
]
