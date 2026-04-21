import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { CheckCircle, XCircle, Shield } from "lucide-react";

export default function VerifyPage() {
  const router = useRouter();
  const { memberId } = router.query as { memberId: string };
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!memberId) return;
    fetch(`/api/verify/${memberId}`)
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); });
  }, [memberId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const eligible = data?.eligible;
  const member = data?.member;
  const color = member?.team?.colorHex || "#3B82F6";

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Header */}
        <div className="flex items-center justify-center gap-2 mb-6">
          <Shield size={20} className="text-gray-500" />
          <span className="text-gray-500 text-sm font-bold uppercase tracking-wider">El Pitazo · Verificación</span>
        </div>

        {eligible && member ? (
          <div className="bg-gray-900 rounded-2xl overflow-hidden border-2" style={{ borderColor: color }}>
            {/* Color bar */}
            <div className="h-2" style={{ backgroundColor: color }} />

            {/* Photo */}
            <div className="flex justify-center pt-6 pb-4">
              <div className="w-28 h-28 rounded-full overflow-hidden border-4" style={{ borderColor: color }}>
                {member.user.avatar ? (
                  <img src={member.user.avatar} alt={member.user.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-4xl font-bold text-white" style={{ backgroundColor: `${color}33` }}>
                    {member.user.name.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
            </div>

            {/* Status badge */}
            <div className="flex justify-center mb-4">
              <div className="flex items-center gap-2 bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 px-4 py-1.5 rounded-full text-sm font-bold">
                <CheckCircle size={16} />
                JUGADOR ELEGIBLE
              </div>
            </div>

            {/* Player info */}
            <div className="text-center px-6 pb-6">
              <h1 className="text-white text-2xl font-bold">{member.user.name}</h1>
              <p className="text-gray-400 mt-1" style={{ color }}>{member.team.name}</p>
              <div className="flex items-center justify-center gap-4 mt-3 text-sm text-gray-400">
                <span className="font-bold text-white text-xl">#{member.number}</span>
                {member.position && <span>{member.position}</span>}
              </div>
              <div className="mt-3 pt-3 border-t border-white/10">
                <p className="text-gray-500 text-xs">{member.tournament.name}</p>
              </div>
            </div>

            <div className="h-2" style={{ backgroundColor: color }} />
          </div>
        ) : (
          <div className="bg-gray-900 rounded-2xl p-8 border-2 border-red-500/40 text-center">
            <XCircle size={64} className="mx-auto text-red-500 mb-4" />
            <h2 className="text-white text-xl font-bold mb-2">No registrado</h2>
            <p className="text-gray-400 text-sm">{data?.error || "Este jugador no está registrado o la credencial no es válida"}</p>
          </div>
        )}

        <p className="text-center text-gray-600 text-xs mt-4">
          Verificado el {new Date().toLocaleString("es-MX")}
        </p>
      </div>
    </div>
  );
}
