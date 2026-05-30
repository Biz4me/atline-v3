'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Loader2, Bot, User } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface HistoryItem {
  role: string;
  content: unknown;
}

export default function MailPostChat() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'Bonjour ! Je suis MailPost, votre assistant email. Que puis-je faire pour vous ? (envoyer un mail, consulter votre boîte, gérer les newsletters, vider la corbeille…)',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = async () => {
    const msg = input.trim();
    if (!msg || loading) return;

    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: msg }]);
    setLoading(true);

    try {
      const res = await fetch('/api/mailpost/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: msg, history }),
      });

      if (!res.ok) throw new Error('Erreur réseau');

      const data = await res.json() as { response: string; history: HistoryItem[] };

      setMessages((prev) => [...prev, { role: 'assistant', content: data.response }]);
      setHistory(data.history);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Désolé, une erreur est survenue. Réessayez.' },
      ]);
    } finally {
      setLoading(false);
      textareaRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-2xl border border-gray-200 overflow-hidden">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {msg.role === 'assistant' && (
              <div className="w-8 h-8 rounded-full bg-[#1e3c5c] flex items-center justify-center shrink-0 mt-0.5">
                <Bot size={16} className="text-white" />
              </div>
            )}
            <div
              className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-[#1e3c5c] text-white rounded-tr-sm'
                  : 'bg-gray-100 text-gray-800 rounded-tl-sm prose prose-sm max-w-none'
              }`}
            >
              {msg.role === 'user' ? msg.content : (
                <ReactMarkdown>{msg.content}</ReactMarkdown>
              )}
            </div>
            {msg.role === 'user' && (
              <div className="w-8 h-8 rounded-full bg-[#f4b342] flex items-center justify-center shrink-0 mt-0.5">
                <User size={16} className="text-[#1e2f3e]" />
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex gap-3 justify-start">
            <div className="w-8 h-8 rounded-full bg-[#1e3c5c] flex items-center justify-center shrink-0">
              <Bot size={16} className="text-white" />
            </div>
            <div className="bg-gray-100 rounded-2xl rounded-tl-sm px-4 py-3">
              <Loader2 size={16} className="animate-spin text-[#1e3c5c]" />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t border-gray-200 p-3 bg-gray-50">
        <div className="flex gap-2 items-end">
          <textarea
            ref={textareaRef}
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Envoie un mail à… / Montre mes emails / Scanne les newsletters…"
            className="flex-1 resize-none rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3c5c]/30 bg-white max-h-32"
            style={{ minHeight: '42px' }}
          />
          <button
            onClick={send}
            disabled={!input.trim() || loading}
            className="w-10 h-10 rounded-xl bg-[#1e3c5c] text-white flex items-center justify-center hover:bg-[#2a5278] disabled:opacity-40 disabled:cursor-not-allowed transition-colors shrink-0"
          >
            <Send size={16} />
          </button>
        </div>
        <p className="text-xs text-gray-400 mt-1.5 px-1">Entrée pour envoyer · Shift+Entrée pour sauter une ligne</p>
      </div>
    </div>
  );
}
