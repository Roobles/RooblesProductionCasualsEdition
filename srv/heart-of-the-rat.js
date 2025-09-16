// A "darling" is a scheduled task, that is set to run on heartbeat.  
// Darlings can skip a number of heartbeats to be run less frequently.
class Darling {
  constructor(logger, name, task, beatSkips = 0) {
    this.logger = logger;
    this.name = name;
    this.task = task;
    this.beatSkips = beatSkips;
  }

  tryYourBest(beats) {
    if((beats % (this.beatSkips + 1)) > 0)
      return; // Better luck next time.

    // Now is your time to shine.
    this.task();
  }
}

class RooblesHeartbeat {
  constructor(config, logger) {
    this.config = config;
    this.logger = logger;

    this.beats = 0;
    this.beating = false;
    this.beatInterval = 1000;
    this.maxBeats = 99;
    this.intervalId = undefined;
    this.darlings = {};
  }

  init() {
    //TODO: Genuinely uncertain what to do here.  But I'm sure something will come up?
  }

  run() {
    if(this.beating) {
      this.logger.warn("Heart is already beating.");
      return;
    }

    this.logger.logAction('Heart Is Beating');
    this.intervalId = setInterval(() => this.beat(), this.beatInterval);
    this.beating = true;
  }

  stop() {
    if(!this.beating) {
      this.logger.warn("Heart was not beating.");
      return;
    }

    this.logger.logAction('Stopping Heart: (how could you?)');
    clearInterval(this.intervalId);
    this.beating = false;
  }

  beat() {
    const beats = this.beats;
    for(const darling in this.darlings) 
      this.darlings[darling].tryYourBest(beats);

    this.beats = this.incrementBeat(beats);
  }

  incrementBeat(currentBeat) {
    return (currentBeat + 1) % (this.maxBeats + 1);
  }

  subscribe(name, task, beatSkips = 0) {
    if(beatSkips < 0)
      beatSkips = 0;
    
    if(name in this.darlings) {
      this.logger.warn(`'${name}' is already in our thoughts and best wishes.`);
      return;
    }

    this.darlings[name] = new Darling(this.logger, name, task, beatSkips);
  }
}

module.exports = {
  RooblesHeartbeat: RooblesHeartbeat
};
