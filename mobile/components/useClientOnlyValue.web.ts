import { useSyncExternalStore } from 'react';

const subscribe = () => () => {};

// The server snapshot is used for server rendering and hydration; the client
// snapshot takes over afterwards.
export function useClientOnlyValue<S, C>(server: S, client: C): S | C {
  return useSyncExternalStore<S | C>(
    subscribe,
    () => client,
    () => server
  );
}
