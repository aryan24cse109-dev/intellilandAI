const dotenv = require("dotenv");

dotenv.config();

const env = {
  port: process.env.PORT || 5000,

  database: {
    host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT) || 5432,
    name: process.env.DB_NAME || "intelliland",
    user: process.env.DB_USER || "postgres",
    password: process.env.DB_PASSWORD,
  },

  aiServiceUrl: process.env.AI_SERVICE_URL || "http://localhost:8000",
};

module.exports = env;