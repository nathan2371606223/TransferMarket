const { pool } = require("./connection");

async function runMigrations() {
  // Create transfer_applications table with tm_ prefix
  await pool.query(`
    CREATE TABLE IF NOT EXISTS tm_transfer_applications (
      id SERIAL PRIMARY KEY,
      player1 VARCHAR(255) NOT NULL,
      player2 VARCHAR(255),
      player3 VARCHAR(255),
      player4 VARCHAR(255),
      team_out VARCHAR(255) NOT NULL,
      team_in VARCHAR(255) NOT NULL,
      price NUMERIC(14,2) NOT NULL,
      remarks TEXT,
      status VARCHAR(50) DEFAULT 'pending',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `);

  // Create transfer_history table with tm_ prefix
  await pool.query(`
    CREATE TABLE IF NOT EXISTS tm_transfer_history (
      id SERIAL PRIMARY KEY,
      application_id INTEGER,
      player1 VARCHAR(255) NOT NULL,
      player2 VARCHAR(255),
      player3 VARCHAR(255),
      player4 VARCHAR(255),
      team_out VARCHAR(255) NOT NULL,
      team_in VARCHAR(255) NOT NULL,
      price NUMERIC(14,2) NOT NULL,
      remarks TEXT,
      status VARCHAR(50) NOT NULL,
      archived BOOLEAN DEFAULT false,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `);
}

module.exports = { runMigrations };

