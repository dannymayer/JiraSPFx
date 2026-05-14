import { HttpClient, HttpClientResponse } from '@microsoft/sp-http';
import {
  IJiraIssue,
  IJiraSearchResult,
  IJiraServiceConfig,
  IAdfNode
} from '../models/IJiraModels';

const FIELDS =
  'summary,status,priority,issuetype,project,reporter,assignee,' +
  'created,updated,duedate,labels,comment,attachment,description';

/**
 * Recursively extracts plain text from an Atlassian Document Format (ADF) node.
 */
export function adfToPlainText(node: IAdfNode | string | null | undefined): string {
  if (!node) return '';
  if (typeof node === 'string') return node;

  if (node.type === 'text' && node.text) {
    return node.text;
  }

  if (Array.isArray(node.content)) {
    const parts = node.content.map((child) => adfToPlainText(child));
    // Add newlines after block nodes
    const blockTypes = ['paragraph', 'bulletList', 'orderedList', 'listItem', 'heading', 'blockquote', 'codeBlock'];
    if (blockTypes.indexOf(node.type) !== -1) {
      return parts.join('') + '\n';
    }
    return parts.join('');
  }

  return '';
}

/**
 * Service class for interacting with the Jira REST API v3.
 *
 * Authentication uses HTTP Basic Auth with the user's Jira email address and
 * an API token generated at https://id.atlassian.com/manage-profile/security/api-tokens.
 *
 * NOTE: Browsers enforce CORS on cross-origin requests.  For Jira Cloud
 * (*.atlassian.net) you may need to route calls through a proxy (e.g. an
 * Azure Function) and set `jiraBaseUrl` to the proxy endpoint so that the
 * appropriate CORS headers are returned.  For on-premise Jira instances,
 * configure the CORS allow-list to include your SharePoint tenant domain.
 */
export class JiraService {
  private readonly _httpClient: HttpClient;
  private readonly _config: IJiraServiceConfig;

  public constructor(httpClient: HttpClient, config: IJiraServiceConfig) {
    this._httpClient = httpClient;
    this._config = config;
  }

  /** Returns true when all required config fields have been populated. */
  public get isConfigured(): boolean {
    const { jiraBaseUrl, jiraEmail, jiraApiToken } = this._config;
    return !!(jiraBaseUrl && jiraEmail && jiraApiToken);
  }

  // ---------------------------------------------------------------------------
  // Public API
  // ---------------------------------------------------------------------------

  /**
   * Fetches issues assigned to `currentUser()`, optionally constrained by
   * extra JQL (e.g. `status = "In Progress"`).
   */
  public async getMyIssues(
    extraJql?: string,
    maxResults: number = 25,
    startAt: number = 0
  ): Promise<IJiraSearchResult> {
    let jql = 'assignee = currentUser() ORDER BY updated DESC';
    if (extraJql) {
      jql = `assignee = currentUser() AND (${extraJql}) ORDER BY updated DESC`;
    }

    const url = this._buildUrl('/rest/api/3/search', {
      jql,
      fields: FIELDS,
      maxResults: String(maxResults),
      startAt: String(startAt)
    });

    const response = await this._fetch(url);
    return response.json() as Promise<IJiraSearchResult>;
  }

  /**
   * Fetches the full details for a single Jira issue.
   * @param issueKey – e.g. "PROJECT-123"
   */
  public async getIssue(issueKey: string): Promise<IJiraIssue> {
    const url = this._buildUrl(`/rest/api/3/issue/${encodeURIComponent(issueKey)}`, {
      fields: FIELDS
    });
    const response = await this._fetch(url);
    return response.json() as Promise<IJiraIssue>;
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  private _buildUrl(path: string, params: Record<string, string> = {}): string {
    const base = this._config.jiraBaseUrl.replace(/\/$/, '');
    const keys = Object.keys(params);
    const query = keys
      .map((k) => `${encodeURIComponent(k)}=${encodeURIComponent(params[k])}`)
      .join('&');
    return `${base}${path}${query ? '?' + query : ''}`;
  }

  private _authHeader(): string {
    const { jiraEmail, jiraApiToken } = this._config;
    return 'Basic ' + btoa(`${jiraEmail}:${jiraApiToken}`);
  }

  private async _fetch(url: string): Promise<HttpClientResponse> {
    const response = await this._httpClient.fetch(url, HttpClient.configurations.v1, {
      method: 'GET',
      headers: {
        Authorization: this._authHeader(),
        Accept: 'application/json',
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => response.statusText);
      throw new Error(`Jira API error ${response.status}: ${errorText}`);
    }

    return response;
  }
}
