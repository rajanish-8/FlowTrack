import React from "react";

/* ───────────────────────────────────────────────
   SkeletonLoader — shimmer placeholder component
   Usage:
     <SkeletonLoader type="card" count={4} />   – Kanban card skeletons
     <SkeletonLoader type="row"  count={6} />   – Table row skeletons
     <SkeletonLoader type="member" count={3} /> – Team member card skeletons
     <SkeletonLoader type="client" count={4} /> – Client card skeletons
─────────────────────────────────────────────── */

const shimmerStyle = {
  background: "linear-gradient(90deg, var(--border) 25%, var(--panel-soft) 50%, var(--border) 75%)",
  backgroundSize: "200% 100%",
  animation: "sk-shimmer 1.4s infinite linear",
  borderRadius: "6px",
};

function SkeletonBox({ w = "100%", h = "14px", style = {} }) {
  return (
    <div
      style={{
        ...shimmerStyle,
        width: w,
        height: h,
        flexShrink: 0,
        ...style,
      }}
    />
  );
}

/* ── Individual skeleton shapes ──────────────── */

function CardSkeleton() {
  return (
    <div
      style={{
        background: "var(--panel)",
        border: "1px solid var(--border)",
        borderRadius: "14px",
        padding: "16px",
        display: "flex",
        flexDirection: "column",
        gap: "10px",
        boxShadow: "var(--shadow-soft)",
      }}
    >
      {/* Priority badge */}
      <SkeletonBox w="60px" h="18px" style={{ borderRadius: "9999px" }} />
      {/* Title */}
      <SkeletonBox w="85%" h="16px" />
      <SkeletonBox w="65%" h="14px" />
      {/* Footer row */}
      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "4px" }}>
        <SkeletonBox w="22px" h="22px" style={{ borderRadius: "50%" }} />
        <SkeletonBox w="70px" h="12px" />
        <div style={{ marginLeft: "auto" }}>
          <SkeletonBox w="50px" h="12px" />
        </div>
      </div>
    </div>
  );
}

function RowSkeleton() {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "2fr 1fr 1fr 1fr 80px",
        gap: "12px",
        alignItems: "center",
        padding: "12px 16px",
        borderBottom: "1px solid var(--border)",
      }}
    >
      <SkeletonBox w="70%" h="14px" />
      <SkeletonBox w="60px" h="18px" style={{ borderRadius: "9999px" }} />
      <SkeletonBox w="70px" h="18px" style={{ borderRadius: "9999px" }} />
      <SkeletonBox w="80px" h="13px" />
      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
        <SkeletonBox w="22px" h="22px" style={{ borderRadius: "50%" }} />
        <SkeletonBox w="50px" h="13px" />
      </div>
    </div>
  );
}

function MemberSkeleton() {
  return (
    <div
      style={{
        background: "var(--panel)",
        border: "1px solid var(--border)",
        borderRadius: "16px",
        padding: "20px",
        display: "flex",
        alignItems: "center",
        gap: "16px",
        boxShadow: "var(--shadow-soft)",
      }}
    >
      <SkeletonBox w="52px" h="52px" style={{ borderRadius: "50%", flexShrink: 0 }} />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "8px" }}>
        <SkeletonBox w="45%" h="15px" />
        <SkeletonBox w="60px" h="18px" style={{ borderRadius: "9999px" }} />
        <SkeletonBox w="70%" h="12px" />
      </div>
    </div>
  );
}

function ClientSkeleton() {
  return (
    <div
      style={{
        background: "var(--panel)",
        border: "1px solid var(--border)",
        borderRadius: "16px",
        padding: "20px",
        display: "flex",
        flexDirection: "column",
        gap: "12px",
        boxShadow: "var(--shadow-soft)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <SkeletonBox w="40px" h="40px" style={{ borderRadius: "10px", flexShrink: 0 }} />
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "6px" }}>
          <SkeletonBox w="55%" h="15px" />
          <SkeletonBox w="40%" h="12px" />
        </div>
      </div>
      <SkeletonBox w="90%" h="12px" />
      <SkeletonBox w="75%" h="12px" />
      <SkeletonBox w="50%" h="12px" />
    </div>
  );
}

/* ── KanbanColumnsSkeleton: 4 columns with 3 cards each ── */
function KanbanSkeleton({ count = 3 }) {
  const cols = ["To Do", "In Progress", "Review", "Done"];
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
        gap: "16px",
      }}
    >
      {cols.map((col) => (
        <div
          key={col}
          style={{
            background: "var(--panel)",
            border: "1px solid var(--border)",
            borderRadius: "18px",
            padding: "16px",
            display: "flex",
            flexDirection: "column",
            gap: "10px",
          }}
        >
          {/* Column header */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
            <SkeletonBox w="90px" h="14px" />
            <SkeletonBox w="24px" h="18px" style={{ borderRadius: "9999px" }} />
          </div>
          {Array.from({ length: count }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ))}
    </div>
  );
}

/* ── Main exported component ───────────────── */
export default function SkeletonLoader({ type = "card", count = 4 }) {
  if (type === "kanban") {
    return (
      <>
        <style>{`
          @keyframes sk-shimmer {
            0% { background-position: 200% 0; }
            100% { background-position: -200% 0; }
          }
        `}</style>
        <KanbanSkeleton count={3} />
      </>
    );
  }

  const SkeletonItem =
    type === "row"
      ? RowSkeleton
      : type === "member"
      ? MemberSkeleton
      : type === "client"
      ? ClientSkeleton
      : CardSkeleton;

  return (
    <>
      <style>{`
        @keyframes sk-shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            type === "row"
              ? "1fr"
              : "repeat(auto-fill, minmax(260px, 1fr))",
          gap: type === "row" ? "0" : "16px",
        }}
      >
        {Array.from({ length: count }).map((_, i) => (
          <SkeletonItem key={i} />
        ))}
      </div>
    </>
  );
}
