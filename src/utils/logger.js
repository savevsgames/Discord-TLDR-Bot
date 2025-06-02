// Simple logging utility

const logLevels = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3,
};

// Default to INFO in production, DEBUG in development
const currentLevel = process.env.LOG_LEVEL 
  ? logLevels[process.env.LOG_LEVEL.toUpperCase()] 
  : (process.env.NODE_ENV === 'production' ? logLevels.INFO : logLevels.DEBUG);

const timestamp = () => {
  return new Date().toISOString();
};

export const logger = {
  error: (...args) => {
    if (currentLevel >= logLevels.ERROR) {
      console.error(`[${timestamp()}] ERROR:`, ...args);
    }
  },
  
  warn: (...args) => {
    if (currentLevel >= logLevels.WARN) {
      console.warn(`[${timestamp()}] WARN:`, ...args);
    }
  },
  
  info: (...args) => {
    if (currentLevel >= logLevels.INFO) {
      console.info(`[${timestamp()}] INFO:`, ...args);
    }
  },
  
  debug: (...args) => {
    if (currentLevel >= logLevels.DEBUG) {
      console.debug(`[${timestamp()}] DEBUG:`, ...args);
    }
  }
};