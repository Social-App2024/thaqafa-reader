import { createContext, useContext, useRef, ReactNode } from 'react';
import { PubSub } from '../util/pubSub';

/**
 * PubSubContext - Provides global PubSub instance using Context Pattern
 * This allows any component in the app to publish/subscribe to events
 */
interface PubSubContextType {
  pubsub: PubSub;
}

const PubSubContext = createContext<PubSubContextType | undefined>(undefined);

interface PubSubProviderProps {
  children: ReactNode;
}

/**
 * PubSubProvider - Singleton Pattern implementation via Context
 * Creates a single PubSub instance for the entire application
 */
export const PubSubProvider = ({ children }: PubSubProviderProps) => {
  // Use ref to ensure PubSub instance persists across re-renders
  const pubsubRef = useRef(new PubSub());

  return (
    <PubSubContext.Provider value={{ pubsub: pubsubRef.current }}>
      {children}
    </PubSubContext.Provider>
  );
};

/**
 * usePubSub - Custom hook to access global PubSub instance
 * Throws error if used outside PubSubProvider
 */
export const usePubSub = (): PubSub => {
  const context = useContext(PubSubContext);

  if (!context) {
    throw new Error('usePubSub must be used within a PubSubProvider');
  }

  return context.pubsub;
};
