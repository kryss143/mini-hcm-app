import express from "express";
import cors from "cors";
import "./firebase.js";
import usersRouter from "./routes/users.js";
import attendanceRouter from "./routes/attendance.js";
import summaryRouter from "./routes/summary.js";
import adminRouter from "./routes/admin.js";

const app = express();
const port = Number(process.env.PORT) || 4000;
app.use(
  cors({
    origin: process.env.CORS_ORIGIN?.split(",") || true,
    credentials: true,
  }),
);
app.use(express.json());
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
