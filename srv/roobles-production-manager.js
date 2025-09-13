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

  handleServiceAction(serviceAction) {
    const sts = serviceAction.Status;
    switch(sts) {
      case 'Stop':
        this.shutdown();

      default:
        this.logger.warn(`Unknown Service Action Status: ${sts}`);
    }
  }

  getObservablePlayers() {
    return this.observerManager.getMappedPlayers();
  }

  getLatestObservationEvent() {
    return this.observerManager.getLatestObservationEvent();
  }

  buildHttpBindings() {
    return [
      new HttpBinding('/valve/gsi', HttpVerb.POST, (gsEvt) => this.processGamestateEvent(gsEvt)),
      new HttpBinding('/roobles/production/service', HttpVerb.PUT, (srvAct) => this.handleServiceAction(srvAct)),
      new HttpBinding('/roobles/api', HttpVerb.GET, () => this.getHttpBindings()),
      new HttpBinding('/roobles/config', HttpVerb.GET, () => this.getConfiguration()),
      new HttpBinding('/roobles/observation/players', HttpVerb.GET, () => this.getObservablePlayers()),
      new HttpBinding('/roobles/observation/events/latest', HttpVerb.GET, () => this.getLatestObservationEvent())
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
    // TODO: Consider any loading of persisted data.
    this.initManagers();
    this.initHttpServer();
    this.initEventHandlers();
  }

  run() {
    this.httpManager.run();
  }

  shutdown() {
    // TODO: Consider any persistence of data.
    this.httpManager.stop();
  }
}

module.exports = {
  RooblesProductionManager : RooblesProductionManager
}
