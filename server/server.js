import express from "express";
import cors from "cors";
import "./src/firebase.js";
import usersRouter from "./src/routes/users.js";
import attendanceRouter from "./src/routes/attendance.js";
import summaryRouter from "./src/routes/summary.js";
import adminRouter from "./src/routes/admin.js";

const app = express();
const port = Number(process.env.PORT) || 4000;

const allowedOrigins = [
  ...(process.env.CORS_ORIGIN?.split(",") ?? []),
  ...(process.env.CORS_ORIGIN2?.split(",") ?? []),
]
  .map((o) => o.trim().replace(/\/+$/, ""))
  .filter(Boolean);

app.use(
  cors({
    origin: allowedOrigins.length
      ? (origin, callback) => {
          if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
          } else {
            callback(new Error(`CORS: origin '${origin}' not allowed`));
          }
        }
      : true,
    credentials: true,
  }),
);
app.use(express.json());

app.get("/", (req, res) => {
  res.json({ message: "mini-hcm API is running" });
});

app.get("/api/health", (req, res) => {
  res.json({ ok: true });
});

app.use("/api/users", usersRouter);
app.use("/api/attendance", attendanceRouter);
app.use("/api/summary", summaryRouter);
app.use("/api/admin", adminRouter);

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
});

if (!process.env.VERCEL) {
  app.listen(port, () => {
    console.log(`mini-hcm API listening on http://localhost:${port}`);
  });
} else {
  console.log("mini-hcm API running in Vercel serverless mode");
}

export default app;
