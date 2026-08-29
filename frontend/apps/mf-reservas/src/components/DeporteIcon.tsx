// Ícono por deporte junto al selector de cancha (CanchaFechaPicker). Trazo
// simple en --turf, coherente con la estética tipográfica/flat del resto de
// la app — mismo componente que mf-administracion/components/DeporteIcon
// (cada microfrontend mantiene su propia copia por diseño, sin código
// compartido entre remotes).
import "./DeporteIcon.css";

export interface DeporteIconProps {
  readonly deporte: string | null;
}

function PadelIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="6" y="3" width="12" height="14" rx="6" />
      <circle cx="8" cy="7" r="0.9" fill="currentColor" stroke="none" />
      <circle cx="12" cy="7" r="0.9" fill="currentColor" stroke="none" />
      <circle cx="16" cy="7" r="0.9" fill="currentColor" stroke="none" />
      <circle cx="8" cy="11" r="0.9" fill="currentColor" stroke="none" />
      <circle cx="12" cy="11" r="0.9" fill="currentColor" stroke="none" />
      <circle cx="16" cy="11" r="0.9" fill="currentColor" stroke="none" />
      <line x1="12" y1="17" x2="12" y2="21" />
    </svg>
  );
}

function TenisIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M4.5 7c3 2.5 3 7.5 0 10" />
      <path d="M19.5 7c-3 2.5-3 7.5 0 10" />
    </svg>
  );
}

function BasquetIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18" />
      <path d="M12 3v18" />
      <path d="M5.3 5.3c3.6 3.6 3.6 9.8 0 13.4" />
      <path d="M18.7 5.3c-3.6 3.6-3.6 9.8 0 13.4" />
    </svg>
  );
}

function GenericIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
    </svg>
  );
}

function iconFor(deporte: string | null) {
  switch (deporte?.trim().toLowerCase()) {
    case "pádel":
    case "padel":
      return <PadelIcon />;
    case "tenis":
      return <TenisIcon />;
    case "básquet":
    case "basquet":
      return <BasquetIcon />;
    default:
      return <GenericIcon />;
  }
}

export function DeporteIcon({ deporte }: DeporteIconProps) {
  return (
    <span className="mfr-deporte-icon" data-testid="deporte-icon" title={deporte ?? undefined}>
      {iconFor(deporte)}
    </span>
  );
}
