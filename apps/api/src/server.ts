import "dotenv/config";
import express from "express";
import cors from "cors";
import routes from "./routes/index.js";
import { globalErrorHandler } from "./middlewares/error.middlewares.js";
import { limiter } from "./middlewares/rate-limit.middleware.js";

const app = express();

app.use(limiter);

app.use(cors({
    origin: true,
    credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/api', routes);

app.use(globalErrorHandler);

const PORT = process.env.PORT ?? 3001;

app.listen(PORT, () => {
    console.log(`API rodando em http://localhost:${PORT}`);
});
