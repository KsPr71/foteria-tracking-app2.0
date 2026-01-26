import { createContext, useContext, ReactNode } from "react";
import { useOrderNotifications } from "@/hooks/use-order-notifications";

interface NotificationsContextType {
  snackbarMessage: string | null;
  snackbarVisible: boolean;
  setSnackbarVisible: (visible: boolean) => void;
  testSnackbar: () => void;
  notificationCount: number;
  checkNow: () => Promise<void>;
  checkForChanges: () => Promise<void>;
  syncTrackedOrdersNow: () => Promise<void>;
}

const NotificationsContext = createContext<NotificationsContextType | undefined>(undefined);

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const notifications = useOrderNotifications();

  return (
    <NotificationsContext.Provider value={notifications}>
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationsContext);
  if (context === undefined) {
    throw new Error("useNotifications must be used within a NotificationsProvider");
  }
  return context;
}
