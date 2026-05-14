import * as React from 'react';
import * as ReactDom from 'react-dom';
import { Version } from '@microsoft/sp-core-library';
import { HttpClient } from '@microsoft/sp-http';
import {
  IPropertyPaneConfiguration,
  PropertyPaneTextField,
  PropertyPaneSlider,
  PropertyPaneDropdown,
  IPropertyPaneDropdownOption
} from '@microsoft/sp-property-pane';
import { BaseClientSideWebPart } from '@microsoft/sp-webpart-base';
import * as strings from 'JiraTicketsWebPartStrings';
import JiraTickets from './components/JiraTickets';
import { IJiraTicketsProps } from './components/IJiraTicketsProps';

export interface IJiraTicketsWebPartProps {
  title: string;
  jiraBaseUrl: string;
  jiraEmail: string;
  jiraApiToken: string;
  maxResults: number;
  defaultStatusFilter: string;
}

export default class JiraTicketsWebPart extends BaseClientSideWebPart<IJiraTicketsWebPartProps> {

  // ---------------------------------------------------------------------------
  // Lifecycle
  // ---------------------------------------------------------------------------

  protected onInit(): Promise<void> {
    // Pre-populate the email field with the current SharePoint user's email
    // the first time the web part is loaded (i.e. when the field is empty).
    if (!this.properties.jiraEmail && this.context.pageContext?.user?.email) {
      this.properties.jiraEmail = this.context.pageContext.user.email;
    }
    return super.onInit();
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  public render(): void {
    const element: React.ReactElement<IJiraTicketsProps> = React.createElement(JiraTickets, {
      title: this.properties.title || 'My Jira Tickets',
      jiraBaseUrl: this.properties.jiraBaseUrl || '',
      jiraEmail: this.properties.jiraEmail || '',
      jiraApiToken: this.properties.jiraApiToken || '',
      maxResults: this.properties.maxResults || 25,
      defaultStatusFilter: this.properties.defaultStatusFilter || 'all',
      httpClient: this.context.httpClient as HttpClient,
      context: this.context
    });

    ReactDom.render(element, this.domElement);
  }

  protected onDispose(): void {
    ReactDom.unmountComponentAtNode(this.domElement);
  }

  // ---------------------------------------------------------------------------
  // Property pane
  // ---------------------------------------------------------------------------

  protected get dataVersion(): Version {
    return Version.parse('1.0');
  }

  protected getPropertyPaneConfiguration(): IPropertyPaneConfiguration {
    const statusOptions: IPropertyPaneDropdownOption[] = [
      { key: 'all', text: strings.StatusAll },
      { key: 'todo', text: strings.StatusTodo },
      { key: 'inprogress', text: strings.StatusInProgress },
      { key: 'done', text: strings.StatusDone }
    ];

    return {
      pages: [
        {
          header: { description: 'Jira Tickets Web Part Settings' },
          groups: [
            {
              groupName: strings.PropertyPaneGroupConnectionLabel,
              groupFields: [
                PropertyPaneTextField('title', {
                  label: strings.PropertyPaneTitleLabel
                }),
                PropertyPaneTextField('jiraBaseUrl', {
                  label: strings.PropertyPaneJiraBaseUrlLabel,
                  description: strings.PropertyPaneJiraBaseUrlDescription,
                  placeholder: 'https://your-org.atlassian.net'
                }),
                PropertyPaneTextField('jiraEmail', {
                  label: strings.PropertyPaneJiraEmailLabel,
                  placeholder: 'user@example.com'
                }),
                PropertyPaneTextField('jiraApiToken', {
                  label: strings.PropertyPaneJiraApiTokenLabel,
                  description: strings.PropertyPaneJiraApiTokenDescription,
                  placeholder: 'Paste your API token here'
                })
              ]
            },
            {
              groupName: strings.PropertyPaneGroupDisplayLabel,
              groupFields: [
                PropertyPaneSlider('maxResults', {
                  label: strings.PropertyPaneMaxResultsLabel,
                  min: 5,
                  max: 100,
                  step: 5
                }),
                PropertyPaneDropdown('defaultStatusFilter', {
                  label: strings.PropertyPaneDefaultStatusLabel,
                  options: statusOptions
                })
              ]
            }
          ]
        }
      ]
    };
  }
}
