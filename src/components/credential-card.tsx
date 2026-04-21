import { QRCodeSVG } from "qrcode.react";
import { Shield } from "lucide-react";

interface CredentialProps {
  member: {
    id: string;
    number: number;
    position?: string | null;
    user: { name: string; avatar?: string | null };
    team: { name: string; colorHex?: string | null; tournament: { name: string } };
  };
  baseUrl?: string;
}

export function CredentialCard({ member, baseUrl = "" }: CredentialProps) {
  const color = member.team.colorHex || "#3B82F6";
  const verifyUrl = `${baseUrl}/verify/${member.id}`;

  return (
    <div
      className="relative w-full max-w-sm mx-auto rounded-2xl overflow-hidden select-none"
      style={{ background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)", border: `2px solid ${color}33` }}
    >
      {/* Top color bar */}
      <div className="h-1.5 w-full" style={{ backgroundColor: color }} />

      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-4 pb-2">
        <div className="flex items-center gap-2">
          <Shield size={16} style={{ color }} />
          <span className="text-xs font-bold uppercase tracking-widest text-gray-400">El Pitazo</span>
        </div>
        <span className="text-xs text-gray-500">{member.team.tournament.name}</span>
      </div>

      {/* Main content */}
      <div className="flex items-start gap-4 px-5 py-3">
        {/* Photo */}
        <div
          className="w-20 h-20 rounded-xl overflow-hidden shrink-0 border-2"
          style={{ borderColor: `${color}66` }}
        >
          {member.user.avatar ? (
            <img src={member.user.avatar} alt={member.user.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-3xl font-bold text-white" style={{ backgroundColor: `${color}33` }}>
              {member.user.name.charAt(0).toUpperCase()}
            </div>
          )}
        </div>

        {/* Player info */}
        <div className="flex-1 min-w-0">
          <div className="text-white font-bold text-lg leading-tight truncate">{member.user.name}</div>
          <div className="text-sm mt-1" style={{ color }}>{member.team.name}</div>
          <div className="flex items-center gap-3 mt-2 text-gray-400 text-xs">
            <span className="font-bold text-white text-lg">#{member.number}</span>
            {member.position && <span>{member.position}</span>}
          </div>
        </div>

        {/* QR code */}
        <div className="shrink-0 bg-white p-1.5 rounded-lg">
          <QRCodeSVG value={verifyUrl} size={64} level="M" />
        </div>
      </div>

      {/* Team watermark */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-8xl font-black pointer-events-none select-none opacity-[0.03] whitespace-nowrap"
        style={{ color }}
      >
        {member.team.name}
      </div>

      {/* Bottom strip */}
      <div className="flex items-center justify-between px-5 py-3 border-t border-white/5">
        <span className="text-gray-600 text-xs font-mono">{member.id.slice(0, 8).toUpperCase()}</span>
        <div className="flex items-center gap-1">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-emerald-400 text-xs font-medium">ACTIVO</span>
        </div>
      </div>

      {/* Bottom color bar */}
      <div className="h-1 w-full" style={{ backgroundColor: color }} />
    </div>
  );
}
