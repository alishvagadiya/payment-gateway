import express from "express";
import { errorHandler } from "./middleware.js";
const app = express();

app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({extended: true, limit: '100mb'}));

// routes
app.get('/',(req, res)=>{ res.json({ message: "welcome"}) }) 

app.use(errorHandler);

app.listen(3000,() => {
  console.log("server running on 3000");
})