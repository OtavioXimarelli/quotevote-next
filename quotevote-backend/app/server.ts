import "dotenv/config";
import express, { Application, Request, Response, NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";

const app: Application = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(helmet());
app.use(morgan("dev"));

// Health Check
app.get("/health", (req: Request, res: Response) => {
  res.status(200).json({ status: "UP", timestamp: new Date().toISOString() });
});

// Root Route
app.get("/", (req: Request, res: Response) => {
  res.send("QuoteVote Backend Running Successfully!");
});

// Global Error Handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({
    message: "Internal Server Error",
    error: process.env.NODE_ENV === "development" ? err.message : undefined,
  });
});

// Start Server
const server = app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
  console.log(`Backend Link: http://localhost:${PORT}`);
});

// Graceful Shutdown
const shutdown = () => {
  console.log("Shutting down server...");
  server.close(() => {
    console.log("Server closed.");
    process.exit(0);
  });
};

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
