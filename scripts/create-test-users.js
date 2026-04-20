require("dotenv").config();
const bcrypt = require("bcryptjs");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  console.log("🏟️ Creating test users for El Pitazo...\n");

  // Password hash
  const passwordHash = await bcrypt.hash("123456", 12);

  // Helper to create user
  const createUser = async (data) => {
    const user = await prisma.user.create({ data });
    console.log(`  ✅ ${data.name} — ${data.role.join(", ")} — ${data.phone || data.email}`);
    return user;
  };

  // Create test users
  console.log("Creating players...");
  await createUser({
    phone: "+525512345678",
    password: passwordHash,
    name: "Carlos Hernández",
    role: ["PLAYER"],
    country: "MX",
    lang: "es",
  });

  await createUser({
    phone: "+525598765432",
    password: passwordHash,
    name: "Miguel Torres",
    role: ["PLAYER"],
    country: "MX",
    lang: "es",
  });

  console.log("\nCreating referees...");
  await createUser({
    phone: "+525511112222",
    password: passwordHash,
    name: "Diego Ramírez",
    role: ["REFEREE"],
    country: "MX",
    lang: "es",
  });

  await createUser({
    phone: "+525533334444",
    password: passwordHash,
    name: "Roberto Morales",
    role: ["REFEREE"],
    country: "MX",
    lang: "es",
  });

  console.log("\nCreating organizers...");
  await createUser({
    phone: "+52555556666",
    password: passwordHash,
    name: "Ana García",
    role: ["ORGANIZER"],
    country: "MX",
    lang: "es",
  });

  await createUser({
    phone: "+525577778888",
    password: passwordHash,
    name: "Luis Martínez",
    role: ["ORGANIZER"],
    country: "MX",
    lang: "es",
  });

  console.log("\nCreating a multi-role user...");
  await createUser({
    phone: "+525599990000",
    password: passwordHash,
    name: "Moises (Owner)",
    role: ["PLAYER", "REFEREE", "ORGANIZER"],
    country: "MX",
    lang: "es",
  });

  // Also create a test tournament
  console.log("\nCreating test tournament...");
  const organizer = await prisma.user.findFirst({ where: { name: "Ana García" } });
  const tournament = await prisma.tournament.create({
    data: {
      name: "Torneo Barrenderos CDMX",
      description: "Torneo amistoso de fútbol amateur en la CDMX",
      type: "KNOCKOUT",
      maxTeams: 16,
      startDate: new Date("2026-04-25T09:00:00Z"),
      endDate: new Date("2026-05-05T20:00:00Z"),
      fieldLocation: "Campo Universitario",
      fieldAddress: "Av. Universidad 123, CDMX",
      fieldLat: 19.3276,
      fieldLng: -99.1844,
      regFee: 500,
      currency: "MXN",
      isPublic: true,
      status: "ACTIVE",
      creatorId: organizer.id,
    },
  });
  console.log(`  ✅ Torneo creado: ${tournament.name} (ID: ${tournament.id})`);

  // Create some test teams
  const teams = await Promise.all([
    prisma.team.create({ data: { tournamentId: tournament.id, name: "Los Gallos", payAmount: 500, payStatus: "PAID", colorHex: "#3B82F6", captainId: (await prisma.user.findFirst({ where: { name: "Carlos Hernández" } })).id } }),
    prisma.team.create({ data: { tournamentId: tournament.id, name: "Los Leones", payAmount: 500, payStatus: "PAID", colorHex: "#EF4444", captainId: (await prisma.user.findFirst({ where: { name: "Miguel Torres" } })).id } }),
  ]);
  console.log(`  ✅ Equipos creados: ${teams.map(t => t.name).join(", ")}`);

  console.log("\n✅ All done! Here's your test credentials:\n");
  console.log("═══════════════════════════════════════════════════");
  console.log("  ⚽ JUGADOR — Carlos Hernández");
  console.log("  📱 Phone: +525512345678");
  console.log("  🔑 Password: 123456");
  console.log("");
  console.log("  ⚽ JUGADOR — Miguel Torres");
  console.log("  📱 Phone: +525598765432");
  console.log("  🔑 Password: 123456");
  console.log("");
  console.log("  🟨 ÁRBITRO — Diego Ramírez");
  console.log("  📱 Phone: +525511112222");
  console.log("  🔑 Password: 123456");
  console.log("");
  console.log("  🟨 ÁRBITRO — Roberto Morales");
  console.log("  📱 Phone: +525533334444");
  console.log("  🔑 Password: 123456");
  console.log("");
  console.log("  👔 ORGANIZADOR — Ana García");
  console.log("  📱 Phone: +52555556666");
  console.log("  🔑 Password: 123456");
  console.log("");
  console.log("  👔 ORGANIZADOR — Luis Martínez");
  console.log("  📱 Phone: +525577778888");
  console.log("  🔑 Password: 123456");
  console.log("");
  console.log("  ⚽🟨👔 MULTI-ROL — Moises (Owner)");
  console.log("  📱 Phone: +525599990000");
  console.log("  🔑 Password: 123456");
  console.log("");
  console.log("═══════════════════════════════════════════════════");
  console.log("\n🌐 Frontend: http://localhost:3000");
  console.log("🔌 Backend: http://localhost:3001");
}

main()
  .catch((e) => {
    console.error("❌ Error:", e.message);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
