const app = require("./app");
const env = require("./config/env");
const { testDatabaseConnection } = require("./config/db");

const startServer = async () => {
  try {
    // Verify database connection before starting the server
    await testDatabaseConnection();

    app.listen(env.port, () => {
      console.log(`🚀 IntelliLandAI Backend running on port ${env.port}`);
      console.log(`🌐 http://localhost:${env.port}`);
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error.message);
    process.exit(1);
  }
};

startServer();