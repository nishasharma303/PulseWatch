import "dotenv/config";
import http from "http";
import express from "express";
import cors from "cors";
import { authRouter } from "./api/routes/auth";
import { watchlistRouter } from "./api/routes/watchlist";
import { attentionRouter } from "./api/routes/attention";
import { timelineRouter } from "./api/routes/timeline";
import { awayRouter } from "./api/routes/away";
import { feedbackRouter } from "./api/routes/feedback";
import { historyRouter } from "./api/routes/history";
import { devRouter } from "./api/routes/dev";
import { chatRouter } from "./api/routes/chat";
import { portfolioRouter } from "./api/routes/portfolio";
import { trendRouter } from "./api/routes/trend";
import { initWsHub } from "./ws/hub";
import { startPoller } from "./ingestion/poller";

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/auth", authRouter);
app.use("/api/watchlists", watchlistRouter);
app.use("/api/attention", attentionRouter);
app.use("/api/timeline", timelineRouter);
app.use("/api/away", awayRouter);
app.use("/api/feedback", feedbackRouter);
app.use("/api/history", historyRouter);
app.use("/api/dev", devRouter);
app.use("/api/chat", chatRouter);
app.use("/api/portfolio", portfolioRouter);
app.use("/api/trend", trendRouter);

app.get("/health", (_req, res) => res.json({ ok: true }));

const server = http.createServer(app);
initWsHub(server);

const PORT = process.env.PORT ?? 4000;
server.listen(PORT, () => {
  console.log(`PulseWatch API + WS listening on :${PORT}`);
  startPoller();
});