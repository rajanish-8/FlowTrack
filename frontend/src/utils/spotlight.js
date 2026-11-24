// Interactive Mouse Spotlight Effect (Trending Bento & Linear Style)
export const initSpotlight = () => {
  if (typeof window === "undefined" || typeof document === "undefined") return () => {};

  const handlePointerMove = (e) => {
    const cards = document.querySelectorAll(".spotlight-card, .div-card, .stat-panel, .column");
    cards.forEach((card) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      card.style.setProperty("--mouse-x", `${x}px`);
      card.style.setProperty("--mouse-y", `${y}px`);
    });
  };

  window.addEventListener("pointermove", handlePointerMove, { passive: true });
  return () => window.removeEventListener("pointermove", handlePointerMove);
};
