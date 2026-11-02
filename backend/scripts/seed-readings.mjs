/**
 * Seed historical readings for the last 7 days.
 * Run: node backend/scripts/seed-readings.mjs
 */

const API_URL = process.env.API_URL || 'http://localhost:4000/api/devices/reading';

const METERS = [
  { meterId: 'ESP32-001', baseFlow: 16.5, baseTotal: 12000, turbidity: 1.8, battery: 92 },
  { meterId: 'ESP32-018', baseFlow: 14.2, baseTotal: 8500,  turbidity: 2.1, battery: 84 },
  { meterId: 'ESP32-042', baseFlow: 21.0, baseTotal: 14800, turbidity: 2.4, battery: 78 },
  { meterId: 'ESP32-005', baseFlow: 18.0, baseTotal: 6000,  turbidity: 1.5, battery: 95 },
];

// Post a reading directly to the reading endpoint
async function postReading(meter, totalUsage, flowRate, turbidity, battery) {
  const payload = {
    deviceId: meter.meterId,
    meterId: meter.meterId,
    flowRateLpm: parseFloat(flowRate.toFixed(1)),
    totalUsageLiters: Math.round(totalUsage),
    turbidityNtu: parseFloat(turbidity.toFixed(2)),
    valveState: 'OPEN',
    connectivity: 'ONLINE',
    batteryPercent: battery,
  };

  const res = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  return res.ok;
}

async function seedReadings() {
  console.log('Seeding 7 days of historical readings...\n');
  
  for (const meter of METERS) {
    let runningTotal = meter.baseTotal;
    console.log(`Seeding ${meter.meterId}...`);
    
    // Seed 2 readings per day for last 7 days (morning + evening)
    for (let daysAgo = 7; daysAgo >= 0; daysAgo--) {
      const flowMorning = meter.baseFlow + (Math.random() - 0.5) * 6;
      const flowEvening = meter.baseFlow + (Math.random() - 0.5) * 8;
      const turbidity = meter.turbidity + (Math.random() - 0.5) * 0.5;
      
      // Morning usage (08:00-12:00 window)
      const morningUsage = (flowMorning * 60 * 4); // ~4 hrs at that rate
      runningTotal += morningUsage / 2;
      await postReading(meter, runningTotal, flowMorning, turbidity, meter.battery);
      
      // Evening usage (18:00-22:00 window)
      const eveningUsage = (flowEvening * 60 * 4);
      runningTotal += eveningUsage / 2;
      await postReading(meter, runningTotal, flowEvening, turbidity + 0.2, meter.battery - 0.5);
      
      await new Promise(r => setTimeout(r, 200));
    }
    
    console.log(`  Done. Final total: ${Math.round(runningTotal).toLocaleString()} L`);
  }

  console.log('\nHistorical readings seeded successfully!');
  console.log('Refresh /usage-analytics to see the charts.');
}

seedReadings().catch(console.error);
