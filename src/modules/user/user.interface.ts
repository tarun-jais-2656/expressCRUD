export interface User {
  id: number;
  name: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserRow {
  id: number;
  name: string;
  email: string;
  created_at: Date;
  updated_at: Date;
}

export interface UserChanges {
  name?: string;
  email?: string;
}
