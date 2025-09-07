const { HttpBinding, HttpVerb } = require('./http-manager.js');

class RooblesProductionManager {
  constructor(config, configManager, logger, httpManager, gamestateManager, observerManager) {
    this.config = config;
    this.logger = logger;
    this.configManager = configManager;
    this.httpManager = httpManager;
    this.gamestateManager = gamestateManager;
    this.observerManager = observerManager;
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

  initManagers() {
    this.gamestateManager.init();
    this.observerManager.init();
  }

  initEventHandlers() {
    this.gamestateManager.subscribeToObserveSlotChange(dta => this.observerManager.processObservationSlotChanges(dta));
  }

  init() {
    this.initManagers();
    this.initHttpServer();
    this.initEventHandlers();
  }

  run() {
    this.httpManager.run();
  }
}

module.exports = {
  RooblesProductionManager : RooblesProductionManager
}
