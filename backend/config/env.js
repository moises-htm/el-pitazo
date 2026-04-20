require("dotenv").config();
module.exports = {
  port: process.env.PORT || 3001,
  databaseUrl: process.env.DATABASE_URL,
  stripeKey: process.env.STRIPE_SECRET_KEY || "",
  mpPublicKey: process.env.MP_PUBLIC_KEY || "",
  mpSecretKey: process.env.MP_SECRET_KEY || "",
  jwtSecret: process.env.JWT_SECRET || "el-pitazo-secret-change-me",
  stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET || "",
  mpWebhookSecret: process.env.MP_WEBHOOK_SECRET || "",
  redisUrl: process.env.REDIS_URL || "",
  s3Bucket: process.env.S3_BUCKET || "",
  s3Region: process.env.S3_REGION || "us-east-1",
  s3AccessKey: process.env.S3_ACCESS_KEY || "",
  s3SecretKey: process.env.S3_SECRET_KEY || "",
};
