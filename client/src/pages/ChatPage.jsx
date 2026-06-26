import { useState, useRef, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import MarkdownRenderer from '../components/MarkdownRenderer.jsx';
import { askQuestion } from '../services/api.js';

const EXAMPLE_QUESTIONS = [
  'How does authentication work?',
  'Explain the main architecture',
  'What database is being used?',
];

export default function ChatPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const repositoryId = searchParams.get('repositoryId');

  const [question, setQuestion] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleAsk = async () => {
    if (!question.trim() || !repositoryId) return;
    const userMsg = { role: 'user', content: question };
    setMessages((prev) => [...prev, userMsg]);
    setQuestion('');
    setLoading(true);
    setError(null);

    try {
      const result = await askQuestion(repositoryId, question);
      const answer = result.data?.answer || result.answer || result.message || '';
      setMessages((prev) => [...prev, { role: 'assistant', content: answer }]);
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to get answer');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAsk();
    }
  };

  if (!repositoryId) {
    return (
      <div className="animate-fade-in">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white tracking-tight mb-2">Repository Chat</h1>
          <p className="text-surface-400">Ask questions about your repository — powered by RAG.</p>
        </div>
        <div className="p-8 rounded-xl bg-surface-900/40 border border-surface-800/60 text-center">
          <div className="p-3 rounded-full bg-accent-500/10 text-accent-400 w-fit mx-auto mb-4">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-white mb-2">No repository selected</h2>
          <p className="text-sm text-surface-400 mb-5">Analyze a repository first, then come here to chat about it.</p>
          <button onClick={() => navigate('/')} className="px-5 py-2.5 bg-accent-600 hover:bg-accent-500 text-white text-sm font-semibold rounded-lg transition-colors">Go to Dashboard</button>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in flex flex-col h-[calc(100vh-7rem)]">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white tracking-tight mb-2">Repository Chat</h1>
        <p className="text-surface-400">Ask anything about the codebase. Answers are grounded in the actual repository code via RAG.</p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-2">
        {messages.length === 0 && !loading && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="p-3 rounded-full bg-accent-500/10 text-accent-400 w-fit mx-auto mb-4">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
                </svg>
              </div>
              <p className="text-surface-400 text-sm max-w-md">
                Try asking:{' '}
                {EXAMPLE_QUESTIONS.map((q, i) => (
                  <>
                    {i > 0 && <span className="text-surface-600"> or </span>}
                    <button
                      key={q}
                      onClick={() => { setQuestion(q); }}
                      className="text-accent-300 hover:text-accent-200 underline underline-offset-2 transition-colors"
                    >
                      &ldquo;{q}&rdquo;
                    </button>
                  </>
                ))}
              </p>
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`animate-fade-in flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`} style={{ animationDelay: `${i * 50}ms` }}>
            <div className={`max-w-[75%] rounded-2xl px-5 py-3 ${
              msg.role === 'user'
                ? 'bg-primary-600/20 border border-primary-500/20 text-white'
                : 'bg-surface-800/60 border border-surface-700/60 text-surface-200'
            }`}>
              {msg.role === 'assistant' ? (
                <MarkdownRenderer content={msg.content} />
              ) : (
                <p className="text-sm leading-relaxed">{msg.content}</p>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start animate-fade-in">
            <div className="rounded-2xl px-5 py-4 bg-surface-800/60 border border-surface-700/60">
              <div className="flex gap-1.5">
                <div className="w-2 h-2 rounded-full bg-surface-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 rounded-full bg-surface-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 rounded-full bg-surface-500 animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="p-3 rounded-xl bg-error-500/10 border border-error-500/20 text-error-400 text-sm">{error}</div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="p-4 rounded-xl bg-surface-900/60 border border-surface-800/60">
        <div className="flex gap-3">
          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask a question about this repository..."
            rows={2}
            className="flex-1 bg-transparent text-sm text-white placeholder-surface-500 resize-none focus:outline-none"
          />
          <button
            onClick={handleAsk}
            disabled={loading || !question.trim()}
            className="self-end px-4 py-2 bg-accent-600 hover:bg-accent-500 disabled:bg-surface-700 disabled:text-surface-500 text-white text-sm font-semibold rounded-lg transition-all duration-200 flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
            </svg>
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
