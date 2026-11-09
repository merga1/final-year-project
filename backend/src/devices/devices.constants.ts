/** Demo alert thresholds. Real deployments should tune these per installation. */
export const THRESHOLDS = {
  turbidityNtu: 5,      // above this -> WATER_QUALITY (critical)
  flowRateLpm: 30,      // above this -> HIGH_USAGE (warning)
  batteryPercent: 15,   // below this -> LOW_BATTERY (warning)
} as const;
