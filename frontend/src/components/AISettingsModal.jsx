import { useState, useEffect } from "react";
import { aiAPI } from "../utils/api";
import "./AIComponents.css";

function AISettingsModal({ onClose, onConfigUpdated }) {
  const [loading, setLoading] = useState(true);
  const [config, setConfig] = useState(null);
  const [keyInput, setKeyInput] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      setLoading(true);
      const res = await aiAPI.getConfig();
      setConfig(res);
    } catch (err) {
      setError(err.message || "Failed to load AI config.");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!keyInput.trim()) return;

    try {
      setSubmitting(true);
      setMessage(null);
      setError(null);
      const res = await aiAPI.updateConfig(keyInput.trim());
      setMessage(res.message);
      setKeyInput("");
      await loadConfig();
      if (onConfigUpdated) onConfigUpdated();
    } catch (err) {
      setError(err.message || "Unable to verify or save Gemini API key.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="ai-modal-overlay" onClick={onClose}>
      <div className="ai-modal-card clay-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "540px" }}>
        <div className="ai-modal-header">
          <div className="ai-badge-group">
            <span className="ai-tag">⚙️ FlowTrack Intelligence</span>
            <h2>AI Engine & Gemini API Setup</h2>
            <p className="ai-subtitle">Connect Google Gemini 1.5 Flash or use the built-in heuristic engine.</p>
          </div>
          <button className="ai-close-btn" onClick={onClose} aria-label="Close modal">×</button>
        </div>

        {loading ? (
          <div className="ai-loading-state">
            <div className="ai-spinner"></div>
            <p>Checking AI Engine status...</p>
          </div>
        ) : (
          <div className="ai-modal-body" style={{ gap: "18px" }}>
            {/* Status Card */}
            <div
              style={{
                background: config?.has_gemini_key ? "#ecfdf5" : "#f8fafc",
                border: `1px solid ${config?.has_gemini_key ? "#a7f3d0" : "#e2e8f0"}`,
                borderRadius: "16px",
                padding: "16px",
                display: "flex",
                flexDirection: "column",
                gap: "8px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>
                  Active Intelligence Engine
                </span>
                <span
                  style={{
                    fontSize: "0.78rem",
                    fontWeight: 700,
                    padding: "3px 10px",
                    borderRadius: "9999px",
                    background: config?.has_gemini_key ? "#10b981" : "#6366f1",
                    color: "#ffffff",
                  }}
                >
                  {config?.has_gemini_key ? "Live Gemini Active" : "Built-in Engine Active"}
                </span>
              </div>
              <p style={{ margin: 0, fontSize: "0.95rem", fontWeight: 700, color: "#0f172a" }}>
                {config?.active_engine}
              </p>
              {config?.has_gemini_key && (
                <span style={{ fontSize: "0.8rem", color: "#059669", fontFamily: "monospace" }}>
                  Connected Key: {config.masked_key}
                </span>
              )}
            </div>

            {/* Connection Options */}
            <div className="ai-section">
              <h4>Option 1: Paste Your Gemini API Key</h4>
              <p style={{ fontSize: "0.84rem", color: "#64748b", margin: "0 0 10px 0" }}>
                Get a free API key at <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" style={{ color: "#4f46e5", fontWeight: 600 }}>Google AI Studio</a>.
              </p>

              <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                  <input
                    type={showKey ? "text" : "password"}
                    placeholder="Paste GEMINI_API_KEY (starts with AIzaSy...)"
                    value={keyInput}
                    onChange={(e) => setKeyInput(e.target.value)}
                    style={{
                      flex: 1,
                      padding: "12px 42px 12px 14px",
                      borderRadius: "12px",
                      border: "1px solid #cbd5e1",
                      fontSize: "0.9rem",
                      outline: "none",
                    }}
                    disabled={submitting}
                  />
                  <button
                    type="button"
                    onClick={() => setShowKey(!showKey)}
                    style={{
                      position: "absolute",
                      right: "10px",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      fontSize: "1.1rem",
                      padding: "4px",
                      color: "#64748b",
                    }}
                    title={showKey ? "Hide key" : "Show key"}
                  >
                    {showKey ? "🙈" : "👁️"}
                  </button>
                </div>
                <button
                  type="submit"
                  className="btn primary"
                  style={{ background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)", padding: "10px 16px" }}
                  disabled={submitting || !keyInput.trim()}
                >
                  {submitting ? "Verifying with Google..." : "⚡ Test & Connect Gemini Key"}
                </button>
              </form>
            </div>

            {/* Feedback alert */}
            {message && (
              <div style={{ background: "#ecfdf5", color: "#065f46", padding: "10px 14px", borderRadius: "10px", fontSize: "0.86rem", fontWeight: 600, border: "1px solid #a7f3d0" }}>
                ✓ {message}
              </div>
            )}
            {error && (
              <div style={{ background: "#fef2f2", color: "#991b1b", padding: "10px 14px", borderRadius: "10px", fontSize: "0.86rem", border: "1px solid #fecaca" }}>
                ⚠️ {error}
              </div>
            )}

            {/* Option 2: File location */}
            <div className="ai-section" style={{ borderTop: "1px solid #f1f5f9", paddingTop: "14px" }}>
              <h4>Option 2: Direct .env Configuration</h4>
              <p style={{ fontSize: "0.82rem", color: "#475569", margin: 0, lineHeight: 1.5 }}>
                You can also set or edit your key directly in:
                <br />
                <code style={{ background: "#f1f5f9", padding: "3px 8px", borderRadius: "6px", fontSize: "0.78rem", display: "inline-block", marginTop: "6px" }}>
                  Backend/flowtrack/.env
                </code>
              </p>
            </div>

            <div className="ai-footer" style={{ marginTop: "6px" }}>
              <span className="ai-powered-by">FlowTrack Intelligence</span>
              <button className="btn secondary" onClick={onClose}>Close</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default AISettingsModal;
