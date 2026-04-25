import http from "k6/http";
import { check, sleep } from "k6";

export const options = {
  stages: [
    { duration: "30s", target: 20 },
    { duration: "1m",  target: 20 },
    { duration: "30s", target: 0 },
  ],
  thresholds: {
    http_req_duration: ["p(95)<500"],
    http_req_failed:   ["rate<0.01"],
  },
};

const BASE  = __ENV.BASE_URL || "https://elpitazo.app";
const TOKEN = __ENV.TOKEN    || "";

export default function () {
  // --- Public endpoints ---
  const r1 = http.get(`${BASE}/api/health`);
  check(r1, { "health 200": (r) => r.status === 200 });

  const r2 = http.get(`${BASE}/api/tournaments/search?q=liga&limit=10`);
  check(r2, { "search 200": (r) => r.status === 200 });

  // --- Authenticated endpoints ---
  if (TOKEN) {
    const headers = {
      Authorization: `Bearer ${TOKEN}`,
      "Content-Type": "application/json",
    };
    const r3 = http.get(`${BASE}/api/player/stats`, { headers });
    check(r3, { "stats ok": (r) => r.status === 200 || r.status === 404 });

    const r4 = http.get(`${BASE}/api/player/tournaments`, { headers });
    check(r4, { "player tournaments ok": (r) => r.status === 200 });
  }

  sleep(1);
}
