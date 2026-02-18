export interface GroupMembership {
  id: number;
  user: number;
  username: string;
  role: string;
  is_active: boolean;
  joined_date: string;
}

export interface GroupMessage {
  id: number;
  group: number;
  sender: number;
  sender_username: string;
  content: string;
  timestamp: string;
}

export interface StudyGroup {
  id: number;
  creator: number;
  creator_username: string;
  name: string;
  course_code: string;
  subject_area: string;
  description: string;
  max_members: number;
  meeting_location: string;
  meeting_schedule: string;
  meeting_frequency: string;
  is_online: boolean;
  meeting_link: string;
  is_active: boolean;
  created_date: string;
  updated_date: string;
  members: GroupMembership[];
  member_count: number;
  is_full: boolean;
  is_member: boolean;
  user_role: string | null;
}

export interface StudyGroupFilters {
  search?: string;
  subject_area?: string;
  course_code?: string;
  is_online?: string;
  has_spots?: boolean;
  my_groups?: boolean;
}
