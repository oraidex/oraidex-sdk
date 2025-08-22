export const SUPPORTED_RESOLUTIONS = {
  1: "1m",
  5: "5m",
  15: "15m",
  30: "30m",
  60: "1h",
  120: "2h",
  240: "4h",
  360: "6h",
  480: "8h",
  1440: "1d"
  // // Custom resolutions
  // 3: "3m", // 3 minutes
  // 10: "10m", // 10 minutes
  // 45: "45m", // 45 minutes
  // 90: "90m", // 1.5 hours
  // 180: "3h", // 3 hours
  // 720: "12h", // 12 hours
  // 2880: "2d", // 2 days
  // 10080: "1w" // 1 week
};

export const FAVORITES_INTERVAL = ["5", "15", "60", "240", "1440"];

export const CHART_PERIODS = {
  "1m": 60,
  "5m": 60 * 5,
  "15m": 60 * 15,
  "30m": 60 * 30,
  "1h": 60 * 60,
  "2h": 60 * 60 * 2,
  "4h": 60 * 60 * 4,
  "6h": 60 * 60 * 6,
  "8h": 60 * 60 * 8,
  "1d": 60 * 60 * 24
  // "12h": 60 * 60 * 12,
  // "2d": 60 * 60 * 24 * 2,
  // "1w": 60 * 60 * 24 * 7
};

export const LAST_BAR_REFRESH_INTERVAL = 15000; // 15 seconds
export const TV_CHART_RELOAD_INTERVAL = 15 * 60 * 1000; // 15 minutes
export const DEFAULT_LIBRARY_URL = "https://chart.oraidex.io/charting_library.standalone.js";

export const EVENT_CHART_SOCKET = "ohlcv";
