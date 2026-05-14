# JiraSPFx

A modern **SharePoint Framework (SPFx) web part** that connects to Jira and displays the logged-in user's assigned tickets with full ticket details.

---

## Features

| Feature | Details |
|---------|---------|
| 🎫 **My Tickets** | Lists all Jira issues currently assigned to the logged-in user |
| 🔍 **Search** | Full-text search across issue summaries and descriptions (via JQL) |
| 🏷️ **Status filter** | Filter by *All*, *To Do*, *In Progress*, or *Done* |
| 📄 **Ticket detail panel** | Click any ticket key to open a side panel with full metadata, description, comments, and attachments |
| ↗️ **Open in Jira** | One-click link to the issue in Jira |
| 📑 **Pagination** | Configurable page size (5–100); next/previous navigation |
| ⚙️ **Property pane** | Configure Jira URL, credentials, page size, and default filter without editing code |
| 🎨 **Fluent UI v8** | Matches the SharePoint modern UI design language |

---

## Prerequisites

| Requirement | Version |
|------------|---------|
| Node.js | 18.x or 20.x |
| gulp-cli | `npm install -g gulp-cli` |
| SharePoint Online | Modern experience |
| Jira Cloud or Jira Server | REST API v3 access |

---

## Getting Started

### 1. Clone and install

```bash
git clone https://github.com/dannymayer/JiraSPFx.git
cd JiraSPFx
npm install
```

### 2. Configure the SharePoint workbench

Edit `config/serve.json` and replace the `initialPage` URL with your SharePoint tenant workbench URL:

```json
{
  "initialPage": "https://YOUR-TENANT.sharepoint.com/_layouts/workbench.aspx"
}
```

### 3. Trust the developer certificate (first time only)

```bash
gulp trust-dev-cert
```

### 4. Start the local dev server

```bash
npm run serve
# or: gulp serve
```

Open the URL from `config/serve.json` in your browser, add the **Jira Tickets** web part, and configure it via the property pane.

---

## Property Pane Configuration

| Property | Description |
|----------|-------------|
| **Web Part Title** | Heading displayed in the web part |
| **Jira Base URL** | Root URL of your Jira instance, e.g. `https://your-org.atlassian.net` |
| **Jira Email / Username** | Email address associated with your Jira account (auto-populated from the SharePoint user profile) |
| **Jira API Token** | Personal API token – generate one at [id.atlassian.com → Security → API tokens](https://id.atlassian.com/manage-profile/security/api-tokens) |
| **Maximum tickets to show** | Number of tickets per page (5–100, default 25) |
| **Default status filter** | Pre-selected status when the web part loads |

> **Security note:** The API token is stored as a web part property inside the SharePoint page. For higher-security deployments consider routing API calls through an Azure Function that reads the token from Azure Key Vault, and set **Jira Base URL** to the function endpoint.

---

## CORS Considerations

Browsers enforce the Same-Origin Policy on cross-origin requests. For **Jira Cloud** (`.atlassian.net`), direct browser-to-Jira API calls are blocked by Atlassian's CORS policy.

**Recommended solution:** Deploy a lightweight proxy (e.g. an Azure Function) that:
1. Accepts requests from your SharePoint tenant domain
2. Forwards them to the Jira REST API with the stored API token
3. Returns the JSON response with the appropriate `Access-Control-Allow-Origin` header

Set the **Jira Base URL** property to the proxy endpoint URL instead of the Atlassian URL.

For **on-premise Jira**, add your SharePoint tenant domain to the Jira CORS allow-list in *Jira Administration → System → Security → CORS*.

---

## Building & Packaging

```bash
# Debug build
npm run build          # → gulp bundle

# Production build (minified)
gulp bundle --ship

# Create deployable .sppkg
gulp package-solution --ship
# Output: sharepoint/solution/jira-spfx.sppkg
```

---

## Deploying to SharePoint

1. Run `gulp bundle --ship && gulp package-solution --ship`
2. Upload `sharepoint/solution/jira-spfx.sppkg` to the SharePoint App Catalog
3. Approve and deploy the solution tenant-wide (or per site)
4. Add the **Jira Tickets** web part to any modern SharePoint page
5. Configure the property pane with your Jira credentials

---

## Project Structure

```
src/
└── webparts/
    └── jiraTickets/
        ├── JiraTicketsWebPart.ts           # Web part class + property pane
        ├── JiraTicketsWebPart.manifest.json
        ├── components/
        │   ├── JiraTickets.tsx             # Main React component
        │   ├── JiraTickets.module.scss     # CSS Modules styles
        │   └── IJiraTicketsProps.ts        # Props interface
        ├── services/
        │   └── JiraService.ts             # Jira REST API client
        ├── models/
        │   └── IJiraModels.ts             # TypeScript interfaces for Jira data
        └── loc/
            ├── en-us.js                   # English strings
            └── mystrings.d.ts             # String type definitions
config/
├── config.json
├── package-solution.json
└── serve.json
```

---

## Technology Stack

- **SharePoint Framework 1.22.2**
- **React 17** + **TypeScript 4.7**
- **Fluent UI React v8** (Microsoft's design system)
- **Gulp 4** build pipeline
- **Jira REST API v3** (Basic Auth)
