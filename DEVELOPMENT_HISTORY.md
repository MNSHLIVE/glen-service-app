# Pandit Glen Service - Development & Update History

This file keeps track of modifications, structural updates, and feature implementations performed on the application.

---

## [2026-08-05] Version 4.8.0 - Multi-Tenant SaaS & Enhanced AI Scanner

### Database Migration
* Created `supabase_setup.sql` in the project root containing:
  * Schema for `agencies` (tenants) table.
  * Adding `agency_id` foreign keys to `tickets`, `technicians`, and `attendance` tables.
  * Creating high-performance indexes on `agency_id`.
  * Preserving existing data by seeding a default agency `'Pandit Glen Service'` (Code: `PGLEN2025`).

### Version Control Settings
* Switched to feature branch `feat/multi-user-ocr` for development.
* Created backup branch `backup/original` representing the original codebase before the multi-tenant SaaS upgrade.
