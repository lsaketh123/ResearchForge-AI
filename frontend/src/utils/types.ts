export interface User {
  id: number;
  email: string;
  role: string;
  created_at: string;
}

export interface Token {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface Workspace {
  id: number;
  name: string;
  description: string | null;
  user_id: number;
  created_at: string;
}

export interface WorkspaceShare {
  id: number;
  workspace_id: number;
  user_id: number;
  email: string;
  role: string;
  created_at: string;
}

export interface Paper {
  id: number;
  title: string;
  authors: string;
  abstract: string | null;
  published_date: string | null;
  url: string | null;
  source: string;
  workspace_id: number;
  user_id: number | null;
  created_at: string;
  extracted_text?: string | null;
}

export interface Conversation {
  id: number;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

export interface Document {
  id: number;
  title: string;
  content: string;
  workspace_id: number;
  user_id: number;
  created_at: string;
  updated_at: string;
}
