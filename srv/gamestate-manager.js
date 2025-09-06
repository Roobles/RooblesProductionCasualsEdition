const EventEmitter = require('node:events');
const { Logger, LogLevels } = require('./logger.js');

const evtLvl = 'event';

const ConnectionStatuses = {
  Unknown: 0,
  Connected: 1,
  Disconnected: 2
};

class GamestateManager {

  constructor(logger, gamestateParser) {
    this.logger = logger;
    this.gsParser = gamestateParser;
  }

  // -------- Init
  init() {
  }

  processGamestateEvent(gamestateEvt) {
    const evts = this.gsParser.parse(gamestateEvt);
    if(evts.length > 0)
      this.logger.logObject(evts);
  }
}

module.exports = {
  ConnectionStatuses: ConnectionStatuses,
  GamestateManager: GamestateManager
};
