export interface LogEntry {
  id: string;
  ts: number;
  user: string;
  text: string;
  prevP?: number;
  prevC?: number;
  newP?: number;
  newC?: number;
}

export interface Comment {
  id: string;
  ts: number;
  user: string;
  text: string;
}

export interface Mitigation {
  id: string;
  label: string;
  due: string;
  owner: string;
  done: boolean;
  comments: Comment[];
  deltaP: number;
  deltaC: number;
}

export interface Risk {
  id: string;
  title: string;
  description: string;
  owner: string;
  tags: string[];
  category?: string;
  p: number;
  c: number;
  mitigations: Mitigation[];
  comments?: Comment[];
  log?: LogEntry[];
}

export interface Collection {
  id: string;
  name: string;
  description: string;
  owner: string;
  period: string;
  scale: number;
  risks: Risk[];
}

export interface Profile {
  id: string;
  full_name: string;
  email: string;
}

export type Severity = 'low' | 'medium' | 'high' | 'critical';
