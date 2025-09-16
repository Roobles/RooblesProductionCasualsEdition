const LogLevels = {
  TRACE: 0,
  DEBUG: 1,
  INFO: 2,
  WARN: 3,
  ERROR: 4
};

const Colors = {
  None: "0m",
  Red: "31m",
  Green: "32m",
  Yellow: "33m",
  White: "97m"
}

class LogDecoration {
  constructor(label, colorCode) {
    this.label = label;
    this.colorCode = colorCode;
  }

  print() {
    return `${this.setColor(this.colorCode)}[${this.label}]${this.setColor(Colors.None)}`;
  }

  setColor(colorCode) {
    return `\x1b[${colorCode}`;
  }
}

class Logger {
  constructor(config) {
    this.config = config;
  }


  errorDrop(errObj, message) {
    this.error(message);
    this.logObject(errObj);
  }

  buildObjectMessage(obj) {
    return (typeof obj === 'object')
      ? JSON.stringify(obj, null, '  ')
      : obj;
  }

  logObject(obj, logLevel = undefined) {

    if(logLevel === undefined)
      logLevel = LogLevels.INFO;

    const objVal = this.buildObjectMessage(obj);
    this.logMessage(objVal, logLevel, false);
  }

  log(message, includeLabel = false) {
    return this.logMessage(message, LogLevels.INFO, includeLabel);
  }

  logAction(message) {
    return this.log(`\n---- ${message}`, false);
  }

  info(message) {
    return this.log(message, true);
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

  traceObject(obj) {
    return this.trace(this.buildObjectMessage(obj));
  }

  getLogLevel() {
    return this.config.Logging.LogLevel;
  }

  logMessage(message, logLevel = undefined, includeLabel = false) {

    const logLevelSetting = this.getLogLevel();

    if(logLevel === undefined)
      logLevel = LogLevels.LOG;

    if(logLevelSetting > logLevel)
      return;

    const isError = (logLevel >= LogLevels.Error);
    const mVal = includeLabel 
      ? `${this.getLogDecoration(logLevel).print()} ${message}`
      : message;

    // TODO: Remove this.
    // Don't record error at the moment.
    // Keep all writes to stdout, not stderr, even during error events.
    const writeLog = console.log;
    /*
    const writeLog = isError
      ? console.error
      : console.log;
    */

    writeLog(mVal);
    return undefined;
  }

  getLogDecoration(logLevel) {

    switch(logLevel) {
      case LogLevels.TRACE:
        return new LogDecoration('Trace', Colors.None);

      case LogLevels.DEBUG:
        return new LogDecoration('Debug', Colors.White);

      case LogLevels.INFO:
        return new LogDecoration('Info', Colors.Green);

      case LogLevels.WARN:
        return new LogDecoration('Warn', Colors.Yellow);

      case LogLevels.ERROR:
        return new LogDecoration('Error', Colors.Red);

      default:
        return new LogDecoration('Unknown', Colors.None);
    }
  }

}

module.exports = {
  Logger: Logger,
  LogLevels: LogLevels
}
