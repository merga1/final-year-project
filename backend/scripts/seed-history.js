const Database = require('better-sqlite3');
const crypto = require('crypto');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'water.sqlite');
const db = new Database(dbPath);

// Delete older bulk readings from test to start clean
db.prepare('DELETE FROM device_readings').run();

const meters = [
  { meterId: 'ESP32-001', deviceId: 'ESP32-001', base: 12000, dailyDelta: 2400 },
  { meterId: 'ESP32-018', deviceId: 'ESP32-018', base: 8500,  dailyDelta: 1950 },
  { meterId: 'ESP32-042', deviceId: 'ESP32-042', base: 14800, dailyDelta: 2850 },
  { meterId: 'ESP32-005', deviceId: 'ESP32-005', base: 6000,  dailyDelta: 2200 },
];

const insert = db.prepare(`
  INSERT INTO device_readings (id, deviceId, meterId, flowRateLpm, totalUsageLiters, turbidityNtu, valveState, connectivity, batteryPercent, timestamp)
  VALUES (?, ?, ?, ?, ?, ?, 'OPEN', 'ONLINE', ?, ?)
`);

// 7 days ago to today
for (let d = 6; d >= 0; d--) {
  const targetDate = new Date();
  targetDate.setDate(targetDate.getDate() - d);
  const dateStr = targetDate.toISOString().slice(0, 10);

  for (const m of meters) {
    const dayIndex = 6 - d;
    const startUsage = m.base + (dayIndex * m.dailyDelta);
    const endUsage = startUsage + m.dailyDelta;

    // Morning reading at 08:30
    const morningTime = dateStr + ' 08:30:00';
    insert.run(
      crypto.randomUUID(),
      m.deviceId,
      m.meterId,
      parseFloat((15.0 + Math.random() * 4).toFixed(1)),
      Math.round(startUsage + (m.dailyDelta * 0.4)),
      parseFloat((1.6 + Math.random() * 0.6).toFixed(2)),
      Math.max(70, 95 - dayIndex),
      morningTime
    );

    // Evening reading at 19:45
    const eveningTime = dateStr + ' 19:45:00';
    insert.run(
      crypto.randomUUID(),
      m.deviceId,
      m.meterId,
      parseFloat((18.0 + Math.random() * 5).toFixed(1)),
      Math.round(endUsage),
      parseFloat((1.8 + Math.random() * 0.7).toFixed(2)),
      Math.max(70, 95 - dayIndex),
      eveningTime
    );
  }
}

console.log('Successfully seeded 7 days of historical readings. Total count:', db.prepare('SELECT COUNT(*) as c FROM device_readings').get().c);

// Check grouping
const summary = db.prepare(`
  SELECT date(timestamp) as day, COUNT(*) as readings, SUM(usage) as totalUsage
  FROM (
    SELECT date(timestamp) as day, meterId, (MAX(totalUsageLiters) - MIN(totalUsageLiters)) as usage
    FROM device_readings
    GROUP BY day, meterId
  )
  GROUP BY day
  ORDER BY day ASC
`).all();

console.log('Daily Summary:', summary);
