import express from "express";
import { handleRequest, errorHandler } from "./middleware.js";
import { createAccount, getBalance } from "./controllers/account.js";
import { processTransaction, processTransactionAsync, getTransactionStatus } from "./controllers/transaction.js";

const app = express();

app.use(handleRequest);
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ extended: true, limit: '100mb' }));

app.get('/', (_req, res) => { res.json({ message: "welcome" }) });

// V1 version
app.post('/v1/account', createAccount);
app.get('/v1/account/:account_id', getBalance);
app.post('/v1/transactions', processTransaction);

// V2 version
app.post('/v2/account', createAccount);
app.get('/v2/account/:account_id', getBalance);
app.post('/v2/transactions', processTransactionAsync);
app.get('/v2/transactions/status/:jobId', getTransactionStatus);

app.use(errorHandler);

export default app;
