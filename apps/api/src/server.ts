import "dotenv/config";
import express from "express";
import cors from "cors";
import { createServer } from "http";
import { Server } from "socket.io";
import routes from "./routes/index.js";
import { globalErrorHandler } from "./middlewares/error.middlewares.js";
import { limiter } from "./middlewares/rate-limit.middleware.js";
import { setupVideoSockets } from "./sockets/video.sockets.js";

const app = express();
const httpServer = createServer(app);

const io = new Server(httpServer, {
    cors: {
        origin: true,
        credentials: true
    }
});

app.use(limiter);

app.use(cors({
    origin: true,
    credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/api', routes);

app.use(globalErrorHandler);

setupVideoSockets(io);

const PORT = process.env.PORT ?? 3001;

httpServer.listen(PORT, () => {
    console.log(`API rodando em http://localhost:${PORT}`);
});
