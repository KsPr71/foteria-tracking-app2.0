import { initDb } from "./db.js";
import { ENV } from "./env.js";

initDb();
console.log("DB initialized at", ENV.DB_PATH);
