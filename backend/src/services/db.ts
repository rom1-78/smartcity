// backend/src/config/db.ts
import mysql from 'mysql2/promise'; // note le /promise !

const pool = mysql.createPool({
  host: 'localhost',          // Laragon = localhost
  user: 'root',               // utilisateur par défaut
  password: '',               // mot de passe par défaut vide (sauf si tu en as mis un)
  database: 'smartcity',      // le nom de ta base
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

export default pool;
