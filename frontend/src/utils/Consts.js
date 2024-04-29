import backendConfig from '../configs/backend.config.json';

export const backendUrl =
  'http://' + backendConfig.host + ':' + backendConfig.port;

export const wsUrl =
  'ws://' + backendConfig.host + ':' + backendConfig.port + '/ws';
