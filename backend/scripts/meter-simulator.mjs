/**
 * AquaSense IoT Smart Meter Simulator
 * ----------------------------------------------------
 * Simulates ESP32 smart water meter devices sending telemetry to AquaSense backend.
 * In production: Devices post twice every 24 hours.
 * In demo/testing mode: Devices post every 60 seconds (1 minute) with realistic
 * dynamic flow rates, accumulating liter volumes, turbidity levels, and alert scenarios.
 *
 * Usage:
 *   node backend/scripts/meter-simulator.mjs
 *   npm run simulate:meters
 */

const API_URL = process.env.API_URL || 'http://localhost:4000/api/devices/reading';
const INTERVAL_SECONDS = 60; // 1 minute interval for demo

// Active meters to simulate
const SIMULATED_METERS = [
  {
    meterId: 'ESP32-001',
    deviceId: 'ESP32-001',
    zone: 'Zone A',
    baseFlow: 16.5,
    totalUsage: 12450.0,
    turbidity: 1.8,
    battery: 92,
    valveState: 'OPEN',
  },
  {
    meterId: 'ESP32-018',
    deviceId: 'ESP32-018',
    zone: 'Zone B',
    baseFlow: 14.2,
    totalUsage: 8930.0,
    turbidity: 2.1,
    battery: 84,
    valveState: 'OPEN',
  },
  {
    meterId: 'ESP32-042',
    deviceId: 'ESP32-042',
    zone: 'Zone C',
    baseFlow: 21.0,
    totalUsage: 15300.0,
    turbidity: 2.4,
    battery: 78,
    valveState: 'OPEN',
  },
  {
    meterId: 'ESP32-005',
    deviceId: 'ESP32-005',
    zone: 'Zone A',
    baseFlow: 18.0,
    totalUsage: 6420.0,
    turbidity: 1.5,
    battery: 95,
    valveState: 'OPEN',
  },
];

let cycleCount = 0;

function formatTimestamp() {
  return new Date().toLocaleTimeString();
}

async function sendReading(meter) {
  // Natural random fluctuation
  const flowJitter = (Math.random() - 0.5) * 4;
  let flowRateLpm = Math.max(0, parseFloat((meter.baseFlow + flowJitter).toFixed(1)));
  let turbidityNtu = parseFloat((meter.turbidity + (Math.random() - 0.5) * 0.4).toFixed(2));
  let batteryPercent = Math.max(10, Math.min(100, meter.battery));
  let alertReason = null;

  // Occasional Demo Anomaly triggers (e.g. every 3rd cycle on specific meters)
  if (cycleCount > 0 && cycleCount % 3 === 0 && meter.meterId === 'ESP32-042') {
    flowRateLpm = 34.5; // > 30 L/min -> High Flow / Leak Alert
    alertReason = 'TRIGGERING HIGH FLOW ALERT (>30 L/min)';
  } else if (cycleCount > 0 && cycleCount % 4 === 0 && meter.meterId === 'ESP32-018') {
    turbidityNtu = 7.4; // > 5 NTU -> Water Quality Alert
    alertReason = 'TRIGGERING WATER QUALITY ALERT (>5 NTU)';
  } else if (cycleCount > 0 && cycleCount % 5 === 0 && meter.meterId === 'ESP32-005') {
    batteryPercent = 12; // < 15% -> Low Battery Alert
    alertReason = 'TRIGGERING LOW BATTERY ALERT (<15%)';
  }

  // Accumulate usage based on flow over the 60s interval
  meter.totalUsage += parseFloat(((flowRateLpm * INTERVAL_SECONDS) / 60).toFixed(1));

  const payload = {
    deviceId: meter.deviceId,
    meterId: meter.meterId,
    flowRateLpm,
    totalUsageLiters: Math.round(meter.totalUsage),
    turbidityNtu,
    valveState: meter.valveState,
    connectivity: 'ONLINE',
    batteryPercent,
  };

  try {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      console.error(`[${formatTimestamp()}] [ERR] ${meter.meterId} HTTP ${res.status}: ${res.statusText}`);
      return;
    }

    const logPrefix = alertReason ? `\x1b[33m[ALERT EVENT]\x1b[0m` : `\x1b[32m[TELEMETRY]\x1b[0m`;
    console.log(
      `${logPrefix} [${formatTimestamp()}] ${meter.meterId} (${meter.zone}) -> Flow: ${flowRateLpm} L/min | Total: ${Math.round(meter.totalUsage)} L | Turbidity: ${turbidityNtu} NTU | Batt: ${batteryPercent}% | Valve: ${meter.valveState}`
    );
    if (alertReason) {
      console.log(`   \x1b[31m-> ${alertReason}\x1b[0m`);
    }
  } catch (err) {
    console.error(`[${formatTimestamp()}] [ERR] Could not reach backend: ${err.message}`);
  }
}

async function runCycle() {
  cycleCount++;
  console.log(`\n======================================================`);
  console.log(` AquaSense Meter Telemetry Cycle #${cycleCount} (Every ${INTERVAL_SECONDS}s)`);
  console.log(`======================================================`);
  for (const meter of SIMULATED_METERS) {
    await sendReading(meter);
    // slight delay between devices
    await new Promise(r => setTimeout(r, 400));
  }
}

console.log(`\x1b[36mAquaSense IoT Smart Meter Telemetry Simulator Initialized\x1b[0m`);
console.log(`Target Backend: ${API_URL}`);
console.log(`Simulating: ${SIMULATED_METERS.map(m => m.meterId).join(', ')}`);
console.log(`Interval: Every ${INTERVAL_SECONDS} seconds (Demo mode; in production 2x in 24 hours)\n`);

// Run first cycle immediately
runCycle();

// Then run every 60 seconds
setInterval(runCycle, INTERVAL_SECONDS * 1000);
