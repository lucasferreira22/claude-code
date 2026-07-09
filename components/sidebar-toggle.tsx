"use client";

// Botão que recolhe/expande a barra lateral. Alterna o atributo
// data-sidebar no <html> (o CSS cuida do resto) e salva no localStorage.
// Não usa estado do React — assim não "pisca" ao recarregar.
export function SidebarToggle() {
  function toggle() {
    const el = document.documentElement;
    const recolhida = el.getAttribute("data-sidebar") === "collapsed";
    if (recolhida) el.removeAttribute("data-sidebar");
    else el.setAttribute("data-sidebar", "collapsed");
    try {
      localStorage.setItem("sidebarRecolhida", recolhida ? "0" : "1");
    } catch {
      /* ignora */
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      title="Recolher/expandir menu"
      aria-label="Recolher ou expandir o menu"
      className="rounded-button p-1.5 text-text-muted transition-all duration-200 hover:bg-surface-hover hover:text-text-primary"
    >
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="16" rx="2" />
        <line x1="9" y1="4" x2="9" y2="20" />
      </svg>
    </button>
  );
}
