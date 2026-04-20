const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { prisma, jwtSecret } = require("../middleware/auth");
const { z } = require("zod");
const router = express.Router();

const registerSchema = z.object({
  phone: z.string().optional(),
  email: z.string().email().optional(),
  password: z.string().min(6),
  name: z.string().min(1),
  role: z.enum(["PLAYER", "REFEREE", "ORGANIZER"]).array(),
  country: z.string().default("MX"),
  lang: z.string().default("es"),
});

router.post("/register", async (req, res) => {
  try {
    const data = registerSchema.parse(req.body);
    if (!data.phone && !data.email) {
      return res.status(400).json({ error: "Need phone or email" });
    }
    const hash = await bcrypt.hash(data.password, 12);
    const user = await prisma.user.create({
      data: {
        phone: data.phone,
        email: data.email,
        password: hash,
        name: data.name,
        role: data.role,
        country: data.country,
        lang: data.lang,
      },
    });
    const token = jwt.sign({ userId: user.id }, jwtSecret, { expiresIn: "7d" });
    res.json({ user: { id: user.id, phone: user.phone, email: user.email, name: user.name, role: user.role, country: user.country, lang: user.lang }, token });
  } catch (err) {
    res.status(400).json({ error: err.errors || err.message });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { phone, email, password } = req.body;
    const user = await prisma.user.findFirst({
      where: {
        OR: [{ phone }, { email }],
      },
    });
    if (!user) return res.status(401).json({ error: "Invalid credentials" });
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ error: "Invalid credentials" });
    const token = jwt.sign({ userId: user.id }, jwtSecret, { expiresIn: "7d" });
    res.json({ user: { id: user.id, phone: user.phone, email: user.email, name: user.name, role: user.role, country: user.country, lang: user.lang }, token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/me", async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { id: true, phone: true, email: true, name: true, role: true, country: true, lang: true, rating: true, createdAt: true },
    });
    res.json({ user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put("/me", async (req, res) => {
  try {
    const { name, phone, email, lang } = req.body;
    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: { name, phone, email, lang },
      select: { id: true, phone: true, email: true, name: true, role: true, country: true, lang: true },
    });
    res.json({ user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
