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

dotenv.config();

const app: Express = express();
const PORT = process.env.PORT || 3000;
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

server.listen(PORT, () => {
  console.log(`[server]: Server is running at http://localhost:${PORT}`);
});
