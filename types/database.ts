export type Profile = {
  id: string; // uuid
  updated_at?: string; // timestamp with time zone
  full_name?: string;
  major?: string;
  level?: string;
  university?: string;
  academic_year?: string;
};

export type Course = {
  id: string; // uuid
  title?: string;
  description?: string;
  created_at?: string; // timestamp with time zone
};

export type UserCourse = {
  user_id: string; // uuid
  course_id: string; // uuid
};

export type Assignment = {
  id: string; // uuid
  course_id: string; // uuid
  title: string;
  description?: string;
  due_date?: string; // timestamp with time zone
  created_at?: string; // timestamp with time zone
  courses: Pick<Course, 'title'>; // Relation from query
};

export type Grade = {
  id: string; // uuid
  assignment_id: string; // uuid
  user_id: string; // uuid
  grade?: number;
  created_at?: string; // timestamp with time zone
};

export type ForumPost = {
  id: string; // uuid
  user_id: string; // uuid
  course_id?: string; // uuid
  title: string;
  content?: string;
  created_at?: string; // timestamp with time zone
};

export type ForumPostReply = {
  id: string; // uuid
  post_id: string; // uuid
  user_id: string; // uuid
  content: string;
  created_at?: string; // timestamp with time zone
};

export type Document = {
  id: string; // uuid
  user_id: string; // uuid
  course_id?: string; // uuid
  title: string;
  file_url: string;
  created_at?: string; // timestamp with time zone
};

export type ClassSchedule = {
  id: string; // uuid
  course_id: string; // uuid
  day_of_week: number; // smallint
  start_time: string; // time
  end_time: string; // time
  location?: string;
  courses: Pick<Course, 'title'>; // Relation from query
};
