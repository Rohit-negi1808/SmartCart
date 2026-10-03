import React, { useState, useRef, useEffect } from 'react';
import { FiMessageCircle, FiX, FiSend } from 'react-icons/fi';
import { sendChatMessage } from '../services/api.js';
import './ChatWidget.css';

const STARTER_QUESTIONS = [
  'Which laptop is good for MERN development?',
  'Do I need 32GB RAM?',
  'What is the difference between RTX 4050 and RTX 4060?',
  'Which laptops under ₹90,000 have a dedicated GPU?',
];

const WELCOME_MESSAGE = {
  role: 'bot',
  text: "Hi! I'm the SmartCart laptop assistant. Ask me about specs, comparisons, or which laptop from our catalog fits your needs - I'll only tell you about real products we actually have, and I'll say so if I don't know something.",
};

// A self-contained, floating laptop-focused chatbot. Grounded entirely by
// the backend's /api/chat endpoint, which only lets Gemini reference real
// MongoDB product data - this component just handles the conversation UI.
const ChatWidget = () => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([WELCOME_MESSAGE]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const sendMessage = async (text) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    setMessages((prev) => [...prev, { role: 'user', text: trimmed }]);
    setInput('');
    setLoading(true);

    try {
      const res = await sendChatMessage(trimmed);
      const { reply, aiAvailable } = res.data.data;
      setMessages((prev) => [...prev, { role: aiAvailable ? 'bot' : 'error', text: reply }]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: 'error', text: err.friendlyMessage || "Sorry, I couldn't process that. Please try again." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    sendMessage(input);
  };

  return (
    <>
      {open && (
        <div className="chat-window">
          <div className="chat-header">
            <div>
              <h4>SmartCart Assistant</h4>
              <p>Laptop specs, comparisons &amp; recommendations</p>
            </div>
            <button className="chat-close" onClick={() => setOpen(false)} aria-label="Close chat"><FiX /></button>
          </div>

          <div className="chat-messages" ref={scrollRef}>
            {messages.map((m, i) => (
              <div key={i} className={`chat-bubble ${m.role}`}>{m.text}</div>
            ))}
            {loading && <div className="chat-bubble bot">Thinking...</div>}
          </div>

          {messages.length === 1 && (
            <div className="chat-suggestions">
              {STARTER_QUESTIONS.map((q) => (
                <button key={q} className="chat-suggestion-btn" onClick={() => sendMessage(q)}>{q}</button>
              ))}
            </div>
          )}

          <form className="chat-input-row" onSubmit={handleSubmit}>
            <input
              type="text"
              placeholder="Ask about laptops..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={loading}
            />
            <button type="submit" disabled={loading || !input.trim()} aria-label="Send"><FiSend /></button>
          </form>
        </div>
      )}

      <button className="chat-fab" onClick={() => setOpen((v) => !v)} aria-label="Open laptop assistant chat">
        {open ? <FiX /> : <FiMessageCircle />}
      </button>
    </>
  );
};

export default ChatWidget;
