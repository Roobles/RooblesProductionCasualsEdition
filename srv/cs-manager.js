const regedit = require('regedit');

class CsManager {
  constructor(config, logger) {
    this.config = config;
    this.logger = logger;
  }
}

module.exports = {
  CsManager: CsManager
}
