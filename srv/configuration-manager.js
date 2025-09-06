const fs = require('node:fs');

class ConfigurationManager {

  constructor(configFile) {
    this.configFile = configFile;
    this.config = undefined;
  }

  setLogger(logger) {
    this.logger = logger;
  }

  errorOut(error, message) {
    // Can't use logger on bootstrap.
    console.log(`---- ${message}`);
    console.log(error);

    return undefined;
  }

  readConfigContents() {
    try {
      return fs.readFileSync(this.configFile, 'utf8');
    } catch(error) {
      return this.errorOut(error, "Error Reading Configuration");
    }
  }

  parseConfigContents(contents) {
    try {
      return JSON.parse(contents);
    }
    catch (error) {
      return this.errorOut(error, "Error Parsing Configuration Contents");
    }
  }

  readConfiguration() {
    const contents = this.readConfigContents();
    return (contents === undefined)
      ? undefined
      : this.parseConfigContents(contents);
  }

  getConfiguration() {
    return (this.config === undefined)
      ? (this.config = this.readConfiguration())
      : this.config;
  }

  setReplayEnabled(isEnabled) {
    const config = this.getConfiguration();

    this.logConfigurationSetting('Replays Enabled', isEnabled);
    config.Obs.ReplayConfiguration.Enabled = isEnabled;
  }

  setGamestateLoggingEnabled(isEnabled) {
    const config = this.getConfiguration();

    this.logConfigurationSetting('Gamestate Logging', isEnabled);
    config.Gamestate.Logging.Enabled = isEnabled;
  }

  logConfigurationSetting(settingName, settingValue) {
    this.logger.logAction(`Setting Configuration '${settingName}' to '${settingValue}'.`);
  }
}

module.exports = {
  ConfigurationManager: ConfigurationManager
}
