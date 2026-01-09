const { pool } = require("./connection");
const crypto = require("crypto");

function generateToken() {
  return crypto.randomBytes(16).toString("hex");
}

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

  // Shared token table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS lb_team_tokens (
      team_id INTEGER PRIMARY KEY REFERENCES lb_teams(id) ON DELETE CASCADE,
      token TEXT UNIQUE NOT NULL,
      team_name VARCHAR(255),
      active BOOLEAN DEFAULT true,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `);

  // Add team_name column if it doesn't exist (for existing databases)
  await pool.query(`
    DO $$ 
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='lb_team_tokens' AND column_name='team_name'
      ) THEN
        ALTER TABLE lb_team_tokens ADD COLUMN team_name VARCHAR(255);
      END IF;
    END $$;
  `);

  // Populate team_name for existing records
  await pool.query(`
    UPDATE lb_team_tokens tt
    SET team_name = t.team_name
    FROM lb_teams t
    WHERE tt.team_id = t.id AND (tt.team_name IS NULL OR tt.team_name != t.team_name);
  `);

  // Alert table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS lb_token_alerts (
      id SERIAL PRIMARY KEY,
      team_id INTEGER REFERENCES lb_teams(id) ON DELETE SET NULL,
      token TEXT,
      module TEXT NOT NULL,
      payload JSONB,
      message TEXT,
      resolved BOOLEAN DEFAULT false,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `);

  // Seed tokens for teams that do not yet have one
  const { rows: teams } = await pool.query("SELECT id, team_name FROM lb_teams");
  for (const t of teams) {
    const { rows: existing } = await pool.query(
      "SELECT token FROM lb_team_tokens WHERE team_id=$1",
      [t.id]
    );
    if (existing.length === 0) {
      const token = generateToken();
      await pool.query(
        "INSERT INTO lb_team_tokens (team_id, token, team_name) VALUES ($1, $2, $3)",
        [t.id, token, t.team_name]
      );
    } else {
      // Update team_name if it's missing or different
      await pool.query(
        "UPDATE lb_team_tokens SET team_name=$1 WHERE team_id=$2 AND (team_name IS NULL OR team_name != $1)",
        [t.team_name, t.id]
      );
    }
  }
}

module.exports = { runMigrations };

