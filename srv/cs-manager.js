const regedit = require('regedit');
const CfgPath = 'game/csgo/cfg';
const path = require('path');

class CsManager {
  constructor(config, logger, fileManager) {
    this.config = config;
    this.logger = logger;
    this.fileManager = fileManager;
  }

  getCfgDirectory() {
    if(this.cfgDir == undefined)
      this.cfgDir = this.buildCfgDirectory();

    return this.cfgDir;
  }

  buildCfgDirectory() {
    const basePath = this.config.CounterStrike.InstallDir;
    return path.join(basePath, CfgPath);
  }

  writeConfigFile(fileName, contents) {
    const cfgFileName = this.buildFullCfgFileName(fileName);
    this.fileManager.writeFileContents(cfgFileName, contents);
  }

  buildFullCfgFileName(fileName) {
    return path.join(this.getCfgDirectory(), fileName);
  }
}

module.exports = {
  CsManager: CsManager
}
