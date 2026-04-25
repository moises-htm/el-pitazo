# Load Testing — El Pitazo

Uses [k6](https://k6.io).

## Install

```bash
brew install k6        # macOS
choco install k6       # Windows
```

## Run against staging

```bash
BASE_URL=https://elpitazo.vercel.app TOKEN=<jwt> k6 run k6/load-test.js
```

## Run against local

```bash
BASE_URL=http://localhost:3000 k6 run k6/load-test.js
```

## Thresholds

- p95 response time < 500 ms  
- Error rate < 1%

## Getting a TOKEN

1. `POST /api/auth/login` with test credentials  
2. Copy the `token` from the JSON response  
3. Pass as `TOKEN=<value>` env var
