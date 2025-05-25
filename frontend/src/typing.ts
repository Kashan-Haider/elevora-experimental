export interface Project {
    id: string;
    user_id: string;
    name: string;
    domain: string;
    created_at: string; // ISO 8601 date string (e.g., "2025-05-23T20:25:28.280Z")
  }

  export interface User {
    id: string;
    username: string;
    email: string;
    password_hash: string;
    created_at: string; 
  }