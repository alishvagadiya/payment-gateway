import 'dotenv/config';
import app from "./app.js";
import { logger } from "./utils/loggers.js";

app.listen(3000, () => {
  logger.info("Server running", { port: 3000 });
})