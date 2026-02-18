import axios from 'axios';

export interface Notification {
  id: number;
  recipient: number;
  sender: number | null;
  sender_username: string | null;
  notification_type: string;
  title: string;
  message: string;
  link: string;
  related_id: number | null;
  is_read: boolean;
  created_at: string;
}

export const getNotifications = async (page: number = 1) => {
  const response = await axios.get(`/api/notifications/?page=${page}`);
  return response.data;
};

export const getUnreadCount = async (): Promise<number> => {
  const response = await axios.get('/api/notifications/unread_count/');
  return response.data.unread_count;
};

export const markNotificationRead = async (id: number) => {
  const response = await axios.post(`/api/notifications/${id}/mark_read/`);
  return response.data;
};

export const markAllNotificationsRead = async () => {
  const response = await axios.post('/api/notifications/mark_all_read/');
  return response.data;
};
