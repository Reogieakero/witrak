"use client";

import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from "react";

type EventsModalContextValue = {
  trigger: number;
  openEvents: () => void;
};

const EventsModalContext = createContext<EventsModalContextValue>({
  trigger: 0,
  openEvents: () => {},
});

export function EventsModalProvider({ children }: { children: ReactNode }) {
  const [trigger, setTrigger] = useState(0);
  const openEvents = useCallback(() => setTrigger((t) => t + 1), []);
  return (
    <EventsModalContext.Provider value={{ trigger, openEvents }}>
      {children}
    </EventsModalContext.Provider>
  );
}

export function useEventsModal() {
  return useContext(EventsModalContext);
}