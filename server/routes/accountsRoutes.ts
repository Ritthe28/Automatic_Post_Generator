import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { get } from "node:http";
import { addAccount, disconnectAccount, getAccounts } from "../controllers/accountController.js";



const accountRouter = express.Router();

accountRouter.get('/', protect,getAccounts);
accountRouter.post('/', protect,addAccount);
accountRouter.post('/:id', protect,disconnectAccount);

export default accountRouter