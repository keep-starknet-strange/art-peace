import backendConfig from '../configs/backend.config.json';

export const backendUrl = backendConfig.production
  ? 'https://' + backendConfig.host
  : 'http://' + backendConfig.host + ':' + backendConfig.port;

export const wsUrl = backendConfig.production
  ? 'wss://' + backendConfig.host + '/ws'
  : 'ws://' + backendConfig.host + ':' + backendConfig.consumer_port + '/ws';

export const devnetMode = backendConfig.production === false;
