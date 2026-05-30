import app from './app.js';
import config from './config/index.js';
import pool from './config/database.js';

const startServer = async () => {
  try {
    // Test database connection
    await pool.query('SELECT NOW()');
    console.log('✓ PostgreSQL connected');

    app.listen(config.port, () => {
      console.log(`✓ Server running on port ${config.port} (${config.env})`);
      console.log(`✓ Client URL: ${config.clientUrl}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  }
};

startServer();
