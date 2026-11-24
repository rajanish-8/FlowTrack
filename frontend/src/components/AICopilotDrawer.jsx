import { useState, useRef, useEffect } from "react";
import { aiAPI } from "../utils/api";
import AISettingsModal from "./AISettingsModal";
import "./AIComponents.css";

function AICopilotDrawer({ project, userRole }) {
  const [isOpen, setIsOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [messages, setMessages] = useState([
    {
      sender: "bot",
      text: `Hi! I'm **FlowBot**, your AI Copilot for **${project?.name || "this project"}**. Ask me anything about tasks, bottlenecks, deadlines, or team workload!`,
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSend = async (textToSend) => {
    const query = textToSend || input;
    if (!query.trim() || loading) return;

    const userMsg = { sender: "user", text: query };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await aiAPI.chat({
        project_id: project?.id,
        message: query,
      });

      setMessages((prev) => [
        ...prev,
        {
          sender: "bot",
          text: res.reply,
          poweredBy: res.ai_powered_by,
        },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          sender: "bot",
          text: "⚠️ Sorry, I encountered an issue retrieving the project context. Please try again.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const quickPrompts = [
    "What's currently In Progress?",
    "Show upcoming deadlines",
    "Analyze team workload",
    "Sprint health summary",
  ];

  return (
    <>
      {/* Floating Trigger Button */}
      <button
        className="ai-floating-trigger"
        onClick={() => setIsOpen(!isOpen)}
        title="Open FlowTrack AI Copilot"
        aria-label="Toggle AI Copilot"
      >
        <span className="ai-sparkle-icon">✨</span>
        <span className="ai-trigger-label">AI Copilot</span>
        <span className="ai-pulse-dot"></span>
      </button>

      {/* Floating Drawer / Chat Panel */}
      {isOpen && (
        <div className="ai-chat-drawer clay-card">
          <div className="ai-drawer-header">
            <div className="ai-drawer-title-group">
              <span className="ai-bot-avatar">🤖</span>
              <div>
                <h3>FlowBot Copilot</h3>
                <span className="ai-online-status">Context: {project?.name || "Active Board"}</span>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <button
                className="ai-settings-btn"
                onClick={() => setShowSettings(true)}
                title="Configure Gemini API Key"
                style={{ background: "none", border: "none", cursor: "pointer", fontSize: "1.1rem", padding: "4px" }}
              >
                ⚙️
              </button>
              <button
                className="ai-drawer-close"
                onClick={() => setIsOpen(false)}
                aria-label="Close Copilot"
              >
                ×
              </button>
            </div>
          </div>

          {/* Messages Container */}
          <div className="ai-drawer-messages">
            {messages.map((m, idx) => (
              <div key={idx} className={`ai-message-bubble ${m.sender}`}>
                <div className="message-content">
                  {m.text.split("\n").map((line, lIdx) => (
                    <p key={lIdx}>{line}</p>
                  ))}
                </div>
                {m.poweredBy && (
                  <span className="message-subtext">⚡ {m.poweredBy}</span>
                )}
              </div>
            ))}

            {loading && (
              <div className="ai-message-bubble bot typing">
                <span className="typing-dot"></span>
                <span className="typing-dot"></span>
                <span className="typing-dot"></span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Suggestions */}
          <div className="ai-quick-pills">
            {quickPrompts.map((prompt, idx) => (
              <button
                key={idx}
                className="ai-pill"
                onClick={() => handleSend(prompt)}
                disabled={loading}
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* Input Area */}
          <form
            className="ai-drawer-input-form"
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
          >
            <input
              type="text"
              placeholder="Ask about tasks, status, deadlines..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={loading}
            />
            <button
              type="submit"
              className="ai-send-btn"
              disabled={!input.trim() || loading}
            >
              ➤
            </button>
          </form>
        </div>
      )}

      {showSettings && (
        <AISettingsModal onClose={() => setShowSettings(false)} />
      )}
    </>
  );
}

export default AICopilotDrawer;
