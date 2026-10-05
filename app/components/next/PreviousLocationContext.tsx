import { createContext, useContext, useState } from "react";
import {
  useLocation,
  useNavigation,
  type Location as ReactRouterLocation,
} from "react-router";

const Context = createContext<{
  previousLocation: ReactRouterLocation | null;
} | null>(null);

export function PreviousLocationContext({
  children,
}: {
  children: React.ReactNode;
}) {
  const location = useLocation();
  const [syncedLocation, setSyncedLocation] = useState(location);
  const [previousLocation, setPreviousLocation] =
    useState<ReactRouterLocation | null>(null);
  const navigation = useNavigation();

  if (syncedLocation !== location && navigation.state === "loading") {
    setPreviousLocation(location);
    setSyncedLocation(location);
  }

  return (
    <Context
      value={{
        previousLocation,
      }}
    >
      {children}
    </Context>
  );
}

export function usePreviousLocation() {
  const context = useContext(Context);
  if (context === null) {
    throw new Error(
      "usePreviousLocation must be used within a PreviousLocationContext"
    );
  }
  return context.previousLocation;
}
