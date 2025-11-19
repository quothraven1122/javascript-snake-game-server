import express from "express";
import pageRouter from "./routes/page.js";

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/", pageRouter);

export default app;
