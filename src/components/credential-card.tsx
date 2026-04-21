import { QRCodeSVG } from "qrcode.react";

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
  const teamColor = member.team.colorHex || "#39FF14";
  const verifyUrl = `${baseUrl}/verify/${member.id}`;

  return (
    <div
      className="relative w-full max-w-sm mx-auto rounded-2xl overflow-hidden select-none"
      style={{
        background: "linear-gradient(145deg, #111 0%, #0a0a0a 40%, #111 100%)",
        border: `1px solid ${teamColor}44`,
        boxShadow: `0 0 0 1px ${teamColor}22, 0 20px 60px rgba(0,0,0,0.8), 0 0 30px ${teamColor}15`,
      }}
    >
      {/* Holographic shimmer layer */}
      <div className="absolute inset-0 shimmer-holo pointer-events-none z-10" />

      {/* Top color bar — team color with neon glow */}
      <div
        className="h-1 w-full"
        style={{
          backgroundColor: teamColor,
          boxShadow: `0 0 12px ${teamColor}, 0 0 4px ${teamColor}`,
        }}
      />

      {/* Header */}
      <div className="relative flex items-center justify-between px-5 pt-4 pb-2 z-20">
        <div className="flex items-center gap-2">
          <span className="text-xs font-black uppercase tracking-[0.2em] text-white font-display">EL PITAZO</span>
        </div>
        <div className="flex flex-col items-end">
          <span className="text-[10px] text-gray-600 uppercase tracking-widest font-display">TORNEO</span>
          <span className="text-[10px] text-gray-400 font-display truncate max-w-[120px]">{member.team.tournament.name}</span>
        </div>
      </div>

      {/* Main content */}
      <div className="relative flex items-start gap-4 px-5 py-4 z-20">
        {/* Photo */}
        <div
          className="relative w-24 h-24 rounded-xl overflow-hidden shrink-0"
          style={{
            border: `2px solid ${teamColor}`,
            boxShadow: `0 0 12px ${teamColor}44`,
          }}
        >
          {member.user.avatar ? (
            <img src={member.user.avatar} alt={member.user.name} className="w-full h-full object-cover" />
          ) : (
            <div
              className="w-full h-full flex items-center justify-center font-black text-3xl font-display"
              style={{ backgroundColor: `${teamColor}22`, color: teamColor }}
            >
              {member.user.name.charAt(0).toUpperCase()}
            </div>
          )}
          {/* Number badge */}
          <div
            className="absolute bottom-0 right-0 w-7 h-7 flex items-center justify-center rounded-tl-lg font-black text-sm font-display"
            style={{ backgroundColor: teamColor, color: teamColor === "#39FF14" ? "#000" : "#fff" }}
          >
            {member.number}
          </div>
        </div>

        {/* Player info */}
        <div className="flex-1 min-w-0">
          <div className="text-gray-500 text-[10px] uppercase tracking-widest font-display mb-0.5">JUGADOR</div>
          <div className="font-display font-black text-xl uppercase text-white leading-tight truncate">
            {member.user.name}
          </div>
          <div
            className="font-display font-bold text-sm uppercase mt-1 truncate"
            style={{ color: teamColor }}
          >
            {member.team.name}
          </div>
          {member.position && (
            <div className="text-gray-500 text-xs uppercase tracking-widest font-display mt-1">{member.position}</div>
          )}

          {/* Active pill */}
          <div className="flex items-center gap-1.5 mt-3">
            <span
              className="w-1.5 h-1.5 rounded-full animate-pulse"
              style={{ backgroundColor: "#39FF14", boxShadow: "0 0 4px #39FF14" }}
            />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] font-display" style={{ color: "#39FF14" }}>
              ACTIVO
            </span>
          </div>
        </div>

        {/* QR code */}
        <div
          className="shrink-0 p-1.5 rounded-xl"
          style={{
            background: "#fff",
            boxShadow: `0 0 16px ${teamColor}44`,
          }}
        >
          <QRCodeSVG value={verifyUrl} size={72} level="M" />
          <div className="text-center mt-1 text-[9px] text-gray-500 font-mono">SCAN TO VERIFY</div>
        </div>
      </div>

      {/* Team watermark */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none select-none whitespace-nowrap font-display font-black text-[6rem] uppercase z-0 leading-none"
        style={{ color: teamColor, opacity: 0.03, letterSpacing: "-0.02em" }}
      >
        {member.team.name}
      </div>

      {/* Bottom strip */}
      <div className="relative flex items-center justify-between px-5 py-3 border-t z-20" style={{ borderColor: `${teamColor}22` }}>
        <span className="text-gray-700 text-[10px] font-mono tracking-widest">
          {member.id.slice(0, 8).toUpperCase()}
        </span>
        <div className="flex items-center gap-2">
          <span className="text-gray-600 text-[10px] font-display uppercase tracking-widest">ACCESO VERIFICADO</span>
          {/* Mini barcode decoration */}
          <div className="flex gap-[2px]">
            {[3,6,4,7,2,5,4,6,3,5,2].map((h, i) => (
              <div key={i} className="w-[2px] rounded-sm" style={{ height: `${h * 2}px`, backgroundColor: teamColor, opacity: 0.6 }} />
            ))}
          </div>
        </div>
      </div>

      {/* Bottom color bar */}
      <div className="h-0.5 w-full" style={{ backgroundColor: teamColor, boxShadow: `0 0 8px ${teamColor}` }} />
    </div>
  );
}
