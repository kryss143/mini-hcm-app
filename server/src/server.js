import express from "express";
import cors from "cors";
import "./firebase.js";
import usersRouter from "./routes/users.js";
import attendanceRouter from "./routes/attendance.js";
import summaryRouter from "./routes/summary.js";
import adminRouter from "./routes/admin.js";

const app = express();
const port = Number(process.env.PORT) || 4000;

const allowedOrigins = [
  ...(process.env.CORS_ORIGIN?.split(",") ?? []),
  ...(process.env.CORS_ORIGIN2?.split(",") ?? []),
]
  .map((o) => o.trim())
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
app.listen(port, () => {
  console.log(`mini-hcm API listening on http://localhost:${port}`);
});
