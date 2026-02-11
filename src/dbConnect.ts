import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const { Pool } = pg;

const config: pg.PoolConfig = {
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  max: parseInt(process.env.DB_MAX_CONNECTIONS) || 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
  min: parseInt(process.env.DB_IDLE_CONNECTIONS) || 2
};

export const pool = new Pool(config);

pool.on('connect', () => {
  console.log("DB Connected");
});

pool.on('error', (err) => {
  console.log("Unexpected error", {error: err.message, stack: err.stack});
  process.exit(-1);
});
