# Supabase Data API Permissions Audit & Action Plan
## Mammas Bahía Platform

This audit outlines the impact of the upcoming Supabase security updates on the **Mammas Bahía** platform. It provides a complete map of the affected tables, details the immediate and long-term actions required, and includes a copy-pasteable SQL migration script to secure the database schema against these changes.

---

### 📅 Key Milestones

> [!IMPORTANT]
> - **May 30, 2026**: All **new** Supabase projects will hide `public` tables from the Data API (PostgREST) by default. Tables will require explicit SQL `GRANT` statements before `supabase-js`, PostgREST, or GraphQL clients can access them.
> - **October 30, 2026**: This explicit grant requirement will be **enforced on all existing projects** globally.

---

### 🔍 Are We Affected?

> [!NOTE]
> **YES, the Mammas Bahía platform is affected.**
>
> The project utilizes `@supabase/supabase-js` (`supabase-js` client library) extensively throughout the Next.js application to perform queries, inserts, and updates directly from the client and server actions. Because these operations route through the **Data API (PostgREST)**, any table we query must have explicit `GRANT` permissions in place when the changes take effect.

---

### 📋 Table-by-Table Impact Analysis

The application currently queries **4 distinct tables** in the `public` schema via `supabase-js`. The table below outlines the necessary role-based access for each:

| Table Name | Frontend / API Access | Target Roles | Action Required / SQL Grants |
| :--- | :--- | :--- | :--- |
| **`public.profiles`** | Checked during auth state change, user lookup, registration, and role checks (`admin`/`mamma` / `/admin/usuarios`). | `anon`, `authenticated`, `service_role` | `GRANT SELECT` to `anon`. <br> `GRANT SELECT, INSERT, UPDATE` to `authenticated`. <br> `GRANT ALL` to `service_role`. |
| **`public.events`** | Public can read published events. Admins can view draft + published, create events, and edit events. | `anon`, `authenticated`, `service_role` | `GRANT SELECT` to `anon`. <br> `GRANT SELECT, INSERT, UPDATE, DELETE` to `authenticated`. <br> `GRANT ALL` to `service_role`. |
| **`public.mammas_autorizadas`** | Anonymous users submit requests. Admins read, approve (update), and reject (update) requests. | `anon`, `authenticated`, `service_role` | `GRANT SELECT, INSERT` to `anon`. <br> `GRANT SELECT, INSERT, UPDATE, DELETE` to `authenticated`. <br> `GRANT ALL` to `service_role`. |
| **`public.providers`** <br>*(and old `proveedores`)* | Directory reads active providers publicly. Mammas create and update draft providers. Admins manage all providers. | `anon`, `authenticated`, `service_role` | `GRANT SELECT` to `anon`. <br> `GRANT SELECT, INSERT, UPDATE, DELETE` to `authenticated`. <br> `GRANT ALL` to `service_role`. |

---

### 🛠️ Proactive SQL Migration Script

To make sure nothing breaks on October 30, or when spinning up a new staging/dev project after May 30, copy and paste the following script into the **Supabase SQL Editor** and execute it. 

This script explicitly grants permissions to the internal Supabase roles used by the Data API:

```sql
-- ====================================================================
-- SUPABASE DATA API PERMISSIONS UPGRADE
-- Title: Mammas Bahía Explicit Grants Migration
-- Target: Apply explicit GRANTs for roles: anon, authenticated, service_role
-- ====================================================================

-- --------------------------------------------------
-- 1) Table: public.profiles
-- --------------------------------------------------
GRANT SELECT ON public.profiles TO anon;
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;

-- --------------------------------------------------
-- 2) Table: public.events
-- --------------------------------------------------
GRANT SELECT ON public.events TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.events TO authenticated;
GRANT ALL ON public.events TO service_role;

-- --------------------------------------------------
-- 3) Table: public.mammas_autorizadas
-- --------------------------------------------------
-- anon needs SELECT and INSERT to allow unauthenticated users to apply for membership
GRANT SELECT, INSERT ON public.mammas_autorizadas TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.mammas_autorizadas TO authenticated;
GRANT ALL ON public.mammas_autorizadas TO service_role;

-- --------------------------------------------------
-- 4) Table: public.providers (Active Directory Table)
-- --------------------------------------------------
GRANT SELECT ON public.providers TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.providers TO authenticated;
GRANT ALL ON public.providers TO service_role;

-- --------------------------------------------------
-- 5) Table: public.proveedores (Old MVP / Fallback Table)
-- --------------------------------------------------
GRANT SELECT ON public.proveedores TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.proveedores TO authenticated;
GRANT ALL ON public.proveedores TO service_role;

-- ====================================================================
-- Validation check: Tables are secured and accessible via API
-- ====================================================================
```

---

### 🚀 Actions Already Taken

To protect future deployments and keep your code in sync, **we have already updated your database provisioning SQL scripts** inside the `supabase/` folder to include these `GRANT` statements:

1. [events.sql](file:///Users/lolo/Desktop/KairosAi/code/mammas/supabase/events.sql) - Updated to include explicit grants for `public.events`.
2. [proveedores.sql](file:///Users/lolo/Desktop/KairosAi/code/mammas/supabase/proveedores.sql) - Updated to include explicit grants for `public.proveedores`.
3. [providers_policies_mamma_select_own.sql](file:///Users/lolo/Desktop/KairosAi/code/mammas/supabase/providers_policies_mamma_select_own.sql) - Updated to include explicit grants for `public.providers`.

---

### 🛡️ Best Practices Going Forward

1. **Always Include Explicit Grants**: Whenever you write new database migration SQL scripts or run `CREATE TABLE` commands in the future, follow this template:
   ```sql
   create table public.your_new_table ( ... );
   
   -- Enable RLS
   alter table public.your_new_table enable row level security;
   
   -- Grant permissions to Data API roles
   grant select on public.your_new_table to anon;
   grant select, insert, update, delete on public.your_new_table to authenticated;
   grant all on public.your_new_table to service_role;
   ```
2. **Dashboard Security Advisor**: Periodically check the **Security Advisor** inside your Supabase project dashboard. It will analyze your schema and warn you if any tables lack the explicit grants required for the Data API.
3. **No Codebase/Next.js Changes Needed**: Because your client-side implementation already targets the correct tables and leverages proper authentication headers, you do not need to modify any Next.js code, `supabase-js` initialization, or server actions. All actions are strictly database-side schema upgrades.
