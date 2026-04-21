import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const users = [
  {
    email: "organizador@test.com",
    phone: "+525500000001",
    name: "Orlando Organizador",
    role: ["ORGANIZER"],
    country: "MX",
    lang: "es",
  },
  {
    email: "jugador@test.com",
    phone: "+525500000002",
    name: "Javier Jugador",
    role: ["PLAYER"],
    country: "MX",
    lang: "es",
  },
  {
    email: "arbitro@test.com",
    phone: "+525500000003",
    name: "Ariadna Árbitro",
    role: ["REFEREE"],
    country: "MX",
    lang: "es",
  },
  {
    email: "multi@test.com",
    phone: "+525500000004",
    name: "Mónica Multi-rol",
    role: ["PLAYER", "REFEREE", "ORGANIZER"],
    country: "MX",
    lang: "es",
  },
];

const PASSWORD = "pass123456";

async function main() {
  const hash = await bcrypt.hash(PASSWORD, 12);

  for (const u of users) {
    const existing = await prisma.user.findFirst({
      where: { OR: [{ email: u.email }, { phone: u.phone }] },
    });

    if (existing) {
      await prisma.user.update({
        where: { id: existing.id },
        data: { ...u, password: hash },
      });
      console.log(`updated  ${u.email.padEnd(28)} [${u.role.join(",")}]`);
    } else {
      await prisma.user.create({ data: { ...u, password: hash } });
      console.log(`created  ${u.email.padEnd(28)} [${u.role.join(",")}]`);
    }
  }

  const total = await prisma.user.count();
  console.log(`\nDone. Total users in DB: ${total}`);
  console.log(`All test users password: ${PASSWORD}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
