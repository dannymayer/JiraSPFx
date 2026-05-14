import { HttpClient } from '@microsoft/sp-http';
import { WebPartContext } from '@microsoft/sp-webpart-base';

export interface IJiraTicketsProps {
  /** Web part display title shown in the header. */
  title: string;
  /** Base URL of the Jira instance, e.g. https://org.atlassian.net */
  jiraBaseUrl: string;
  /** Email address used for Jira Basic Auth. */
  jiraEmail: string;
  /** Jira API token used for Basic Auth. */
  jiraApiToken: string;
  /** Maximum number of issues to fetch per page (1–100). */
  maxResults: number;
  /** Default JQL status filter key: 'all' | 'todo' | 'inprogress' | 'done' */
  defaultStatusFilter: string;
  /** SPFx HttpClient instance passed from the web part. */
  httpClient: HttpClient;
  /** SPFx web part context. */
  context: WebPartContext;
}
