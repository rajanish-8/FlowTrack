import { useState, useEffect } from "react";
import { clientAPI } from "../utils/api";

function ClientsView({ userRole, projects = [], onTaskUpdated }) {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    contact_name: "",
    email: "",
    phone: "",
    website: "",
    notes: "",
  });
  const [submitting, setSubmitting] = useState(false);

  const canManage = userRole === "owner" || userRole === "manager";

  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = async () => {
    try {
      setLoading(true);
      const data = await clientAPI.getAll();
      setClients(data || []);
    } catch (err) {
      console.error("Failed to load clients:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAddModal = () => {
    setEditingClient(null);
    setFormData({
      name: "",
      contact_name: "",
      email: "",
      phone: "",
      website: "",
      notes: "",
    });
    setShowModal(true);
  };

  const handleOpenEditModal = (client) => {
    setEditingClient(client);
    setFormData({
      name: client.name || "",
      contact_name: client.contact_name || "",
      email: client.email || "",
      phone: client.phone || "",
      website: client.website || "",
      notes: client.notes || "",
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert("Company / Client name is required.");
      return;
    }
    try {
      setSubmitting(true);
      if (editingClient) {
        await clientAPI.update(editingClient.id, formData);
      } else {
        await clientAPI.create(formData);
      }
      setShowModal(false);
      await loadClients();
      if (onTaskUpdated) onTaskUpdated();
    } catch (err) {
      alert("Failed to save client: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (clientId, clientName) => {
    if (!window.confirm(`Are you sure you want to remove client "${clientName}"? Projects linked to this client will be unlinked.`)) {
      return;
    }
    try {
      await clientAPI.delete(clientId);
      await loadClients();
      if (onTaskUpdated) onTaskUpdated();
    } catch (err) {
      alert("Failed to delete client: " + err.message);
    }
  };

  const filteredClients = clients.filter((c) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      c.name?.toLowerCase().includes(q) ||
      c.contact_name?.toLowerCase().includes(q) ||
      c.email?.toLowerCase().includes(q) ||
      c.notes?.toLowerCase().includes(q)
    );
  });

  const totalLinkedProjects = clients.reduce((acc, c) => acc + (c.projects_count || 0), 0);

  return (
    <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "24px 20px" }}>
      {/* Hero Header */}
      <div
        className="clay-card"
        style={{
          padding: "24px 28px",
          borderRadius: "20px",
          background: "var(--panel)",
          border: "1px solid var(--border)",
          boxShadow: "var(--shadow-soft)",
          marginBottom: "24px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "16px",
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
            <span
              style={{
                fontSize: "0.72rem",
                fontWeight: 700,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                color: "var(--brand)",
                background: "rgba(37, 99, 235, 0.08)",
                padding: "2px 8px",
                borderRadius: "6px",
              }}
            >
              Enterprise CRM Hub (django-crm)
            </span>
            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>•</span>
            <span style={{ fontSize: "0.78rem", color: "var(--text-muted)", fontWeight: 500 }}>
              {clients.length} {clients.length === 1 ? "Client" : "Clients"} Registered
            </span>
          </div>
          <h1 style={{ fontSize: "1.85rem", fontWeight: 800, margin: "2px 0 6px 0", color: "var(--text)" }}>
            Clients & Accounts Directory
          </h1>
          <p style={{ margin: 0, fontSize: "0.88rem", color: "var(--text-muted)" }}>
            Manage client relationships, contact points, and linked project deliverables.
          </p>
        </div>

        {canManage && (
          <button
            type="button"
            className="btn primary"
            onClick={handleOpenAddModal}
            style={{
              padding: "10px 20px",
              fontSize: "0.88rem",
              fontWeight: 700,
              borderRadius: "12px",
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              boxShadow: "0 4px 14px rgba(37, 99, 235, 0.3)",
            }}
          >
            🏢 + Add Client
          </button>
        )}
      </div>

      {/* Quick CRM Metrics */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "16px",
          marginBottom: "24px",
        }}
      >
        <div
          className="clay-card"
          style={{
            padding: "18px",
            borderRadius: "16px",
            background: "var(--panel)",
            border: "1px solid var(--border)",
            borderTop: "3px solid #3b82f6",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>
              Total Clients
            </span>
            <span style={{ fontSize: "1.2rem" }}>🏢</span>
          </div>
          <strong style={{ fontSize: "28px", color: "var(--text)", display: "block", marginTop: "6px" }}>
            {clients.length}
          </strong>
        </div>

        <div
          className="clay-card"
          style={{
            padding: "18px",
            borderRadius: "16px",
            background: "var(--panel)",
            border: "1px solid var(--border)",
            borderTop: "3px solid #10b981",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>
              Linked Projects
            </span>
            <span style={{ fontSize: "1.2rem" }}>📂</span>
          </div>
          <strong style={{ fontSize: "28px", color: "var(--text)", display: "block", marginTop: "6px" }}>
            {totalLinkedProjects}
          </strong>
        </div>

        <div
          className="clay-card"
          style={{
            padding: "18px",
            borderRadius: "16px",
            background: "var(--panel)",
            border: "1px solid var(--border)",
            borderTop: "3px solid #f59e0b",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>
              Direct Contacts
            </span>
            <span style={{ fontSize: "1.2rem" }}>👤</span>
          </div>
          <strong style={{ fontSize: "28px", color: "var(--text)", display: "block", marginTop: "6px" }}>
            {clients.filter((c) => Boolean(c.email || c.phone)).length}
          </strong>
        </div>

        <div
          className="clay-card"
          style={{
            padding: "18px",
            borderRadius: "16px",
            background: "var(--panel)",
            border: "1px solid var(--border)",
            borderTop: "3px solid #a855f7",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>
              Web Verified
            </span>
            <span style={{ fontSize: "1.2rem" }}>🌐</span>
          </div>
          <strong style={{ fontSize: "28px", color: "var(--text)", display: "block", marginTop: "6px" }}>
            {clients.filter((c) => Boolean(c.website)).length}
          </strong>
        </div>
      </div>

      {/* Search Toolbar */}
      <div
        className="clay-card"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "12px 18px",
          marginBottom: "20px",
          borderRadius: "16px",
          background: "var(--panel)",
          border: "1px solid var(--border)",
          boxShadow: "var(--shadow-soft)",
          gap: "12px",
          flexWrap: "wrap",
        }}
      >
        <div style={{ position: "relative", flex: "1 1 280px", maxWidth: "420px" }}>
          <span style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }}>
            🔍
          </span>
          <input
            type="text"
            placeholder="Search clients by company, contact person, or notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: "100%",
              padding: "8px 36px 8px 36px",
              borderRadius: "9999px",
              border: "1px solid var(--border)",
              background: "var(--bg)",
              color: "var(--text)",
              fontSize: "0.86rem",
              outline: "none",
            }}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              style={{
                position: "absolute",
                right: "12px",
                top: "50%",
                transform: "translateY(-50%)",
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "var(--text-muted)",
                fontSize: "1rem",
              }}
            >
              ×
            </button>
          )}
        </div>

        <span style={{ fontSize: "0.82rem", color: "var(--text-muted)", fontWeight: 600 }}>
          Showing {filteredClients.length} of {clients.length} clients
        </span>
      </div>

      {/* Clients Cards Grid */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "48px 0", color: "var(--text-muted)" }}>
          <div className="loading-spinner" style={{ margin: "0 auto 12px auto" }} />
          <p>Loading enterprise clients...</p>
        </div>
      ) : filteredClients.length === 0 ? (
        <div
          className="clay-card"
          style={{
            textAlign: "center",
            padding: "48px 24px",
            borderRadius: "20px",
            background: "var(--panel)",
            border: "1px dashed var(--border)",
          }}
        >
          <div style={{ fontSize: "2.8rem", marginBottom: "8px" }}>🏢</div>
          <h3 style={{ fontSize: "1.2rem", fontWeight: 700, color: "var(--text)", margin: "0 0 6px 0" }}>
            No Clients Found
          </h3>
          <p style={{ fontSize: "0.88rem", color: "var(--text-muted)", margin: "0 0 16px 0" }}>
            {searchQuery
              ? `No clients matched your search "${searchQuery}".`
              : "Register your client accounts to link deliverables, track billable time, and organize contracts."}
          </p>
          {canManage && (
            <button type="button" className="btn primary" onClick={handleOpenAddModal}>
              + Add First Client
            </button>
          )}
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))",
            gap: "20px",
          }}
        >
          {filteredClients.map((client) => (
            <div
              key={client.id}
              className="clay-card"
              style={{
                borderRadius: "18px",
                background: "var(--panel)",
                border: "1px solid var(--border)",
                padding: "20px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                boxShadow: "var(--shadow-soft)",
                transition: "transform 0.15s ease, box-shadow 0.15s ease",
              }}
            >
              <div>
                {/* Header: Company & Actions */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <div
                      style={{
                        width: "42px",
                        height: "42px",
                        borderRadius: "12px",
                        background: "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)",
                        color: "#fff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "1.2rem",
                        fontWeight: 800,
                        boxShadow: "0 4px 12px rgba(59, 130, 246, 0.3)",
                      }}
                    >
                      {client.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 style={{ margin: 0, fontSize: "1.05rem", fontWeight: 700, color: "var(--text)" }}>
                        {client.name}
                      </h3>
                      {client.contact_name && (
                        <span style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
                          POC: <strong>{client.contact_name}</strong>
                        </span>
                      )}
                    </div>
                  </div>

                  {canManage && (
                    <div style={{ display: "flex", gap: "4px" }}>
                      <button
                        type="button"
                        onClick={() => handleOpenEditModal(client)}
                        style={{
                          background: "var(--bg)",
                          border: "1px solid var(--border)",
                          borderRadius: "8px",
                          padding: "4px 8px",
                          fontSize: "0.78rem",
                          cursor: "pointer",
                          color: "var(--text)",
                        }}
                        title="Edit client"
                      >
                        ✏️
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(client.id, client.name)}
                        style={{
                          background: "var(--bg)",
                          border: "1px solid var(--border)",
                          borderRadius: "8px",
                          padding: "4px 8px",
                          fontSize: "0.78rem",
                          cursor: "pointer",
                          color: "#ef4444",
                        }}
                        title="Delete client"
                      >
                        🗑️
                      </button>
                    </div>
                  )}
                </div>

                {/* Contact Coordinates */}
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "6px",
                    background: "var(--bg)",
                    border: "1px solid var(--border)",
                    borderRadius: "12px",
                    padding: "10px 14px",
                    fontSize: "0.82rem",
                    marginBottom: "12px",
                  }}
                >
                  {client.email && (
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span>✉️</span>
                      <a
                        href={`mailto:${client.email}`}
                        style={{ color: "var(--brand)", textDecoration: "none", overflow: "hidden", textOverflow: "ellipsis" }}
                      >
                        {client.email}
                      </a>
                    </div>
                  )}
                  {client.phone && (
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span>📞</span>
                      <a href={`tel:${client.phone}`} style={{ color: "var(--text)", textDecoration: "none" }}>
                        {client.phone}
                      </a>
                    </div>
                  )}
                  {client.website && (
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span>🌐</span>
                      <a
                        href={client.website.startsWith("http") ? client.website : `https://${client.website}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: "var(--brand)", textDecoration: "none", overflow: "hidden", textOverflow: "ellipsis" }}
                      >
                        {client.website.replace(/^https?:\/\//, "")}
                      </a>
                    </div>
                  )}
                  {!client.email && !client.phone && !client.website && (
                    <span style={{ color: "var(--text-muted)", fontStyle: "italic", fontSize: "0.78rem" }}>
                      No direct contact details registered.
                    </span>
                  )}
                </div>

                {/* Notes & Terms */}
                {client.notes && (
                  <p
                    style={{
                      margin: "0 0 12px 0",
                      fontSize: "0.82rem",
                      color: "var(--text-muted)",
                      lineHeight: 1.5,
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                    }}
                  >
                    {client.notes}
                  </p>
                )}
              </div>

              {/* Linked Projects Footer */}
              <div
                style={{
                  borderTop: "1px solid var(--border)",
                  paddingTop: "10px",
                  marginTop: "8px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <span style={{ fontSize: "0.74rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>
                    Linked Projects:
                  </span>
                  <span
                    style={{
                      fontSize: "0.74rem",
                      fontWeight: 800,
                      padding: "2px 8px",
                      borderRadius: "6px",
                      background: "rgba(99, 102, 241, 0.12)",
                      color: "#6366f1",
                    }}
                  >
                    {client.projects_count || 0}
                  </span>
                </div>
                <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>
                  Added {new Date(client.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Client Modal */}
      {showModal && (
        <div className="ai-modal-overlay" onClick={() => setShowModal(false)}>
          <div
            className="ai-modal-card clay-card"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: "560px" }}
          >
            <div className="ai-modal-header">
              <div className="ai-badge-group">
                <span className="priority-level priority-high">CRM Entity</span>
                <h2>{editingClient ? "Edit Client Account" : "Add New Client Account"}</h2>
                <p className="ai-subtitle">Track client accounts and link them to FlowTrack projects.</p>
              </div>
              <button className="ai-close-btn" onClick={() => setShowModal(false)}>×</button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px", padding: "20px 24px" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, marginBottom: "4px", color: "var(--text)" }}>
                  Company / Organization Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Acme Corp, Vercel Inc."
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "9px 12px",
                    borderRadius: "10px",
                    border: "1px solid var(--border)",
                    background: "var(--bg)",
                    color: "var(--text)",
                    fontSize: "0.86rem",
                    outline: "none",
                  }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, marginBottom: "4px", color: "var(--text)" }}>
                    Primary Contact Person
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Sarah Jenkins"
                    value={formData.contact_name}
                    onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "9px 12px",
                      borderRadius: "10px",
                      border: "1px solid var(--border)",
                      background: "var(--bg)",
                      color: "var(--text)",
                      fontSize: "0.86rem",
                      outline: "none",
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, marginBottom: "4px", color: "var(--text)" }}>
                    Contact Email
                  </label>
                  <input
                    type="email"
                    placeholder="e.g. sarah@acme.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "9px 12px",
                      borderRadius: "10px",
                      border: "1px solid var(--border)",
                      background: "var(--bg)",
                      color: "var(--text)",
                      fontSize: "0.86rem",
                      outline: "none",
                    }}
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, marginBottom: "4px", color: "var(--text)" }}>
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    placeholder="+1 (555) 019-2834"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "9px 12px",
                      borderRadius: "10px",
                      border: "1px solid var(--border)",
                      background: "var(--bg)",
                      color: "var(--text)",
                      fontSize: "0.86rem",
                      outline: "none",
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, marginBottom: "4px", color: "var(--text)" }}>
                    Website URL
                  </label>
                  <input
                    type="text"
                    placeholder="https://acmecorp.com"
                    value={formData.website}
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "9px 12px",
                      borderRadius: "10px",
                      border: "1px solid var(--border)",
                      background: "var(--bg)",
                      color: "var(--text)",
                      fontSize: "0.86rem",
                      outline: "none",
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, marginBottom: "4px", color: "var(--text)" }}>
                  Account Notes / SLA / Billing Details
                </label>
                <textarea
                  rows={3}
                  placeholder="Key account details, monthly retainer terms, billing cycles, or points of contact..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "9px 12px",
                    borderRadius: "10px",
                    border: "1px solid var(--border)",
                    background: "var(--bg)",
                    color: "var(--text)",
                    fontSize: "0.86rem",
                    outline: "none",
                    resize: "none",
                  }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "8px" }}>
                <button
                  type="button"
                  className="btn secondary"
                  onClick={() => setShowModal(false)}
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn primary"
                  disabled={submitting}
                >
                  {submitting ? "Saving..." : editingClient ? "Save Changes" : "Create Client"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default ClientsView;
