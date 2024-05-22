import React from 'react';

import {
  publicProvider,
  StarknetConfig,
  useInjectedConnectors,
  argent,
  braavos
} from '@starknet-react/core';
import { sepolia, mainnet } from '@starknet-react/chains';
import { voyager } from '@starknet-react/core';

const StarknetProvider = ({ children }) => {
  const chains = [mainnet, sepolia];
  const provider = publicProvider();
  const { connectors } = useInjectedConnectors({
    recommended: [argent(), braavos()],
    includeRecommended: 'onlyIfNoConnectors',
    order: 'random'
  });

  return (
    <StarknetConfig
      chains={chains}
      provider={provider}
      explorer={voyager}
      connectors={connectors}
    >
      {children}
    </StarknetConfig>
  );
};

export default StarknetProvider;
