import "dotenv/config";
import express from "express";
import cors from "cors";
import routes from "./routes/index.js";


const app = express();

app.use(cors({
    origin: true,
    credentials: true,
}));
app.use(express.json());
app.use('/api', routes);



const PORT = process.env.PORT ?? 3001;

app.listen(PORT, () => {
    console.log(`API rodando em http://localhost:${PORT}`);
});
