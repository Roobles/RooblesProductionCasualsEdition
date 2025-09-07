const CoachRegex = /^ *Coach/i;
const ConfigFileExtensionRegex = /\.cfg *$/i;
const FixRangeLowerBound = 10;
const FixRangeUpperBound = 11;

const ObserverSlotKeyBinds = [
  "1",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "0",
  "-",
  "="
];

class ObservationManager {
  shouldRemapKeys() {
    return this.config.CoachFix.RemapNumberKeys;
  }
  
  constructor(config, logger, csManager) {
    this.config = config;
    this.logger = logger;
    this.csManager = csManager;
  }

  init() {
    // Set config value for this behavior.
    this.setPrimaryConfiguration();
  }

  // ---------------------------------------------------------------  Domain Methods
  processObservationSlotChanges(changeArgs) {
    // TODO: Add a configuration check for multiple different kinds of behaviors.
    if(changeArgs == undefined)
      return;

    const changedData = changeArgs.ChangedData;
    if(changedData == undefined || changedData.length < 1)
      return;

    const remapAction = this.shouldRemapKeys()
      ? (ca) => this.setKeyRemapPlayerBindExecs(ca)
      : (ca) => this.setOverflowPlayerBindExecs(ca);

    remapAction(changeArgs);
  }

  setPrimaryConfiguration() {
    // TODO: Consider making this configurable.
    const configFileName = "roobles_production_spec_binds.cfg";
    const cfgContents = this.buildPrimaryConfiguration();

    this.csManager.writeConfigFile(configFileName, cfgContents);
  }

  // ---------------------------------------------------------------  Primary Configuration
  buildPrimaryConfiguration() {
    // TODO: Build this based on configurable behaviors.
    
    return this.shouldRemapKeys()
      ? this.buildKeyRemapPrimaryConfiguration()
      : this.buildOverflowPrimaryConfiguration();
  }

  buildKeyRemapPrimaryConfiguration() {
    const configLines = this.buildPrimaryConfigurationHeader();

    for(let i=0; i<10; i++)
      configLines.push(this.buildRemappedKeyboardExecLine(i));

    return configLines.join("\n");
  }

  buildOverflowPrimaryConfiguration() {
    const defaultKeyBinds = [
      "slot1", "slot2", "slot3",
      "slot4", "slot5", "slot6",
      "slot7", "slot8", "slot9",
      "slot10"
    ];

    const defaultKeyBindNum = defaultKeyBinds.length;
    const configLines = this.buildPrimaryConfigurationHeader();

    for(let i=0; i<defaultKeyBindNum; i++)
      configLines.push(this.buildObserverKeyBinding(i, defaultKeyBinds[i]));

    configLines.push(this.buildRemappedKeyboardExecLine(10));
    configLines.push(this.buildRemappedKeyboardExecLine(11));

    return configLines.join("\n");
  }

  buildPrimaryConfigurationHeader() {
    const configLines = [];
    configLines.push("spec_usenumberkeys_nobinds false\n");

    return configLines;
  }

  buildRemappedKeyboardExecLine(observerSlot) {
    const playerExecScript = this.buildExecFileNameByObserverSlot(observerSlot);
    const playerExecScriptName = playerExecScript.replace(ConfigFileExtensionRegex, "");

    return this.buildObserverKeyBinding(observerSlot, `exec ${playerExecScriptName}`);
  }

  buildObserverKeyBinding(observerSlot, bindContents) {
    const bindingKey = this.getBindingKeyByObserverSlot(observerSlot);

    return `bind "${bindingKey}" "${bindContents}"`;
  }

  // ---------------------------------------------------------------  Secondary Configurations
  setKeyRemapPlayerBindExecs(changeArgs) {
    const actualPlayers = changeArgs.CurrentData.filter(p => !this.isACoachSlot(p));

    const sortedPlayers = actualPlayers.sort((a,b) => a.ObserverSlot - b.ObserverSlot);
    const playerCount = sortedPlayers.length;
    const limit = playerCount > FixRangeLowerBound
      ? FixRangeLowerBound
      : playerCount;

    this.logger.logAction("Remapping All Player Binds");
    for(let i=0; i<limit; i++)
      this.setPlayerObservationExecutionScript(sortedPlayers[i], i);
  }

  setOverflowPlayerBindExecs(changeArgs) {
    const playerFixes = changeArgs.ChangedData.filter(p => !this.isACoachSlot(p) && this.isOutOfBounds(p));
    if(playerFixes.length < 1)
      return;

    this.logger.logAction("Setting Overflow Player Binds");
    for(const fix of playerFixes)
      this.setPlayerObservationExecutionScript(fix, fix.ObserverSlot);
  }

  setPlayerObservationExecutionScript(playerData, observationSlot) {
    const command = this.toSpecPlayerCommand(playerData);
    const fileName = this.buildExecFileNameByObserverSlot(observationSlot);


    this.csManager.writeConfigFile(fileName, command);
  }

  toSpecPlayerCommand(playerData) {
    const playerName = playerData.Name;

    return `spec_player "${playerName}"`;
  }

  // ---------------------------------------------------------------  Utility
  getBindingKeyByObserverSlot(observerSlot) {
    return ObserverSlotKeyBinds[observerSlot];
  }

  buildExecFileNameByObserverSlot(observerSlot) {
    const player_slot = observerSlot + 1;
    return `roobles_production_spec_player_${player_slot}.cfg`;
  }

  isACoachSlot(playerData) {
    return playerData == undefined
      ? false
      : this.isACoach(playerData.Name);
  }

  isACoach(playerName) {
    return CoachRegex.test(playerName);
  }

  isOutOfBounds(playerData) {
    if(playerData == undefined)
      return false;

    const observeSlot = playerData.ObserverSlot;
    return observeSlot >= FixRangeLowerBound && observeSlot <= FixRangeUpperBound;
  }

}

module.exports = {
  ObservationManager: ObservationManager
}
