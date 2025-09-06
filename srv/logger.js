const LogLevels = {
  TRACE: 0,
  DEBUG: 1,
  INFO: 2,
  WARN: 3,
  ERROR: 4
};

class Logger {
  constructor(logLevel = LogLevels.INFO) {
    this.logLevel = logLevel;
  }

  getLogLevelName(logLevel) {

    switch(logLevel) {
      case LogLevels.TRACE:
        return 'Trace';

      case LogLevels.DEBUG:
        return 'Debug';

      case LogLevels.INFO:
        return 'Info';

      case LogLevels.WARN:
        return 'Warn';

      case LogLevels.ERROR:
        return 'Error';

      default:
        return 'Unknown';
    }
  }

  setLevel(logLevel) {
    this.logLevel = logLevel;
  }

  errorDrop(errObj, message) {
    this.error(message);
    this.logObject(errObj);
  }

  logObject(obj, logLevel = undefined) {

    if(logLevel === undefined)
      logLevel = LogLevels.INFO;

    const objVal = (typeof obj === 'object')
      ? JSON.stringify(obj, null, '  ')
      : obj;

    this.logMessage(objVal, logLevel, );
  }

  log(message, includeLabel = false) {
    return this.logMessage(message, LogLevels.INFO, includeLabel);
  }

  logAction(message) {
    return this.log(`---- ${message}`, false);
  }

  error(message) {
    return this.logMessage(message, LogLevels.ERROR, true);
  }

  warn(message) {
    return this.logMessage(message, LogLevels.WARN, true);
  }

  debug(message) {
    return this.logMessage(message, LogLevels.DEBUG, true);
  }

  trace(message) {
    return this.logMessage(message, LogLevels.TRACE, true);
  }

  logMessage(message, logLevel = undefined, includeLabel = false) {

    const logLevelSetting = this.logLevel;

    if(logLevel === undefined)
      logLevel = LogLevels.LOG;

    if(logLevelSetting > logLevel)
      return;

    const isError = (logLevel >= LogLevels.Error);
    const labelName = this.getLogLevelName(logLevel);

    const mVal = includeLabel 
      ? `[${labelName}] ${message}`
      : message;

    // TODO: Remove this.
    // Don't record error at the moment.
    const writeLog = console.log;
    /*
    const writeLog = isError
      ? console.error
      : console.log;
    */

    writeLog(mVal);
    return undefined;
  }
}

module.exports = {
  Logger: Logger,
  LogLevels: LogLevels
}
