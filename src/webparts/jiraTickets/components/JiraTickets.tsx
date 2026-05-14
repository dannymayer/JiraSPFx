import * as React from 'react';
import {
  DetailsList,
  DetailsListLayoutMode,
  IColumn,
  SelectionMode,
  Panel,
  PanelType,
  Spinner,
  SpinnerSize,
  SearchBox,
  Dropdown,
  IDropdownOption,
  DefaultButton,
  PrimaryButton,
  MessageBar,
  MessageBarType,
  Link,
  Icon,
  TooltipHost,
  Persona,
  PersonaSize,
  IconButton
} from '@fluentui/react';
import * as strings from 'JiraTicketsWebPartStrings';
import { JiraService, adfToPlainText } from '../services/JiraService';
import { IJiraIssue } from '../models/IJiraModels';
import { IJiraTicketsProps } from './IJiraTicketsProps';
import styles from './JiraTickets.module.scss';

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

interface IJiraTicketsState {
  issues: IJiraIssue[];
  total: number;
  loading: boolean;
  error: string | null;
  selectedIssue: IJiraIssue | null;
  isPanelOpen: boolean;
  searchText: string;
  statusFilter: string;
  page: number;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const STATUS_CATEGORY_TO_CSS: Record<string, string> = {
  'new': styles.statusTodo,
  'indeterminate': styles.statusInProgress,
  'done': styles.statusDone
};

function getStatusClass(issue: IJiraIssue): string {
  const category = issue.fields?.status?.statusCategory?.key ?? '';
  return STATUS_CATEGORY_TO_CSS[category] ?? styles.statusOther;
}

function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch {
    return iso;
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default class JiraTickets extends React.Component<IJiraTicketsProps, IJiraTicketsState> {
  private _service: JiraService;

  public constructor(props: IJiraTicketsProps) {
    super(props);
    this.state = {
      issues: [],
      total: 0,
      loading: false,
      error: null,
      selectedIssue: null,
      isPanelOpen: false,
      searchText: '',
      statusFilter: props.defaultStatusFilter || 'all',
      page: 0
    };
    this._service = new JiraService(props.httpClient, {
      jiraBaseUrl: props.jiraBaseUrl,
      jiraEmail: props.jiraEmail,
      jiraApiToken: props.jiraApiToken
    });
  }

  // ---------------------------------------------------------------------------
  // Lifecycle
  // ---------------------------------------------------------------------------

  public componentDidMount(): void {
    if (this._service.isConfigured) {
      this._loadIssues(0);
    }
  }

  public componentDidUpdate(prevProps: IJiraTicketsProps): void {
    if (
      prevProps.jiraBaseUrl !== this.props.jiraBaseUrl ||
      prevProps.jiraEmail !== this.props.jiraEmail ||
      prevProps.jiraApiToken !== this.props.jiraApiToken ||
      prevProps.maxResults !== this.props.maxResults
    ) {
      this._service = new JiraService(this.props.httpClient, {
        jiraBaseUrl: this.props.jiraBaseUrl,
        jiraEmail: this.props.jiraEmail,
        jiraApiToken: this.props.jiraApiToken
      });
      if (this._service.isConfigured) {
        this._loadIssues(0);
      }
    }
  }

  // ---------------------------------------------------------------------------
  // Data loading
  // ---------------------------------------------------------------------------

  private _buildExtraJql(): string | undefined {
    const parts: string[] = [];

    if (this.state.statusFilter === 'todo') {
      parts.push('statusCategory = "To Do"');
    } else if (this.state.statusFilter === 'inprogress') {
      parts.push('statusCategory = "In Progress"');
    } else if (this.state.statusFilter === 'done') {
      parts.push('statusCategory = "Done"');
    }

    if (this.state.searchText) {
      const escaped = this.state.searchText.replace(/"/g, '\\"');
      parts.push(`(summary ~ "${escaped}" OR description ~ "${escaped}")`);
    }

    return parts.length > 0 ? parts.join(' AND ') : undefined;
  }

  private _loadIssues(page: number): void {
    const { maxResults } = this.props;
    this.setState({ loading: true, error: null, page });
    this._service
      .getMyIssues(this._buildExtraJql(), maxResults, page * maxResults)
      .then((result) => {
        this.setState({
          issues: result.issues,
          total: result.total,
          loading: false
        });
      })
      .catch((err: Error) => {
        this.setState({
          loading: false,
          error: err.message || strings.ErrorMessage
        });
      });
  }

  // ---------------------------------------------------------------------------
  // Event handlers
  // ---------------------------------------------------------------------------

  private _onRefresh = (): void => {
    this._loadIssues(this.state.page);
  };

  private _onSearch = (
    _event: React.ChangeEvent<HTMLInputElement> | undefined,
    value?: string
  ): void => {
    this.setState({ searchText: value ?? '' }, () => this._loadIssues(0));
  };

  private _onSearchClear = (): void => {
    this.setState({ searchText: '' }, () => this._loadIssues(0));
  };

  private _onStatusFilterChange = (
    _event: React.FormEvent<HTMLDivElement>,
    option?: IDropdownOption
  ): void => {
    if (option) {
      this.setState({ statusFilter: option.key as string }, () => this._loadIssues(0));
    }
  };

  private _onIssueClick = (issue: IJiraIssue): void => {
    this.setState({ selectedIssue: issue, isPanelOpen: true });
  };

  private _onPanelDismiss = (): void => {
    this.setState({ isPanelOpen: false, selectedIssue: null });
  };

  private _onPreviousPage = (): void => {
    const newPage = Math.max(0, this.state.page - 1);
    this._loadIssues(newPage);
  };

  private _onNextPage = (): void => {
    const { maxResults } = this.props;
    const { page, total } = this.state;
    if ((page + 1) * maxResults < total) {
      this._loadIssues(page + 1);
    }
  };

  // ---------------------------------------------------------------------------
  // Column definitions
  // ---------------------------------------------------------------------------

  private _getColumns(): IColumn[] {
    return [
      {
        key: 'key',
        name: 'Key',
        minWidth: 80,
        maxWidth: 120,
        isResizable: true,
        onRender: (item: IJiraIssue) => (
          <span
            className={styles.issueKey}
            onClick={() => this._onIssueClick(item)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && this._onIssueClick(item)}
          >
            {item.key}
          </span>
        )
      },
      {
        key: 'summary',
        name: 'Summary',
        minWidth: 200,
        isResizable: true,
        isMultiline: true,
        onRender: (item: IJiraIssue) => (
          <span style={{ fontSize: 13 }}>{item.fields.summary}</span>
        )
      },
      {
        key: 'project',
        name: strings.ProjectLabel,
        minWidth: 100,
        maxWidth: 150,
        isResizable: true,
        onRender: (item: IJiraIssue) => (
          <span>{item.fields.project?.name ?? '—'}</span>
        )
      },
      {
        key: 'status',
        name: strings.StatusLabel,
        minWidth: 100,
        maxWidth: 140,
        isResizable: true,
        onRender: (item: IJiraIssue) => (
          <span className={`${styles.statusBadge} ${getStatusClass(item)}`}>
            {item.fields.status?.name ?? '—'}
          </span>
        )
      },
      {
        key: 'priority',
        name: strings.PriorityLabel,
        minWidth: 80,
        maxWidth: 120,
        isResizable: true,
        onRender: (item: IJiraIssue) => {
          const p = item.fields.priority;
          return p ? (
            <TooltipHost content={p.name}>
              <img src={p.iconUrl} alt={p.name} className={styles.priorityIcon} />
              <span style={{ fontSize: 12 }}>{p.name}</span>
            </TooltipHost>
          ) : (
            <span>—</span>
          );
        }
      },
      {
        key: 'updated',
        name: strings.UpdatedLabel,
        minWidth: 100,
        maxWidth: 120,
        isResizable: true,
        onRender: (item: IJiraIssue) => (
          <span style={{ fontSize: 12 }}>{formatDate(item.fields.updated)}</span>
        )
      }
    ];
  }

  // ---------------------------------------------------------------------------
  // Sub-renders
  // ---------------------------------------------------------------------------

  private _renderToolbar(): React.ReactElement {
    const { searchText, statusFilter } = this.state;
    const statusOptions: IDropdownOption[] = [
      { key: 'all', text: strings.StatusAll },
      { key: 'todo', text: strings.StatusTodo },
      { key: 'inprogress', text: strings.StatusInProgress },
      { key: 'done', text: strings.StatusDone }
    ];

    return (
      <div className={styles.toolbar}>
        <div className={styles.searchBox}>
          <SearchBox
            placeholder={strings.SearchPlaceholder}
            value={searchText}
            onChange={this._onSearch}
            onClear={this._onSearchClear}
          />
        </div>
        <div className={styles.statusDropdown}>
          <Dropdown
            options={statusOptions}
            selectedKey={statusFilter}
            onChange={this._onStatusFilterChange}
            ariaLabel={strings.FilterLabel}
          />
        </div>
        <IconButton
          iconProps={{ iconName: 'Refresh' }}
          title={strings.RefreshButtonLabel}
          ariaLabel={strings.RefreshButtonLabel}
          onClick={this._onRefresh}
        />
      </div>
    );
  }

  private _renderPagination(): React.ReactElement | null {
    const { page, total } = this.state;
    const { maxResults } = this.props;
    const totalPages = Math.ceil(total / maxResults);
    if (totalPages <= 1) return null;

    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 12, justifyContent: 'flex-end' }}>
        <DefaultButton
          text="Previous"
          disabled={page === 0}
          onClick={this._onPreviousPage}
          iconProps={{ iconName: 'ChevronLeft' }}
        />
        <span style={{ fontSize: 13 }}>
          Page {page + 1} of {totalPages} ({total} total)
        </span>
        <DefaultButton
          text="Next"
          disabled={(page + 1) * maxResults >= total}
          onClick={this._onNextPage}
          iconProps={{ iconName: 'ChevronRight' }}
        />
      </div>
    );
  }

  private _renderDetailPanel(): React.ReactElement {
    const { selectedIssue, isPanelOpen } = this.state;
    if (!selectedIssue) return <></>;

    const f = selectedIssue.fields;
    const jiraUrl = `${this.props.jiraBaseUrl}/browse/${selectedIssue.key}`;

    return (
      <Panel
        isOpen={isPanelOpen}
        onDismiss={this._onPanelDismiss}
        headerText={`${selectedIssue.key}: ${f.summary}`}
        type={PanelType.medium}
        isBlocking={false}
        closeButtonAriaLabel={strings.DismissLabel}
      >
        {/* Open in Jira */}
        <div style={{ marginBottom: 16 }}>
          <PrimaryButton
            text={strings.OpenInJiraLabel}
            iconProps={{ iconName: 'OpenInNewTab' }}
            href={jiraUrl}
            target="_blank"
            rel="noopener noreferrer"
          />
        </div>

        {/* Metadata grid */}
        <div className={styles.detailSection}>
          <div className={styles.detailSectionTitle}>Details</div>
          <div className={styles.metaGrid}>
            <span className={styles.metaLabel}>{strings.StatusLabel}</span>
            <span className={`${styles.statusBadge} ${getStatusClass(selectedIssue)}`}>
              {f.status?.name ?? '—'}
            </span>

            <span className={styles.metaLabel}>{strings.PriorityLabel}</span>
            <span className={styles.metaValue}>
              {f.priority ? (
                <>
                  <img src={f.priority.iconUrl} alt={f.priority.name} className={styles.priorityIcon} />
                  {f.priority.name}
                </>
              ) : '—'}
            </span>

            <span className={styles.metaLabel}>{strings.IssueTypeLabel}</span>
            <span className={styles.metaValue}>
              {f.issuetype ? (
                <>
                  <img src={f.issuetype.iconUrl} alt={f.issuetype.name} className={styles.priorityIcon} />
                  {f.issuetype.name}
                </>
              ) : '—'}
            </span>

            <span className={styles.metaLabel}>{strings.ProjectLabel}</span>
            <span className={styles.metaValue}>{f.project?.name ?? '—'}</span>

            <span className={styles.metaLabel}>{strings.ReporterLabel}</span>
            <span className={styles.metaValue}>
              {f.reporter ? (
                <Persona
                  text={f.reporter.displayName}
                  imageUrl={f.reporter.avatarUrls?.['24x24']}
                  size={PersonaSize.size24}
                  hidePersonaDetails={false}
                />
              ) : '—'}
            </span>

            <span className={styles.metaLabel}>{strings.AssigneeLabel}</span>
            <span className={styles.metaValue}>
              {f.assignee ? (
                <Persona
                  text={f.assignee.displayName}
                  imageUrl={f.assignee.avatarUrls?.['24x24']}
                  size={PersonaSize.size24}
                  hidePersonaDetails={false}
                />
              ) : '—'}
            </span>

            <span className={styles.metaLabel}>{strings.CreatedLabel}</span>
            <span className={styles.metaValue}>{formatDate(f.created)}</span>

            <span className={styles.metaLabel}>{strings.UpdatedLabel}</span>
            <span className={styles.metaValue}>{formatDate(f.updated)}</span>

            <span className={styles.metaLabel}>{strings.DueDateLabel}</span>
            <span className={styles.metaValue}>{formatDate(f.duedate)}</span>

            {f.labels && f.labels.length > 0 && (
              <>
                <span className={styles.metaLabel}>{strings.LabelsLabel}</span>
                <span className={styles.metaValue}>
                  {f.labels.map((l) => (
                    <span key={l} className={styles.label}>{l}</span>
                  ))}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Description */}
        <div className={styles.detailSection}>
          <div className={styles.detailSectionTitle}>{strings.DescriptionLabel}</div>
          {f.description ? (
            <p className={styles.descriptionText}>{adfToPlainText(f.description)}</p>
          ) : (
            <p style={{ color: '#6b778c', fontSize: 13 }}>{strings.NoDescriptionMessage}</p>
          )}
        </div>

        {/* Comments */}
        <div className={styles.detailSection}>
          <div className={styles.detailSectionTitle}>
            {strings.CommentsLabel} ({f.comment?.total ?? 0})
          </div>
          {f.comment?.comments?.length > 0 ? (
            f.comment.comments.slice().reverse().slice(0, 10).map((c) => (
              <div key={c.id} className={styles.commentItem}>
                <div>
                  <span className={styles.commentAuthor}>{c.author?.displayName ?? 'Unknown'}</span>
                  <span className={styles.commentDate}>{formatDate(c.created)}</span>
                </div>
                <div className={styles.commentBody}>{adfToPlainText(c.body)}</div>
              </div>
            ))
          ) : (
            <p style={{ color: '#6b778c', fontSize: 13 }}>{strings.NoCommentsMessage}</p>
          )}
        </div>

        {/* Attachments */}
        {f.attachment && f.attachment.length > 0 && (
          <div className={styles.detailSection}>
            <div className={styles.detailSectionTitle}>
              {strings.AttachmentsLabel} ({f.attachment.length})
            </div>
            {f.attachment.map((att) => (
              <div key={att.id} className={styles.attachmentItem}>
                <Icon iconName="Attach" />
                <Link href={att.content} target="_blank" rel="noopener noreferrer">
                  {att.filename}
                </Link>
                <span style={{ color: '#6b778c', fontSize: 12 }}>
                  ({(att.size / 1024).toFixed(1)} KB)
                </span>
              </div>
            ))}
          </div>
        )}
      </Panel>
    );
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  public render(): React.ReactElement<IJiraTicketsProps> {
    const { title } = this.props;
    const { issues, loading, error } = this.state;

    // Not yet configured
    if (!this._service.isConfigured) {
      return (
        <div className={styles.container}>
          <div className={styles.centered}>
            <Icon iconName="Settings" style={{ fontSize: 40, color: '#c8c6c4' }} />
            <p>{strings.NoConfigurationMessage}</p>
          </div>
        </div>
      );
    }

    return (
      <div className={styles.container}>
        {/* Header */}
        <div className={styles.header}>
          <h2 className={styles.title}>{title}</h2>
        </div>

        {/* Error bar */}
        {error && (
          <MessageBar
            messageBarType={MessageBarType.error}
            isMultiline={false}
            dismissButtonAriaLabel="Close"
            onDismiss={() => this.setState({ error: null })}
          >
            {error}
          </MessageBar>
        )}

        {/* Toolbar */}
        {this._renderToolbar()}

        {/* Content */}
        {loading ? (
          <div className={styles.centered}>
            <Spinner size={SpinnerSize.large} label={strings.LoadingMessage} />
          </div>
        ) : issues.length === 0 ? (
          <div className={styles.centered}>
            <Icon iconName="Inbox" style={{ fontSize: 40, color: '#c8c6c4' }} />
            <p>{strings.NoTicketsMessage}</p>
          </div>
        ) : (
          <>
            <DetailsList
              items={issues}
              columns={this._getColumns()}
              setKey="set"
              layoutMode={DetailsListLayoutMode.justified}
              selectionMode={SelectionMode.none}
              isHeaderVisible={true}
            />
            {this._renderPagination()}
          </>
        )}

        {/* Detail panel */}
        {this._renderDetailPanel()}
      </div>
    );
  }
}
