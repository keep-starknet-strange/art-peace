import backendConfig from '../configs/backend.config.json';

export const backendUrl = backendConfig.production
  ? 'https://' + backendConfig.host
  : 'http://' + backendConfig.host + ':' + backendConfig.port;

export const wsUrl = backendConfig.production
  ? 'wss://' + backendConfig.host + '/ws'
  : 'ws://' + backendConfig.host + ':' + backendConfig.port + '/ws';

export const devnetMode = backendConfig.production === false;
//export const devnetMode = false; //TODO: backendConfig.production === false;
