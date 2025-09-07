
class ObservationManager {
  constructor(config, logger) {
    this.config = config;
    this.logger = logger;
  }

  processObservationSlotChanges(changeArgs) {
    this.logger.logObject(changeArgs);
  }

}

module.exports = {
  ObservationManager: ObservationManager
}
