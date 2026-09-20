const app = require("./app");
const env = require("./config/env");
const { testDatabaseConnection } = require("./config/db");

const startServer = async () => {
  try {
    // Verify database connection before starting the server
    await testDatabaseConnection();

    const server = app.listen(env.port, "0.0.0.0", () => {
      console.log(`🚀 IntelliLandAI Backend running on port ${env.port}`);
      console.log(`🌐 Server listening on 0.0.0.0:${env.port}`);
    });

    // Render: prevent intermittent 502 / connection reset issues
    server.keepAliveTimeout = 120000;
    server.headersTimeout = 120000;

  } catch (error) {
    console.error("❌ Failed to start server:", error.message);
    process.exit(1);
  }
};

startServer();
