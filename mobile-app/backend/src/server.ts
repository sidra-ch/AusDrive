import express, { Express } from "express";
import cors from "cors";
import dotenv from "dotenv";
import { createServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import authRoutes from "./routes/auth.routes";
import bookingsRoutes from "./routes/bookings.routes";
import dashboardRoutes from "./routes/dashboard.routes";
import aiRoutes from "./routes/ai.routes";
import carsRoutes from "./routes/cars.routes";
import gpsRoutes from "./routes/gps.routes";
import sessionsRoutes from "./routes/sessions.routes";
import usersRoutes from "./routes/users.routes";
import { ensureBackendSchema } from "./lib/schema";

dotenv.config();

const app: Express = express();
const BASE_PORT = Number(process.env.MOBILE_BACKEND_PORT || 3001);
const server = createServer(app);
const io = new SocketIOServer(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

app.use(cors());
app.use(express.json());

// Routes
app.use("/auth", authRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/bookings", bookingsRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/cars", carsRoutes);
app.use("/api/gps", gpsRoutes);
app.use("/api/sessions", sessionsRoutes);
app.use("/api/users", usersRoutes);

app.get("/health", (req, res) => {
  res.status(200).json({ status: "OK", timestamp: new Date().toISOString() });
});

io.on("connection", (socket) => {
  console.log(`[socket]: connected ${socket.id}`);

  socket.on("track_car", ({ carId }) => {
    if (carId) {
      socket.join(`car:${carId}`);
    }
  });

  socket.on("untrack_car", ({ carId }) => {
    if (carId) {
      socket.leave(`car:${carId}`);
    }
  });

  socket.on("disconnect", () => {
    console.log(`[socket]: disconnected ${socket.id}`);
  });
});

ensureBackendSchema()
  .then(() => {
    const listenWithFallback = (port: number, attempt = 0) => {
      server.once("error", (err: NodeJS.ErrnoException) => {
        if (err.code === "EADDRINUSE" && attempt < 30) {
          const nextPort = port + 1;
          console.warn(`[server]: Port ${port} busy, retrying on ${nextPort}`);
          listenWithFallback(nextPort, attempt + 1);
          return;
        }

        console.error("[server]: Failed to start", err);
        process.exit(1);
      });

      server.listen(port, () => {
        console.log(`[server]: Server is running at http://localhost:${port}`);
      });
    };

    listenWithFallback(BASE_PORT);
  })
  .catch((err) => {
    console.error("[server]: Failed to initialize schema", err);
    process.exit(1);
  });
