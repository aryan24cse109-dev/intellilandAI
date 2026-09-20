const express = require("express");
const cors = require("cors");

const { authenticate } = require("./middleware/auth.middleware");
const { authorizeRoles } = require("./middleware/role.middleware");
const { errorHandler } = require("./middleware/error.middleware");

const authRoutes = require("./routes/auth.routes");
const documentRoutes = require("./routes/document.routes");
const landRecordRoutes = require("./routes/landRecord.routes");
const validationRoutes = require("./routes/validation.routes");
const verificationRoutes = require("./routes/verification.routes");
const parcelRoutes = require("./routes/parcel.routes");
const auditRoutes = require("./routes/audit.routes");
const dashboardRoutes = require("./routes/dashboard.routes");

const app = express();

/*
|--------------------------------------------------------------------------
| Global Middleware
|--------------------------------------------------------------------------
*/

const allowedOrigins = [
  "https://intelliland.vercel.app",
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) {
        return callback(null, true);
      }

      const isProductionVercel =
        origin === "https://intelliland.vercel.app";

      const isVercelDeployment =
        /^https:\/\/intelliland-[a-z0-9]+-bhumatrix\.vercel\.app$/.test(origin);

      if (isProductionVercel || isVercelDeployment) {
        return callback(null, true);
      }

      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/*
|--------------------------------------------------------------------------
| Public Routes
|--------------------------------------------------------------------------
*/

app.get("/api/health", (req, res) => {
  return res.status(200).json({
    success: true,
    message: "IntelliLandAI Backend is running",
  });
});

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

app.use("/api/auth", authRoutes);
app.use("/api/documents", documentRoutes);
app.use("/api/land-records", landRecordRoutes);
app.use("/api/validation", validationRoutes);
app.use("/api/verification", verificationRoutes);
app.use("/api/parcels", parcelRoutes);
app.use("/api/audit", auditRoutes);
app.use("/api/dashboard", dashboardRoutes);

/*
|--------------------------------------------------------------------------
| Protected Test Route
|--------------------------------------------------------------------------
*/

app.get(
  "/api/admin/test",
  authenticate,
  authorizeRoles("ADMIN"),
  (req, res) => {
    return res.status(200).json({
      success: true,
      message: "Admin route is working",
      user: req.user,
    });
  }
);

/*
|--------------------------------------------------------------------------
| Current User
|--------------------------------------------------------------------------
*/

app.get(
  "/api/auth/me",
  authenticate,
  (req, res) => {
    return res.status(200).json({
      success: true,
      user: req.user,
    });
  }
);

/*
|--------------------------------------------------------------------------
| Error Handler
|--------------------------------------------------------------------------
*/

app.use(errorHandler);

module.exports = app;
