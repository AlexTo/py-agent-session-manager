import { Spinner } from '../spinner';
import React, {
  createContext,
  PropsWithChildren,
  useEffect,
  useState,
} from 'react';

// Consider specifying types if desired
export type IRuntimeConfig = any;

/**
 * Context for storing the runtimeConfig.
 */
export const RuntimeConfigContext = createContext<IRuntimeConfig | undefined>(
  undefined,
);

/**
 * Apply any overrides to point to local servers/resources here
 * for the dev target
 */
const applyOverrides = (runtimeConfig: IRuntimeConfig) => {
  if (import.meta.env.MODE === 'local-dev') {
    runtimeConfig.agentRuntimes.StrandsAguiAgent =
      'http://localhost:8082/invocations';
    runtimeConfig.agentRuntimes.StrandsHttpAgent = 'http://localhost:8081';
    runtimeConfig.agentRuntimes.LangchainAguiAgent =
      'http://localhost:8084/invocations';
    runtimeConfig.agentRuntimes.LangchainHttpAgent = 'http://localhost:8083';
  }
  return runtimeConfig;
};

/**
 * Sets up the runtimeConfig.
 *
 * This assumes a runtime-config.json file is present at '/'.
 */
const RuntimeConfigProvider: React.FC<PropsWithChildren> = ({ children }) => {
  const [runtimeConfig, setRuntimeConfig] = useState<
    IRuntimeConfig | undefined
  >();
  useEffect(() => {
    (async () => {
      try {
        setRuntimeConfig(
          applyOverrides(await (await fetch('/runtime-config.json')).json()),
        );
      } catch {
        setRuntimeConfig(
          applyOverrides({ apis: {}, agentRuntimes: {} } as any),
        );
      }
    })();
  }, [setRuntimeConfig]);

  return runtimeConfig ? (
    <RuntimeConfigContext.Provider value={runtimeConfig}>
      {children}
    </RuntimeConfigContext.Provider>
  ) : (
    <Spinner />
  );
};

export default RuntimeConfigProvider;
