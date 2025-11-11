import { createContext, useContext, useEffect, useRef } from "react";
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
  const prevLocationRef = useRef<ReactRouterLocation | null>(null);
  const navigation = useNavigation();

  useEffect(() => {
    if (navigation.state === "loading") {
      prevLocationRef.current = location;
    }
  }, [navigation, location]);

  return (
    <Context
      value={{
        previousLocation: prevLocationRef.current,
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
