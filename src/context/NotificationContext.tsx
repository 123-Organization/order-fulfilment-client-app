import React, { createContext, useContext } from "react";
import { notification } from "antd";

const NotificationContext = createContext<any>(null);
type NotificationType = 'success' | 'info' | 'warning' | 'error';

interface NotificationAlertProps {
        type: NotificationType,
        message : string,
        description : string
      }
      
export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [api, contextHolder] = notification.useNotification();

  return (
    <NotificationContext.Provider value={api}>
      {contextHolder} {/* Ensures notifications can be rendered anywhere */}
      {children}
    </NotificationContext.Provider>
  );
};

// Custom hook to use the notification API anywhere
export const useNotificationContext = () => {
  return useContext(NotificationContext);
};