const { HttpBinding, HttpVerb } = require('./http-manager.js');

class RooblesProductionManager {
  constructor(config, configManager, logger, httpManager, gamestateManager) {
    this.config = config;
    this.logger = logger;
    this.configManager = configManager;
    this.httpManager = httpManager;
    this.gamestateManager = gamestateManager;
  }

  processGamestateEvent(gsEvt) {
    this.gamestateManager.processGamestateEvent(gsEvt);
    return { };
  }

  getConfiguration() {
    return this.config;
  }

  getHttpBindings() {
    return this.httpManager.getBindings();
  }

  buildHttpBindings() {
    return [
      new HttpBinding('/valve/gsi', HttpVerb.POST, (gsEvt) => this.processGamestateEvent(gsEvt)),
      new HttpBinding('/roobles/api', HttpVerb.GET, () => this.getHttpBindings()),
      new HttpBinding('/roobles/config', HttpVerb.GET, () => this.getConfiguration())
    ];
  }

  initHttpServer() {
    const bindings = this.buildHttpBindings();
    this.httpManager.init(bindings);
  }

  initGamestateManager() {
    this.gamestateManager.init();
  }

  init() {
    this.initGamestateManager();
    this.initHttpServer();
  }

  run() {
    this.httpManager.run();
  }
}

module.exports = {
  RooblesProductionManager : RooblesProductionManager
}
