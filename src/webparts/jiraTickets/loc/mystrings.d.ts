declare interface IJiraTicketsWebPartStrings {
  // Property pane
  PropertyPaneTitleLabel: string;
  PropertyPaneGroupConnectionLabel: string;
  PropertyPaneJiraBaseUrlLabel: string;
  PropertyPaneJiraBaseUrlDescription: string;
  PropertyPaneJiraEmailLabel: string;
  PropertyPaneJiraApiTokenLabel: string;
  PropertyPaneJiraApiTokenDescription: string;
  PropertyPaneGroupDisplayLabel: string;
  PropertyPaneMaxResultsLabel: string;
  PropertyPaneDefaultStatusLabel: string;

  // Status filter options
  StatusAll: string;
  StatusTodo: string;
  StatusInProgress: string;
  StatusDone: string;

  // UI strings
  NoConfigurationMessage: string;
  LoadingMessage: string;
  NoTicketsMessage: string;
  ErrorMessage: string;
  RefreshButtonLabel: string;
  SearchPlaceholder: string;
  FilterLabel: string;
  DetailsHeader: string;
  DismissLabel: string;
  OpenInJiraLabel: string;
  DescriptionLabel: string;
  CommentsLabel: string;
  AttachmentsLabel: string;
  NoDescriptionMessage: string;
  NoCommentsMessage: string;
  NoAttachmentsMessage: string;
  PriorityLabel: string;
  StatusLabel: string;
  ReporterLabel: string;
  AssigneeLabel: string;
  CreatedLabel: string;
  UpdatedLabel: string;
  DueDateLabel: string;
  LabelsLabel: string;
  ProjectLabel: string;
  IssueTypeLabel: string;
}

declare module 'JiraTicketsWebPartStrings' {
  const strings: IJiraTicketsWebPartStrings;
  export = strings;
}
