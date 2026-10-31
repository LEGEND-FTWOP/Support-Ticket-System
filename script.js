(function () {
  'use strict';

  /**
 * TicketHub CRM - Support Ticket & Helpdesk System
 * Client-Side Single Page Application with persistent LocalStorage state.
 */


  const STORAGE_KEY = 'TICKETHUB_CRM_DATA_v3';
  const CURRENT_SCHEMA_VERSION = 3;
  const THEME_KEY = 'TICKETHUB_THEME';
  const hourMs = 3600 * 1000;

  const SLA_HOURS_BY_PRIORITY = {
    critical: 4,
    high: 12,
    medium: 24,
    low: 48
  };

  function formatDate(d = new Date()) {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    let hours = d.getHours();
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    return `${year}-${month}-${day} ${String(hours).padStart(2, '0')}:${minutes} ${ampm}`;
  }

  function formatRelativeTime(timestamp) {
    if (!timestamp) return '';
    const diffMs = Date.now() - timestamp;
    if (diffMs <= 0) return 'Just now';
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  }

  function getInitials(name) {
    if (!name) return 'AD';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return name.substring(0, 2).toUpperCase();
  }

  const DEFAULT_CATEGORIES = [
    { id: 'tech-support', name: 'Technical Support', color: '#7c3aed', icon: 'fa-laptop-code' },
    { id: 'account-billing', name: 'Account & Billing', color: '#3b82f6', icon: 'fa-file-invoice-dollar' },
    { id: 'bug-report', name: 'Bug Report', color: '#ef4444', icon: 'fa-bug' },
    { id: 'feature-request', name: 'Feature Request', color: '#10b981', icon: 'fa-lightbulb' },
    { id: 'general-inquiry', name: 'General Inquiry', color: '#f59e0b', icon: 'fa-circle-question' }
  ];

  const INITIAL_AGENTS = [
    { id: 1, name: "Sarah Chen", email: "sarah.c@tickethub.io", department: "Technical Support", role: "Senior Support Engineer", capacity: 8, baseResolved: 34, csat: 4.9 },
    { id: 2, name: "Marcus Vance", email: "marcus.v@tickethub.io", department: "Account & Billing", role: "Billing Specialist", capacity: 6, baseResolved: 28, csat: 4.7 },
    { id: 3, name: "Alex Rivera", email: "alex.r@tickethub.io", department: "Bug Report", role: "Tier 2 Systems Engineer", capacity: 8, baseResolved: 21, csat: 4.8 },
    { id: 4, name: "Emily Watson", email: "emily.w@tickethub.io", department: "Technical Support", role: "Escalations Lead", capacity: 5, baseResolved: 42, csat: 5.0 }
  ];

  const INITIAL_KB = [
    {
      id: 1,
      title: "Resetting account passwords and 2FA authenticator tokens",
      category: "Account & Security",
      content: "Navigate to Settings > Security. Click 'Reset Two-Factor Authentication' or use the 'Forgot Password' link at sign-in. A time-bound reset link is sent to your primary registered email within 2 minutes.",
      helpfulYes: 24,
      helpfulNo: 1
    },
    {
      id: 2,
      title: "Updating corporate payment cards and downloading annual tax receipts",
      category: "Billing & Subscriptions",
      content: "Itemized VAT and corporate billing receipts are generated on the 1st of every month. To update your corporate card, ACH/wire instructions, or company tax identifier, navigate to Billing > Invoices.",
      helpfulYes: 19,
      helpfulNo: 2
    },
    {
      id: 3,
      title: "Troubleshooting HTTP 500 & Webhook Signature Timeouts",
      category: "Technical & API",
      content: "An HTTP 500 or 502 error during webhook dispatch typically indicates your destination endpoint took longer than 5000ms to acknowledge receipt. Return a 200 OK immediately and process payloads asynchronously.",
      helpfulYes: 37,
      helpfulNo: 3
    },
    {
      id: 4,
      title: "Connecting custom support domains with automated SSL",
      category: "Troubleshooting",
      content: "Add a CNAME record pointing your subdomain (e.g., help.yourcompany.com) to cname.tickethub.io. DNS propagation and TLS certificate issuance complete within 20 minutes.",
      helpfulYes: 14,
      helpfulNo: 0
    },
    {
      id: 5,
      title: "Configuring SAML 2.0 Single Sign-On (SSO) with Okta and Microsoft Entra ID",
      category: "Account & Security",
      content: "Enterprise workspaces support SAML 2.0 and OIDC. Upload your Identity Provider metadata XML in Workspace Settings > Authentication > SSO Configuration and verify the ACS URL.",
      helpfulYes: 11,
      helpfulNo: 1
    }
  ];

  const INITIAL_CANNED = [
    { id: 1, title: "First Response & Investigation Acknowledgement", text: "Hello, thank you for contacting TicketHub Support. We have reviewed your report and are inspecting the relevant service logs. We will share an update shortly." },
    { id: 2, title: "Requesting HAR File & Console Logs", text: "Could you please share the browser network HAR file, console error logs, or the exact timestamp (UTC) when this error occurred so we can trace the request ID?" },
    { id: 3, title: "Fix Deployed & Verification Request", text: "We have deployed a configuration update to resolve this issue. Please refresh your session and confirm if the workflow is functioning as expected." },
    { id: 4, title: "Billing & Tax Invoice Confirmation", text: "We have updated your billing profile and regenerated the corporate invoice. You can download the signed PDF directly from your Billing > Statements tab." }
  ];

  function buildInitialTickets(baseTime = Date.now()) {
    const t1001Created = baseTime - (3 * hourMs);
    const t1002Created = baseTime - (4 * hourMs);
    const t1003Created = baseTime - (14 * hourMs);
    const t1004Created = baseTime - (48 * hourMs);
    const t1005Created = baseTime - (72 * hourMs);
    const t1006Created = baseTime - (22 * hourMs);

    return [
      {
        id: 1001,
        ticketCode: "TICK-1001",
        subject: "Stripe webhook signature mismatch on $4,850 enterprise renewal",
        description: "Production checkout failed with error: 'Webhook payload signature mismatch'. Enterprise customer renewals are blocked in pending state.",
        category: "Account & Billing",
        priority: "critical",
        status: "in-progress",
        customerName: "Alex Morgan",
        customerEmail: "alex.morgan@apexcloud.io",
        assignee: "Sarah Chen",
        createdAt: formatDate(new Date(t1001Created)),
        updatedAt: formatDate(new Date(baseTime - (1 * hourMs))),
        createdTimestamp: t1001Created,
        slaHours: SLA_HOURS_BY_PRIORITY.critical,
        slaDueTimestamp: t1001Created + (SLA_HOURS_BY_PRIORITY.critical * hourMs),
        slaStatus: "warning",
        attachment: "stripe_webhook_trace.log",
        triageSource: "auto",
        triageReason: "Auto-routed via Billing & Transaction Rule (triggers: 'webhook', 'signature', 'stripe')",
        sentiment: "urgent",
        messages: [
          {
            id: 1,
            senderName: "Alex Morgan",
            senderType: "customer",
            content: "Checkout keeps failing with signature verification errors on $4,850 annual plans. Need urgent resolution.",
            timestamp: formatDate(new Date(t1001Created))
          },
          {
            id: 2,
            senderName: "Sarah Chen",
            senderType: "agent",
            content: "Hi Alex, I am checking the payment gateway logs right now. It appears the webhook signing secret was rotated earlier today.",
            timestamp: formatDate(new Date(t1001Created + 20 * 60 * 1000))
          },
          {
            id: 3,
            senderName: "Sarah Chen",
            senderType: "internal",
            content: "Internal Note: DevOps rotated secondary webhook signing key without updating worker pods. Syncing configuration now.",
            timestamp: formatDate(new Date(t1001Created + 55 * 60 * 1000))
          }
        ],
        activity: [
          { text: "Status changed to In Progress", time: formatDate(new Date(t1001Created + 20 * 60 * 1000)) },
          { text: "Assigned to Sarah Chen", time: formatDate(new Date(t1001Created + 5 * 60 * 1000)) },
          { text: "Ticket created with Critical priority (Auto-routed: Billing Rule)", time: formatDate(new Date(t1001Created)) }
        ],
        csat: null
      },
      {
        id: 1002,
        ticketCode: "TICK-1002",
        subject: "Unable to invite new workspace admins to organization account",
        description: "When sending an invitation to dev-lead@cloudscale.io, the invite modal throws a 403 Insufficient Permissions error despite Admin role status.",
        category: "Technical Support",
        priority: "high",
        status: "new",
        customerName: "Elena Rostova",
        customerEmail: "elena.r@cloudscale.io",
        assignee: "Unassigned",
        createdAt: formatDate(new Date(t1002Created)),
        updatedAt: formatDate(new Date(t1002Created)),
        createdTimestamp: t1002Created,
        slaHours: SLA_HOURS_BY_PRIORITY.high,
        slaDueTimestamp: t1002Created + (SLA_HOURS_BY_PRIORITY.high * hourMs),
        slaStatus: "met",
        attachment: null,
        triageSource: "manual",
        triageReason: "Manual triage: Assigned from workspace owner escalation queue",
        sentiment: "frustrated",
        messages: [
          {
            id: 1,
            senderName: "Elena Rostova",
            senderType: "customer",
            content: "I hold Organization Owner permissions, but the member invite modal blocks new seat additions with a 403 error.",
            timestamp: formatDate(new Date(t1002Created))
          }
        ],
        activity: [
          { text: "Ticket submitted by Elena Rostova", time: formatDate(new Date(t1002Created)) }
        ],
        csat: null
      },
      {
        id: 1003,
        ticketCode: "TICK-1003",
        subject: "Dark mode data grid contrast issue on external displays",
        description: "In dark theme, muted secondary column labels inside data grids have insufficient contrast on calibrated monitors.",
        category: "Bug Report",
        priority: "medium",
        status: "in-progress",
        customerName: "David Kim",
        customerEmail: "david.kim@pixelcraft.io",
        assignee: "Alex Rivera",
        createdAt: formatDate(new Date(t1003Created)),
        updatedAt: formatDate(new Date(t1003Created + (6 * hourMs))),
        createdTimestamp: t1003Created,
        slaHours: SLA_HOURS_BY_PRIORITY.medium,
        slaDueTimestamp: t1003Created + (SLA_HOURS_BY_PRIORITY.medium * hourMs),
        slaStatus: "met",
        attachment: "contrast_audit.png",
        triageSource: "auto",
        triageReason: "Auto-routed via Defect & UI Regression Rule (triggers: 'contrast', 'dark mode', 'grid')",
        sentiment: "neutral",
        messages: [
          {
            id: 1,
            senderName: "David Kim",
            senderType: "customer",
            content: "Attached screenshot of the grid header contrast in dark theme.",
            timestamp: formatDate(new Date(t1003Created))
          },
          {
            id: 2,
            senderName: "Alex Rivera",
            senderType: "agent",
            content: "Thanks David! Replicated this and queued a CSS variable update for our next release.",
            timestamp: formatDate(new Date(t1003Created + (6 * hourMs)))
          }
        ],
        activity: [
          { text: "Assigned to Alex Rivera", time: formatDate(new Date(t1003Created + 20 * 60 * 1000)) },
          { text: "Ticket created by David Kim (Auto-routed: UI Defect Rule)", time: formatDate(new Date(t1003Created)) }
        ],
        csat: null
      },
      {
        id: 1004,
        ticketCode: "TICK-1004",
        subject: "Consolidated annual tax invoice & VAT receipt ($13,500)",
        description: "Our finance department requires a consolidated corporate tax invoice and itemized receipt for our annual enterprise tier.",
        category: "Account & Billing",
        priority: "low",
        status: "resolved",
        customerName: "Rachel Green",
        customerEmail: "rachel.g@vanguardholdings.com",
        assignee: "Marcus Vance",
        createdAt: formatDate(new Date(t1004Created)),
        updatedAt: formatDate(new Date(t1004Created + (29 * hourMs))),
        createdTimestamp: t1004Created,
        slaHours: SLA_HOURS_BY_PRIORITY.low,
        slaDueTimestamp: t1004Created + (SLA_HOURS_BY_PRIORITY.low * hourMs),
        slaStatus: "met",
        attachment: null,
        triageSource: "manual",
        triageReason: "Manual triage: Routed directly to billing specialist",
        sentiment: "neutral",
        messages: [
          {
            id: 1,
            senderName: "Rachel Green",
            senderType: "customer",
            content: "Please share the updated tax statement for $13,500 with our corporate tax ID.",
            timestamp: formatDate(new Date(t1004Created))
          },
          {
            id: 2,
            senderName: "Marcus Vance",
            senderType: "agent",
            content: "Hello Rachel, the itemized tax statement has been generated and uploaded to your billing portal.",
            timestamp: formatDate(new Date(t1004Created + (29 * hourMs)))
          }
        ],
        activity: [
          { text: "Ticket resolved by Marcus Vance", time: formatDate(new Date(t1004Created + (29 * hourMs))) },
          { text: "Assigned to Marcus Vance", time: formatDate(new Date(t1004Created + 15 * 60 * 1000)) },
          { text: "Ticket created by Rachel Green", time: formatDate(new Date(t1004Created)) }
        ],
        csat: { rating: 5, comment: "Prompt turnaround and accurate invoice delivery." }
      },
      {
        id: 1005,
        ticketCode: "TICK-1005",
        subject: "Feature Request: Filtered CSV export for audit compliance",
        description: "We need a direct export button on the Tickets Hub to export filtered ticket sets to CSV for weekly SOC2 audit reviews.",
        category: "Feature Request",
        priority: "low",
        status: "resolved",
        customerName: "Liam O'Connor",
        customerEmail: "liam@veritasretail.com",
        assignee: "Sarah Chen",
        createdAt: formatDate(new Date(t1005Created)),
        updatedAt: formatDate(new Date(t1005Created + (22 * hourMs))),
        createdTimestamp: t1005Created,
        slaHours: SLA_HOURS_BY_PRIORITY.low,
        slaDueTimestamp: t1005Created + (SLA_HOURS_BY_PRIORITY.low * hourMs),
        slaStatus: "met",
        attachment: null,
        triageSource: "auto",
        triageReason: "Auto-routed via Enhancement Request Rule (triggers: 'feature', 'export', 'csv')",
        sentiment: "positive",
        messages: [
          {
            id: 1,
            senderName: "Liam O'Connor",
            senderType: "customer",
            content: "Need CSV export capability for our weekly SOC2 audit review.",
            timestamp: formatDate(new Date(t1005Created))
          },
          {
            id: 2,
            senderName: "Sarah Chen",
            senderType: "agent",
            content: "Hi Liam, CSV export is now live in the Tickets Hub toolbar.",
            timestamp: formatDate(new Date(t1005Created + (22 * hourMs)))
          }
        ],
        activity: [
          { text: "Status changed to Resolved", time: formatDate(new Date(t1005Created + (22 * hourMs))) },
          { text: "Ticket created by Liam O'Connor (Auto-routed: Feature Rule)", time: formatDate(new Date(t1005Created)) }
        ],
        csat: { rating: 4, comment: "Works well, would love scheduled email exports next." }
      },
      {
        id: 1006,
        ticketCode: "TICK-1006",
        subject: "SAML 2.0 SSO redirect loop with Okta identity provider",
        description: "Users authenticating via corporate Okta SSO are redirected in a continuous loop due to an expired X.509 certificate.",
        category: "Technical Support",
        priority: "high",
        status: "on-hold",
        customerName: "Alex Morgan",
        customerEmail: "alex.morgan@apexcloud.io",
        assignee: "Sarah Chen",
        createdAt: formatDate(new Date(t1006Created)),
        updatedAt: formatDate(new Date(baseTime - (3 * hourMs))),
        createdTimestamp: t1006Created,
        slaHours: SLA_HOURS_BY_PRIORITY.high,
        slaDueTimestamp: t1006Created + (SLA_HOURS_BY_PRIORITY.high * hourMs),
        slaStatus: "breached",
        attachment: "okta_saml_trace.xml",
        triageSource: "auto",
        triageReason: "Auto-routed via Auth & Infrastructure Rule (triggers: 'sso', 'saml', 'redirect loop')",
        sentiment: "urgent",
        messages: [
          {
            id: 1,
            senderName: "Alex Morgan",
            senderType: "customer",
            content: "Users cannot sign in via SSO. Getting an infinite redirect loop.",
            timestamp: formatDate(new Date(t1006Created))
          },
          {
            id: 2,
            senderName: "Sarah Chen",
            senderType: "agent",
            content: "Hi Alex, your Identity Provider federation metadata has an expired signing certificate. Awaiting your IT team to upload the new certificate file.",
            timestamp: formatDate(new Date(baseTime - (3 * hourMs)))
          }
        ],
        activity: [
          { text: "Status changed to On Hold (Awaiting customer IT certificate)", time: formatDate(new Date(baseTime - (3 * hourMs))) },
          { text: "Ticket created with High Priority (Auto-routed: SSO Auth Rule)", time: formatDate(new Date(t1006Created)) }
        ],
        csat: null
      }
    ];
  }

  function buildInitialNotifications(baseTime = Date.now()) {
    return [
      { id: 1, title: "Critical Ticket Active", desc: "#TICK-1001: Stripe webhook failure", time: "10 mins ago", read: false },
      { id: 2, title: "SLA Breach Alert", desc: "#TICK-1006 exceeded 12h target window", time: "1 hour ago", read: false },
      { id: 3, title: "CSAT Rating Logged", desc: "Rachel Green rated #TICK-1004 (5/5)", time: "Yesterday", read: true }
    ];
  }

  function buildInitialEmails(baseTime = Date.now()) {
    const t1001Created = baseTime - (3 * hourMs);
    return [
      { to: "alex.morgan@apexcloud.io", subject: "[#TICK-1001] Support Request Logged", date: formatDate(new Date(t1001Created)), preview: "We have received your critical request regarding Stripe webhook signatures." },
      { to: "sarah.c@tickethub.io", subject: "[#TICK-1001] Assigned to Your Queue", date: formatDate(new Date(t1001Created + 5 * 60 * 1000)), preview: "Ticket #TICK-1001 (Critical) has been assigned to you." }
    ];
  }

  function migrateData(raw) {
    const data = raw || {};
    const ver = data.version || 1;
    if (ver < 2) {
      data.tickets = (data.tickets || []).map(t => ({
        ...t,
        triageSource: t.triageSource || 'auto',
        triageReason: t.triageReason || 'Auto-routed via rules',
        sentiment: t.sentiment || 'neutral'
      }));
    }
    if (ver < 3) {
      data.categories = Array.isArray(data.categories) && data.categories.length > 0
        ? data.categories
        : JSON.parse(JSON.stringify(DEFAULT_CATEGORIES));
      data.notifications = Array.isArray(data.notifications) ? data.notifications : buildInitialNotifications();
      data.emailLogs = Array.isArray(data.emailLogs) ? data.emailLogs : buildInitialEmails();
    }
    data.version = CURRENT_SCHEMA_VERSION;
    return data;
  }

  function getDefaultFilterState(overrides = {}) {
    return {
      search: '',
      status: 'all',
      priority: 'all',
      category: 'all',
      assignee: 'all',
      triage: 'all',
      sort: 'newest',
      ...overrides
    };
  }

  const appState = {
    currentRole: 'admin',
    activeAgentId: 1,
    activeCustomerName: 'Alex Morgan',
    activeCustomerEmail: 'alex.morgan@apexcloud.io',
    activeTicketId: 1001,
    filterState: getDefaultFilterState(),
    data: null,

    loadData() {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed && Array.isArray(parsed.tickets)) {
            const data = migrateData(parsed);
            this.data = data;
            return data;
          }
        }
      } catch {
        // Fall back to seed defaults if storage is corrupted
      }
      return this.resetToDefaults();
    },

    saveData() {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
      } catch (e) {
        console.error("Failed to save to localStorage:", e);
      }
    },

    resetToDefaults() {
      const now = Date.now();
      const defaultState = {
        version: CURRENT_SCHEMA_VERSION,
        tickets: buildInitialTickets(now),
        agents: JSON.parse(JSON.stringify(INITIAL_AGENTS)),
        kb: JSON.parse(JSON.stringify(INITIAL_KB)),
        canned: JSON.parse(JSON.stringify(INITIAL_CANNED)),
        notifications: buildInitialNotifications(now),
        emailLogs: buildInitialEmails(now),
        categories: JSON.parse(JSON.stringify(DEFAULT_CATEGORIES))
      };
      this.data = defaultState;
      this.saveData();
      return defaultState;
    },

    getAllCategories() {
      const base = Array.isArray(this.data.categories) && this.data.categories.length > 0
        ? this.data.categories
        : DEFAULT_CATEGORIES;
      const set = new Map();
      base.forEach(c => set.set(c.name, c));

      const palette = ['#7c3aed', '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4'];
      let palIdx = 0;
      this.data.tickets.forEach(t => {
        if (t.category && !set.has(t.category)) {
          set.set(t.category, {
            id: 'cat-' + t.category.toLowerCase().replace(/[^a-z0-9]/g, '-'),
            name: t.category,
            color: palette[palIdx % palette.length]
          });
          palIdx++;
        }
      });
      return Array.from(set.values());
    },

    addCategory(name, color = '#6366f1') {
      if (!name) return;
      if (!Array.isArray(this.data.categories)) {
        this.data.categories = JSON.parse(JSON.stringify(DEFAULT_CATEGORIES));
      }
      const existing = this.data.categories.find(c => c.name.toLowerCase() === name.toLowerCase());
      if (existing) {
        existing.color = color;
      } else {
        this.data.categories.push({
          id: 'cat-' + Date.now(),
          name: name.trim(),
          color: color || '#6366f1'
        });
      }
      this.saveData();
      populateCategoryDropdowns();
    },

    getDistinctCustomers() {
      const map = new Map();
      this.data.tickets.forEach(t => {
        if (t.customerName && !map.has(t.customerName.toLowerCase())) {
          let company = 'Client';
          if (t.customerEmail && t.customerEmail.includes('@')) {
            const domain = t.customerEmail.split('@')[1];
            company = domain.split('.')[0].toUpperCase();
          }
          map.set(t.customerName.toLowerCase(), {
            name: t.customerName,
            email: t.customerEmail || '',
            company
          });
        }
      });
      if (map.size === 0) {
        map.set('alex morgan', { name: 'Alex Morgan', email: 'alex.morgan@apexcloud.io', company: 'APEXCLOUD' });
      }
      return Array.from(map.values());
    },

    getActiveAgent() {
      const agents = this.data.agents || [];
      return agents.find(a => a.id === this.activeAgentId) || agents[0] || { id: 1, name: 'Support Staff', department: 'General' };
    },

    getRoleFilteredTickets() {
      this.refreshSlaStates();
      if (this.currentRole === 'customer') {
        const targetName = (this.activeCustomerName || 'Alex Morgan').toLowerCase();
        const targetEmail = (this.activeCustomerEmail || '').toLowerCase();
        return this.data.tickets.filter(t =>
          (t.customerName && t.customerName.toLowerCase() === targetName) ||
          (targetEmail && t.customerEmail && t.customerEmail.toLowerCase() === targetEmail)
        );
      }
      return this.data.tickets;
    },

    refreshSlaStates() {
      const currentMs = Date.now();
      this.data.tickets.forEach(t => {
        if (t.createdTimestamp) {
          t.createdAt = formatDate(new Date(t.createdTimestamp));
        }

        if (t.status === 'resolved' || t.status === 'closed') {
          if (t.slaStatus !== 'breached') t.slaStatus = 'met';
          return;
        }
        if (t.slaDueTimestamp && t.createdTimestamp) {
          const totalWindow = t.slaDueTimestamp - t.createdTimestamp;
          const remaining = t.slaDueTimestamp - currentMs;
          if (remaining <= 0) {
            t.slaStatus = 'breached';
          } else if (remaining < totalWindow * 0.25) {
            t.slaStatus = 'warning';
          } else {
            t.slaStatus = 'met';
          }
        }
      });
    },

    logEmail(to, subject, preview) {
      const now = formatDate(new Date());
      this.data.emailLogs.unshift({ to, subject, date: now, preview });
      this.saveData();
      renderEmailDrawer();
      showToast(`Notification sent to ${to}`, "info");
    },

    addNotification(title, desc) {
      this.data.notifications.unshift({
        id: Date.now(),
        title,
        desc,
        time: formatDate(new Date()),
        read: false
      });
      this.saveData();
      renderNotifications();
    }
  };
  appState.data = appState.loadData();

  const ROUTING_RULES = [
    {
      department: 'Account & Billing',
      ruleName: 'Billing & Transaction Rule',
      keywords: ['payment', 'billing', 'invoice', 'vat', 'tax', 'refund', 'charge', 'stripe', 'renewal', 'subscription', 'credit', 'checkout', 'ach', 'wire', 'deposit']
    },
    {
      department: 'Technical Support',
      ruleName: 'Auth & Infrastructure Rule',
      keywords: ['sso', 'saml', 'api', 'login', '2fa', 'authentication', 'token', 'certificate', 'timeout', 'webhook', 'redirect', 'okta', 'entra', 'auth', 'permissions', '403', '500', '502', 'oauth']
    },
    {
      department: 'Bug Report',
      ruleName: 'Defect & UI Regression Rule',
      keywords: ['bug', 'crash', 'contrast', 'glitch', 'broken', 'defect', 'loop', 'fails', 'error', 'exception', 'stack trace', 'regression', 'render', 'display', 'screen', 'grid']
    },
    {
      department: 'Feature Request',
      ruleName: 'Enhancement Request Rule',
      keywords: ['feature', 'request', 'export', 'csv', 'enhance', 'integration', 'add', 'option', 'ability', 'automate', 'proposal', 'customization']
    },
    {
      department: 'General Inquiry',
      ruleName: 'General Consultation Rule',
      keywords: ['how to', 'inquiry', 'question', 'help', 'guide', 'documentation', 'consultation']
    }
  ];

  function tokenize(text) {
    return text.toLowerCase().match(/[a-z0-9_-]+/g) || [];
  }

  function evaluateRoutingRules(subject = '', description = '') {
    const fullText = `${subject} ${description}`.toLowerCase();
    const tokenSet = new Set(tokenize(fullText));

    let rule = ROUTING_RULES[ROUTING_RULES.length - 1];
    let hits = [];
    let maxHits = 0;

    for (const r of ROUTING_RULES) {
      const matched = r.keywords.filter(k => {
        if (k.includes(' ')) return fullText.includes(k);
        return tokenSet.has(k);
      });
      if (matched.length > maxHits) {
        maxHits = matched.length;
        rule = r;
        hits = matched;
      }
    }

    const topCategory = rule.department;

    const criticalWords = ['outage', 'production', 'blocker', 'stuck', 'immediately', 'urgent', 'disaster', 'emergency', 'security', 'down', 'locked out', '403', '502'];
    const highWords = ['major', 'important', 'timeout', 'redirect loop', 'batch delayed', 'compliance', 'sso'];
    const lowWords = ['minor', 'export', 'cosmetic', 'feature request', 'low priority', 'feedback'];

    const criticalHits = criticalWords.filter(w => w.includes(' ') ? fullText.includes(w) : tokenSet.has(w));
    const highHits = highWords.filter(w => w.includes(' ') ? fullText.includes(w) : tokenSet.has(w));
    const lowHits = lowWords.filter(w => w.includes(' ') ? fullText.includes(w) : tokenSet.has(w));

    let priority = 'medium';
    let priorityNote = 'Standard queue';

    if (criticalHits.length > 0) {
      priority = 'critical';
      priorityNote = `Critical triggers: "${criticalHits.slice(0, 2).join('", "')}"`;
    } else if (highHits.length > 0) {
      priority = 'high';
      priorityNote = `High-impact triggers: "${highHits.slice(0, 2).join('", "')}"`;
    } else if (lowHits.length > 0 || topCategory === 'Feature Request') {
      priority = 'low';
      priorityNote = 'Non-blocking inquiry or enhancement';
    }

    let sentiment = 'neutral';
    if (criticalHits.length > 0 || tokenSet.has('stuck') || tokenSet.has('immediately')) {
      sentiment = 'urgent';
    } else if (tokenSet.has('locked') || tokenSet.has('failed') || tokenSet.has('broken') || tokenSet.has('cannot') || tokenSet.has('unable')) {
      sentiment = 'frustrated';
    } else if (tokenSet.has('thank') || tokenSet.has('great') || tokenSet.has('appreciate')) {
      sentiment = 'positive';
    }

    const agents = appState.data.agents;
    const deptAgents = agents.filter(a => a.department === topCategory);
    const suggestedAgent = deptAgents.length > 0 ? deptAgents[0].name : (agents[0] ? agents[0].name : 'Unassigned');

    const triggerSummary = hits.length > 0
      ? `Triggers: "${hits.slice(0, 3).join('", "')}"`
      : 'Fallback route';

    const reason = `${rule.ruleName} → ${topCategory} (${priority.toUpperCase()}). ${triggerSummary}. ${priorityNote}.`;

    return {
      category: topCategory,
      priority,
      sentiment,
      ruleName: rule.ruleName,
      matchedTriggers: hits,
      reason,
      suggestedAgent
    };
  }

  const REPLY_TEMPLATES = {
    'Account & Billing': (t) => `I have reviewed the billing and transaction logs regarding "${t.subject}". Our finance audit confirms the transaction is currently being verified against payment gateway records. We will share the updated statement as soon as the verification completes.`,
    'Technical Support': (t) => `We have inspected the service logs associated with your report on "${t.subject}". Our engineering team has isolated the underlying service condition and is applying the required configuration update.`,
    'Bug Report': (t) => `Thank you for the detailed report. We have reproduced the issue under our staging environment and filed a defect ticket in our sprint backlog.`,
    'Feature Request': (t) => `Thank you for sharing this workflow enhancement request regarding "${t.subject}". We have logged this request in our product backlog for review during our quarterly roadmap planning.`,
    'General Inquiry': (t) => `Thank you for contacting TicketHub Support regarding "${t.subject}". Our team is reviewing the inquiry and will follow up with complete next steps shortly.`
  };

  function generateContextualReply(ticket) {
    if (!ticket) return '';

    const firstName = ticket.customerName ? ticket.customerName.split(' ')[0] : 'there';
    const ticketCode = ticket.ticketCode || `TICK-${ticket.id}`;
    const agentName = appState.currentRole === 'agent'
      ? appState.getActiveAgent().name
      : (ticket.assignee !== 'Unassigned' ? ticket.assignee : 'Support Operations');

    const templateFn = REPLY_TEMPLATES[ticket.category] || REPLY_TEMPLATES['General Inquiry'];
    const body = templateFn(ticket);

    const statusMap = {
      'on-hold': 'We are keeping this ticket on hold pending further details from your side.',
      'in-progress': `This ticket is actively in progress under our ${ticket.slaHours}h SLA target window.`
    };
    const statusLine = statusMap[ticket.status] || '';

    return `Hi ${firstName},\n\nThank you for reaching out to TicketHub Support regarding #${ticketCode}.\n\n${body}\n\n${statusLine ? statusLine + '\n\n' : ''}Best regards,\n${agentName}\nTicketHub Support Team`;
  }

  function getStatusBadgeClass(status) {
    const map = {
      'new': 'badge-new',
      'in-progress': 'badge-in-progress',
      'on-hold': 'badge-on-hold',
      'resolved': 'badge-resolved',
      'closed': 'badge-closed'
    };
    return map[status] || 'badge-new';
  }

  function getStatusLabel(status) {
    const map = {
      'new': 'New',
      'in-progress': 'In Progress',
      'on-hold': 'On Hold',
      'resolved': 'Resolved',
      'closed': 'Closed'
    };
    return map[status] || status;
  }

  function getPriorityBadgeClass(priority) {
    const map = {
      'critical': 'badge-critical',
      'high': 'badge-high',
      'medium': 'badge-medium',
      'low': 'badge-low'
    };
    return map[priority] || 'badge-medium';
  }

  function computeMetrics(tickets) {
    const total = tickets.length;
    const active = tickets.filter(t => t.status === 'in-progress' || t.status === 'new').length;
    const newCount = tickets.filter(t => t.status === 'new').length;
    const critical = tickets.filter(t => t.priority === 'critical' && t.status !== 'resolved' && t.status !== 'closed').length;
    const resolved = tickets.filter(t => t.status === 'resolved' || t.status === 'closed').length;
    const resolutionRate = total > 0 ? Math.round((resolved / total) * 100) : 0;

    const breachedCount = tickets.filter(t => t.slaStatus === 'breached').length;
    const slaRate = total > 0 ? (((total - breachedCount) / total) * 100).toFixed(1) : '100.0';

    const ratedTickets = tickets.filter(t => t.csat && typeof t.csat.rating === 'number');
    const csatAvg = ratedTickets.length > 0
      ? (ratedTickets.reduce((sum, t) => sum + t.csat.rating, 0) / ratedTickets.length).toFixed(1)
      : '0.0';

    const avgSlaWindow = total > 0
      ? (tickets.reduce((sum, t) => sum + (t.slaHours || 24), 0) / total).toFixed(1)
      : '0.0';

    return {
      total,
      active,
      newCount,
      critical,
      resolved,
      resolutionRate,
      breachedCount,
      slaRate,
      csatAvg,
      ratedCount: ratedTickets.length,
      avgSlaWindow
    };
  }

  const toastIcons = {
    success: 'fa-circle-check',
    error: 'fa-circle-xmark',
    warning: 'fa-triangle-exclamation',
    info: 'fa-circle-info'
  };

  function showToast(message, type = "success") {
    const container = document.getElementById('toastContainer');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    const icon = toastIcons[type] || toastIcons.success;

    toast.innerHTML = `
      <i class="fa-solid ${icon}"></i>
      <div>${escapeHtml(message)}</div>
    `;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  }

  function navigateTo(targetHash) {
    let page = (targetHash || '#dashboard').replace('#', '');
    if (!page) page = 'dashboard';

    if (page.includes('?')) {
      const parts = page.split('?');
      page = parts[0];
      const params = new URLSearchParams(parts[1]);
      if (params.has('id')) {
        appState.activeTicketId = parseInt(params.get('id'), 10);
      }
    }

    const views = document.querySelectorAll('.page-view');
    views.forEach(v => v.classList.remove('active'));

    const targetView = document.getElementById(`view-${page}`);
    if (targetView) {
      targetView.classList.add('active');
    } else {
      document.getElementById('view-dashboard').classList.add('active');
      page = 'dashboard';
    }

    document.querySelectorAll('.nav-link').forEach(link => {
      link.classList.toggle('active', link.dataset.page === page);
    });

    closeMobileSidebar();
    updateSidebarBadges();

    if (page === 'dashboard') renderDashboard();
    if (page === 'tickets') renderTicketsList();
    if (page === 'ticket-detail') renderTicketDetail(appState.activeTicketId);
    if (page === 'knowledge-base') renderKnowledgeBase();
    if (page === 'agents') renderAgentsGrid();
    if (page === 'reports') renderReports();
    if (page === 'settings') renderSettings();

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function updateSidebarBadges() {
    const tickets = appState.getRoleFilteredTickets();
    const m = computeMetrics(tickets);
    document.getElementById('navBadgeTotal').textContent = m.total;
    document.getElementById('navBadgeOpen').textContent = m.active;
    document.getElementById('navBadgeAgents').textContent = appState.data.agents.length;
    document.getElementById('countCritical').textContent = m.critical;
    document.getElementById('countNew').textContent = m.newCount;
    document.getElementById('countInProgress').textContent = tickets.filter(t => t.status === 'in-progress').length;
  }

  function initRouter() {
    window.addEventListener('hashchange', () => {
      navigateTo(window.location.hash);
    });

    navigateTo(window.location.hash || '#dashboard');
  }

  function closeMobileSidebar() {
    const sidebar = document.getElementById('sidebar');
    const backdrop = document.getElementById('sidebarBackdrop');
    if (sidebar) sidebar.classList.remove('active');
    if (backdrop) backdrop.classList.remove('active');
  }

  function renderDashboard() {
    const tickets = appState.getRoleFilteredTickets();
    const m = computeMetrics(tickets);

    document.getElementById('kpiTotalTickets').textContent = m.total;
    document.getElementById('kpiTotalSubtext').textContent = appState.currentRole === 'customer' ? 'Your submitted tickets' : 'Total workspace records';
    document.getElementById('kpiActiveTickets').textContent = m.active;
    document.getElementById('kpiNewCount').textContent = m.newCount;
    document.getElementById('kpiCriticalTickets').textContent = m.critical;
    document.getElementById('kpiCriticalSubtext').textContent = m.critical > 0 ? 'Requires immediate triage' : 'Zero critical blockers';
    document.getElementById('kpiResolvedTickets').textContent = m.resolved;
    document.getElementById('kpiResolutionRate').textContent = `${m.resolutionRate}%`;
    document.getElementById('kpiSlaRate').textContent = `${m.slaRate}%`;
    document.getElementById('kpiBreachedCount').textContent = `${m.breachedCount} breached`;
    document.getElementById('kpiCsatScore').textContent = `${m.csatAvg} / 5.0`;
    document.getElementById('kpiCsatResponses').textContent = `${m.ratedCount} verified ${m.ratedCount === 1 ? 'review' : 'reviews'}`;

    updateSidebarBadges();
    renderPriorityBars(tickets);
    renderDashboardAgentWorkload(appState.data.tickets);
    renderDashboardRecentTickets(tickets);
  }

  function renderPriorityBars(tickets) {
    const wrapper = document.getElementById('priorityBarsWrapper');
    if (!wrapper) return;

    const counts = { critical: 0, high: 0, medium: 0, low: 0 };
    tickets.forEach(t => {
      if (counts[t.priority] !== undefined) counts[t.priority]++;
    });

    const total = tickets.length || 1;
    const priorities = [
      { key: 'critical', label: 'Critical', color: 'var(--color-critical)' },
      { key: 'high', label: 'High', color: 'var(--color-high)' },
      { key: 'medium', label: 'Medium', color: '#eab308' },
      { key: 'low', label: 'Low', color: 'var(--color-low)' }
    ];

    wrapper.innerHTML = priorities.map(p => {
      const count = counts[p.key] || 0;
      const pct = tickets.length > 0 ? Math.round((count / total) * 100) : 0;
      return `
        <div class="priority-bar-item" data-action="filter-priority" data-priority="${p.key}">
          <div class="priority-bar-header">
            <span>${p.label}</span>
            <span><strong>${count}</strong> (${pct}%)</span>
          </div>
          <div class="priority-progress-bg">
            <div class="priority-progress-fill" style="width: ${pct}%; background: ${p.color};"></div>
          </div>
        </div>
      `;
    }).join('');

    const statusCounts = { 'new': 0, 'in-progress': 0, 'on-hold': 0, 'resolved': 0, 'closed': 0 };
    tickets.forEach(t => {
      if (statusCounts[t.status] !== undefined) statusCounts[t.status]++;
    });

    const chipsWrapper = document.getElementById('statusSummaryChips');
    chipsWrapper.innerHTML = `
      <div class="status-chip" data-action="filter-status" data-status="new"><span class="priority-bullet new"></span> New: <strong>${statusCounts['new']}</strong></div>
      <div class="status-chip" data-action="filter-status" data-status="in-progress"><span class="priority-bullet in-progress"></span> In Progress: <strong>${statusCounts['in-progress']}</strong></div>
      <div class="status-chip" data-action="filter-status" data-status="on-hold"><span class="priority-bullet" style="background:#f59e0b"></span> On Hold: <strong>${statusCounts['on-hold']}</strong></div>
      <div class="status-chip" data-action="filter-status" data-status="resolved"><span class="priority-bullet" style="background:#10b981"></span> Resolved: <strong>${statusCounts['resolved']}</strong></div>
      <div class="status-chip" data-action="filter-status" data-status="closed"><span class="priority-bullet" style="background:#6b7280"></span> Closed: <strong>${statusCounts['closed']}</strong></div>
    `;
  }

  function renderDashboardAgentWorkload(allTickets) {
    const container = document.getElementById('dashboardAgentWorkload');
    if (!container) return;

    const agents = appState.data.agents;
    container.innerHTML = agents.map(agent => {
      const assignedTickets = allTickets.filter(t => t.assignee === agent.name && t.status !== 'resolved' && t.status !== 'closed');
      const load = assignedTickets.length;
      const pct = Math.min(100, Math.round((load / agent.capacity) * 100));
      const initials = agent.name.split(' ').map(n => n[0]).join('');

      return `
        <div class="agent-workload-item">
          <div class="agent-info-compact">
            <div class="agent-avatar-circle">${initials}</div>
            <div class="agent-name-role">
              <strong>${escapeHtml(agent.name)}</strong>
              <small>${escapeHtml(agent.department)}</small>
            </div>
          </div>
          <div class="workload-meter">
            <div class="workload-count">${load} / ${agent.capacity} active</div>
            <div class="workload-progress">
              <div class="workload-progress-fill" style="width: ${pct}%; ${pct > 80 ? 'background: var(--color-critical);' : ''}"></div>
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  function renderDashboardRecentTickets(tickets) {
    const tbody = document.getElementById('dashboardRecentTicketsTbody');
    if (!tbody) return;

    const recent = [...tickets].sort((a, b) => b.id - a.id).slice(0, 5);

    tbody.innerHTML = recent.map(t => {
      const slaClass = t.slaStatus === 'breached' ? 'breached' : (t.slaStatus === 'warning' ? 'warning' : 'met');
      const slaLabel = t.slaStatus === 'breached' ? 'Breached' : `${t.slaHours}h Target`;
      return `
        <tr>
          <td><span class="ticket-id-tag" data-action="view-ticket" data-id="${t.id}" title="View ticket details">#${t.ticketCode}</span></td>
          <td>
            <strong>${escapeHtml(t.customerName)}</strong>
            <small style="display:block; color:var(--text-muted); font-size:0.74rem;">${escapeHtml(t.customerEmail)}</small>
          </td>
          <td class="ticket-subject-cell" style="cursor:pointer;" data-action="view-ticket" data-id="${t.id}">
            <strong>${escapeHtml(t.subject)}</strong>
            <span>${escapeHtml(t.category)}</span>
          </td>
          <td><span class="badge ${getPriorityBadgeClass(t.priority)}">${t.priority}</span></td>
          <td><span class="badge ${getStatusBadgeClass(t.status)}">${getStatusLabel(t.status)}</span></td>
          <td>
            <div style="font-size:0.8rem; font-weight:600;">
              ${t.assignee === 'Unassigned' ? '<span style="color:var(--text-muted);">Unassigned</span>' : escapeHtml(t.assignee)}
            </div>
          </td>
          <td><span class="sla-badge ${slaClass}">${slaLabel}</span></td>
          <td>
            <button type="button" class="btn btn-outline btn-xs" data-action="view-ticket" data-id="${t.id}">
              <i class="fa-solid fa-arrow-right"></i> Open
            </button>
          </td>
        </tr>
      `;
    }).join('');
  }

  function renderTicketsList() {
    populateAssigneeFilters();
    populateCategoryDropdowns();

    const tickets = appState.getRoleFilteredTickets();
    const { search, status, priority, category, assignee, triage, sort } = appState.filterState;

    const filtered = tickets.filter(t => {
      if (search) {
        const q = search.toLowerCase();
        const matchSubject = t.subject.toLowerCase().includes(q);
        const matchDesc = t.description.toLowerCase().includes(q);
        const matchCode = t.ticketCode.toLowerCase().includes(q);
        const matchCustomer = t.customerName.toLowerCase().includes(q) || t.customerEmail.toLowerCase().includes(q);
        if (!matchSubject && !matchDesc && !matchCode && !matchCustomer) return false;
      }
      if (status !== 'all' && t.status !== status) return false;
      if (priority !== 'all' && t.priority !== priority) return false;
      if (category !== 'all' && t.category !== category) return false;
      if (assignee !== 'all' && t.assignee !== assignee) return false;
      if (triage && triage !== 'all' && t.triageSource !== triage) return false;
      return true;
    });

    filtered.sort((a, b) => {
      if (sort === 'newest') return b.id - a.id;
      if (sort === 'oldest') return a.id - b.id;
      if (sort === 'priority-desc') {
        const order = { critical: 4, high: 3, medium: 2, low: 1 };
        return (order[b.priority] || 0) - (order[a.priority] || 0);
      }
      if (sort === 'priority-asc') {
        const order = { critical: 4, high: 3, medium: 2, low: 1 };
        return (order[a.priority] || 0) - (order[b.priority] || 0);
      }
      if (sort === 'sla') {
        return a.slaHours - b.slaHours;
      }
      return b.id - a.id;
    });

    document.getElementById('ticketResultsCount').textContent = `Showing ${filtered.length} of ${tickets.length} tickets`;

    const tbody = document.getElementById('ticketsListTbody');
    const emptyState = document.getElementById('ticketsEmptyState');

    if (filtered.length === 0) {
      tbody.innerHTML = '';
      emptyState.classList.remove('hidden');
      return;
    }

    emptyState.classList.add('hidden');
    tbody.innerHTML = filtered.map(t => {
      const slaClass = t.slaStatus === 'breached' ? 'breached' : (t.slaStatus === 'warning' ? 'warning' : 'met');
      const slaLabel = t.slaStatus === 'breached' ? 'Breached' : `${t.slaHours}h SLA`;
      const hasAttachment = t.attachment ? `<i class="fa-solid fa-paperclip" title="Attachment: ${escapeHtml(t.attachment)}" style="margin-left:4px; color:var(--text-subtle);"></i>` : '';
      const deleteAction = appState.currentRole === 'admin'
        ? `<button type="button" class="btn btn-outline-danger btn-xs" data-action="delete-ticket" data-id="${t.id}" title="Delete ticket"><i class="fa-solid fa-trash"></i></button>`
        : '';

      const isAuto = t.triageSource === 'auto';
      const triagePill = `<span class="triage-pill ${isAuto ? 'triage-auto' : 'triage-manual'}" title="${escapeHtml(t.triageReason || (isAuto ? 'Auto-routed via rules' : 'Manual staff assignment'))}"><i class="fa-solid ${isAuto ? 'fa-bolt' : 'fa-user'}"></i> ${isAuto ? 'Auto' : 'Manual'}</span>`;

      return `
        <tr>
          <td><span class="ticket-id-tag" data-action="view-ticket" data-id="${t.id}" title="View ticket details">#${t.ticketCode}</span></td>
          <td class="ticket-subject-cell" style="cursor:pointer;" data-action="view-ticket" data-id="${t.id}">
            <strong>${escapeHtml(t.subject)} ${hasAttachment}</strong>
            <span>${escapeHtml(t.description.substring(0, 65))}...</span>
          </td>
          <td><span class="badge info">${escapeHtml(t.category)}</span></td>
          <td><span class="badge ${getPriorityBadgeClass(t.priority)}">${t.priority}</span></td>
          <td><span class="badge ${getStatusBadgeClass(t.status)}">${getStatusLabel(t.status)}</span></td>
          <td>
            <div style="font-weight:600; font-size:0.82rem;">${escapeHtml(t.customerName)}</div>
            <div style="font-size:0.72rem; color:var(--text-muted);">${escapeHtml(t.customerEmail)}</div>
          </td>
          <td>
            <div style="font-weight:600; font-size:0.82rem;">
              ${t.assignee === 'Unassigned' ? '<span style="color:var(--text-muted);">Unassigned</span>' : escapeHtml(t.assignee)}
            </div>
          </td>
          <td>${triagePill}</td>
          <td><span class="sla-badge ${slaClass}">${slaLabel}</span></td>
          <td>
            <div style="font-weight:600; font-size:0.78rem;">${formatRelativeTime(t.createdTimestamp)}</div>
            <div style="font-size:0.68rem; color:var(--text-muted);">${t.createdAt.split(' ')[0]}</div>
          </td>
          <td style="text-align: right;">
            <div style="display:flex; gap:6px; justify-content: flex-end;">
              <button type="button" class="btn btn-outline btn-xs" data-action="view-ticket" data-id="${t.id}" title="View ticket">
                <i class="fa-solid fa-eye"></i>
              </button>
              ${deleteAction}
            </div>
          </td>
        </tr>
      `;
    }).join('');
  }

  function populateAssigneeFilters() {
    const agents = appState.data.agents || [];
    const filterSelect = document.getElementById('filterAssigneeSelect');
    const formSelect = document.getElementById('ticketAssignee');
    const detailSelect = document.getElementById('detailAgentSelect');

    const filterVal = filterSelect ? filterSelect.value : 'all';
    const detailVal = detailSelect ? detailSelect.value : '';

    const agentOptions = agents.map(a => `<option value="${escapeHtml(a.name)}">${escapeHtml(a.name)} (${escapeHtml(a.department)})</option>`).join('');

    if (filterSelect) {
      filterSelect.innerHTML = `<option value="all">All Agents</option><option value="Unassigned">Unassigned</option>` + agentOptions;
      filterSelect.value = filterVal;
    }
    if (formSelect) {
      formSelect.innerHTML = `<option value="Unassigned">Unassigned</option>` + agentOptions;
    }
    if (detailSelect) {
      detailSelect.innerHTML = `<option value="Unassigned">Unassigned</option>` + agentOptions;
      if (detailVal) detailSelect.value = detailVal;
    }
  }

  function populateCategoryDropdowns() {
    const categories = appState.getAllCategories();
    const filterCatSelect = document.getElementById('filterCategorySelect');
    const formCatSelect = document.getElementById('ticketCategory');
    const agentDeptSelect = document.getElementById('agentDepartment');

    const curFilter = filterCatSelect ? filterCatSelect.value : 'all';
    const curForm = formCatSelect ? formCatSelect.value : '';
    const curAgent = agentDeptSelect ? agentDeptSelect.value : '';

    if (filterCatSelect) {
      filterCatSelect.innerHTML = `<option value="all">All Categories</option>` +
        categories.map(c => `<option value="${escapeHtml(c.name)}">${escapeHtml(c.name)}</option>`).join('');
      filterCatSelect.value = curFilter;
    }

    if (formCatSelect) {
      formCatSelect.innerHTML = `<option value="">Select Category...</option>` +
        categories.map(c => `<option value="${escapeHtml(c.name)}">${escapeHtml(c.name)}</option>`).join('');
      if (curForm) formCatSelect.value = curForm;
    }

    if (agentDeptSelect) {
      agentDeptSelect.innerHTML = `<option value="">Select Department...</option>` +
        categories.map(c => `<option value="${escapeHtml(c.name)}">${escapeHtml(c.name)}</option>`).join('');
      if (curAgent) agentDeptSelect.value = curAgent;
    }
  }

  function populateRoleSwitcher() {
    const roleSelect = document.getElementById('userRoleSelect');
    if (!roleSelect) return;

    const agents = appState.data.agents || [];
    const customers = appState.getDistinctCustomers();

    let html = `
      <optgroup label="System Administrator">
        <option value="admin">Support Admin (Global Access)</option>
      </optgroup>
      <optgroup label="Agents (Select to Impersonate)">
        ${agents.map(a => `<option value="agent:${a.id}">Agent: ${escapeHtml(a.name)} (${escapeHtml(a.department)})</option>`).join('')}
      </optgroup>
      <optgroup label="Customers (Select to Impersonate)">
        ${customers.map(c => `<option value="customer:${escapeHtml(c.name)}">Customer: ${escapeHtml(c.name)} (${escapeHtml(c.company || 'Client')})</option>`).join('')}
      </optgroup>
    `;

    roleSelect.innerHTML = html;

    if (appState.currentRole === 'admin') {
      roleSelect.value = 'admin';
    } else if (appState.currentRole === 'agent') {
      roleSelect.value = `agent:${appState.activeAgentId || (agents[0] ? agents[0].id : 1)}`;
    } else if (appState.currentRole === 'customer') {
      roleSelect.value = `customer:${appState.activeCustomerName || (customers[0] ? customers[0].name : 'Alex Morgan')}`;
    }
  }

  function initCreateTicketForm() {
    const form = document.getElementById('createTicketForm');
    const fileInput = document.getElementById('ticketFileInput');
    const dropZone = document.getElementById('fileDropZone');
    const filePreview = document.getElementById('fileUploadPreview');
    const fileNameDisplay = document.getElementById('fileNameDisplay');
    const removeFileBtn = document.getElementById('removeFileBtn');

    let currentAttachedFileName = null;
    let pendingRoutingRule = null;

    if (appState.currentRole === 'customer' && appState.activeCustomerName) {
      const nameInput = document.getElementById('ticketCreatedBy');
      const emailInput = document.getElementById('ticketCustomerEmail');
      if (nameInput) nameInput.value = appState.activeCustomerName;
      if (emailInput && appState.activeCustomerEmail) emailInput.value = appState.activeCustomerEmail;
    }

    const triggerAutoBtn = document.getElementById('triggerAutoTriageBtn');
    const autoPanel = document.getElementById('autoTriagePanel');
    const autoReason = document.getElementById('autoTriageReason');
    const ruleTag = document.getElementById('ruleMatchTag');
    const applyAutoBtn = document.getElementById('applyAutoTriageBtn');
    const dismissAutoBtn = document.getElementById('dismissAutoTriageBtn');

    if (triggerAutoBtn && autoPanel) {
      triggerAutoBtn.addEventListener('click', () => {
        const subject = document.getElementById('ticketSubject').value.trim();
        const description = document.getElementById('ticketDescription').value.trim();

        if (!subject && !description) {
          showToast("Please enter a subject or description first to evaluate routing rules", "warning");
          return;
        }

        pendingRoutingRule = evaluateRoutingRules(subject, description);
        if (ruleTag) ruleTag.textContent = pendingRoutingRule.ruleName;
        autoReason.innerHTML = `<strong>Suggested Department:</strong> ${escapeHtml(pendingRoutingRule.category)} &bull; <strong>Urgency:</strong> ${pendingRoutingRule.priority.toUpperCase()}<br><span style="color:var(--text-muted);">${escapeHtml(pendingRoutingRule.reason)}</span>`;
        autoPanel.classList.remove('hidden');
        showToast("Routing rule match calculated", "info");
      });

      if (applyAutoBtn) {
        applyAutoBtn.addEventListener('click', () => {
          if (!pendingRoutingRule) return;
          const catSelect = document.getElementById('ticketCategory');
          const prioSelect = document.getElementById('ticketPriority');
          const assignSelect = document.getElementById('ticketAssignee');

          if (catSelect) catSelect.value = pendingRoutingRule.category;
          if (prioSelect) prioSelect.value = pendingRoutingRule.priority;
          if (assignSelect && pendingRoutingRule.suggestedAgent) {
            assignSelect.value = pendingRoutingRule.suggestedAgent;
          }
          autoPanel.classList.add('hidden');
          showToast(`Applied: ${pendingRoutingRule.category} (${pendingRoutingRule.priority.toUpperCase()})`, "success");
        });
      }

      if (dismissAutoBtn) {
        dismissAutoBtn.addEventListener('click', () => {
          autoPanel.classList.add('hidden');
        });
      }
    }

    dropZone.addEventListener('click', (e) => {
      if (e.target !== removeFileBtn) fileInput.click();
    });

    fileInput.addEventListener('change', () => {
      if (fileInput.files && fileInput.files[0]) {
        currentAttachedFileName = fileInput.files[0].name;
        fileNameDisplay.textContent = currentAttachedFileName;
        filePreview.classList.remove('hidden');
      }
    });

    removeFileBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      currentAttachedFileName = null;
      fileInput.value = '';
      filePreview.classList.add('hidden');
    });

    form.addEventListener('submit', (e) => {
      e.preventDefault();

      const customerName = document.getElementById('ticketCreatedBy').value.trim();
      const customerEmail = document.getElementById('ticketCustomerEmail').value.trim();
      const subject = document.getElementById('ticketSubject').value.trim();
      const category = document.getElementById('ticketCategory').value;
      const priority = document.getElementById('ticketPriority').value;
      const assignee = document.getElementById('ticketAssignee').value;
      const description = document.getElementById('ticketDescription').value.trim();

      let isValid = true;
      document.getElementById('errCreatedBy').textContent = customerName ? "" : "Customer name is required";
      if (!customerName) isValid = false;

      const emailInput = document.getElementById('ticketCustomerEmail');
      const isValidEmail = customerEmail && emailInput && emailInput.checkValidity();
      document.getElementById('errCustomerEmail').textContent = isValidEmail ? "" : "Valid customer email is required";
      if (!isValidEmail) isValid = false;

      document.getElementById('errSubject').textContent = subject ? "" : "Ticket subject is required";
      if (!subject) isValid = false;

      document.getElementById('errCategory').textContent = category ? "" : "Please select a category";
      if (!category) isValid = false;

      document.getElementById('errDescription').textContent = description ? "" : "Please provide an issue description";
      if (!description) isValid = false;

      if (!isValid) return;

      const slaHours = SLA_HOURS_BY_PRIORITY[priority] || 24;

      const maxId = appState.data.tickets.reduce((max, t) => Math.max(max, t.id), 1000);
      const newId = maxId + 1;
      const ticketCode = `TICK-${newId}`;
      const createdDate = new Date();
      const nowStr = formatDate(createdDate);
      const dueDate = new Date(createdDate.getTime() + slaHours * hourMs);

      const isAuto = pendingRoutingRule !== null;
      const triageSource = isAuto ? 'auto' : 'manual';
      const triageReason = isAuto ? pendingRoutingRule.reason : `Directly submitted by ${customerName}`;
      const sentiment = isAuto ? pendingRoutingRule.sentiment : 'neutral';

      const newTicket = {
        id: newId,
        ticketCode,
        subject,
        description,
        category,
        priority,
        status: assignee !== 'Unassigned' ? 'in-progress' : 'new',
        customerName,
        customerEmail,
        assignee,
        createdAt: nowStr,
        updatedAt: nowStr,
        createdTimestamp: createdDate.getTime(),
        slaHours,
        slaDueTimestamp: dueDate.getTime(),
        slaStatus: "met",
        attachment: currentAttachedFileName,
        triageSource,
        triageReason,
        sentiment,
        messages: [
          {
            id: 1,
            senderName: customerName,
            senderType: "customer",
            content: description,
            timestamp: nowStr
          }
        ],
        activity: [
          { text: `Ticket created by ${customerName} (Due: ${formatDate(dueDate)}) - ${isAuto ? 'Auto-routed via rules' : 'Manual submission'}`, time: nowStr }
        ],
        csat: null
      };

      if (assignee !== 'Unassigned') {
        newTicket.activity.unshift({ text: `Assigned to ${assignee}`, time: nowStr });
      }

      appState.data.tickets.unshift(newTicket);
      appState.saveData();
      populateRoleSwitcher();
      populateCategoryDropdowns();
      pendingRoutingRule = null;
      if (autoPanel) autoPanel.classList.add('hidden');

      appState.logEmail(
        customerEmail,
        `[#${ticketCode}] Support Request Logged: ${subject}`,
        `Hello ${customerName}, your ticket #${ticketCode} has been logged with a ${slaHours}-hour SLA target.`
      );

      if (assignee !== 'Unassigned') {
        const agentObj = appState.data.agents.find(a => a.name === assignee);
        if (agentObj) {
          appState.logEmail(
            agentObj.email,
            `[#${ticketCode}] Assigned: ${subject}`,
            `Ticket #${ticketCode} (${priority.toUpperCase()}) has been assigned to your queue.`
          );
        }
      }

      appState.addNotification("New Support Ticket", `#${ticketCode}: ${subject} (${customerName})`);
      showToast(`Ticket #${ticketCode} created`, "success");

      form.reset();
      currentAttachedFileName = null;
      filePreview.classList.add('hidden');

      appState.activeTicketId = newId;
      window.location.hash = `#ticket-detail?id=${newId}`;
    });

    document.querySelectorAll('.template-chip').forEach(btn => {
      btn.addEventListener('click', () => {
        const type = btn.dataset.template;
        if (type === 'payment') {
          document.getElementById('ticketCreatedBy').value = "Jason Miller";
          document.getElementById('ticketCustomerEmail').value = "jason.m@apexlogistics.io";
          document.getElementById('ticketSubject').value = "Stripe payout batch delayed for $11,200 invoice";
          document.getElementById('ticketCategory').value = "Account & Billing";
          document.getElementById('ticketPriority').value = "high";
          document.getElementById('ticketDescription').value = "Our corporate ACH transfer cleared yesterday at 14:00 UTC (Transfer ID: tr_8302194810), but our subscription dashboard still indicates 'Payment Pending'.";
        } else if (type === 'login') {
          document.getElementById('ticketCreatedBy').value = "Clara Oswald";
          document.getElementById('ticketCustomerEmail').value = "clara.o@mediatrix.io";
          document.getElementById('ticketSubject').value = "2FA TOTP authentication failing across team accounts";
          document.getElementById('ticketCategory').value = "Technical Support";
          document.getElementById('ticketPriority').value = "critical";
          document.getElementById('ticketDescription').value = "Multiple team members are locked out of the dashboard because authenticator codes are rejected. Please inspect server clock drift or provide backup bypass tokens.";
        } else if (type === 'server') {
          document.getElementById('ticketCreatedBy').value = "Devon Scott";
          document.getElementById('ticketCustomerEmail').value = "devon@cloudstack.io";
          document.getElementById('ticketSubject').value = "REST API v2 returning 502 Bad Gateway on /api/v2/tickets/bulk";
          document.getElementById('ticketCategory').value = "Bug Report";
          document.getElementById('ticketPriority').value = "critical";
          document.getElementById('ticketDescription').value = "When querying batches larger than 250 records with custom date ranges, the API gateway terminates the connection after 10 seconds.";
        } else if (type === 'feature') {
          document.getElementById('ticketCreatedBy').value = "Hannah Abbott";
          document.getElementById('ticketCustomerEmail').value = "hannah@aurastudio.io";
          document.getElementById('ticketSubject').value = "Request: Automated monthly audit log export to JSON / S3";
          document.getElementById('ticketCategory').value = "Feature Request";
          document.getElementById('ticketPriority').value = "low";
          document.getElementById('ticketDescription').value = "Our security team requires an automated export pipeline for security audit logs and ticket resolutions directly to cloud storage.";
        }
        showToast("Preset populated", "info");
      });
    });

    document.getElementById('resetTicketFormBtn').addEventListener('click', () => {
      form.reset();
      filePreview.classList.add('hidden');
      currentAttachedFileName = null;
    });
  }

  function renderTicketDetail(ticketId) {
    appState.refreshSlaStates();
    const ticket = appState.data.tickets.find(t => t.id === ticketId);
    if (!ticket) {
      showToast("Ticket not found", "warning");
      window.location.hash = '#tickets';
      return;
    }

    document.getElementById('detailTicketId').textContent = `#${ticket.ticketCode}`;
    document.getElementById('detailSubject').textContent = ticket.subject;
    document.getElementById('detailRequesterName').textContent = ticket.customerName;
    document.getElementById('detailRequesterEmail').textContent = ticket.customerEmail;
    document.getElementById('detailCreatedAt').innerHTML = `${ticket.createdAt} <span style="font-size:0.8rem; color:var(--text-muted); font-weight:normal;">(${formatRelativeTime(ticket.createdTimestamp)})</span>`;
    document.getElementById('detailCategory').textContent = ticket.category;
    document.getElementById('detailDescription').textContent = ticket.description;

    const statusBadge = document.getElementById('detailStatusBadge');
    statusBadge.className = `badge ${getStatusBadgeClass(ticket.status)}`;
    statusBadge.textContent = getStatusLabel(ticket.status);

    const priorityBadge = document.getElementById('detailPriorityBadge');
    priorityBadge.className = `badge ${getPriorityBadgeClass(ticket.priority)}`;
    priorityBadge.textContent = ticket.priority.toUpperCase();

    const triageBadge = document.getElementById('detailTriageBadge');
    if (triageBadge) {
      const isAuto = ticket.triageSource === 'auto';
      triageBadge.className = `triage-pill ${isAuto ? 'triage-auto' : 'triage-manual'}`;
      triageBadge.innerHTML = `<i class="fa-solid ${isAuto ? 'fa-bolt' : 'fa-user'}"></i> ${isAuto ? 'Auto-Routed' : 'Manual Triage'}`;
    }

    const triageDisplay = document.getElementById('triageOriginDisplay');
    if (triageDisplay) {
      const isAuto = ticket.triageSource === 'auto';
      const sentiment = ticket.sentiment || 'neutral';
      triageDisplay.innerHTML = `
        <div class="triage-meta-item">
          <div class="triage-meta-label">Routing Method</div>
          <div class="triage-meta-value">
            <span class="triage-pill ${isAuto ? 'triage-auto' : 'triage-manual'}">
              <i class="fa-solid ${isAuto ? 'fa-bolt' : 'fa-user'}"></i> ${isAuto ? 'Auto-Routed (Rule-Based)' : 'Manual Staff Triage'}
            </span>
          </div>
        </div>
        <div class="triage-meta-item">
          <div class="triage-meta-label">Customer Sentiment</div>
          <div class="triage-meta-value">
            <span class="sentiment-badge sentiment-${sentiment}">
              <i class="fa-solid ${sentiment === 'urgent' ? 'fa-fire' : sentiment === 'frustrated' ? 'fa-triangle-exclamation' : sentiment === 'positive' ? 'fa-thumbs-up' : 'fa-circle-info'}"></i>
              ${sentiment.toUpperCase()}
            </span>
          </div>
        </div>
        <div class="triage-meta-item">
          <div class="triage-meta-label">Routing Note & Triggers</div>
          <div class="triage-meta-value" style="font-size:0.78rem; color:var(--text-muted);">
            ${escapeHtml(ticket.triageReason || (isAuto ? 'Auto-routed via department rule triggers' : 'Submitted directly via client portal'))}
          </div>
        </div>
      `;
    }

    document.getElementById('detailStatusSelect').value = ticket.status;
    document.getElementById('detailPrioritySelect').value = ticket.priority;
    populateAssigneeFilters();
    document.getElementById('detailAgentSelect').value = ticket.assignee;

    const slaStatusText = document.getElementById('slaStatusText');
    const slaRemainingTime = document.getElementById('slaRemainingTime');
    const slaProgressFill = document.getElementById('slaProgressFill');

    const totalMs = (ticket.slaHours || 24) * hourMs;
    const elapsedMs = Math.max(0, Date.now() - (ticket.createdTimestamp || (Date.now() - 2 * hourMs)));
    const pctUsed = Math.min(100, Math.round((elapsedMs / totalMs) * 100));
    const hoursLeft = Math.max(0, (( totalMs - elapsedMs ) / hourMs)).toFixed(1);

    slaStatusText.innerHTML = `Target: <strong>${ticket.slaHours}h</strong>`;
    if (ticket.status === 'resolved' || ticket.status === 'closed') {
      slaRemainingTime.className = 'badge badge-resolved';
      slaRemainingTime.textContent = 'SLA Met';
      slaProgressFill.style.width = '100%';
      slaProgressFill.style.background = 'var(--color-resolved)';
    } else if (ticket.slaStatus === 'breached' || pctUsed >= 100) {
      slaRemainingTime.className = 'badge badge-critical';
      slaRemainingTime.textContent = 'SLA Breached';
      slaProgressFill.style.width = '100%';
      slaProgressFill.style.background = 'var(--color-critical)';
    } else {
      slaRemainingTime.className = pctUsed > 75 ? 'badge badge-high' : 'badge info';
      slaRemainingTime.textContent = `${hoursLeft}h remaining (${pctUsed}%)`;
      slaProgressFill.style.width = `${pctUsed}%`;
      slaProgressFill.style.background = pctUsed > 75 ? 'var(--color-high)' : 'var(--primary)';
    }

    const csatBox = document.getElementById('detailCsatBox');
    const csatContainer = document.getElementById('csatDisplayContainer');
    if (ticket.csat) {
      csatBox.style.display = 'block';
      let starsHtml = '';
      for (let i = 1; i <= 5; i++) {
        starsHtml += `<i class="fa-solid fa-star" style="color: ${i <= ticket.csat.rating ? '#f59e0b' : '#d1d5db'}"></i>`;
      }
      csatContainer.innerHTML = `
        <div class="csat-rating-stars">${starsHtml} (${ticket.csat.rating}/5)</div>
        <div class="csat-comment-quote">"${escapeHtml(ticket.csat.comment || 'No written comment')}"</div>
      `;
    } else if (ticket.status === 'resolved' || ticket.status === 'closed') {
      csatBox.style.display = 'block';
      csatContainer.innerHTML = `
        <p style="font-size:0.78rem; color:var(--text-muted); margin-bottom:8px;">Awaiting customer satisfaction rating.</p>
        <button type="button" class="btn btn-outline btn-xs" data-action="trigger-csat" data-id="${ticket.id}">Log CSAT Rating</button>
      `;
    } else {
      csatBox.style.display = 'none';
    }

    renderMessagesStream(ticket);
    renderActivityTimeline(ticket);
    populateCannedResponseSelector();
  }

  function renderMessagesStream(ticket) {
    const container = document.getElementById('messagesStream');
    if (!container) return;

    const visibleMessages = (ticket.messages || []).filter(msg => {
      if (appState.currentRole === 'customer' && msg.senderType === 'internal') return false;
      return true;
    });

    if (visibleMessages.length === 0) {
      container.innerHTML = `<div class="empty-state" style="padding:20px;">No messages in this thread yet.</div>`;
      return;
    }

    container.innerHTML = visibleMessages.map(msg => {
      let cardClass = 'agent-reply';
      let badgeLabel = 'Support Engineer';
      let badgeStyle = 'badge-purple';
      let avatarLetter = msg.senderName.split(' ').map(n => n[0]).join('');

      if (msg.senderType === 'customer') {
        cardClass = 'customer-reply';
        badgeLabel = 'Customer';
        badgeStyle = 'info';
      } else if (msg.senderType === 'internal') {
        cardClass = 'internal-note';
        badgeLabel = 'Internal Staff Note';
        badgeStyle = 'badge-high';
        avatarLetter = 'IN';
      }

      return `
        <div class="message-bubble-card ${cardClass}">
          <div class="msg-header">
            <div class="msg-author-info">
              <div class="msg-avatar">${avatarLetter}</div>
              <div>
                <span class="msg-author-name">${escapeHtml(msg.senderName)}</span>
                <span class="badge ${badgeStyle} msg-badge-type">${badgeLabel}</span>
              </div>
            </div>
            <span class="msg-time">${msg.timestamp}</span>
          </div>
          <div class="msg-body">${escapeHtml(msg.content)}</div>
        </div>
      `;
    }).join('');
  }

  function renderActivityTimeline(ticket) {
    const timeline = document.getElementById('detailActivityTimeline');
    if (!timeline) return;

    timeline.innerHTML = (ticket.activity || []).map(act => `
      <li class="activity-item">
        <span class="activity-text">${escapeHtml(act.text)}</span>
        <span class="activity-time">${act.time}</span>
      </li>
    `).join('');
  }

  function populateCannedResponseSelector() {
    const select = document.getElementById('cannedResponseSelect');
    if (!select) return;

    const canned = appState.data.canned;
    select.innerHTML = `<option value="">Insert response macro...</option>` +
      canned.map(c => `<option value="${c.id}">${escapeHtml(c.title)}</option>`).join('');

    select.onchange = () => {
      const selectedId = parseInt(select.value, 10);
      const found = canned.find(c => c.id === selectedId);
      if (found) {
        document.getElementById('replyMessageText').value = found.text;
      }
    };
  }

  function initTicketDetailActions() {
    let activeReplyType = 'public';

    const tabPublic = document.getElementById('tabPublicReply');
    const tabInternal = document.getElementById('tabInternalNote');

    if (tabPublic && tabInternal) {
      tabPublic.addEventListener('click', () => {
        activeReplyType = 'public';
        tabPublic.classList.add('active');
        tabInternal.classList.remove('active');
        document.getElementById('replyMessageText').placeholder = "Type your reply to the customer...";
      });

      tabInternal.addEventListener('click', () => {
        activeReplyType = 'internal';
        tabInternal.classList.add('active');
        tabPublic.classList.remove('active');
        document.getElementById('replyMessageText').placeholder = "Type internal staff note (hidden from customer)...";
      });
    }

    const suggestedReplyBtn = document.getElementById('suggestedReplyBtn');
    if (suggestedReplyBtn) {
      suggestedReplyBtn.addEventListener('click', () => {
        const ticket = appState.data.tickets.find(t => t.id === appState.activeTicketId);
        if (!ticket) return;

        const replyDraft = generateContextualReply(ticket);
        const replyArea = document.getElementById('replyMessageText');
        if (replyArea) {
          replyArea.value = replyDraft;
          replyArea.focus();
          showToast("Contextual response template inserted", "info");
        }
      });
    }

    const insertKbBtn = document.getElementById('insertKbRefBtn');
    if (insertKbBtn) {
      insertKbBtn.addEventListener('click', () => {
        const ticket = appState.data.tickets.find(t => t.id === appState.activeTicketId);
        const matchingArticle = appState.data.kb.find(k =>
          ticket && (k.category.includes(ticket.category.split(' ')[0]) || ticket.subject.toLowerCase().includes('500'))
        ) || appState.data.kb[0];

        const replyText = document.getElementById('replyMessageText');
        if (matchingArticle) {
          replyText.value += `\n\nReference Guide — "${matchingArticle.title}":\n${matchingArticle.content}`;
          showToast(`Cited KB Article #${matchingArticle.id}`, "info");
        }
      });
    }

    let resolveUponSending = false;
    const quickResolveBtn = document.getElementById('quickResolveCheckboxBtn');
    if (quickResolveBtn) {
      quickResolveBtn.addEventListener('click', () => {
        resolveUponSending = !resolveUponSending;
        quickResolveBtn.classList.toggle('btn-primary', resolveUponSending);
        quickResolveBtn.classList.toggle('btn-outline', !resolveUponSending);
      });
    }

    const sendReplyBtn = document.getElementById('sendReplyBtn');
    if (sendReplyBtn) {
      sendReplyBtn.addEventListener('click', () => {
        const text = document.getElementById('replyMessageText').value.trim();
        if (!text) {
          showToast("Please enter a message", "warning");
          return;
        }

        const ticket = appState.data.tickets.find(t => t.id === appState.activeTicketId);
        if (!ticket) return;

        const nowStr = formatDate(new Date());
        let senderName = "Support Admin";
        if (appState.currentRole === 'agent') {
          senderName = appState.getActiveAgent().name;
        } else if (appState.currentRole === 'customer') {
          senderName = appState.activeCustomerName || ticket.customerName;
        }

        const newMsg = {
          id: Date.now(),
          senderName,
          senderType: activeReplyType === 'internal' ? 'internal' : (appState.currentRole === 'customer' ? 'customer' : 'agent'),
          content: text,
          timestamp: nowStr
        };

        ticket.messages.push(newMsg);
        ticket.updatedAt = nowStr;

        if (activeReplyType === 'internal') {
          ticket.activity.unshift({ text: `Internal note added by ${senderName}`, time: nowStr });
          showToast("Internal note saved", "info");
        } else {
          ticket.activity.unshift({ text: `Reply posted by ${senderName}`, time: nowStr });
          showToast("Reply posted", "success");

          if (newMsg.senderType === 'agent') {
            appState.logEmail(
              ticket.customerEmail,
              `Re: [#${ticket.ticketCode}] ${ticket.subject}`,
              text
            );
          }
        }

        if (resolveUponSending) {
          ticket.status = 'resolved';
          ticket.activity.unshift({ text: `Ticket marked as Resolved by ${senderName}`, time: nowStr });
          resolveUponSending = false;
          quickResolveBtn.classList.remove('btn-primary');
          quickResolveBtn.classList.add('btn-outline');
          triggerCsatSurvey(ticket.id);
        }

        appState.saveData();
        document.getElementById('replyMessageText').value = '';
        renderTicketDetail(ticket.id);
      });
    }

    const savePropsBtn = document.getElementById('savePropertiesBtn');
    if (savePropsBtn) {
      savePropsBtn.addEventListener('click', () => {
        const ticket = appState.data.tickets.find(t => t.id === appState.activeTicketId);
        if (!ticket) return;

        const newStatus = document.getElementById('detailStatusSelect').value;
        const newPriority = document.getElementById('detailPrioritySelect').value;
        const newAssignee = document.getElementById('detailAgentSelect').value;
        const nowStr = formatDate(new Date());

        let changed = false;

        if (ticket.status !== newStatus) {
          ticket.activity.unshift({ text: `Status updated from ${ticket.status} to ${newStatus}`, time: nowStr });
          ticket.status = newStatus;
          changed = true;
          if (newStatus === 'resolved') {
            triggerCsatSurvey(ticket.id);
          }
        }

        if (ticket.priority !== newPriority) {
          ticket.slaHours = SLA_HOURS_BY_PRIORITY[newPriority] || 24;
          ticket.slaDueTimestamp = (ticket.createdTimestamp || Date.now()) + ticket.slaHours * hourMs;
          ticket.activity.unshift({ text: `Priority changed from ${ticket.priority} to ${newPriority} (${ticket.slaHours}h SLA)`, time: nowStr });
          ticket.priority = newPriority;
          changed = true;
        }

        if (ticket.assignee !== newAssignee) {
          ticket.activity.unshift({ text: `Assigned agent updated to ${newAssignee}`, time: nowStr });
          ticket.assignee = newAssignee;
          changed = true;

          if (newAssignee !== 'Unassigned') {
            const agentObj = appState.data.agents.find(a => a.name === newAssignee);
            if (agentObj) {
              appState.logEmail(
                agentObj.email,
                `[#${ticket.ticketCode}] Ticket Assigned to You`,
                `You have been assigned to #${ticket.ticketCode}: ${ticket.subject}`
              );
            }
          }
        }

        if (changed) {
          ticket.updatedAt = nowStr;
          appState.saveData();
          updateSidebarBadges();
          showToast("Ticket properties updated", "success");
          renderTicketDetail(ticket.id);
        } else {
          showToast("No property changes to save", "info");
        }
      });
    }

    const deleteBtn = document.getElementById('detailDeleteTicketBtn');
    if (deleteBtn) {
      deleteBtn.addEventListener('click', () => {
        deleteTicket(appState.activeTicketId);
      });
    }
  }

  function viewTicketDetail(id) {
    appState.activeTicketId = id;
    window.location.hash = `#ticket-detail?id=${id}`;
  };

  function deleteTicket(id) {
    const ticket = appState.data.tickets.find(t => t.id === id);
    if (!ticket) return;

    if (confirm(`Permanently delete Ticket #${ticket.ticketCode} (${ticket.subject})?`)) {
      appState.data.tickets = appState.data.tickets.filter(t => t.id !== id);
      appState.saveData();
      updateSidebarBadges();
      showToast(`Ticket #${ticket.ticketCode} deleted`, "info");
      window.location.hash = '#tickets';
    }
  };

  function renderKnowledgeBase() {
    const articlesContainer = document.getElementById('kbArticlesContainer');
    const searchInput = document.getElementById('kbSearchInput');
    const query = searchInput ? searchInput.value.toLowerCase().trim() : '';

    const activePill = document.querySelector('.kb-cat-pill.active');
    const categoryFilter = activePill ? activePill.dataset.cat : 'all';

    const articles = appState.data.kb.filter(art => {
      if (categoryFilter !== 'all' && art.category !== categoryFilter) return false;
      if (query) {
        return art.title.toLowerCase().includes(query) || art.content.toLowerCase().includes(query);
      }
      return true;
    });

    if (articles.length === 0) {
      articlesContainer.innerHTML = `
        <div class="empty-state" style="grid-column: 1 / -1;">
          <div class="empty-icon"><i class="fa-solid fa-book-bookmark"></i></div>
          <h3>No matching articles</h3>
          <p>Try searching for different keywords or publish a new article.</p>
        </div>
      `;
      return;
    }

    articlesContainer.innerHTML = articles.map(art => `
      <div class="kb-article-card">
        <div>
          <div class="kb-article-header">
            <span class="kb-cat-badge">${escapeHtml(art.category)}</span>
          </div>
          <h4 class="kb-article-title">${escapeHtml(art.title)}</h4>
          <p class="kb-article-content">${escapeHtml(art.content)}</p>
        </div>
        <div class="kb-article-footer">
          <span>Helpful article?</span>
          <div class="kb-vote-buttons">
            <button type="button" class="kb-vote-btn" data-action="vote-kb" data-id="${art.id}" data-vote="yes">
              <i class="fa-regular fa-thumbs-up"></i> ${art.helpfulYes}
            </button>
            <button type="button" class="kb-vote-btn" data-action="vote-kb" data-id="${art.id}" data-vote="no">
              <i class="fa-regular fa-thumbs-down"></i> ${art.helpfulNo}
            </button>
          </div>
        </div>
      </div>
    `).join('');
  }

  function voteKb(id, voteType) {
    const art = appState.data.kb.find(a => a.id === id);
    if (!art) return;
    if (voteType === 'yes') art.helpfulYes++;
    if (voteType === 'no') art.helpfulNo++;
    appState.saveData();
    showToast("Feedback recorded", "success");
    renderKnowledgeBase();
  };

  function initKnowledgeBaseEvents() {
    const searchInput = document.getElementById('kbSearchInput');
    if (searchInput) {
      searchInput.addEventListener('input', () => renderKnowledgeBase());
    }

    document.querySelectorAll('.kb-cat-pill').forEach(pill => {
      pill.addEventListener('click', () => {
        document.querySelectorAll('.kb-cat-pill').forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        renderKnowledgeBase();
      });
    });

    const addForm = document.getElementById('addKbForm');
    if (addForm) {
      addForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const title = document.getElementById('kbTitle').value.trim();
        const category = document.getElementById('kbCategory').value;
        const content = document.getElementById('kbContent').value.trim();

        if (!title || !content) {
          showToast("Please fill all required fields", "warning");
          return;
        }

        const newId = appState.data.kb.reduce((m, k) => Math.max(m, k.id), 0) + 1;
        appState.data.kb.unshift({
          id: newId,
          title,
          category,
          content,
          helpfulYes: 1,
          helpfulNo: 0
        });
        appState.saveData();

        showToast("Knowledge Base article published", "success");
        addForm.reset();
        closeModal('modalAddKb');
        renderKnowledgeBase();
      });
    }

    document.getElementById('openAddKbModalBtn').addEventListener('click', () => {
      openModal('modalAddKb');
    });
  }

  function renderAgentsGrid() {
    const container = document.getElementById('agentsGridContainer');
    if (!container) return;

    const agents = appState.data.agents;
    const tickets = appState.data.tickets;

    container.innerHTML = agents.map(agent => {
      const activeTickets = tickets.filter(t => t.assignee === agent.name && t.status !== 'resolved' && t.status !== 'closed');
      const liveResolved = tickets.filter(t => t.assignee === agent.name && (t.status === 'resolved' || t.status === 'closed')).length;
      const totalResolved = (agent.baseResolved || 0) + liveResolved;
      const load = activeTickets.length;
      const pct = Math.min(100, Math.round((load / agent.capacity) * 100));
      const initials = agent.name.split(' ').map(n => n[0]).join('');

      return `
        <div class="agent-profile-card">
          <div class="agent-top-row">
            <div class="agent-big-avatar">${initials}</div>
            <div class="agent-name-box">
              <h4>${escapeHtml(agent.name)}</h4>
              <p>${escapeHtml(agent.role)} · <strong>${escapeHtml(agent.department)}</strong></p>
            </div>
          </div>

          <div class="agent-stats-row">
            <div class="agent-stat-box">
              <span class="number">${load}</span>
              <span class="label">Active Queue</span>
            </div>
            <div class="agent-stat-box">
              <span class="number">${totalResolved}</span>
              <span class="label">Total Resolved</span>
            </div>
          </div>

          <div class="agent-capacity-row">
            <div class="label-bar">
              <span>Workload Capacity</span>
              <span><strong>${load}</strong> / ${agent.capacity} Max</span>
            </div>
            <div class="workload-progress">
              <div class="workload-progress-fill" style="width: ${pct}%; ${pct > 80 ? 'background: var(--color-critical);' : ''}"></div>
            </div>
          </div>

          <div style="display:flex; justify-content:space-between; align-items:center; margin-top:auto;">
            <span style="font-size:0.78rem; color:var(--text-muted);">
              <i class="fa-solid fa-star" style="color:#f59e0b;"></i> ${agent.csat} CSAT
            </span>
            <button type="button" class="btn btn-outline btn-xs" data-action="filter-agent" data-agent="${escapeHtml(agent.name)}">
              Assigned Tickets &rarr;
            </button>
          </div>
        </div>
      `;
    }).join('');

    document.getElementById('navBadgeAgents').textContent = agents.length;
  }

  function filterByAgent(agentName) {
    appState.filterState = getDefaultFilterState({ assignee: agentName });
    syncFilterDropdowns();
    window.location.hash = '#tickets';
  };

  function filterByStatus(status) {
    appState.filterState = getDefaultFilterState({ status });
    syncFilterDropdowns();
    window.location.hash = '#tickets';
  };

  function filterByPriority(priority) {
    appState.filterState = getDefaultFilterState({ priority });
    syncFilterDropdowns();
    window.location.hash = '#tickets';
  };

  function syncFilterDropdowns() {
    const { search, status, priority, category, assignee, triage, sort } = appState.filterState;
    const searchInput = document.getElementById('ticketSearchInput');
    const statSelect = document.getElementById('filterStatusSelect');
    const prioSelect = document.getElementById('filterPrioritySelect');
    const catSelect = document.getElementById('filterCategorySelect');
    const assignSelect = document.getElementById('filterAssigneeSelect');
    const triageSelect = document.getElementById('filterTriageSelect');
    const sortSelect = document.getElementById('filterSortSelect');

    if (searchInput) searchInput.value = search;
    if (statSelect) statSelect.value = status;
    if (prioSelect) prioSelect.value = priority;
    if (catSelect) catSelect.value = category;
    if (assignSelect) assignSelect.value = assignee;
    if (triageSelect) triageSelect.value = triage || 'all';
    if (sortSelect) sortSelect.value = sort;
  }

  function initAgentsManagement() {
    const form = document.getElementById('addAgentForm');
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = document.getElementById('agentFullName').value.trim();
        const email = document.getElementById('agentEmail').value.trim();
        const department = document.getElementById('agentDepartment').value;
        const capacity = parseInt(document.getElementById('agentMaxCapacity').value, 10) || 8;

        if (!name || !email) {
          showToast("Name and Email are required", "warning");
          return;
        }

        const newId = appState.data.agents.reduce((m, a) => Math.max(m, a.id), 0) + 1;
        appState.data.agents.push({
          id: newId,
          name,
          email,
          department,
          role: "Support Specialist",
          capacity,
          baseResolved: 0,
          csat: 5.0
        });

        appState.saveData();
        showToast(`Agent ${name} added to roster`, "success");
        form.reset();
        closeModal('modalAddAgent');
        renderAgentsGrid();
        populateAssigneeFilters();
        populateRoleSwitcher();
        populateCategoryDropdowns();
      });
    }

    document.getElementById('openAddAgentModalBtn').addEventListener('click', () => {
      openModal('modalAddAgent');
    });
  }

  function renderReports() {
    const tickets = appState.getRoleFilteredTickets();
    const m = computeMetrics(tickets);

    document.getElementById('repAvgResolution').textContent = `${m.avgSlaWindow} hrs`;
    document.getElementById('repFirstResponse').textContent = `${m.resolutionRate}%`;
    document.getElementById('repSlaCompliance').textContent = `${m.slaRate}%`;
    document.getElementById('repCsatScore').textContent = `${m.csatAvg} / 5`;

    const tbody = document.getElementById('agentLeaderboardTbody');
    if (tbody) {
      const agents = appState.data.agents;
      tbody.innerHTML = agents.map(a => {
        const agentTickets = appState.data.tickets.filter(t => t.assignee === a.name);
        const handled = agentTickets.length;
        const activeCount = agentTickets.filter(t => t.status !== 'resolved' && t.status !== 'closed').length;
        const res = agentTickets.filter(t => t.status === 'resolved' || t.status === 'closed').length;
        const breached = agentTickets.filter(t => t.slaStatus === 'breached').length;
        const agentSla = handled > 0 ? Math.round(((handled - breached) / handled) * 100) : 100;

        const rated = agentTickets.filter(t => t.csat && typeof t.csat.rating === 'number');
        const liveCsat = rated.length > 0
          ? (rated.reduce((s, t) => s + t.csat.rating, 0) / rated.length).toFixed(1)
          : a.csat.toFixed(1);

        return `
          <tr>
            <td><strong>${escapeHtml(a.name)}</strong></td>
            <td><span class="badge info">${escapeHtml(a.department)}</span></td>
            <td>${handled} tickets</td>
            <td>${activeCount} open</td>
            <td><strong>${res + (a.baseResolved || 0)}</strong> (${res} current)</td>
            <td><i class="fa-solid fa-star" style="color:#f59e0b;"></i> ${liveCsat}</td>
            <td><span class="badge ${agentSla >= 90 ? 'badge-resolved' : 'badge-high'}">${agentSla}%</span></td>
          </tr>
        `;
      }).join('');
    }

    drawStatusBreakdownChart(tickets);
    drawCategoryDistributionChart(tickets);
  }

  function getThemeTokens() {
    const s = getComputedStyle(document.documentElement);
    return {
      textMain: s.getPropertyValue('--text-main').trim() || '#111827',
      textMuted: s.getPropertyValue('--text-muted').trim() || '#6b7280',
      chartGrid: s.getPropertyValue('--chart-grid').trim() || s.getPropertyValue('--border-color').trim() || '#e5e7eb',
      chartText: s.getPropertyValue('--chart-text').trim() || s.getPropertyValue('--text-muted').trim() || '#6b7280',
      chartBarBg: s.getPropertyValue('--chart-bar-bg').trim() || s.getPropertyValue('--bg-subtle').trim() || '#f3f4f6'
    };
  }

  function drawStatusBreakdownChart(tickets) {
    const canvas = document.getElementById('ticketsTrendCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;

    ctx.clearRect(0, 0, w, h);

    const statuses = [
      { key: 'new', label: 'New', color: '#7c3aed' },
      { key: 'in-progress', label: 'In Progress', color: '#0284c7' },
      { key: 'on-hold', label: 'On Hold', color: '#f59e0b' },
      { key: 'resolved', label: 'Resolved', color: '#10b981' },
      { key: 'closed', label: 'Closed', color: '#6b7280' }
    ];

    const counts = statuses.map(s => tickets.filter(t => t.status === s.key).length);
    const maxVal = Math.max(5, ...counts);

    const padding = 42;
    const chartW = w - padding * 2;
    const chartH = h - padding * 2;

    const theme = getThemeTokens();

    ctx.strokeStyle = theme.chartGrid;
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const y = padding + (chartH / 4) * i;
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(w - padding, y);
      ctx.stroke();

      ctx.fillStyle = theme.chartText;
      ctx.font = '11px Plus Jakarta Sans, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(Math.round(maxVal - (maxVal / 4) * i), 12, y + 4);
    }

    const colWidth = chartW / statuses.length;
    const barWidth = Math.min(54, colWidth * 0.55);

    statuses.forEach((st, idx) => {
      const val = counts[idx];
      const barH = (val / maxVal) * chartH;
      const x = padding + idx * colWidth + (colWidth - barWidth) / 2;
      const y = padding + chartH - barH;

      ctx.fillStyle = st.color;
      ctx.beginPath();
      ctx.roundRect(x, y, barWidth, Math.max(4, barH), [6, 6, 0, 0]);
      ctx.fill();

      ctx.fillStyle = theme.textMain;
      ctx.font = 'bold 12px Plus Jakarta Sans, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(String(val), x + barWidth / 2, y - 8);

      ctx.fillStyle = theme.chartText;
      ctx.font = '12px Plus Jakarta Sans, sans-serif';
      ctx.fillText(st.label, x + barWidth / 2, h - 14);
    });
  }

  function drawCategoryDistributionChart(tickets) {
    const canvas = document.getElementById('categoryDistributionCanvas');
    if (!canvas) return;

    const categoriesList = appState.getAllCategories();
    const categories = categoriesList.map(c => ({
      name: c.name,
      color: c.color || '#6366f1',
      count: tickets.filter(t => t.category === c.name).length
    }));

      const numCats = Math.max(1, categories.length);
    const minRowHeight = 44;
    const requiredHeight = Math.max(280, 36 + numCats * minRowHeight);
    if (canvas.height !== requiredHeight) {
      canvas.height = requiredHeight;
    }

    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;

    ctx.clearRect(0, 0, w, h);

    const maxCount = Math.max(4, ...categories.map(c => c.count));
    const paddingLeft = 145;
    const paddingRight = 45;
    const chartW = w - paddingLeft - paddingRight;

    const startY = 24;
    const availableH = h - startY - 18;
    const slotH = availableH / numCats;
    const barHeight = Math.max(14, Math.min(22, slotH * 0.52));
    const gap = slotH - barHeight;

    const theme = getThemeTokens();

    categories.forEach((cat, idx) => {
      const y = startY + idx * slotH + (gap / 2);
      const barW = (cat.count / maxCount) * chartW;

      ctx.fillStyle = theme.textMain;
      ctx.font = '12px Plus Jakarta Sans, sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(cat.name, paddingLeft - 14, y + barHeight * 0.72);

      ctx.fillStyle = theme.chartBarBg;
      ctx.beginPath();
      ctx.roundRect(paddingLeft, y, chartW, barHeight, 5);
      ctx.fill();

      if (barW > 0) {
        ctx.fillStyle = cat.color;
        ctx.beginPath();
        ctx.roundRect(paddingLeft, y, barW, barHeight, 5);
        ctx.fill();
      }

      ctx.fillStyle = theme.textMain;
      ctx.font = 'bold 12px Plus Jakarta Sans, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(String(cat.count), paddingLeft + barW + 8, y + barHeight * 0.72);
    });
  }

  function renderSettings() {
    const list = document.getElementById('cannedResponsesList');
    const summaryEl = document.getElementById('settingsStorageSummary');
    const storageKeyEl = document.getElementById('settingsStorageKeyDisplay');
    const catList = document.getElementById('settingsCategoryList');

    if (storageKeyEl) {
      storageKeyEl.textContent = STORAGE_KEY;
    }

    if (summaryEl) {
      summaryEl.textContent = `${appState.data.tickets.length} Tickets, ${appState.data.agents.length} Agents, ${appState.data.kb.length} KB Articles, ${appState.getAllCategories().length} Departments`;
    }

    if (catList) {
      const allCats = appState.getAllCategories();
      catList.innerHTML = allCats.map(c => {
        const count = appState.data.tickets.filter(t => t.category === c.name).length;
        return `
          <div class="category-item">
            <div class="category-item-left">
              <span class="category-color-dot" style="background:${c.color};"></span>
              <strong>${escapeHtml(c.name)}</strong>
            </div>
            <div>
              <span class="badge info" style="font-size:0.72rem;">${count} tickets</span>
            </div>
          </div>
        `;
      }).join('');
    }

    if (!list) return;

    list.innerHTML = appState.data.canned.map(c => `
      <div class="canned-item">
        <div class="canned-item-header">
          <strong>${escapeHtml(c.title)}</strong>
          <button type="button" class="btn btn-outline-danger btn-xs" data-action="delete-canned" data-id="${c.id}">&times; Delete</button>
        </div>
        <p>${escapeHtml(c.text)}</p>
      </div>
    `).join('');
  }

  function deleteCanned(id) {
    appState.data.canned = appState.data.canned.filter(c => c.id !== id);
    appState.saveData();
    showToast("Macro removed", "info");
    renderSettings();
  };

  function initSettingsEvents() {
    const addCannedForm = document.getElementById('addCannedForm');
    if (addCannedForm) {
      addCannedForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const title = document.getElementById('newCannedTitle').value.trim();
        const body = document.getElementById('newCannedBody').value.trim();

        if (!title || !body) return;

        const newId = appState.data.canned.reduce((m, c) => Math.max(m, c.id), 0) + 1;
        appState.data.canned.push({ id: newId, title, text: body });
        appState.saveData();

        showToast("Response macro saved", "success");
        addCannedForm.reset();
        renderSettings();
      });
    }

    const addCatForm = document.getElementById('addCategoryForm');
    if (addCatForm) {
      addCatForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const nameInput = document.getElementById('newCategoryName');
        const colorInput = document.getElementById('newCategoryColor');
        const name = nameInput.value.trim();
        const color = colorInput ? colorInput.value : '#6366f1';

        if (!name) return;

        appState.addCategory(name, color);
        addCatForm.reset();
        showToast(`Department "${name}" added`, "success");
        renderSettings();
        populateCategoryDropdowns();
      });
    }

    const factoryResetBtn = document.getElementById('factoryResetBtn');
    if (factoryResetBtn) {
      factoryResetBtn.addEventListener('click', () => {
        if (confirm("Restore all workspace tickets, agents, and articles to default state?")) {
          appState.resetToDefaults();
          populateRoleSwitcher();
          populateCategoryDropdowns();
          renderNotifications();
          renderEmailDrawer();
          showToast("Workspace restored to defaults", "success");
          navigateTo('#dashboard');
        }
      });
    }

    const dashNewTicketBtn = document.getElementById('dashboardNewTicketBtn');
    if (dashNewTicketBtn) {
      dashNewTicketBtn.addEventListener('click', () => {
        window.location.hash = '#create-ticket';
      });
    }

    const seedBtn = document.getElementById('seedDemoDataBtn');
    if (seedBtn) {
      seedBtn.addEventListener('click', () => {
        if (confirm("Restore default tickets and agents?")) {
          appState.resetToDefaults();
          renderNotifications();
          renderEmailDrawer();
          showToast("Default workspace data restored", "success");
          renderDashboard();
        }
      });
    }
  }

  function renderEmailDrawer() {
    const list = document.getElementById('emailLogsList');
    const badge = document.getElementById('emailCountBadge');
    const stats = document.getElementById('emailStatsCount');
    const logs = appState.data.emailLogs || [];

    if (badge) badge.textContent = logs.length;
    if (stats) stats.textContent = `${logs.length} Dispatched`;

    if (!list) return;

    if (logs.length === 0) {
      list.innerHTML = `<div class="empty-state" style="padding:20px;">No outbound emails logged.</div>`;
      return;
    }

    list.innerHTML = logs.map(em => `
      <div class="email-log-item">
        <div class="email-log-header">
          <span>To: <strong class="email-log-to">${escapeHtml(em.to)}</strong></span>
          <span>${escapeHtml(em.date)}</span>
        </div>
        <div class="email-log-subject">${escapeHtml(em.subject)}</div>
        <div class="email-log-body">${escapeHtml(em.preview)}</div>
      </div>
    `).join('');
  }

  function renderNotifications() {
    const list = document.getElementById('notificationList');
    const badge = document.getElementById('notifCountBadge');
    const notifs = appState.data.notifications || [];
    const unread = notifs.filter(n => !n.read).length;

    if (badge) {
      badge.textContent = unread;
      badge.style.display = unread > 0 ? 'inline-block' : 'none';
    }

    if (!list) return;

    list.innerHTML = notifs.map(n => `
      <div class="notif-item ${n.read ? '' : 'unread'}">
        <i class="fa-solid fa-bell notif-icon"></i>
        <div>
          <strong>${escapeHtml(n.title)}</strong>
          <div>${escapeHtml(n.desc)}</div>
          <div class="notif-time">${escapeHtml(n.time)}</div>
        </div>
      </div>
    `).join('');
  }

  function applyRolePermissions() {
    const isAdmin = appState.currentRole === 'admin';
    document.querySelectorAll('.admin-only-btn').forEach(el => {
      el.classList.toggle('hidden', !isAdmin);
    });
    const navSettings = document.getElementById('navItemSettings');
    if (navSettings) navSettings.classList.toggle('hidden', appState.currentRole === 'customer');
  }

  function initHeaderDrawerEvents() {
    const drawerBackdrop = document.getElementById('emailDrawerBackdrop');
    const emailBtn = document.getElementById('emailDrawerBtn');
    const closeEmailBtn = document.getElementById('closeEmailDrawerBtn');
    const clearEmailBtn = document.getElementById('clearEmailLogsBtn');

    if (emailBtn) {
      emailBtn.addEventListener('click', () => {
        renderEmailDrawer();
        drawerBackdrop.classList.add('active');
      });
    }

    if (closeEmailBtn) {
      closeEmailBtn.addEventListener('click', () => drawerBackdrop.classList.remove('active'));
    }

    if (drawerBackdrop) {
      drawerBackdrop.addEventListener('click', (e) => {
        if (e.target === drawerBackdrop) drawerBackdrop.classList.remove('active');
      });
    }

    if (clearEmailBtn) {
      clearEmailBtn.addEventListener('click', () => {
        appState.data.emailLogs = [];
        appState.saveData();
        renderEmailDrawer();
        showToast("Email log cleared", "info");
      });
    }

    const notifBtn = document.getElementById('notifBellBtn');
    const notifDropdown = document.getElementById('notificationDropdown');
    const markAllReadBtn = document.getElementById('markAllReadBtn');

    if (notifBtn) {
      notifBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        notifDropdown.classList.toggle('active');
      });
    }

    if (markAllReadBtn) {
      markAllReadBtn.addEventListener('click', () => {
        appState.data.notifications.forEach(n => n.read = true);
        appState.saveData();
        renderNotifications();
        showToast("Notifications marked as read", "info");
      });
    }

    document.addEventListener('click', (e) => {
      if (notifDropdown && !notifDropdown.contains(e.target) && e.target !== notifBtn) {
        notifDropdown.classList.remove('active');
      }
    });

    const roleSelect = document.getElementById('userRoleSelect');
    if (roleSelect) {
      roleSelect.addEventListener('change', () => {
        const val = roleSelect.value;
        const topName = document.getElementById('topProfileName');
        const topDept = document.getElementById('topProfileDept');
        const topPic = document.getElementById('topProfilePic');
        const roleAvatar = document.getElementById('currentRoleAvatar');

        if (val === 'admin') {
          appState.currentRole = 'admin';
          topName.textContent = "Support Admin";
          topDept.textContent = "Operations";
          topPic.innerHTML = "<span>AD</span>";
          if (roleAvatar) roleAvatar.innerHTML = '<i class="fa-solid fa-user-shield"></i>';
          appState.filterState.assignee = 'all';
        } else if (val.startsWith('agent:')) {
          appState.currentRole = 'agent';
          const agentId = parseInt(val.split(':')[1], 10);
          const agent = appState.data.agents.find(a => a.id === agentId) || appState.data.agents[0];
          appState.activeAgentId = agent.id;
          topName.textContent = agent.name;
          topDept.textContent = agent.role || agent.department;
          topPic.innerHTML = `<span>${getInitials(agent.name)}</span>`;
          if (roleAvatar) roleAvatar.innerHTML = '<i class="fa-solid fa-headset"></i>';
          appState.filterState.assignee = agent.name;
        } else if (val.startsWith('customer:')) {
          appState.currentRole = 'customer';
          const custName = val.substring(9);
          const cust = appState.getDistinctCustomers().find(c => c.name.toLowerCase() === custName.toLowerCase()) || { name: custName, email: '', company: 'Client' };
          appState.activeCustomerName = cust.name;
          appState.activeCustomerEmail = cust.email;
          topName.textContent = cust.name;
          topDept.textContent = cust.company || "Client Portal";
          topPic.innerHTML = `<span>${getInitials(cust.name)}</span>`;
          if (roleAvatar) roleAvatar.innerHTML = '<i class="fa-solid fa-user"></i>';
          appState.filterState.assignee = 'all';
        }

        applyRolePermissions();
        syncFilterDropdowns();
        navigateTo(window.location.hash || '#dashboard');
        showToast(`Workspace switched to ${topName.textContent}`, "info");
      });
    }

    document.getElementById('quickNewTicketBtn').addEventListener('click', () => {
      window.location.hash = '#create-ticket';
    });

    document.getElementById('newTicketFromListBtn').addEventListener('click', () => {
      window.location.hash = '#create-ticket';
    });

    const printBtn = document.getElementById('printReportBtn');
    if (printBtn) {
      printBtn.addEventListener('click', () => window.print());
    }
  }

  function initGlobalSearch() {
    const input = document.getElementById('globalSearchInput');
    const dropdown = document.getElementById('searchDropdown');

    if (!input || !dropdown) return;

    input.addEventListener('input', () => {
      const q = input.value.toLowerCase().trim();
      if (!q) {
        dropdown.classList.remove('active');
        dropdown.innerHTML = '';
        return;
      }

      const tickets = appState.getRoleFilteredTickets().filter(t =>
        t.subject.toLowerCase().includes(q) ||
        t.ticketCode.toLowerCase().includes(q) ||
        t.customerName.toLowerCase().includes(q) ||
        t.customerEmail.toLowerCase().includes(q)
      );

      const kb = appState.data.kb.filter(k =>
        k.title.toLowerCase().includes(q) ||
        k.category.toLowerCase().includes(q)
      );

      if (tickets.length === 0 && kb.length === 0) {
        dropdown.innerHTML = `<div style="padding:14px; font-size:0.8rem; color:var(--text-muted);">No matching results for "${escapeHtml(q)}"</div>`;
        dropdown.classList.add('active');
        return;
      }

      let html = '';

      if (tickets.length > 0) {
        html += `<div style="padding:6px 14px; font-size:0.7rem; font-weight:700; color:var(--primary); background:var(--bg-subtle);">TICKETS (${tickets.length})</div>`;
        tickets.slice(0, 5).forEach(t => {
          html += `
            <div class="search-result-item" data-action="view-ticket" data-id="${t.id}">
              <div>
                <div class="search-res-title">#${t.ticketCode}: ${escapeHtml(t.subject)}</div>
                <div class="search-res-meta">${escapeHtml(t.customerName)} · Status: ${t.status}</div>
              </div>
              <span class="badge ${getPriorityBadgeClass(t.priority)}">${t.priority}</span>
            </div>
          `;
        });
      }

      if (kb.length > 0) {
        html += `<div style="padding:6px 14px; font-size:0.7rem; font-weight:700; color:var(--color-resolved); background:var(--bg-subtle);">KNOWLEDGE BASE (${kb.length})</div>`;
        kb.slice(0, 3).forEach(k => {
          html += `
            <div class="search-result-item" data-action="navigate" data-target="#knowledge-base">
              <div>
                <div class="search-res-title"><i class="fa-solid fa-book" style="margin-right:6px;"></i> ${escapeHtml(k.title)}</div>
                <div class="search-res-meta">Category: ${escapeHtml(k.category)}</div>
              </div>
            </div>
          `;
        });
      }

      dropdown.innerHTML = html;
      dropdown.classList.add('active');
    });

    document.addEventListener('click', (e) => {
      if (!dropdown.contains(e.target) && e.target !== input) {
        dropdown.classList.remove('active');
      }
    });

    document.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        input.focus();
      }
    });
  }

  function initExports() {
    const exportCsvBtn = document.getElementById('exportTicketsCsvBtn');
    if (exportCsvBtn) {
      exportCsvBtn.addEventListener('click', () => {
        const tickets = appState.getRoleFilteredTickets();
        const headers = ["Ticket ID", "Subject", "Category", "Priority", "Status", "Customer Name", "Customer Email", "Assigned Agent", "SLA Hours", "SLA Status", "Created Date"];
        
        const rows = tickets.map(t => [
          `"${t.ticketCode}"`,
          `"${t.subject.replace(/"/g, '""')}"`,
          `"${t.category}"`,
          `"${t.priority}"`,
          `"${t.status}"`,
          `"${t.customerName}"`,
          `"${t.customerEmail}"`,
          `"${t.assignee}"`,
          `"${t.slaHours}"`,
          `"${t.slaStatus}"`,
          `"${t.createdAt}"`
        ]);

        const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `tickethub_tickets_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        showToast("Tickets exported to CSV", "success");
      });
    }

    const exportJsonBtn = document.getElementById('exportTicketsJsonBtn');
    if (exportJsonBtn) {
      exportJsonBtn.addEventListener('click', () => {
        const jsonStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(appState.data, null, 2));
        const link = document.createElement("a");
        link.setAttribute("href", jsonStr);
        link.setAttribute("download", `tickethub_workspace_${new Date().toISOString().split('T')[0]}.json`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        showToast("Workspace exported to JSON", "success");
      });
    }
  }

  function triggerCsatSurvey(ticketId) {
    const modal = document.getElementById('modalCsat');
    const ticketIdSpan = document.getElementById('csatTicketId');
    if (!modal) return;

    modal.dataset.ticketId = ticketId;
    modal.dataset.rating = '5';
    if (ticketIdSpan) ticketIdSpan.textContent = `#TICK-${ticketId}`;
    const commentInput = document.getElementById('csatComment');
    if (commentInput) commentInput.value = '';

    modal.querySelectorAll('.csat-star-btn').forEach(b => {
      b.classList.add('active');
    });

    openModal('modalCsat');
  }

  function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.add('active');
  }

  function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.remove('active');
  }

  function initModals() {
    document.querySelectorAll('[data-close-modal]').forEach(btn => {
      btn.addEventListener('click', () => closeModal(btn.dataset.closeModal));
    });

    document.querySelectorAll('.modal-backdrop').forEach(modal => {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.classList.remove('active');
      });
    });

    const csatModal = document.getElementById('modalCsat');
    if (csatModal) {
      const starBtns = csatModal.querySelectorAll('.csat-star-btn');
      starBtns.forEach(btn => {
        btn.addEventListener('click', () => {
          const rating = parseInt(btn.dataset.rating, 10);
          csatModal.dataset.rating = String(rating);
          starBtns.forEach(b => {
            const r = parseInt(b.dataset.rating, 10);
            b.classList.toggle('active', r <= rating);
          });
        });
      });

      const submitBtn = document.getElementById('submitCsatBtn');
      if (submitBtn) {
        submitBtn.addEventListener('click', () => {
          const ticketId = parseInt(csatModal.dataset.ticketId, 10);
          const rating = parseInt(csatModal.dataset.rating || '5', 10);
          const comment = document.getElementById('csatComment').value.trim();
          const ticket = appState.data.tickets.find(t => t.id === ticketId);
          if (ticket) {
            ticket.csat = { rating, comment };
            ticket.activity.unshift({ text: `Verified ${rating}-star CSAT rating recorded`, time: formatDate(new Date()) });
            appState.saveData();
            showToast(`CSAT rating (${rating}/5) saved`, "success");
          }
          closeModal('modalCsat');
          if (window.location.hash.includes('ticket-detail')) {
            renderTicketDetail(ticketId);
          } else if (window.location.hash.includes('dashboard')) {
            renderDashboard();
          }
        });
      }
    }
  }

  function initThemeAndMobile() {
    const themeToggleBtn = document.getElementById('themeToggleBtn');
    const savedTheme = localStorage.getItem(THEME_KEY) || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);

    if (themeToggleBtn) {
      themeToggleBtn.addEventListener('click', () => {
        const current = document.documentElement.getAttribute('data-theme') || 'light';
        const next = current === 'light' ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', next);
        localStorage.setItem(THEME_KEY, next);
        if (window.location.hash.includes('reports')) renderReports();
        showToast(`Appearance set to ${next} mode`, "info");
      });
    }

    const mobileBtn = document.getElementById('mobileMenuBtn');
    const sidebar = document.getElementById('sidebar');
    const backdrop = document.getElementById('sidebarBackdrop');
    const closeBtn = document.getElementById('sidebarCloseBtn');

    if (mobileBtn) {
      mobileBtn.addEventListener('click', () => {
        sidebar.classList.add('active');
        backdrop.classList.add('active');
      });
    }

    if (closeBtn) closeBtn.addEventListener('click', closeMobileSidebar);
    if (backdrop) backdrop.addEventListener('click', closeMobileSidebar);
  }

  function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function initFilterToolbar() {
    const searchInput = document.getElementById('ticketSearchInput');
    const clearSearchBtn = document.getElementById('clearTicketSearchBtn');
    const statusSelect = document.getElementById('filterStatusSelect');
    const prioritySelect = document.getElementById('filterPrioritySelect');
    const categorySelect = document.getElementById('filterCategorySelect');
    const assigneeSelect = document.getElementById('filterAssigneeSelect');
    const triageSelect = document.getElementById('filterTriageSelect');
    const sortSelect = document.getElementById('filterSortSelect');
    const resetFiltersBtn = document.getElementById('resetAllFiltersBtn');
    const emptyStateResetBtn = document.getElementById('emptyStateResetBtn');

    if (triageSelect) {
      triageSelect.addEventListener('change', () => {
        appState.filterState.triage = triageSelect.value;
        renderTicketsList();
      });
    }

    if (searchInput) {
      searchInput.addEventListener('input', () => {
        appState.filterState.search = searchInput.value.trim();
        clearSearchBtn.style.display = searchInput.value ? 'block' : 'none';
        renderTicketsList();
      });
    }

    if (clearSearchBtn) {
      clearSearchBtn.addEventListener('click', () => {
        searchInput.value = '';
        appState.filterState.search = '';
        clearSearchBtn.style.display = 'none';
        renderTicketsList();
      });
    }

    if (statusSelect) {
      statusSelect.addEventListener('change', () => {
        appState.filterState.status = statusSelect.value;
        renderTicketsList();
      });
    }

    if (prioritySelect) {
      prioritySelect.addEventListener('change', () => {
        appState.filterState.priority = prioritySelect.value;
        renderTicketsList();
      });
    }

    if (categorySelect) {
      categorySelect.addEventListener('change', () => {
        appState.filterState.category = categorySelect.value;
        renderTicketsList();
      });
    }

    if (assigneeSelect) {
      assigneeSelect.addEventListener('change', () => {
        appState.filterState.assignee = assigneeSelect.value;
        renderTicketsList();
      });
    }

    if (sortSelect) {
      sortSelect.addEventListener('change', () => {
        appState.filterState.sort = sortSelect.value;
        renderTicketsList();
      });
    }

    const clearAll = () => {
      appState.filterState = getDefaultFilterState();
      syncFilterDropdowns();
      if (clearSearchBtn) clearSearchBtn.style.display = 'none';
      renderTicketsList();
      showToast("Filters cleared", "info");
    };

    if (resetFiltersBtn) resetFiltersBtn.addEventListener('click', clearAll);
    if (emptyStateResetBtn) emptyStateResetBtn.addEventListener('click', clearAll);
  }

  function initEventDelegation() {
    document.addEventListener('click', (e) => {
      const actionEl = e.target.closest('[data-action]');
      if (!actionEl) return;
      const action = actionEl.dataset.action;

      if (action === 'view-ticket') {
        const id = parseInt(actionEl.dataset.id, 10);
        if (id) viewTicketDetail(id);
      } else if (action === 'delete-ticket') {
        const id = parseInt(actionEl.dataset.id, 10);
        if (id) deleteTicket(id);
      } else if (action === 'filter-priority') {
        filterByPriority(actionEl.dataset.priority);
      } else if (action === 'filter-status') {
        filterByStatus(actionEl.dataset.status);
      } else if (action === 'filter-agent') {
        filterByAgent(actionEl.dataset.agent);
      } else if (action === 'metric-card') {
        const type = actionEl.dataset.card;
        if (type === 'total') {
          appState.filterState = getDefaultFilterState();
          syncFilterDropdowns();
          window.location.hash = '#tickets';
        } else if (type === 'open') {
          filterByStatus('in-progress');
        } else if (type === 'critical') {
          filterByPriority('critical');
        } else if (type === 'resolved') {
          filterByStatus('resolved');
        } else if (type === 'sla' || type === 'csat') {
          window.location.hash = '#reports';
        }
      } else if (action === 'vote-kb') {
        const id = parseInt(actionEl.dataset.id, 10);
        voteKb(id, actionEl.dataset.vote);
      } else if (action === 'delete-canned') {
        const id = parseInt(actionEl.dataset.id, 10);
        deleteCanned(id);
      } else if (action === 'trigger-csat') {
        const id = parseInt(actionEl.dataset.id, 10);
        triggerCsatSurvey(id);
      } else if (action === 'navigate') {
        if (actionEl.dataset.target) window.location.hash = actionEl.dataset.target;
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        const actionEl = e.target.closest('[data-action][tabindex="0"], [data-action][role="button"]');
        if (actionEl) {
          e.preventDefault();
          actionEl.click();
        }
      }
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    initThemeAndMobile();
    initEventDelegation();
    populateCategoryDropdowns();
    populateRoleSwitcher();
    applyRolePermissions();
    initFilterToolbar();
    initCreateTicketForm();
    initTicketDetailActions();
    initKnowledgeBaseEvents();
    initAgentsManagement();
    initSettingsEvents();
    initHeaderDrawerEvents();
    initGlobalSearch();
    initExports();
    initModals();
    initRouter();

    renderNotifications();
    renderEmailDrawer();
  });

})();