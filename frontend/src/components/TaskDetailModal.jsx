import { useState, useEffect, useRef } from "react";
import { commentAPI, taskAPI, attachmentAPI, timeEntryAPI } from "../utils/api";
import { startVoiceRecognition, isSpeechSupported } from "../utils/speech";
import defaultAvatar from "../assets/default-avatar.svg";
import "./AIComponents.css";

const PRESET_TAGS = ["#Bug", "#Feature", "#DevOps", "#Design", "#Urgent", "#Backend", "#Frontend"];

const getTagColor = (tag) => {
  const t = (tag || "").toLowerCase();
  if (t.includes("bug") || t.includes("urgent") || t.includes("critical")) {
    return { bg: "rgba(239, 68, 68, 0.15)", text: "#ef4444", border: "rgba(239, 68, 68, 0.3)" };
  }
  if (t.includes("feat") || t.includes("feature")) {
    return { bg: "rgba(59, 130, 246, 0.15)", text: "#3b82f6", border: "rgba(59, 130, 246, 0.3)" };
  }
  if (t.includes("devops") || t.includes("infra")) {
    return { bg: "rgba(168, 85, 247, 0.15)", text: "#a855f7", border: "rgba(168, 85, 247, 0.3)" };
  }
  if (t.includes("design") || t.includes("ui") || t.includes("ux")) {
    return { bg: "rgba(236, 72, 153, 0.15)", text: "#ec4899", border: "rgba(236, 72, 153, 0.3)" };
  }
  if (t.includes("backend") || t.includes("api")) {
    return { bg: "rgba(16, 185, 129, 0.15)", text: "#10b981", border: "rgba(16, 185, 129, 0.3)" };
  }
  if (t.includes("frontend") || t.includes("web")) {
    return { bg: "rgba(245, 158, 11, 0.15)", text: "#f59e0b", border: "rgba(245, 158, 11, 0.3)" };
  }
  return { bg: "rgba(100, 116, 139, 0.15)", text: "#94a3b8", border: "rgba(100, 116, 139, 0.3)" };
};

const formatDuration = (minutes) => {
  if (!minutes || minutes <= 0) return "0m";
  const hrs = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  if (hrs > 0 && mins > 0) return `${hrs}h ${mins}m`;
  if (hrs > 0) return `${hrs}h`;
  return `${mins}m`;
};

function TaskDetailModal({ task, onClose, onTaskUpdated, userRole, currentUserId }) {
  const [activeTab, setActiveTab] = useState("overview"); // "overview" | "time" | "checklist" | "files" | "discussion"
  const [comments, setComments] = useState([]);
  const [loadingComments, setLoadingComments] = useState(true);
  const [newComment, setNewComment] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);
  const [checklist, setChecklist] = useState(task.checklist || []);
  const [newCheckItem, setNewCheckItem] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [attachments, setAttachments] = useState([]);
  const [loadingAttachments, setLoadingAttachments] = useState(true);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const fileInputRef = useRef(null);

  // Extended Features from reference repos
  const [tags, setTags] = useState(task.tags || []);
  const [newTagInput, setNewTagInput] = useState("");
  const [estimatedHours, setEstimatedHours] = useState(task.estimated_hours || 0);
  const [recurrence, setRecurrence] = useState(task.recurrence || "none");
  const [blockedReason, setBlockedReason] = useState(task.blocked_reason || "");
  const [isBlocked, setIsBlocked] = useState(Boolean(task.blocked_reason));
  const [resolution, setResolution] = useState(task.resolution || "");
  const [savingResolution, setSavingResolution] = useState(false);
  const [savingBlocker, setSavingBlocker] = useState(false);

  // Time tracking & Live Stopwatch (taskcoach & django-coleman)
  const [timeEntries, setTimeEntries] = useState([]);
  const [totalTimeMinutes, setTotalTimeMinutes] = useState(task.total_time_minutes || 0);
  const [loadingTimeEntries, setLoadingTimeEntries] = useState(false);
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const timerIntervalRef = useRef(null);
  const [logMinutes, setLogMinutes] = useState("");
  const [logNotes, setLogNotes] = useState("");
  const [logBillable, setLogBillable] = useState(true);
  const [submittingTime, setSubmittingTime] = useState(false);

  useEffect(() => {
    loadComments();
    loadAttachments();
    loadTimeEntries();
  }, [task.id]);

  // Stopwatch timer effect
  useEffect(() => {
    if (timerRunning) {
      timerIntervalRef.current = setInterval(() => {
        setTimerSeconds((prev) => prev + 1);
      }, 1000);
    } else if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
    }
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [timerRunning]);

  const formatTimerClock = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const loadTimeEntries = async () => {
    try {
      setLoadingTimeEntries(true);
      const res = await timeEntryAPI.getByTaskId(task.id);
      setTimeEntries(res.time_entries || []);
      setTotalTimeMinutes(res.total_time_minutes || 0);
    } catch (err) {
      console.error("Error loading time entries:", err);
    } finally {
      setLoadingTimeEntries(false);
    }
  };

  const handleLogStopwatch = async () => {
    if (timerSeconds < 30) {
      alert("Timer duration is less than 30 seconds. Run longer before logging.");
      return;
    }
    const minutesToLog = Math.max(1, Math.round(timerSeconds / 60));
    try {
      setSubmittingTime(true);
      await timeEntryAPI.create(task.id, {
        duration_minutes: minutesToLog,
        notes: `Live stopwatch session (${formatTimerClock(timerSeconds)})`,
        billable: true,
      });
      setTimerRunning(false);
      setTimerSeconds(0);
      await loadTimeEntries();
      if (onTaskUpdated) onTaskUpdated();
    } catch (err) {
      alert("Failed to log stopwatch time: " + err.message);
    } finally {
      setSubmittingTime(false);
    }
  };

  const handleManualLogTime = async (e) => {
    e.preventDefault();
    const mins = parseInt(logMinutes, 10);
    if (!mins || mins <= 0) {
      alert("Please enter a valid duration in minutes.");
      return;
    }
    try {
      setSubmittingTime(true);
      await timeEntryAPI.create(task.id, {
        duration_minutes: mins,
        notes: logNotes.trim(),
        billable: logBillable,
      });
      setLogMinutes("");
      setLogNotes("");
      await loadTimeEntries();
      if (onTaskUpdated) onTaskUpdated();
    } catch (err) {
      alert("Failed to log time: " + err.message);
    } finally {
      setSubmittingTime(false);
    }
  };

  const handleDeleteTimeEntry = async (entryId) => {
    if (!window.confirm("Are you sure you want to delete this time entry?")) return;
    try {
      await timeEntryAPI.delete(entryId);
      await loadTimeEntries();
      if (onTaskUpdated) onTaskUpdated();
    } catch (err) {
      alert("Failed to delete time entry: " + err.message);
    }
  };

  const handleUpdateEstimatedHours = async (newVal) => {
    const val = parseFloat(newVal) || 0;
    setEstimatedHours(val);
    try {
      await taskAPI.update(task.id, { estimated_hours: val });
      if (onTaskUpdated) onTaskUpdated();
    } catch (err) {
      console.error("Failed to update estimated hours:", err);
    }
  };

  const handleRecurrenceChange = async (val) => {
    setRecurrence(val);
    try {
      await taskAPI.update(task.id, { recurrence: val });
      if (onTaskUpdated) onTaskUpdated();
    } catch (err) {
      console.error("Failed to update recurrence:", err);
    }
  };

  const handleSaveBlocker = async () => {
    try {
      setSavingBlocker(true);
      const reason = isBlocked ? blockedReason.trim() || "Unspecified blocker" : "";
      await taskAPI.update(task.id, { blocked_reason: reason });
      setBlockedReason(reason);
      if (onTaskUpdated) onTaskUpdated();
    } catch (err) {
      alert("Failed to update blocker status: " + err.message);
    } finally {
      setSavingBlocker(false);
    }
  };

  const handleClearBlocker = async () => {
    setIsBlocked(false);
    setBlockedReason("");
    try {
      setSavingBlocker(true);
      await taskAPI.update(task.id, { blocked_reason: "" });
      if (onTaskUpdated) onTaskUpdated();
    } catch (err) {
      alert("Failed to clear blocker: " + err.message);
    } finally {
      setSavingBlocker(false);
    }
  };

  const handleSaveResolution = async () => {
    try {
      setSavingResolution(true);
      await taskAPI.update(task.id, { resolution: resolution.trim() });
      if (onTaskUpdated) onTaskUpdated();
    } catch (err) {
      alert("Failed to save resolution note: " + err.message);
    } finally {
      setSavingResolution(false);
    }
  };

  const handleAddTag = async (tagToAdd) => {
    const clean = tagToAdd.trim().startsWith("#") ? tagToAdd.trim() : `#${tagToAdd.trim()}`;
    if (!clean || clean === "#" || tags.includes(clean)) return;
    const updated = [...tags, clean];
    setTags(updated);
    setNewTagInput("");
    try {
      await taskAPI.update(task.id, { tags: updated });
      if (onTaskUpdated) onTaskUpdated();
    } catch (err) {
      console.error("Failed to update tags:", err);
    }
  };

  const handleRemoveTag = async (tagToRemove) => {
    const updated = tags.filter((t) => t !== tagToRemove);
    setTags(updated);
    try {
      await taskAPI.update(task.id, { tags: updated });
      if (onTaskUpdated) onTaskUpdated();
    } catch (err) {
      console.error("Failed to remove tag:", err);
    }
  };

  const loadAttachments = async () => {
    try {
      setLoadingAttachments(true);
      const res = await attachmentAPI.getByTaskId(task.id);
      setAttachments(res || []);
    } catch (err) {
      console.error("Error loading attachments:", err);
    } finally {
      setLoadingAttachments(false);
    }
  };

  const handleFileUpload = async (file) => {
    if (!file) return;
    try {
      setUploadingFile(true);
      const created = await attachmentAPI.upload(task.id, file);
      setAttachments((prev) => [created, ...prev]);
    } catch (err) {
      alert("Failed to upload file: " + err.message);
    } finally {
      setUploadingFile(false);
    }
  };

  const handleDeleteAttachment = async (attachmentId) => {
    if (!window.confirm("Are you sure you want to delete this attachment?")) return;
    try {
      await attachmentAPI.delete(attachmentId);
      setAttachments((prev) => prev.filter((a) => a.id !== attachmentId));
    } catch (err) {
      alert("Failed to delete attachment: " + err.message);
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes || bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  const getFileIcon = (filename) => {
    const ext = filename?.split(".").pop()?.toLowerCase() || "";
    if (["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(ext)) return "🖼️";
    if (["pdf"].includes(ext)) return "📄";
    if (["zip", "rar", "7z", "tar", "gz"].includes(ext)) return "📦";
    if (["json", "js", "jsx", "ts", "tsx", "py", "html", "css"].includes(ext)) return "💻";
    if (["doc", "docx", "txt", "md"].includes(ext)) return "📝";
    if (["xls", "xlsx", "csv"].includes(ext)) return "📊";
    return "📎";
  };

  const loadComments = async () => {
    try {
      setLoadingComments(true);
      const res = await commentAPI.getByTaskId(task.id);
      setComments(res);
    } catch (err) {
      console.error("Error loading comments:", err);
    } finally {
      setLoadingComments(false);
    }
  };

  const handlePostComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || submittingComment) return;
    try {
      setSubmittingComment(true);
      const created = await commentAPI.create(task.id, newComment.trim());
      setComments((prev) => [...prev, created]);
      setNewComment("");
    } catch (err) {
      alert("Failed to post comment: " + err.message);
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleToggleChecklist = async (index) => {
    const updated = checklist.map((item, idx) =>
      idx === index ? { ...item, completed: !item.completed } : item
    );
    setChecklist(updated);
    try {
      await taskAPI.update(task.id, { checklist: updated });
      if (onTaskUpdated) onTaskUpdated();
    } catch (err) {
      console.error("Failed to update checklist item:", err);
    }
  };

  const handleAddChecklistItem = async (e) => {
    e.preventDefault();
    if (!newCheckItem.trim()) return;
    const updated = [
      ...checklist,
      { id: Date.now(), text: newCheckItem.trim(), completed: false },
    ];
    setChecklist(updated);
    setNewCheckItem("");
    try {
      await taskAPI.update(task.id, { checklist: updated });
      if (onTaskUpdated) onTaskUpdated();
    } catch (err) {
      console.error("Failed to add checklist item:", err);
    }
  };

  const handleDeleteChecklistItem = async (index) => {
    const updated = checklist.filter((_, idx) => idx !== index);
    setChecklist(updated);
    try {
      await taskAPI.update(task.id, { checklist: updated });
      if (onTaskUpdated) onTaskUpdated();
    } catch (err) {
      console.error("Failed to delete checklist item:", err);
    }
  };

  const handleVoiceComment = () => {
    if (isRecording) return;
    setIsRecording(true);
    startVoiceRecognition({
      onResult: (text) => {
        setNewComment((prev) => (prev ? prev + " " + text : text));
      },
      onError: (err) => {
        console.warn("Speech error:", err);
        setIsRecording(false);
      },
      onEnd: () => {
        setIsRecording(false);
      },
    });
  };

  const completedCount = checklist.filter((c) => c.completed).length;
  const checklistProgress = checklist.length > 0 ? Math.round((completedCount / checklist.length) * 100) : 0;
  const totalLoggedHours = (totalTimeMinutes / 60).toFixed(1);
  const timeProgressPercent = estimatedHours > 0 ? Math.min(100, Math.round(((totalTimeMinutes / 60) / estimatedHours) * 100)) : 0;

  return (
    <div className="ai-modal-overlay" onClick={onClose}>
      <div
        className="ai-modal-card clay-card"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: "800px", maxHeight: "92vh", display: "flex", flexDirection: "column" }}
      >
        {/* Header */}
        <div className="ai-modal-header" style={{ paddingBottom: "14px" }}>
          <div className="ai-badge-group" style={{ width: "100%" }}>
            <div style={{ display: "flex", gap: "8px", alignItems: "center", marginBottom: "6px", flexWrap: "wrap" }}>
              <span className={`priority-level priority-${task.priority_level?.toLowerCase() || "low"}`}>
                {task.priority_level}
              </span>
              <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontWeight: 600 }}>
                Status: {task.status}
              </span>
              {recurrence !== "none" && (
                <span
                  style={{
                    fontSize: "0.74rem",
                    padding: "2px 8px",
                    borderRadius: "6px",
                    background: "rgba(99, 102, 241, 0.15)",
                    color: "#6366f1",
                    fontWeight: 700,
                    border: "1px solid rgba(99, 102, 241, 0.3)",
                  }}
                  title="Smart recurrence active"
                >
                  🔁 {recurrence.toUpperCase()}
                </span>
              )}
              {Boolean(blockedReason) && (
                <span
                  style={{
                    fontSize: "0.74rem",
                    padding: "2px 8px",
                    borderRadius: "6px",
                    background: "rgba(239, 68, 68, 0.2)",
                    color: "#ef4444",
                    fontWeight: 800,
                    border: "1px solid rgba(239, 68, 68, 0.4)",
                  }}
                >
                  🚫 BLOCKED
                </span>
              )}
            </div>
            <h2>{task.title}</h2>
            <p className="ai-subtitle">
              Assigned to: <strong>{task.user_username || "Unassigned"}</strong> {task.due_date ? `| Due: ${task.due_date}` : ""}
            </p>

            {/* Tags row */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", alignItems: "center", marginTop: "8px" }}>
              {tags.map((tag) => {
                const colors = getTagColor(tag);
                return (
                  <span
                    key={tag}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "4px",
                      fontSize: "0.72rem",
                      fontWeight: 700,
                      padding: "2px 8px",
                      borderRadius: "6px",
                      background: colors.bg,
                      color: colors.text,
                      border: `1px solid ${colors.border}`,
                    }}
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      style={{
                        background: "none",
                        border: "none",
                        color: colors.text,
                        cursor: "pointer",
                        padding: 0,
                        marginLeft: "2px",
                        fontWeight: 800,
                        lineHeight: 1,
                      }}
                      title="Remove tag"
                    >
                      ×
                    </button>
                  </span>
                );
              })}
              <div style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                <input
                  type="text"
                  placeholder="+ Tag..."
                  value={newTagInput}
                  onChange={(e) => setNewTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddTag(newTagInput);
                    }
                  }}
                  style={{
                    width: "80px",
                    padding: "2px 6px",
                    fontSize: "0.72rem",
                    borderRadius: "6px",
                    border: "1px dashed var(--border)",
                    background: "var(--bg)",
                    color: "var(--text)",
                    outline: "none",
                  }}
                />
              </div>
            </div>
          </div>
          <button className="ai-close-btn" onClick={onClose} aria-label="Close modal">×</button>
        </div>

        {/* Modal Navigation Tabs */}
        <div
          style={{
            display: "flex",
            gap: "6px",
            borderBottom: "1px solid var(--border)",
            padding: "0 24px",
            background: "var(--bg)",
          }}
        >
          {[
            { id: "overview", label: "📋 Details & Settings" },
            { id: "time", label: `⏱️ Time Tracker (${formatDuration(totalTimeMinutes)})` },
            { id: "checklist", label: `☑️ Checklist (${completedCount}/${checklist.length})` },
            { id: "files", label: `📎 Files (${attachments.length})` },
            { id: "discussion", label: `💬 Discussion (${comments.length})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                background: "none",
                border: "none",
                borderBottom: activeTab === tab.id ? "2px solid var(--brand)" : "2px solid transparent",
                color: activeTab === tab.id ? "var(--brand)" : "var(--text-muted)",
                fontWeight: activeTab === tab.id ? 700 : 500,
                fontSize: "0.82rem",
                padding: "10px 12px",
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="ai-modal-body" style={{ gap: "20px", overflowY: "auto", padding: "20px 24px", flex: 1 }}>
          {/* TAB 1: OVERVIEW & SETTINGS */}
          {activeTab === "overview" && (
            <>
              {/* Description */}
              <div className="ai-section">
                <h4>Description</h4>
                <div style={{ background: "var(--bg)", border: "1px solid var(--border)", borderRadius: "12px", padding: "14px", fontSize: "0.88rem", lineHeight: 1.6, whiteSpace: "pre-wrap", color: "var(--text)" }}>
                  {task.description || "No description provided for this task."}
                </div>
              </div>

              {/* Tag Quick Selector */}
              <div className="ai-section">
                <h4>🏷️ Tag Taxonomy & Categories</h4>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                  {PRESET_TAGS.map((tag) => {
                    const isSelected = tags.includes(tag);
                    const colors = getTagColor(tag);
                    return (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => isSelected ? handleRemoveTag(tag) : handleAddTag(tag)}
                        style={{
                          fontSize: "0.76rem",
                          padding: "4px 10px",
                          borderRadius: "9999px",
                          border: `1px solid ${isSelected ? colors.border : "var(--border)"}`,
                          background: isSelected ? colors.bg : "var(--panel)",
                          color: isSelected ? colors.text : "var(--text-muted)",
                          fontWeight: isSelected ? 700 : 500,
                          cursor: "pointer",
                          transition: "all 0.15s",
                        }}
                      >
                        {isSelected ? `✓ ${tag}` : `+ ${tag}`}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Recurrence Selector */}
              <div className="ai-section" style={{ borderTop: "1px solid var(--border)", paddingTop: "14px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
                  <div>
                    <h4 style={{ margin: "0 0 4px 0" }}>🔁 Smart Task Recurrence</h4>
                    <p style={{ margin: 0, fontSize: "0.78rem", color: "var(--text-muted)" }}>
                      Automatically generate next cycle task when this task is completed.
                    </p>
                  </div>
                  <select
                    value={recurrence}
                    onChange={(e) => handleRecurrenceChange(e.target.value)}
                    style={{
                      padding: "6px 12px",
                      borderRadius: "8px",
                      border: "1px solid var(--border)",
                      background: "var(--bg)",
                      color: "var(--text)",
                      fontSize: "0.82rem",
                      fontWeight: 600,
                      outline: "none",
                      cursor: "pointer",
                    }}
                  >
                    <option value="none">None (One-off Task)</option>
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="weekdays">Weekdays (Mon-Fri)</option>
                  </select>
                </div>
              </div>

              {/* Blocker & Resolution Engine */}
              <div className="ai-section" style={{ borderTop: "1px solid var(--border)", paddingTop: "14px" }}>
                <h4>🚫 Blocker & Resolution Engine (django-coleman)</h4>
                
                {/* Blocker Status */}
                <div
                  style={{
                    background: isBlocked ? "rgba(239, 68, 68, 0.08)" : "var(--bg)",
                    border: `1px solid ${isBlocked ? "rgba(239, 68, 68, 0.3)" : "var(--border)"}`,
                    borderRadius: "12px",
                    padding: "12px",
                    marginBottom: "12px",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                    <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", fontWeight: 700, fontSize: "0.84rem", color: isBlocked ? "#ef4444" : "var(--text)" }}>
                      <input
                        type="checkbox"
                        checked={isBlocked}
                        onChange={(e) => setIsBlocked(e.target.checked)}
                        style={{ accentColor: "#ef4444", width: "16px", height: "16px" }}
                      />
                      Mark task as Blocked
                    </label>
                    {Boolean(blockedReason) && (
                      <button
                        type="button"
                        onClick={handleClearBlocker}
                        disabled={savingBlocker}
                        style={{ fontSize: "0.75rem", background: "none", border: "none", color: "#ef4444", cursor: "pointer", textDecoration: "underline" }}
                      >
                        Clear Blocker
                      </button>
                    )}
                  </div>
                  {isBlocked && (
                    <div style={{ display: "flex", gap: "8px" }}>
                      <input
                        type="text"
                        placeholder="What is blocking this task? (e.g. Waiting on API credentials)"
                        value={blockedReason}
                        onChange={(e) => setBlockedReason(e.target.value)}
                        style={{
                          flex: 1,
                          padding: "6px 10px",
                          borderRadius: "8px",
                          border: "1px solid var(--border)",
                          background: "var(--panel)",
                          color: "var(--text)",
                          fontSize: "0.82rem",
                          outline: "none",
                        }}
                      />
                      <button
                        type="button"
                        onClick={handleSaveBlocker}
                        disabled={savingBlocker}
                        className="btn primary"
                        style={{ fontSize: "0.78rem", padding: "4px 12px" }}
                      >
                        {savingBlocker ? "Saving..." : "Save Blocker"}
                      </button>
                    </div>
                  )}
                </div>

                {/* Resolution Notes */}
                <div style={{ background: "var(--bg)", border: "1px solid var(--border)", borderRadius: "12px", padding: "12px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                    <label style={{ fontWeight: 700, fontSize: "0.84rem", color: "var(--text)" }}>
                      ✅ Resolution / Completion Notes
                    </label>
                    <button
                      type="button"
                      onClick={handleSaveResolution}
                      disabled={savingResolution}
                      className="btn secondary"
                      style={{ fontSize: "0.75rem", padding: "3px 10px" }}
                    >
                      {savingResolution ? "Saving..." : "Save Resolution"}
                    </button>
                  </div>
                  <textarea
                    rows={2}
                    placeholder="Document how this task was resolved, PR links, deployment notes, or verification steps..."
                    value={resolution}
                    onChange={(e) => setResolution(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "8px 10px",
                      borderRadius: "8px",
                      border: "1px solid var(--border)",
                      background: "var(--panel)",
                      color: "var(--text)",
                      fontSize: "0.84rem",
                      outline: "none",
                      resize: "none",
                    }}
                  />
                </div>
              </div>
            </>
          )}

          {/* TAB 2: LIVE STOPWATCH & TIME TRACKER */}
          {activeTab === "time" && (
            <>
              {/* Estimated Hours & Progress Bar */}
              <div
                style={{
                  background: "var(--bg)",
                  border: "1px solid var(--border)",
                  borderRadius: "14px",
                  padding: "16px",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px", flexWrap: "wrap", gap: "8px" }}>
                  <div>
                    <h4 style={{ margin: "0 0 2px 0" }}>Time Budget & Variance</h4>
                    <p style={{ margin: 0, fontSize: "0.78rem", color: "var(--text-muted)" }}>
                      {totalLoggedHours}h logged of {estimatedHours}h estimated ({timeProgressPercent}%)
                    </p>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <span style={{ fontSize: "0.78rem", color: "var(--text-muted)", fontWeight: 600 }}>Estimated:</span>
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      value={estimatedHours}
                      onChange={(e) => handleUpdateEstimatedHours(e.target.value)}
                      style={{
                        width: "65px",
                        padding: "4px 8px",
                        borderRadius: "6px",
                        border: "1px solid var(--border)",
                        background: "var(--panel)",
                        color: "var(--text)",
                        fontSize: "0.82rem",
                        textAlign: "center",
                      }}
                    />
                    <span style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>hours</span>
                  </div>
                </div>

                <div style={{ height: "8px", background: "var(--border)", borderRadius: "9999px", overflow: "hidden" }}>
                  <div
                    style={{
                      width: `${timeProgressPercent}%`,
                      height: "100%",
                      background:
                        timeProgressPercent > 100
                          ? "#ef4444"
                          : "linear-gradient(90deg, #6366f1, #00d2ff)",
                      transition: "width 0.3s ease",
                    }}
                  />
                </div>
              </div>

              {/* Live Stopwatch Card (taskcoach) */}
              <div
                style={{
                  background: "linear-gradient(135deg, rgba(99, 102, 241, 0.08) 0%, rgba(0, 210, 255, 0.08) 100%)",
                  border: "1px solid rgba(99, 102, 241, 0.25)",
                  borderRadius: "14px",
                  padding: "16px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                  gap: "12px",
                }}
              >
                <div>
                  <div style={{ fontSize: "0.76rem", fontWeight: 700, color: "var(--brand)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    Live Task Stopwatch (taskcoach)
                  </div>
                  <div style={{ fontSize: "1.85rem", fontWeight: 800, fontFamily: "monospace", color: "var(--text)", marginTop: "2px" }}>
                    {formatTimerClock(timerSeconds)}
                  </div>
                </div>

                <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                  {!timerRunning ? (
                    <button
                      type="button"
                      onClick={() => setTimerRunning(true)}
                      style={{
                        background: "#10b981",
                        color: "#fff",
                        border: "none",
                        borderRadius: "10px",
                        padding: "8px 16px",
                        fontWeight: 700,
                        fontSize: "0.84rem",
                        cursor: "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                        boxShadow: "0 4px 12px rgba(16, 185, 129, 0.3)",
                      }}
                    >
                      ▶ Start Timer
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setTimerRunning(false)}
                      style={{
                        background: "#f59e0b",
                        color: "#fff",
                        border: "none",
                        borderRadius: "10px",
                        padding: "8px 16px",
                        fontWeight: 700,
                        fontSize: "0.84rem",
                        cursor: "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                        boxShadow: "0 4px 12px rgba(245, 158, 11, 0.3)",
                      }}
                    >
                      ⏸ Pause
                    </button>
                  )}

                  {timerSeconds > 0 && (
                    <>
                      <button
                        type="button"
                        onClick={handleLogStopwatch}
                        disabled={submittingTime}
                        style={{
                          background: "#6366f1",
                          color: "#fff",
                          border: "none",
                          borderRadius: "10px",
                          padding: "8px 16px",
                          fontWeight: 700,
                          fontSize: "0.84rem",
                          cursor: "pointer",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "6px",
                          boxShadow: "0 4px 12px rgba(99, 102, 241, 0.3)",
                        }}
                      >
                        {submittingTime ? "Logging..." : `💾 Log ${Math.max(1, Math.round(timerSeconds / 60))}m`}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setTimerRunning(false);
                          setTimerSeconds(0);
                        }}
                        style={{
                          background: "var(--bg)",
                          color: "var(--text-muted)",
                          border: "1px solid var(--border)",
                          borderRadius: "10px",
                          padding: "8px 12px",
                          fontWeight: 600,
                          fontSize: "0.82rem",
                          cursor: "pointer",
                        }}
                      >
                        Reset
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Manual Time Entry Form (django-coleman) */}
              <form
                onSubmit={handleManualLogTime}
                style={{
                  background: "var(--bg)",
                  border: "1px solid var(--border)",
                  borderRadius: "14px",
                  padding: "16px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "10px",
                }}
              >
                <div style={{ fontWeight: 700, fontSize: "0.86rem", color: "var(--text)" }}>
                  ✍️ Manual Time Entry Log
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "130px 1fr auto", gap: "10px", alignItems: "center" }}>
                  <input
                    type="number"
                    min="1"
                    placeholder="Minutes (e.g. 45)"
                    value={logMinutes}
                    onChange={(e) => setLogMinutes(e.target.value)}
                    style={{
                      padding: "8px 10px",
                      borderRadius: "8px",
                      border: "1px solid var(--border)",
                      background: "var(--panel)",
                      color: "var(--text)",
                      fontSize: "0.84rem",
                      outline: "none",
                    }}
                  />
                  <input
                    type="text"
                    placeholder="Work description / notes (optional)..."
                    value={logNotes}
                    onChange={(e) => setLogNotes(e.target.value)}
                    style={{
                      padding: "8px 12px",
                      borderRadius: "8px",
                      border: "1px solid var(--border)",
                      background: "var(--panel)",
                      color: "var(--text)",
                      fontSize: "0.84rem",
                      outline: "none",
                    }}
                  />
                  <button
                    type="submit"
                    className="btn primary"
                    disabled={!logMinutes || submittingTime}
                    style={{ fontSize: "0.82rem", padding: "8px 14px", whiteSpace: "nowrap" }}
                  >
                    + Log Time
                  </button>
                </div>
                <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.78rem", color: "var(--text-muted)", cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={logBillable}
                    onChange={(e) => setLogBillable(e.target.checked)}
                    style={{ accentColor: "var(--brand)" }}
                  />
                  Billable to client / project
                </label>
              </form>

              {/* Time Logs History List */}
              <div className="ai-section">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                  <h4>📜 Logged Work Sessions ({timeEntries.length})</h4>
                  <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--brand)" }}>
                    Total: {formatDuration(totalTimeMinutes)}
                  </span>
                </div>

                {loadingTimeEntries ? (
                  <p style={{ fontSize: "0.84rem", color: "var(--text-muted)" }}>Loading time logs...</p>
                ) : timeEntries.length === 0 ? (
                  <p style={{ fontSize: "0.84rem", color: "var(--text-muted)", fontStyle: "italic" }}>
                    No time logged yet. Start the live stopwatch or log an entry above.
                  </p>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    {timeEntries.map((entry) => (
                      <div
                        key={entry.id}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          padding: "10px 14px",
                          borderRadius: "10px",
                          background: "var(--bg)",
                          border: "1px solid var(--border)",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0 }}>
                          <span style={{ fontSize: "1.1rem" }}>⏱️</span>
                          <div style={{ minWidth: 0 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                              <strong style={{ fontSize: "0.88rem", color: "var(--text)" }}>
                                {formatDuration(entry.duration_minutes)}
                              </strong>
                              {entry.billable && (
                                <span style={{ fontSize: "0.68rem", fontWeight: 700, padding: "1px 6px", borderRadius: "4px", background: "rgba(16, 185, 129, 0.15)", color: "#10b981" }}>
                                  Billable
                                </span>
                              )}
                              <span style={{ fontSize: "0.74rem", color: "var(--text-muted)" }}>
                                • {entry.user_username || "User"} • {entry.date}
                              </span>
                            </div>
                            {entry.notes && (
                              <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginTop: "2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                {entry.notes}
                              </div>
                            )}
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleDeleteTimeEntry(entry.id)}
                          style={{
                            background: "none",
                            border: "none",
                            color: "var(--text-muted)",
                            cursor: "pointer",
                            fontSize: "0.85rem",
                            padding: "4px",
                          }}
                          title="Delete time entry"
                        >
                          🗑️
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

          {/* TAB 3: CHECKLIST & SUBTASKS */}
          {activeTab === "checklist" && (
            <div className="ai-section">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h4>Checklist & Subtasks ({completedCount}/{checklist.length})</h4>
                <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--brand)" }}>
                  {checklistProgress}% Complete
                </span>
              </div>

              {checklist.length > 0 && (
                <div style={{ height: "6px", background: "var(--border)", borderRadius: "9999px", overflow: "hidden", margin: "4px 0 10px 0" }}>
                  <div style={{ width: `${checklistProgress}%`, height: "100%", background: "linear-gradient(90deg, #10b981, #06b6d4)", transition: "width 0.3s ease" }} />
                </div>
              )}

              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                {checklist.map((item, idx) => (
                  <div
                    key={item.id || idx}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "8px 12px",
                      borderRadius: "10px",
                      background: item.completed ? "var(--bg)" : "var(--panel)",
                      border: "1px solid var(--border)",
                      transition: "all 0.15s ease",
                    }}
                  >
                    <label style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer", flex: 1 }}>
                      <input
                        type="checkbox"
                        checked={item.completed}
                        onChange={() => handleToggleChecklist(idx)}
                        style={{ cursor: "pointer", width: "16px", height: "16px", accentColor: "var(--brand)" }}
                      />
                      <span style={{ fontSize: "0.88rem", textDecoration: item.completed ? "line-through" : "none", color: item.completed ? "var(--text-muted)" : "var(--text)" }}>
                        {item.text}
                      </span>
                    </label>
                    <button
                      onClick={() => handleDeleteChecklistItem(idx)}
                      style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", fontSize: "0.85rem", padding: "2px 6px" }}
                      title="Remove item"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>

              {/* Add checklist item form */}
              <form onSubmit={handleAddChecklistItem} style={{ display: "flex", gap: "8px", marginTop: "12px" }}>
                <input
                  type="text"
                  placeholder="Add a new checklist subtask..."
                  value={newCheckItem}
                  onChange={(e) => setNewCheckItem(e.target.value)}
                  style={{
                    flex: 1,
                    padding: "8px 12px",
                    borderRadius: "10px",
                    border: "1px solid var(--border)",
                    background: "var(--bg)",
                    color: "var(--text)",
                    fontSize: "0.85rem",
                    outline: "none",
                  }}
                />
                <button type="submit" className="btn secondary" style={{ fontSize: "0.8rem", padding: "6px 12px" }} disabled={!newCheckItem.trim()}>
                  + Add
                </button>
              </form>
            </div>
          )}

          {/* TAB 4: FILES & ATTACHMENTS */}
          {activeTab === "files" && (
            <div className="ai-section">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                <h4>📎 Files & Attachments ({attachments.length})</h4>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingFile}
                  style={{
                    fontSize: "0.78rem",
                    padding: "4px 10px",
                    borderRadius: "8px",
                    border: "1px solid var(--border)",
                    background: "var(--panel)",
                    color: "var(--brand)",
                    fontWeight: 700,
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "4px",
                  }}
                >
                  {uploadingFile ? "Uploading..." : "➕ Attach File"}
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  style={{ display: "none" }}
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleFileUpload(e.target.files[0]);
                      e.target.value = "";
                    }
                  }}
                />
              </div>

              {/* Drag & Drop Zone */}
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDraggingFile(true);
                }}
                onDragLeave={() => setIsDraggingFile(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDraggingFile(false);
                  if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                    handleFileUpload(e.dataTransfer.files[0]);
                  }
                }}
                onClick={() => fileInputRef.current?.click()}
                style={{
                  border: isDraggingFile ? "2px dashed var(--brand)" : "1px dashed var(--border)",
                  background: isDraggingFile ? "rgba(37, 99, 235, 0.08)" : "var(--bg)",
                  borderRadius: "12px",
                  padding: "14px",
                  textAlign: "center",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  marginBottom: "10px",
                }}
              >
                <div style={{ fontSize: "1.3rem", marginBottom: "2px" }}>📂</div>
                <p style={{ margin: 0, fontSize: "0.82rem", color: "var(--text)", fontWeight: 600 }}>
                  {uploadingFile ? "Uploading file, please wait..." : "Drag & drop files here, or click to browse"}
                </p>
                <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>
                  Images, PDFs, documents, design assets, and zip archives
                </span>
              </div>

              {/* Attachment Cards Grid */}
              {loadingAttachments ? (
                <p style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>Loading attachments...</p>
              ) : attachments.length === 0 ? (
                <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", fontStyle: "italic" }}>
                  No files attached yet. Drop screenshots, design assets, or specs above.
                </p>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "10px" }}>
                  {attachments.map((att) => (
                    <div
                      key={att.id}
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "space-between",
                        padding: "10px",
                        borderRadius: "10px",
                        background: "var(--bg)",
                        border: "1px solid var(--border)",
                        transition: "all 0.15s ease",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "flex-start", gap: "8px", minWidth: 0 }}>
                        <span style={{ fontSize: "1.3rem", lineHeight: 1 }}>{getFileIcon(att.filename)}</span>
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div
                            style={{
                              fontSize: "0.82rem",
                              fontWeight: 600,
                              color: "var(--text)",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                            title={att.filename}
                          >
                            {att.filename}
                          </div>
                          <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: "2px" }}>
                            {formatFileSize(att.file_size)} • {att.user_username || "User"}
                          </div>
                        </div>
                      </div>

                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "8px", paddingTop: "6px", borderTop: "1px solid var(--border)" }}>
                        <a
                          href={att.file_url || att.file}
                          target="_blank"
                          rel="noopener noreferrer"
                          download
                          style={{
                            fontSize: "0.74rem",
                            color: "var(--brand)",
                            fontWeight: 700,
                            textDecoration: "none",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "3px",
                          }}
                        >
                          ⬇️ Download
                        </a>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteAttachment(att.id);
                          }}
                          style={{
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            color: "var(--text-muted)",
                            fontSize: "0.8rem",
                            padding: "2px 4px",
                          }}
                          title="Delete attachment"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 5: DISCUSSION & COMMENTS */}
          {activeTab === "discussion" && (
            <div className="ai-section">
              <h4>💬 Team Discussion ({comments.length})</h4>

              {loadingComments ? (
                <p style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>Loading discussion...</p>
              ) : comments.length === 0 ? (
                <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", fontStyle: "italic" }}>
                  No comments yet. Start the conversation with your team!
                </p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "10px", maxHeight: "280px", overflowY: "auto", paddingRight: "4px" }}>
                  {comments.map((c) => (
                    <div key={c.id} style={{ display: "flex", gap: "10px", background: "var(--bg)", border: "1px solid var(--border)", borderRadius: "12px", padding: "10px 14px" }}>
                      <img
                        src={c.user_profile_picture || defaultAvatar}
                        alt={c.user_username}
                        style={{ width: "28px", height: "28px", borderRadius: "50%", objectFit: "cover" }}
                      />
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                          <strong style={{ fontSize: "0.84rem", color: "var(--text)" }}>{c.user_username}</strong>
                          <span style={{ fontSize: "0.74rem", color: "var(--text-muted)" }}>
                            {new Date(c.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", month: "short", day: "numeric" })}
                          </span>
                        </div>
                        <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--text)", lineHeight: 1.45 }}>{c.content}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Post comment input */}
              <form onSubmit={handlePostComment} style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "12px" }}>
                <div style={{ position: "relative" }}>
                  <textarea
                    rows={2}
                    placeholder="Leave a comment or update for the team..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "10px 42px 10px 12px",
                      borderRadius: "12px",
                      border: "1px solid var(--border)",
                      background: "var(--bg)",
                      color: "var(--text)",
                      fontSize: "0.86rem",
                      outline: "none",
                      resize: "none",
                    }}
                    disabled={submittingComment}
                  />
                  {isSpeechSupported() && (
                    <button
                      type="button"
                      onClick={handleVoiceComment}
                      style={{
                        position: "absolute",
                        right: "10px",
                        top: "10px",
                        background: isRecording ? "#ef4444" : "none",
                        color: isRecording ? "#fff" : "var(--text-muted)",
                        border: "none",
                        borderRadius: "50%",
                        width: "28px",
                        height: "28px",
                        cursor: "pointer",
                        fontSize: "1rem",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        boxShadow: isRecording ? "0 0 0 3px rgba(239, 68, 68, 0.4)" : "none",
                      }}
                      title={isRecording ? "Listening... Speak now!" : "Click to speak comment"}
                    >
                      🎙️
                    </button>
                  )}
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  {isRecording && (
                    <span style={{ fontSize: "0.78rem", color: "#ef4444", fontWeight: 700 }}>
                      🔴 Listening to your voice... Speak now!
                    </span>
                  )}
                  <div style={{ marginLeft: "auto" }}>
                    <button
                      type="submit"
                      className="btn primary"
                      style={{ fontSize: "0.82rem", padding: "6px 14px" }}
                      disabled={!newComment.trim() || submittingComment}
                    >
                      {submittingComment ? "Posting..." : "💬 Post Comment"}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          )}

          <div className="ai-footer" style={{ marginTop: "auto", borderTop: "1px solid var(--border)", paddingTop: "12px" }}>
            <span className="ai-powered-by">FlowTrack Pro Work Execution Engine</span>
            <button className="btn secondary" onClick={onClose}>Close</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TaskDetailModal;
