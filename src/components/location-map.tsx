import { MapPin, Navigation } from "lucide-react";

interface Props {
  lat?: number | string | null;
  lng?: number | string | null;
  address?: string | null;
  name?: string | null;
  compact?: boolean;
}

export function LocationMap({ lat, lng, address, name, compact = false }: Props) {
  const hasCoords = lat != null && lng != null && Number(lat) !== 0 && Number(lng) !== 0;

  const directionsUrl = hasCoords
    ? `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`
    : address
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`
    : null;

  const mapSrc = hasCoords
    ? `https://www.openstreetmap.org/export/embed.html?bbox=${Number(lng) - 0.005},${Number(lat) - 0.003},${Number(lng) + 0.005},${Number(lat) + 0.003}&layer=mapnik&marker=${lat},${lng}`
    : null;

  if (!hasCoords && !address) return null;

  if (compact) {
    return (
      <a
        href={directionsUrl || "#"}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2 text-gray-400 hover:text-emerald-400 transition-colors text-sm"
        onClick={(e) => !directionsUrl && e.preventDefault()}
      >
        <MapPin size={14} className="shrink-0 text-emerald-400" />
        <span className="truncate">{name || address || "Ver ubicación"}</span>
        {directionsUrl && <Navigation size={12} className="shrink-0 text-emerald-400" />}
      </a>
    );
  }

  return (
    <div className="space-y-2">
      {mapSrc && (
        <div className="rounded-xl overflow-hidden border border-white/10 h-36">
          <iframe
            src={mapSrc}
            className="w-full h-full"
            style={{ border: "none" }}
            title="Ubicación del campo"
            loading="lazy"
          />
        </div>
      )}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2 min-w-0">
          <MapPin size={16} className="text-emerald-400 mt-0.5 shrink-0" />
          <div className="min-w-0">
            {name && <p className="text-white text-sm font-semibold truncate">{name}</p>}
            {address && <p className="text-gray-400 text-xs truncate">{address}</p>}
          </div>
        </div>
        {directionsUrl && (
          <a
            href={directionsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 flex items-center gap-1 bg-emerald-600 hover:bg-emerald-500 text-white text-xs px-3 py-1.5 rounded-lg transition-colors font-medium"
          >
            <Navigation size={12} />
            Cómo llegar
          </a>
        )}
      </div>
    </div>
  );
}
