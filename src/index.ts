import express from "express";
import { errorHandler } from "./middleware.js";
import { createAccount, getBalance } from "./controllers/account.js"
import { processTransaction } from "./controllers/transaction.js"
const app = express();

app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({extended: true, limit: '100mb'}));

// routes
app.get('/',(req, res)=>{ res.json({ message: "welcome"}) })
app.post('/account', createAccount);
app.get('/account/:account_id', getBalance)
app.post('/transactions', processTransaction)

app.use(errorHandler);

app.listen(3000,() => {
  console.log("server running on 3000");
})