const { RooblesProductionFactory } = require("./roobles-production-factory.js");
const configFile = 'roobles-production-config.json';

const fact = new RooblesProductionFactory(configFile);
fact.init();

const rooblesProdManager = fact.RooblesProductionManager();

rooblesProdManager.init();
rooblesProdManager.run();
