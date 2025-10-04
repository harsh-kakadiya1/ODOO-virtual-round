import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import io from 'socket.io-client';
import toast from 'react-hot-toast';

const NotificationContext = createContext();

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const { user } = useAuth();
  const [socket, setSocket] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (user && user.company) {
      // Initialize socket connection
      const newSocket = io('http://localhost:5000');
      
      newSocket.on('connect', () => {
        console.log('Connected to notification server');
        // Join the company room for notifications
        newSocket.emit('join-company', user.company);
      });

      newSocket.on('notification', (notification) => {
        // Check if notification is relevant to current user
        const isRelevant = isNotificationRelevantToUser(notification, user);
        
        if (isRelevant) {
          // Add to notifications list
          setNotifications(prev => [notification, ...prev.slice(0, 49)]); // Keep last 50
          setUnreadCount(prev => prev + 1);
          
          // Show toast notification
          showNotificationToast(notification);
        }
      });

      newSocket.on('disconnect', () => {
        console.log('Disconnected from notification server');
      });

      setSocket(newSocket);

      return () => {
        newSocket.close();
      };
    }
  }, [user]);

  const isNotificationRelevantToUser = (notification, currentUser) => {
    const { recipient, data } = notification;

    switch (recipient) {
      case 'managers':
        // Show to admins and managers
        return currentUser.role === 'admin' || currentUser.role === 'manager';
      
      case 'employee':
        // Show to the specific employee who submitted the expense
        return currentUser._id === data.submitterId;
      
      case 'approver':
        // Show to the specific approver
        return currentUser._id === data.approverId;
      
      default:
        return false;
    }
  };

  const showNotificationToast = (notification) => {
    const { type, title, message } = notification;
    
    switch (type) {
      case 'expense_submitted':
      case 'expense_needs_approval':
        toast.success(message, { duration: 5000 });
        break;
      
      case 'expense_approved':
      case 'expense_reimbursed':
        toast.success(message, { duration: 5000 });
        break;
      
      case 'expense_rejected':
        toast.error(message, { duration: 6000 });
        break;
      
      default:
        toast(message, { duration: 4000 });
    }
  };

  const markAsRead = (notificationId) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === notificationId 
          ? { ...notif, read: true }
          : notif
      )
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(notif => ({ ...notif, read: true })));
    setUnreadCount(0);
  };

  const clearNotification = (notificationId) => {
    setNotifications(prev => prev.filter(notif => notif.id !== notificationId));
    const notification = notifications.find(n => n.id === notificationId);
    if (notification && !notification.read) {
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
  };

  const clearAllNotifications = () => {
    setNotifications([]);
    setUnreadCount(0);
  };

  const value = {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    clearNotification,
    clearAllNotifications,
    socket
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};