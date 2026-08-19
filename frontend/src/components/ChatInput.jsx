import { useRef, useEffect } from 'react'
import { Send } from 'lucide-react'

/**
 * Auto-growing textarea + send button for the chat input bar.
 *
 * Props:
 *   value       – controlled value
 *   onChange    – setter
 *   onSend      – callback when user sends (Enter or button click)
 *   isLoading   – disables input while waiting for a response
 */
export default function ChatInput({ value, onChange, onSend, isLoading }) {
  const textareaRef = useRef(null)

  // Auto-resize the textarea as the user types (up to ~5 lines)
  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 140) + 'px'
  }, [value])

  const handleKeyDown = (e) => {
    // Send on Enter; allow Shift+Enter for newlines
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleSend = () => {
    if (!value.trim() || isLoading) return
    onSend()
  }

  return (
    <div className="border-t border-white/5 bg-surface-900/80 backdrop-blur-sm px-4 py-4">
      <div className="max-w-3xl mx-auto">
        <div className="glass-card flex items-end gap-3 px-4 py-3 focus-within:border-brand-500/40 transition-all">
          <textarea
            id="chat-input"
            ref={textareaRef}
            rows={1}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask a medical question… (Enter to send, Shift+Enter for newline)"
            disabled={isLoading}
            className="flex-1 bg-transparent resize-none outline-none text-sm text-slate-100
                       placeholder-slate-500 leading-relaxed max-h-36 py-0.5
                       disabled:opacity-50"
            aria-label="Medical question input"
          />
          <button
            id="chat-send"
            onClick={handleSend}
            disabled={!value.trim() || isLoading}
            className="btn-primary flex-shrink-0 px-3 py-2 rounded-xl"
            aria-label="Send question"
          >
            {isLoading ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </div>
        <p className="text-xs text-slate-600 text-center mt-2">
          MedRAG may make mistakes. Always verify critical clinical information.
        </p>
      </div>
    </div>
  )
}
