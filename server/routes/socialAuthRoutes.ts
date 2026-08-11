import express from "express";
import { generateAuthUrl, syncAccount } from "../controllers/socialAuthController.js";
import { protect } from "../middleware/authMiddleware.js";
const socialAuthRouter = express.Router();
socialAuthRouter.get("/:platform/url",protect,generateAuthUrl)
socialAuthRouter.get("/sync",protect, syncAccount)


export default socialAuthRouter;
