import { Pool } from 'pg';

let globalPool = (global as any).pgPool;
if (!globalPool) {
  globalPool = new Pool({
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    port: parseInt(process.env.DB_PORT || '5432'),
  });
  (global as any).pgPool = globalPool;
}

const pool = globalPool;

// Automatically configure Makassar (GMT+8) timezone for all queries in the connection pool
pool.on('connect', (client: any) => {
  client.query("SET timezone = 'Asia/Makassar';").catch((err: any) => {
    console.error('Failed to set timezone on pool connection:', err.message);
  });
});

let dbInitialized = false;

async function initDb() {
  if (dbInitialized) return;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Create users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        employee_no VARCHAR(50) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        department VARCHAR(255),
        designation VARCHAR(255),
        role VARCHAR(50) NOT NULL DEFAULT 'EMPLOYEE',
        is_active BOOLEAN NOT NULL DEFAULT true,
        username VARCHAR(255),
        password VARCHAR(255),
        token VARCHAR(255),
        udid VARCHAR(255),
        default_image TEXT,
        cutoff_clockin VARCHAR(5) DEFAULT '07:30',
        cutoff_checkout VARCHAR(5) DEFAULT '17:00',
        auto_attendance BOOLEAN DEFAULT false,
        preferred_location_id INT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Ensure columns exist in case the table was created before
    await client.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS username VARCHAR(255)');
    await client.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS password VARCHAR(255)');
    await client.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS token VARCHAR(255)');
    await client.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS udid VARCHAR(255)');
    await client.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS default_image TEXT');
    await client.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS cutoff_clockin VARCHAR(5) DEFAULT \'07:30\'');
    await client.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS cutoff_checkout VARCHAR(5) DEFAULT \'17:00\'');
    await client.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS auto_attendance BOOLEAN DEFAULT false');
    await client.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS preferred_location_id INT');

    // Create activity_logs table
    await client.query(`
      CREATE TABLE IF NOT EXISTS activity_logs (
        id SERIAL PRIMARY KEY,
        employee_no VARCHAR(50) NOT NULL,
        action VARCHAR(50) NOT NULL,
        description TEXT,
        ip_address VARCHAR(100),
        user_agent TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create locations table
    await client.query(`
      CREATE TABLE IF NOT EXISTS locations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        address TEXT,
        latitude DOUBLE PRECISION NOT NULL,
        longitude DOUBLE PRECISION NOT NULL,
        is_active BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Seed admin user
    await client.query(`
      INSERT INTO users (employee_no, name, email, department, designation, role, is_active)
      VALUES ('0326056', 'RADITYA FIRMAN SYAPUTRA', 'xxx@perumbulog.onmicrosoft.com', 'IT', 'Developer', 'ADMIN', true)
      ON CONFLICT (employee_no) DO UPDATE SET is_active = true, role = 'ADMIN'
    `);

    // Seed default locations if table is empty
    const locationsCount = await client.query('SELECT count(*) FROM locations');
    if (parseInt(locationsCount.rows[0].count, 10) === 0) {
      await client.query(`
        INSERT INTO locations (name, address, latitude, longitude, is_active)
        VALUES 
        ('Gudang BULOG Pantai Hambawang Timur', 'Gudang BULOG Pantai Hambawang Timur\nKabupaten Hulu Sungai Tengah\nKalimantan Selatan', -2.6411002644013295, 115.33504681162752, true),
        ('Gudang BULOG Andang', 'Gudang BULOG Andang\nKabupaten Hulu Sungai Tengah\nKalimantan Selatan', -2.6810775314690543, 115.32615174419966, true)
      `);
    }

    await client.query('COMMIT');
    dbInitialized = true;
    console.log('Database initialized successfully and migrations applied.');
    
    // Start background auto-attendance checker worker
    try {
      const { startAttendanceCron } = require('./attendance-cron');
      startAttendanceCron();
    } catch (cronErr: any) {
      console.error('Failed to start auto attendance background worker:', cronErr.message);
    }
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Database migration/initialization error:', error);
    throw error;
  } finally {
    client.release();
  }
}

export async function query(text: string, params?: any[]) {
  if (!dbInitialized) {
    await initDb();
  }
  return pool.query(text, params);
}

export { pool };
