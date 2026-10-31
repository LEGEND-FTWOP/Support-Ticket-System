# TicketHub CRM

TicketHub CRM is a browser-based customer support and helpdesk dashboard designed to feel like a real internal support system. It helps teams track incoming issues, assign work, monitor SLA deadlines, and respond to customers without needing a backend or database setup.

Everything runs in the browser using local storage, which makes the app easy to open, test, and demo quickly.

---

## What this project does

This application simulates a modern support desk where users can:

- manage support tickets from creation to resolution
- switch between admin, agent, and customer perspectives
- automatically route tickets based on rules and keywords
- monitor workload, priorities, and response times
- view dashboards with analytics and trend indicators
- maintain internal notes, customer conversations, and audit history

It is built to feel practical and realistic, not just static demo UI.

---

## Key features

### Team and role switching
TicketHub lets you switch between different personas in the workspace, including admins, support agents, and customers. Each role sees a different view, permissions, and workflow, which makes the app feel more like a real CRM system rather than a single-page mockup.

### Smart ticket routing
Tickets can be assigned automatically using rule-based logic. The system checks ticket subject and description content, matches them to the right department, identifies urgency, and suggests the most suitable agent. This helps simulate how support operations often work in larger teams.

### Dashboard and analytics
The dashboard gives a quick overview of ticket activity, backlog, SLA risk, resolution rate, and team performance. It also includes visual indicators for urgency levels and workflow status so support leads can react quickly.

### SLA and case tracking
Each ticket includes priority-based service targets and progress indicators. Users can monitor how long a case has been open, what stage it is in, and whether it is approaching a deadline.

### Customer communication workflow
The app supports threaded conversations, internal notes, canned replies, and status updates. This makes it easier to manage the full lifecycle of a support interaction, from the first message to the final resolution.

### Knowledge base and self-service
There is also a built-in knowledge base where users can browse helpful articles and vote on whether content was useful. This adds a self-service layer that many real support platforms include.

### Accessibility and usability
The interface supports light and dark themes, responsive layouts, keyboard shortcuts, and a straightforward information hierarchy, making it easier to use across different screen sizes.

---

## Getting started

### Option 1: Open directly in the browser
Simply open `index.html` in a modern browser such as Chrome, Edge, Firefox, or Safari.

### Option 2: Run a local server
From the project folder, run:

```powershell
python run_server.py
```

Then open:

```text
http://localhost:8000/index.html
```

The project is designed to run locally without any external backend or database.

---

## Project structure

```text
INTERNSHIP/
├── index.html          # Main app layout and UI structure
├── style.css           # Styling, themes, layout, and responsive design
├── script.js           # App logic, state management, routing, and analytics
├── run_server.py       # Local development server
├── README.md           # Project overview and setup instructions
├── PROJECT_REPORT.md   # Technical analysis and design notes
└── LICENSE             # License information
```

---

## Tech stack

- HTML5 for structure and layout
- CSS3 for theme styling and responsive design
- Vanilla JavaScript for app logic and interaction
- Browser localStorage for persistent data
- Canvas API for analytics visuals
- FontAwesome and custom UI styling for a polished support dashboard feel

---

## Notes

This project is a practical front-end CRM/demo built for learning, portfolio presentation, and UI prototyping. It demonstrates how a helpdesk system could work in a browser without needing a server-side application.

---

## License

This project is licensed under the MIT License. You are free to use, adapt, and build on it for personal, educational, or portfolio purposes.
