const { Pool } = require("pg");
const env = require("./env");

const pool = new Pool({
  host: env.database.host,
  port: env.database.port,
  database: env.database.name,
  user: env.database.user,
  password: env.database.password,
});

pool.on("connect", () => {
  console.log("✅ PostgreSQL connected");
});

pool.on("error", (error) => {
  console.error("❌ Unexpected PostgreSQL error:", error.message);
});

const testDatabaseConnection = async () => {
  try {
    const result = await pool.query("SELECT NOW()");
    console.log("✅ Database connection verified:", result.rows[0].now);
  } catch (error) {
    console.error("❌ Database connection failed:", error.message);
    throw error;
  }
};

module.exports = {
  pool,
  testDatabaseConnection,
};