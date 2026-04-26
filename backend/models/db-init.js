const pool = require('../config/db');

async function initializeDatabase() {
  const connection = await pool.getConnection();
  try {
    // Users table: both owner and customer roles
    await connection.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        phone VARCHAR(20),
        password_hash VARCHAR(255) NOT NULL,
        role ENUM('owner', 'customer') NOT NULL DEFAULT 'customer',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // Services offered by the salon
    await connection.query(`
      CREATE TABLE IF NOT EXISTS services (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(150) NOT NULL,
        duration_minutes INT NOT NULL,
        price DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
        description TEXT,
        is_active TINYINT(1) NOT NULL DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Daily schedule: owner sets open/close hours per day of week
    await connection.query(`
      CREATE TABLE IF NOT EXISTS daily_schedules (
        id INT AUTO_INCREMENT PRIMARY KEY,
        day_of_week TINYINT NOT NULL COMMENT '0=Sunday, 1=Monday...6=Saturday',
        open_time TIME NOT NULL DEFAULT '10:00:00',
        close_time TIME NOT NULL DEFAULT '20:30:00',
        is_open TINYINT(1) NOT NULL DEFAULT 1,
        UNIQUE KEY unique_day (day_of_week)
      )
    `);

    // Breaks: lunch, tea breaks per day
    await connection.query(`
      CREATE TABLE IF NOT EXISTS breaks (
        id INT AUTO_INCREMENT PRIMARY KEY,
        day_of_week TINYINT NOT NULL COMMENT '0=Sunday...6=Saturday',
        break_type ENUM('lunch', 'tea', 'other') NOT NULL,
        start_time TIME NOT NULL,
        end_time TIME NOT NULL,
        label VARCHAR(100)
      )
    `);

    // Closed dates: public holidays, special closures
    await connection.query(`
      CREATE TABLE IF NOT EXISTS closed_dates (
        id INT AUTO_INCREMENT PRIMARY KEY,
        closed_date DATE NOT NULL UNIQUE,
        reason VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Bookings
    await connection.query(`
      CREATE TABLE IF NOT EXISTS bookings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        customer_id INT NOT NULL,
        service_id INT NOT NULL,
        booking_date DATE NOT NULL,
        start_time TIME NOT NULL,
        end_time TIME NOT NULL,
        status ENUM('pending', 'approved', 'cancelled', 'completed') NOT NULL DEFAULT 'pending',
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (customer_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE,
        INDEX idx_booking_date (booking_date),
        INDEX idx_booking_slot (booking_date, start_time, end_time)
      )
    `);

    // Seed default services
    const [existingServices] = await connection.query('SELECT COUNT(*) as count FROM services');
    if (existingServices[0].count === 0) {
      await connection.query(`
        INSERT INTO services (name, duration_minutes, price, description) VALUES
        ('Normal Haircut', 40, 500.00, 'Standard haircut service'),
        ('Haircut + Beard', 60, 800.00, 'Haircut with beard grooming'),
        ('Haircut + Hair Color', 80, 2500.00, 'Haircut with hair coloring'),
        ('Haircut + Beard + Head Massage', 90, 1500.00, 'Haircut, beard grooming, and relaxing head massage'),
        ('Haircut + Beard + Hair Color + Head Massage', 105, 3500.00, 'Full premium grooming package')
      `);
    }

    // Seed default daily schedule (Mon-Sat open, Sun closed)
    const [existingSchedules] = await connection.query('SELECT COUNT(*) as count FROM daily_schedules');
    if (existingSchedules[0].count === 0) {
      await connection.query(`
        INSERT INTO daily_schedules (day_of_week, open_time, close_time, is_open) VALUES
        (0, '10:00:00', '20:30:00', 0),
        (1, '10:00:00', '20:30:00', 1),
        (2, '10:00:00', '20:30:00', 1),
        (3, '10:00:00', '20:30:00', 1),
        (4, '10:00:00', '20:30:00', 1),
        (5, '10:00:00', '20:30:00', 1),
        (6, '10:00:00', '20:30:00', 1)
      `);
    }

    // Seed owner account if not exists
    const [existingOwner] = await connection.query("SELECT COUNT(*) as count FROM users WHERE role = 'owner'");
    if (existingOwner[0].count === 0) {
      const bcrypt = require('bcryptjs');
      const hash = await bcrypt.hash('owner123', 12);
      await connection.query(
        "INSERT INTO users (name, email, phone, password_hash, role) VALUES (?, ?, ?, ?, 'owner')",
        ['Salon Owner', 'owner@salon.com', '0771234567', hash]
      );
    }

    console.log('Database initialized successfully');
  } catch (err) {
    console.error('Database initialization error:', err);
    throw err;
  } finally {
    connection.release();
  }
}

module.exports = initializeDatabase;
