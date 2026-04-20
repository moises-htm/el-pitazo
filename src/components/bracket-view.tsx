import { Trophy, MapPin, Clock, Users, ChevronDown, ChevronRight, Star } from "lucide-react";

export function BracketView() {
  // Mock bracket data — connected to real API later
  const rounds = [
    {
      name: "Semifinales",
      matches: [
        { home: "Los Gallos", away: "Los Leones", homeScore: 2, awayScore: 1, status: "COMPLETED" },
        { home: "Los Rayados", away: "Los Tigres", homeScore: null, awayScore: null, status: "SCHEDULED" },
      ],
    },
    {
      name: "Final",
      matches: [
        { home: "Por definir", away: "Por definir", homeScore: null, awayScore: null, status: "SCHEDULED" },
      ],
    },
  ];

  return (
    <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
      <h2 className="text-white font-bold text-lg mb-4">Cuadro del Torneo</h2>

      <div className="space-y-8">
        {rounds.map((round, rIdx) => (
          <div key={rIdx}>
            <h3 className="text-blue-300 text-sm font-semibold mb-3 uppercase tracking-wider">{round.name}</h3>
            <div className="space-y-3">
              {round.matches.map((match, mIdx) => (
                <div key={mIdx} className={`bg-white/5 rounded-xl p-4 border ${match.status === "COMPLETED" ? "border-green-500/30" : "border-white/10"}`}>
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className={`font-semibold ${match.homeScore !== null && match.homeScore > (match.awayScore || 0) ? "text-white" : "text-gray-300"}`}>
                        {match.home}
                      </div>
                      <div className={`font-semibold ${match.awayScore !== null && match.awayScore > (match.homeScore || 0) ? "text-white" : "text-gray-300"}`}>
                        {match.away}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-bold text-white w-8 text-center">{match.homeScore ?? '-'}</span>
                      <span className="text-gray-500">-</span>
                      <span className="text-2xl font-bold text-white w-8 text-center">{match.awayScore ?? '-'}</span>
                    </div>
                  </div>
                  <div className="mt-2 text-xs text-gray-500 flex items-center gap-2">
                    <Clock size={12} />
                    {match.status === "COMPLETED" ? "Finalizado" : "Próximo partido"}
                  </div>
                </div>
              ))}
            </div>
            {rIdx < rounds.length - 1 && (
              <div className="flex justify-center my-4">
                <ChevronDown size={24} className="text-blue-400" />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
