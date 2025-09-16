const printf = require('printf');

class GamestateLogger {
  getConfig() {
    return this.config.Gamestate.Logging;
  }

  isEnabled() {
    return this.getConfig()
      .Enabled;
  }

  getLogFileDirectory() {
    return this.getConfig()
      .Directory;
  }

  buildNextFileName() {
    return printf('gsi_payload_%08d.json', ++this.fileId);
  }

  logGamestate(gsData) {
    if(!this.isEnabled())
      return;

    const fileName = this.buildNextFileName();
    const logDir = this.getLogFileDirectory();

    const logFile = this.fileManager.getFileFullName(logDir, fileName);
    this.fileManager.writeFileContents(logFile, gsData);
  }

  cleanLogDirectory() {
    const logDir = this.getLogFileDirectory();
    if(!logDir)
      return this.logger.warn("Log directory isn't configured.");

    this.logger.logAction("Cleaning Gamestate Log Directory");
    this.fileManager.deleteFilesOfTypes(logDir, 'json');
    this.fileId = 0;
  }

  constructor(config, logger, fileManager) {
    this.config = config;
    this.logger = logger;
    this.fileManager = fileManager;
    this.fileId = 0;
  }

  init() {
    this.cleanLogDirectory();
  }
}

module.exports = {
  GamestateLogger: GamestateLogger
}
