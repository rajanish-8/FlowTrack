import { useState, useEffect } from "react";
import { aiAPI } from "../utils/api";
import "./AIComponents.css";

function AISprintSummaryModal({ project, onClose }) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function fetchSummary() {
      if (!project?.id) return;
      try {
        setLoading(true);
        setError(null);
        const res = await aiAPI.getSprintSummary(project.id);
        setData(res);
      } catch (err) {
        setError(err.message || "Failed to generate AI sprint summary.");
      } finally {
        setLoading(false);
      }
    }
    fetchSummary();
  }, [project]);

  const handleCopy = () => {
    if (!data) return;
    const text = `📊 *${data.project_name} Sprint Report*\nHealth: ${data.health_score} | Completion: ${data.completion_rate}%\n\n${data.summary}\n\n*Bottlenecks:*\n${data.bottlenecks?.map(b => "• " + b).join("\n")}\n\n*Recommendations:*\n${data.recommendations?.map(r => "• " + r).join("\n")}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="ai-modal-overlay" onClick={onClose}>
      <div className="ai-modal-card clay-card" onClick={(e) => e.stopPropagation()}>
        <div className="ai-modal-header">
          <div className="ai-badge-group">
            <span className="ai-tag">✨ FlowTrack AI Intelligence</span>
            <h2>Sprint & Board Health Summary</h2>
            <p className="ai-subtitle">Executive insight for <strong>{project?.name || "Active Project"}</strong></p>
          </div>
          <button className="ai-close-btn" onClick={onClose} aria-label="Close modal">×</button>
        </div>

        {loading ? (
          <div className="ai-loading-state">
            <div className="ai-spinner"></div>
            <p>Analyzing Kanban tasks, velocity, and bottlenecks with AI...</p>
          </div>
        ) : error ? (
          <div className="ai-error-state">
            <p>⚠️ {error}</p>
            <button className="btn" onClick={() => window.location.reload()}>Retry</button>
          </div>
        ) : data ? (
          <div className="ai-modal-body">
            {/* Health & Metrics Bar */}
            <div className="ai-metrics-row">
              <div className="ai-metric-pill">
                <span className="metric-label">Health Rating</span>
                <span className={`health-status status-${data.health_score.toLowerCase().replace(" ", "-")}`}>
                  {data.health_score}
                </span>
              </div>
              <div className="ai-metric-pill">
                <span className="metric-label">Completion Rate</span>
                <span className="metric-value">{data.completion_rate}%</span>
              </div>
              <div className="ai-metric-pill">
                <span className="metric-label">Total Tasks</span>
                <span className="metric-value">{data.total_tasks}</span>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="ai-progress-container">
              <div className="ai-progress-bar" style={{ width: `${Math.max(data.completion_rate, 4)}%` }}></div>
            </div>

            {/* Executive Summary */}
            <div className="ai-section">
              <h4>🎯 Executive Overview</h4>
              <p className="ai-summary-text">{data.summary}</p>
            </div>

            {/* Bottlenecks */}
            <div className="ai-section">
              <h4>⚠️ Bottlenecks & Risk Factors</h4>
              <ul className="ai-list warning-list">
                {data.bottlenecks?.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            </div>

            {/* Recommendations */}
            <div className="ai-section">
              <h4>💡 AI Recommended Action Items</h4>
              <ul className="ai-list recommend-list">
                {data.recommendations?.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            </div>

            <div className="ai-footer">
              <span className="ai-powered-by">⚡ Powered by {data.ai_powered_by}</span>
              <div className="ai-actions">
                <button className="btn secondary" onClick={handleCopy}>
                  {copied ? "✓ Copied to Clipboard" : "📋 Copy Standup Brief"}
                </button>
                <button className="btn primary" onClick={onClose}>Done</button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default AISprintSummaryModal;
