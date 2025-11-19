import express from "express";
import { renderMain } from "../controllers/page.js";

const router = express.Router();

router.get("/", renderMain);

export default router;
