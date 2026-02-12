import 'dotenv/config';
import express from "express";
import { handleRequest, errorHandler } from "./middleware.js";
import { createAccount, getBalance } from "./controllers/account.js"
import { processTransaction } from "./controllers/transaction.js"
import { logger } from "./utils/loggers.js";

const app = express();

app.use(handleRequest);
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({extended: true, limit: '100mb'}));

// routes
app.get('/',(_req, res)=>{ res.json({ message: "welcome"}) })
app.post('/account', createAccount);
app.get('/account/:account_id', getBalance)
app.post('/transactions', processTransaction)

app.use(errorHandler);

app.listen(3000,() => {
  logger.info("Server running", { port: 3000 });
})