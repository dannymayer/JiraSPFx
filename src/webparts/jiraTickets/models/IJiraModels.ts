export interface IJiraUser {
  accountId: string;
  emailAddress: string;
  displayName: string;
  avatarUrls: {
    '16x16': string;
    '24x24': string;
    '32x32': string;
    '48x48': string;
  };
  active: boolean;
}

export interface IJiraPriority {
  iconUrl: string;
  name: string;
  id: string;
}

export interface IJiraStatus {
  name: string;
  id: string;
  statusCategory: {
    key: string;
    colorName: string;
    name: string;
  };
}

export interface IJiraIssueType {
  iconUrl: string;
  name: string;
  id: string;
  subtask: boolean;
}

export interface IJiraProject {
  id: string;
  key: string;
  name: string;
  avatarUrls: {
    '16x16': string;
    '24x24': string;
    '32x32': string;
    '48x48': string;
  };
}

/** Represents a single node in an Atlassian Document Format (ADF) document. */
export interface IAdfNode {
  type: string;
  text?: string;
  content?: IAdfNode[];
  attrs?: Record<string, unknown>;
  marks?: Array<{ type: string; attrs?: Record<string, unknown> }>;
}

export interface IJiraComment {
  id: string;
  author: IJiraUser;
  body: IAdfNode | string;
  created: string;
  updated: string;
}

export interface IJiraAttachment {
  id: string;
  filename: string;
  mimeType: string;
  size: number;
  content: string;
  created: string;
  author: IJiraUser;
}

export interface IJiraIssueFields {
  summary: string;
  description: IAdfNode | string | null;
  status: IJiraStatus;
  priority: IJiraPriority;
  issuetype: IJiraIssueType;
  project: IJiraProject;
  reporter: IJiraUser | null;
  assignee: IJiraUser | null;
  created: string;
  updated: string;
  duedate: string | null;
  labels: string[];
  comment: {
    comments: IJiraComment[];
    total: number;
  };
  attachment: IJiraAttachment[];
}

export interface IJiraIssue {
  id: string;
  key: string;
  self: string;
  fields: IJiraIssueFields;
}

export interface IJiraSearchResult {
  issues: IJiraIssue[];
  total: number;
  maxResults: number;
  startAt: number;
}

export interface IJiraServiceConfig {
  jiraBaseUrl: string;
  jiraEmail: string;
  jiraApiToken: string;
}
