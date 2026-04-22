import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const DEMO_PASSWORD = "pitazo2026";
const LEGACY_PASSWORD = "pass123456";

const legacyUsers = [
  {
    email: "organizador@test.com",
    phone: "+525500000011",
    name: "Orlando Organizador",
    role: ["ORGANIZER"],
    country: "MX",
    lang: "es",
  },
  {
    email: "jugador@test.com",
    phone: "+525500000012",
    name: "Javier Jugador",
    role: ["PLAYER"],
    country: "MX",
    lang: "es",
  },
  {
    email: "arbitro@test.com",
    phone: "+525500000013",
    name: "Ariadna Árbitro",
    role: ["REFEREE"],
    country: "MX",
    lang: "es",
  },
  {
    email: "multi@test.com",
    phone: "+525500000014",
    name: "Mónica Multi-rol",
    role: ["PLAYER", "REFEREE", "ORGANIZER"],
    country: "MX",
    lang: "es",
  },
];

const demoUsers = [
  {
    email: "organizador@elpitazo.app",
    phone: "+525500000001",
    name: "Carlos Organiza",
    role: ["ORGANIZER"],
    country: "MX",
    lang: "es",
  },
  {
    email: "arbitro@elpitazo.app",
    phone: "+525500000002",
    name: "Referee Martínez",
    role: ["REFEREE"],
    country: "MX",
    lang: "es",
  },
  {
    email: "jugador@elpitazo.app",
    phone: "+525500000003",
    name: "Gol Hernández",
    role: ["PLAYER"],
    country: "MX",
    lang: "es",
  },
  {
    email: "capitan@elpitazo.app",
    phone: "+525500000004",
    name: "Cap Torres",
    role: ["PLAYER"],
    country: "MX",
    lang: "es",
  },
];

async function upsertUser(u, hash) {
  const existing = await prisma.user.findFirst({
    where: { OR: [{ email: u.email }, { phone: u.phone }] },
  });
  if (existing) {
    await prisma.user.update({ where: { id: existing.id }, data: { ...u, password: hash } });
    console.log(`updated  ${u.email.padEnd(32)} [${u.role.join(",")}]`);
    return { ...existing, ...u };
  }
  const created = await prisma.user.create({ data: { ...u, password: hash } });
  console.log(`created  ${u.email.padEnd(32)} [${u.role.join(",")}]`);
  return created;
}

async function main() {
  const legacyHash = await bcrypt.hash(LEGACY_PASSWORD, 12);
  const demoHash = await bcrypt.hash(DEMO_PASSWORD, 12);

  console.log("\n=== Cuentas legacy (pass123456) ===");
  for (const u of legacyUsers) {
    await upsertUser(u, legacyHash);
  }

  console.log("\n=== Cuentas demo (pitazo2026) ===");
  const organizer = await upsertUser(demoUsers[0], demoHash);
  const arbitro = await upsertUser(demoUsers[1], demoHash);
  const jugador = await upsertUser(demoUsers[2], demoHash);
  const capitan = await upsertUser(demoUsers[3], demoHash);

  // Fetch fresh records to get UUIDs
  const organizadorRecord = await prisma.user.findUnique({ where: { email: "organizador@elpitazo.app" } });
  const arbitroRecord = await prisma.user.findUnique({ where: { email: "arbitro@elpitazo.app" } });
  const jugadorRecord = await prisma.user.findUnique({ where: { email: "jugador@elpitazo.app" } });
  const capitanRecord = await prisma.user.findUnique({ where: { email: "capitan@elpitazo.app" } });

  console.log("\n=== Torneo demo ===");

  // Upsert tournament
  let tournament = await prisma.tournament.findFirst({
    where: { name: "Liga Demo CDMX", creatorId: organizadorRecord.id },
  });
  if (!tournament) {
    tournament = await prisma.tournament.create({
      data: {
        name: "Liga Demo CDMX",
        description: "Torneo de demostración para El Pitazo — Liga amateur CDMX",
        type: "LEAGUE",
        maxTeams: 8,
        status: "ACTIVE",
        regFee: 500,
        currency: "MXN",
        fieldLocation: "CDMX",
        fieldAddress: "Ciudad de México",
        isPublic: true,
        creatorId: organizadorRecord.id,
      },
    });
    console.log(`created  tournament: ${tournament.name}`);
  } else {
    console.log(`exists   tournament: ${tournament.name}`);
  }

  // Upsert Team 1 — Tigres FC (capitán es Cap Torres)
  let team1 = await prisma.team.findFirst({ where: { tournamentId: tournament.id, name: "Tigres FC" } });
  if (!team1) {
    team1 = await prisma.team.create({
      data: {
        tournamentId: tournament.id,
        name: "Tigres FC",
        captainId: capitanRecord.id,
        colorHex: "#FF6B00",
        payAmount: 500,
        payStatus: "PAID",
        playersCount: 1,
      },
    });
    console.log(`created  team: ${team1.name}`);
  } else {
    console.log(`exists   team: ${team1.name}`);
  }

  // Upsert Team 2 — Leones CDMX (jugador)
  let team2 = await prisma.team.findFirst({ where: { tournamentId: tournament.id, name: "Leones CDMX" } });
  if (!team2) {
    team2 = await prisma.team.create({
      data: {
        tournamentId: tournament.id,
        name: "Leones CDMX",
        colorHex: "#1E90FF",
        payAmount: 500,
        payStatus: "PAID",
        playersCount: 1,
      },
    });
    console.log(`created  team: ${team2.name}`);
  } else {
    console.log(`exists   team: ${team2.name}`);
  }

  // Add capitán to team1
  await prisma.teamMember.upsert({
    where: { teamId_userId: { teamId: team1.id, userId: capitanRecord.id } },
    create: { teamId: team1.id, userId: capitanRecord.id, number: 10, position: "Delantero", isCaptain: true },
    update: {},
  });
  console.log(`upserted teamMember: Cap Torres → Tigres FC`);

  // Add jugador to team2
  await prisma.teamMember.upsert({
    where: { teamId_userId: { teamId: team2.id, userId: jugadorRecord.id } },
    create: { teamId: team2.id, userId: jugadorRecord.id, number: 9, position: "Delantero", isCaptain: false },
    update: {},
  });
  console.log(`upserted teamMember: Gol Hernández → Leones CDMX`);

  // Upsert BracketRound 1
  let round1 = await prisma.bracketRound.findFirst({ where: { tournamentId: tournament.id, roundNum: 1 } });
  if (!round1) {
    round1 = await prisma.bracketRound.create({
      data: { tournamentId: tournament.id, roundNum: 1, bracketType: "LEAGUE" },
    });
    console.log(`created  round: Jornada 1`);
  } else {
    console.log(`exists   round: Jornada 1`);
  }

  // Upsert match Tigres vs Leones with árbitro assigned
  let match = await prisma.bracketMatch.findFirst({
    where: { roundId: round1.id, homeTeamId: team1.id, awayTeamId: team2.id },
  });
  if (!match) {
    match = await prisma.bracketMatch.create({
      data: {
        roundId: round1.id,
        homeTeamId: team1.id,
        awayTeamId: team2.id,
        refereeId: arbitroRecord.id,
        status: "SCHEDULED",
        scheduledAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week from now
      },
    });
    console.log(`created  match: Tigres FC vs Leones CDMX (árbitro: Referee Martínez)`);
  } else {
    console.log(`exists   match: Tigres FC vs Leones CDMX`);
  }

  // Upsert referee assignment
  await prisma.refereeAssignment.upsert({
    where: { matchId: match.id },
    create: { matchId: match.id, refereeId: arbitroRecord.id, status: "assigned" },
    update: {},
  });
  console.log(`upserted refereeAssignment: Referee Martínez → partido demo`);

  const total = await prisma.user.count();
  console.log(`\n✅ Seed completo. Total usuarios en DB: ${total}`);
  console.log(`   Cuentas demo     → pass: ${DEMO_PASSWORD}`);
  console.log(`   Cuentas legacy   → pass: ${LEGACY_PASSWORD}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
