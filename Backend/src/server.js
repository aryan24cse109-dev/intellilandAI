const app = require("./app");
const env = require("./config/env");
const { testDatabaseConnection } = require("./config/db");

const startServer = async () => {
  try {
    // Verify database connection before starting the server
    await testDatabaseConnection();

    app.listen(env.port, "0.0.0.0", () => {
      console.log(`🚀 IntelliLandAI Backend running on port ${env.port}`);
      console.log(`🌐 Server listening on 0.0.0.0:${env.port}`);
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error.message);
    process.exit(1);
  }
};

startServer();