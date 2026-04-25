/**
 * k6 load test for El Pitazo
 *
 * Install k6: https://k6.io/docs/get-started/installation/
 * Run:
 *   BASE_URL=https://elpitazo.app k6 run scripts/load-test.js
 *   k6 run --vus 20 --duration 30s scripts/load-test.js
 */
import http from "k6/http";
import { check, sleep } from "k6";
import { Rate, Trend } from "k6/metrics";

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------
const BASE_URL = __ENV.BASE_URL || "http://localhost:3000";

// Test credentials — use seeded dev users
const TEST_EMAIL = __ENV.TEST_EMAIL || "admin@test.com";
const TEST_PASS  = __ENV.TEST_PASS  || "pass123456";

// ---------------------------------------------------------------------------
// Custom metrics
// ---------------------------------------------------------------------------
const loginErrors     = new Rate("login_errors");
const tournamentErrors = new Rate("tournament_errors");
const joinTeamErrors  = new Rate("join_team_errors");
const loginDuration   = new Trend("login_duration_ms", true);

// ---------------------------------------------------------------------------
// k6 options
// ---------------------------------------------------------------------------
export const options = {
  stages: [
    { duration: "15s", target: 10 },  // ramp up
    { duration: "30s", target: 20 },  // sustained load
    { duration: "15s", target: 0  },  // ramp down
  ],
  thresholds: {
    http_req_duration: ["p(95)<3000"],
    login_errors:      ["rate<0.05"],
    tournament_errors: ["rate<0.05"],
    join_team_errors:  ["rate<0.10"],
  },
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function jsonHeaders(token) {
  const h = { "Content-Type": "application/json" };
  if (token) h["Authorization"] = `Bearer ${token}`;
  return h;
}

// ---------------------------------------------------------------------------
// Default scenario
// ---------------------------------------------------------------------------
export default function () {
  // ── 1. Login ──────────────────────────────────────────────────────────────
  const loginStart = Date.now();
  const loginRes = http.post(
    `${BASE_URL}/api/auth/login`,
    JSON.stringify({ email: TEST_EMAIL, password: TEST_PASS }),
    { headers: jsonHeaders(null), tags: { name: "login" } },
  );
  loginDuration.add(Date.now() - loginStart);

  const loginOk = check(loginRes, {
    "login 200":       (r) => r.status === 200,
    "login has token": (r) => {
      try { return !!JSON.parse(r.body).token; } catch { return false; }
    },
  });
  loginErrors.add(!loginOk);

  if (!loginOk) {
    sleep(1);
    return;
  }

  let token;
  try { token = JSON.parse(loginRes.body).token; } catch { sleep(1); return; }

  sleep(0.5);

  // ── 2. Browse tournaments ─────────────────────────────────────────────────
  const tournamentsRes = http.get(
    `${BASE_URL}/api/tournaments?status=ACTIVE&limit=10`,
    { headers: jsonHeaders(token), tags: { name: "browse_tournaments" } },
  );

  const tournamentsOk = check(tournamentsRes, {
    "tournaments 200":   (r) => r.status === 200,
    "tournaments array": (r) => {
      try { return Array.isArray(JSON.parse(r.body)); } catch { return false; }
    },
  });
  tournamentErrors.add(!tournamentsOk);

  sleep(0.5);

  // ── 3. Get single tournament detail ───────────────────────────────────────
  let firstTournamentId = null;
  try {
    const list = JSON.parse(tournamentsRes.body);
    if (Array.isArray(list) && list.length > 0) firstTournamentId = list[0].id;
  } catch { /* no-op */ }

  if (firstTournamentId) {
    const detailRes = http.get(
      `${BASE_URL}/api/tournaments/${firstTournamentId}`,
      { headers: jsonHeaders(token), tags: { name: "tournament_detail" } },
    );
    check(detailRes, {
      "tournament detail 200": (r) => r.status === 200,
    });
    sleep(0.5);
  }

  // ── 4. Attempt to join a team (will 4xx if no open teams — that's fine) ───
  if (firstTournamentId) {
    const joinRes = http.post(
      `${BASE_URL}/api/tournaments/${firstTournamentId}/teams/join`,
      JSON.stringify({ tournamentId: firstTournamentId }),
      { headers: jsonHeaders(token), tags: { name: "join_team" } },
    );

    // 200 = joined, 400/404/409 = expected business errors
    const joinOk = check(joinRes, {
      "join team not 5xx": (r) => r.status < 500,
    });
    joinTeamErrors.add(!joinOk);
  }

  sleep(1);
}
