# Glen Service Portal: White-Label Scaling Architecture

**Current Stack Overview:**
- **Frontend:** React 19, TypeScript, Vite
- **Backend & Database:** Supabase (PostgreSQL, Auth, RLS)
- **Workflow Automation:** n8n (Webhook-driven event processing)
- **Hosting:** Vercel (Edge delivery)

To scale this application into a multi-tenant, SaaS-style white-label platform, the following architectural upgrades and modifications are required:

## 1. Database & Multi-Tenancy (Supabase)
Currently, data is structured for a single organization.
*   **Tenant Identification:** Introduce a `tenant_id` (UUID) column to all major tables (`tickets`, `technicians`, `attendance`, `jobs`).
*   **Row Level Security (RLS):** Update all Supabase RLS policies to ensure users and technicians can only read/write data where `tenant_id` matches their authenticated session or user profile.
*   **Tenants Table:** Create a master `tenants` table to store tenant-specific configurations (company name, primary color, logo URL, custom domain).

## 2. Dynamic Theming & UI Customization (Frontend)
The app must adapt visually to each tenant's branding.
*   **CSS Variables & Theme Context:** Migrate hardcoded colors to CSS variables. Fetch the tenant's configuration on app load (based on sub-domain or custom domain) and inject these variables into the root `:root` or a ThemeProvider.
*   **Assets Configuration:** Replace the hardcoded logos and company names with dynamic references pointing to the tenant's assets stored in Supabase Storage.
*   **Custom Domains:** Utilize Vercel's Custom Domain and Edge Middleware features to detect incoming hostnames and route to the corresponding `tenant_id`.

## 3. Webhook & Automation Routing (n8n)
The current n8n webhook handles requests centrally for one business.
*   **Tenant Payload Injection:** Every frontend action payload (e.g., `NEW_TICKET`, `ADD_TECHNICIAN`) must include the `tenant_id`.
*   **Dynamic Credentials:** If tenants have unique integrations (like their own WhatsApp numbers or Google Sheets), the n8n workflows must use the `tenant_id` to dynamically fetch API credentials or route emails and messages from the correct sender profile.
*   **Unified vs. Segregated Workflows:** Decide whether to use a single master workflow with conditional routing by tenant, or provision separate n8n environments for high-tier tenants.

## 4. User Roles & Authentication
*   **Super Admin:** A top-level role that manages tenants, platform billing, and global settings.
*   **Tenant Admin:** A role specific to a `tenant_id` with access only to their technicians, tickets, and dashboard.
*   **Technician:** A role specific to a `tenant_id` that handles on-field operations for that specific organization.

## 5. Next Steps for Implementation
1.  **Draft Database Migration:** Add `tenant_id` to the local development environment and test standard user flows.
2.  **Vercel Edge Setup:** Configure Vercel to map subdomains (e.g., `client1.yourplatform.com`) to the main app dynamically.
3.  **Theme Abstraction:** Replace the main `index.css` colors with dynamic properties.
4.  **n8n Security Overhaul:** Ensure the webhook endpoint is secured and validates the `tenant_id` against the requester's identity.
