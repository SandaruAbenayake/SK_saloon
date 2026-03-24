const pool = require('../config/db');

/**
 * Convert "HH:MM:SS" time string to total minutes from midnight.
 */
function timeToMinutes(timeStr) {
  const parts = timeStr.split(':');
  return parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
}

/**
 * Convert total minutes from midnight to "HH:MM:SS" string.
 */
function minutesToTime(minutes) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00`;
}

/**
 * Check if a given date is a closed date (holiday).
 */
async function isClosedDate(dateStr) {
  const [rows] = await pool.query('SELECT id FROM closed_dates WHERE closed_date = ?', [dateStr]);
  return rows.length > 0;
}

/**
 * Get the daily schedule for a given day of week (0-6).
 */
async function getDaySchedule(dayOfWeek) {
  const [rows] = await pool.query(
    'SELECT * FROM daily_schedules WHERE day_of_week = ?',
    [dayOfWeek]
  );
  return rows.length > 0 ? rows[0] : null;
}

/**
 * Get breaks for a given day of week.
 */
async function getBreaks(dayOfWeek) {
  const [rows] = await pool.query(
    'SELECT * FROM breaks WHERE day_of_week = ? ORDER BY start_time',
    [dayOfWeek]
  );
  return rows;
}

/**
 * Get all confirmed bookings for a given date.
 */
async function getBookingsForDate(dateStr) {
  const [rows] = await pool.query(
    "SELECT * FROM bookings WHERE booking_date = ? AND status = 'confirmed' ORDER BY start_time",
    [dateStr]
  );
  return rows;
}

/**
 * Core validation: Check whether a proposed booking slot is available.
 *
 * @param {string} dateStr    - "YYYY-MM-DD"
 * @param {string} startTime  - "HH:MM" or "HH:MM:SS"
 * @param {number} durationMinutes - service duration
 * @param {number|null} excludeBookingId - booking ID to exclude (for updates)
 * @returns {{ available: boolean, reason?: string }}
 */
async function validateSlot(dateStr, startTime, durationMinutes, excludeBookingId = null) {
  // 1. Check if date is a closed date
  if (await isClosedDate(dateStr)) {
    return { available: false, reason: 'The salon is closed on this date.' };
  }

  // 2. Get day of week
  const date = new Date(dateStr + 'T00:00:00');
  const dayOfWeek = date.getDay();

  // 3. Check daily schedule
  const schedule = await getDaySchedule(dayOfWeek);
  if (!schedule || !schedule.is_open) {
    return { available: false, reason: 'The salon is closed on this day.' };
  }

  // 4. Check if slot fits within operating hours
  const normalizedStart = startTime.length === 5 ? startTime + ':00' : startTime;
  const slotStartMin = timeToMinutes(normalizedStart);
  const slotEndMin = slotStartMin + durationMinutes;
  const openMin = timeToMinutes(schedule.open_time);
  const closeMin = timeToMinutes(schedule.close_time);

  if (slotStartMin < openMin) {
    return { available: false, reason: `Salon opens at ${schedule.open_time.slice(0, 5)}.` };
  }
  if (slotEndMin > closeMin) {
    return {
      available: false,
      reason: `This service would end at ${minutesToTime(slotEndMin).slice(0, 5)}, past closing time ${schedule.close_time.slice(0, 5)}.`,
    };
  }

  // 5. Check if slot overlaps with any break
  const breaks = await getBreaks(dayOfWeek);
  for (const brk of breaks) {
    const brkStart = timeToMinutes(brk.start_time);
    const brkEnd = timeToMinutes(brk.end_time);
    if (slotStartMin < brkEnd && slotEndMin > brkStart) {
      return {
        available: false,
        reason: `This slot overlaps with a ${brk.break_type} break (${brk.start_time.slice(0, 5)} - ${brk.end_time.slice(0, 5)}).`,
      };
    }
  }

  // 6. Check if slot overlaps with any existing confirmed booking
  const bookings = await getBookingsForDate(dateStr);
  for (const booking of bookings) {
    if (excludeBookingId && booking.id === excludeBookingId) continue;
    const bkStart = timeToMinutes(booking.start_time);
    const bkEnd = timeToMinutes(booking.end_time);
    if (slotStartMin < bkEnd && slotEndMin > bkStart) {
      return {
        available: false,
        reason: 'This time slot is already booked. Please select another time.',
      };
    }
  }

  return { available: true };
}

/**
 * Generate all available time slots for a given date and service duration.
 * Slots are generated in 10-minute increments.
 */
async function getAvailableSlots(dateStr, durationMinutes) {
  // Quick checks
  if (await isClosedDate(dateStr)) return [];

  const date = new Date(dateStr + 'T00:00:00');
  const dayOfWeek = date.getDay();
  const schedule = await getDaySchedule(dayOfWeek);
  if (!schedule || !schedule.is_open) return [];

  const openMin = timeToMinutes(schedule.open_time);
  const closeMin = timeToMinutes(schedule.close_time);
  const breaks = await getBreaks(dayOfWeek);
  const bookings = await getBookingsForDate(dateStr);

  const slots = [];
  const STEP = 10; // 10-minute increments

  for (let t = openMin; t + durationMinutes <= closeMin; t += STEP) {
    const slotEnd = t + durationMinutes;

    // Check break overlap
    let overlapsBreak = false;
    for (const brk of breaks) {
      const brkStart = timeToMinutes(brk.start_time);
      const brkEnd = timeToMinutes(brk.end_time);
      if (t < brkEnd && slotEnd > brkStart) {
        overlapsBreak = true;
        break;
      }
    }
    if (overlapsBreak) continue;

    // Check booking overlap
    let overlapsBooking = false;
    for (const booking of bookings) {
      const bkStart = timeToMinutes(booking.start_time);
      const bkEnd = timeToMinutes(booking.end_time);
      if (t < bkEnd && slotEnd > bkStart) {
        overlapsBooking = true;
        break;
      }
    }
    if (overlapsBooking) continue;

    slots.push({
      start: minutesToTime(t).slice(0, 5),
      end: minutesToTime(slotEnd).slice(0, 5),
    });
  }

  return slots;
}

module.exports = {
  validateSlot,
  getAvailableSlots,
  timeToMinutes,
  minutesToTime,
  isClosedDate,
  getDaySchedule,
  getBreaks,
};
