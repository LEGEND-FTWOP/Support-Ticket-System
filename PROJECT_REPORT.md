# Project Report: TicketHub Helpdesk CRM

**System:** TicketHub Helpdesk CRM  
**Domain:** Customer Support & Helpdesk Management  
**Architecture:** Single-Page Application (SPA) with local storage persistence and schema migration support  
**Storage Schema:** `TICKETHUB_CRM_DATA_v3` (Version 3 with automated migration pipeline)  

---

## 1. Executive Summary

TicketHub CRM is a client-side support and helpdesk management system designed to streamline the way modern support teams receive, triage, assign, and resolve customer issues. In many support environments, operational bottlenecks arise when tickets lack urgency classification, are routed without workload awareness, use inconsistent timestamps, or are difficult to audit across multiple staff and customer roles.

This project delivers a responsive, self-contained CRM system that covers the complete support lifecycle:

- Ingesting customer queries across technical, billing, and operational categories.
- Classifying incoming tickets through an explicit automated and manual routing pipeline powered by tokenized matching and trigger-keyword extraction.
- Dynamically impersonating administrators, agents, and customers without hard-coded identity constraints.
- Synchronizing SLA deadlines with runtime timestamps so elapsed time and deadline proximity remain consistent.
- Visualizing operational health through KPI cards, workload indicators, and design-token-driven HTML5 canvas charts.
- Generating contextual response macros using ticket metadata, customer information, SLA windows, and active agent signatures.
- Maintaining persistent client-side state through automated schema migration logic to preserve compatibility across data revisions.

The system was developed using standard HTML5, custom CSS3 with design tokens, and vanilla JavaScript (ES6+). It runs entirely on the client side and does not require a database, package installation, or third-party charting library.

---

## 2. Project Objectives

1. **Structured ticket lifecycle management:** Provide an intuitive workflow for creating, triaging, updating, filtering, sorting, and resolving support requests.
2. **Priority-based SLA synchronization:** Link service-level targets directly to ticket priority tiers via `SLA_HOURS_BY_PRIORITY`, ensuring consistent urgency handling and countdown timers.
3. **Dynamic role impersonation:** Support switching between admin, agent, and customer perspectives while adapting permissions, visibility, and queue behavior.
4. **Transparent routing distinction:** Clearly mark tickets as `Auto-Routed` or `Manual Routing` and explain classification logic through a routing audit panel.
5. **Centralized taxonomy management:** Maintain a single registry for support categories and auto-propagate updates across forms, filters, and analytics.
6. **Robust schema evolution:** Build a migration layer that upgrades legacy data safely while preserving existing records and application functionality.

---

## 3. System Architecture and Design

### Application Flow
The platform is implemented as a single-page application using hash-based routing across views such as `#dashboard`, `#tickets`, `#create-ticket`, `#ticket-detail`, `#knowledge-base`, `#agents`, `#reports`, and `#settings`.

1. **View layer:** HTML5 semantic structure with sections toggled by the client-side router.
2. **State store (`appState`):** Centralized in-memory state for tickets, agents, articles, templates, notifications, categories, and email logs. `appState.loadData()` refreshes the active dataset.
3. **Persistence layer:** Saves state in browser `localStorage` under `TICKETHUB_CRM_DATA_v3`, with automated schema version checks and migration routines.
4. **Unified event delegation:** A single dispatcher (`initEventDelegation()`) handles user actions through `data-action` attributes, avoiding global handler pollution and inline event bindings.

---

## 4. Key Functional Modules

### 4.1 Dynamic Role Impersonation and Multi-Tenancy
The sidebar workspace switcher is populated dynamically from application state:

- **Support Admin (Global Access):** Full visibility over tickets, agent records, category taxonomy, deletion actions, and reports.
- **Support Agents:** Agent options are rendered from `appState.data.agents` and include names such as Sarah Chen, Marcus Vance, Alex Rivera, and Emily Watson. Selecting an agent updates profile details, queue filters, and reply signatures.
- **Customers:** Customer options are derived from existing ticket records, allowing a user to switch into a customer view that limits visibility to that customer's tickets and hides internal notes.

### 4.2 Automated Rule-Based Routing and Triage

- **Routing badges:** Each ticket shows a visual status indicating whether it was `Auto-Routed` or `Manual`.
- **Tokenized auto-routing engine (`ROUTING_RULES`):** Evaluates subject and description text using word-tokenized lexical matching to prevent collisions. It identifies support category, ticket urgency, customer sentiment (`urgent`, `frustrated`, `neutral`, `positive`), and the best-fit agent.
- **Template-driven macro generator (`REPLY_TEMPLATES`):** Produces tailored response drafts using customer names, ticket codes (`#TICK-xxxx`), issue subjects, SLA windows, and active agent signatures.
- **Routing audit and sentiment sidebar:** Displays routing source, trigger keywords, sentiment classification, and explanation of the assigned priority.

### 4.3 Centralized Department and Category Taxonomy

- A centralized `DEFAULT_CATEGORIES` registry is maintained in `script.js` and stored in `appState.data.categories`.
- `populateCategoryDropdowns()` dynamically injects category values into ticket forms, filter toolbars, and agent registration fields.
- **Token-driven canvas charts with dynamic auto-scaling:** The category distribution chart calculates canvas height based on item count and reads CSS variables through `getThemeTokens()` and `getComputedStyle()`. Additional departments expand the layout automatically without clipping.
- **Department taxonomy manager:** A settings screen allows administrators to add new departments with color selections, and those updates immediately propagate across forms, filters, and charts.

### 4.4 Ticket Management and Mathematical SLA Synchronization

- **Relative date engine:** Ticket creation dates, activity timestamps, and message times are generated relative to runtime (`Date.now()`), reducing drift between displayed values and SLA countdowns.
- **Priority constant (`SLA_HOURS_BY_PRIORITY`):** The application standardizes SLA windows across ticket creation, priority updates, countdowns, and reporting (`critical: 4h`, `high: 12h`, `medium: 24h`, `low: 48h`).
- **Unified filter state (`getDefaultFilterState`):** Resetting filters keeps all core dimensions aligned across status, priority, category, assignee, triage state, and search queries.
- **Data export:** Users can export tickets in CSV format or back up the full state as JSON.

### 4.5 Ticket Detail View and Discussion Stream

- Threaded discussion stream for customer messages, agent replies, and internal staff notes.
- Canned response macro selector for quick standardized replies.
- Context-aware macro composer for launching polished, personalized responses.
- Properties sidebar for updating assignee, status, or priority while recording entries to the audit log.
- Real-time SLA countdown indicator.
- Interactive five-star CSAT modal with one-time event binding handled safely in `initModals()`.

### 4.6 Knowledge Base Portal

- FAQ and troubleshooting content grouped by topic, including Account & Security, Billing, Technical & API, and Troubleshooting.
- Live keyword filtering across article titles and content.
- Helpfulness counters that persist user feedback.

### 4.7 Team Workload Management

- Detailed agent cards showing department, active ticket load, resolved counts, and satisfaction ratings.
- Workload capacity progress bars indicate available bandwidth.
- Quick filters help isolate tickets assigned to specific team members.

### 4.8 Reports and Analytics

- Summary cards provide average resolution time, first response time, SLA success rate, and overall CSAT.
- Native HTML5 canvas charts visualize:
  - Status distribution.
  - Department volume breakdown with responsive auto-scaling.
- Agent productivity leaderboard table.

---

## 5. Technical Decisions and Implementation Highlights

- **Unified event delegation:** Removed global `window` function assignments and inline `onclick` handlers in favor of a central event dispatcher (`initEventDelegation()`).
- **Schema migration pipeline:** Implemented `migrateData()` to validate current storage version (`CURRENT_SCHEMA_VERSION = 3`) and upgrade legacy records without data loss.
- **Design-token canvas rendering:** Chart logic reads active theme values through `getComputedStyle(document.documentElement)` to keep grid, label, and bar colors synchronized with light and dark modes.
- **HTML5 email validation:** Uses native browser validation via `checkValidity()` on `<input type="email">` instead of brittle regex checks.
- **Zero-dependency architecture:** The app runs without a build step, external packages, or third-party charting libraries.

---

## 6. Verification and Testing

1. **Role impersonation testing:** Verified that switching between agents and customers updates profile data, queue filters, and reply senders correctly.
2. **Schema migration testing:** Confirmed that unversioned or legacy data is upgraded to schema version 3 with required categories and notifications automatically restored.
3. **Event delegation and memory verification:** Confirmed that repeated `triggerCsatSurvey()` calls and rapid modal actions do not leak listeners or trigger duplicate bindings.
4. **Filter consistency testing:** Verified that quick filters, priority bars, metric cards, and dropdown selections reset cleanly through `getDefaultFilterState()`.
5. **Theme token reactivity testing:** Confirmed that toggling between light and dark themes updates both DOM elements and canvas charts with compliant contrast.

---

## 7. Conclusion

TicketHub CRM is a robust, accessible, and maintainable support platform. By reducing redundant logic, eliminating global event pollution, standardizing SLA handling, automating schema migration, and centralizing DOM event management, the project demonstrates a strong front-end solution built on web standards and practical support operations needs.
