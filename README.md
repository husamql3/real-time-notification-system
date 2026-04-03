# db-studio Partnership & Collaboration Agreement

**Prepared by:** Hüsam Yıldırım
**Website:** [dbstudio.sh](https://dbstudio.sh/)
**GitHub:** [github.com/husamql3/db-studio](https://github.com/husamql3/db-studio)
**Date:** ******\_\_\_******

---

## Parties

|                      |                                |
| -------------------- | ------------------------------ |
| **Licensor**         | Hüsam Yıldırım (db-studio)     |
| **Partner**          | ************\_\_\_************ |
| **Partner Platform** | ************\_\_\_************ |

---

## 1. Features Included

The following features are delivered to the Partner as part of this agreement.

### 1.1 Foundation

- Solid connection to PostgreSQL & MySQL databases
- Full table browsing with row/column details
- Clear view of table structure and schema
- Modern spreadsheet-style interface
- Fast filtering and sorting of data
- Create new tables and insert rows

### 1.2 CLI & Distribution

- Run via `npx db-studio` with no installation required
- Custom port, env file path, and variable name flags
- Direct database URL flag

### 1.3 SQL Runner

- Monaco editor with PostgreSQL syntax highlighting and autocomplete
- Query execution with results in table and JSON format
- Execution time and row count display
- Save, favorite, and format queries
- Keyboard shortcuts for quick access

### 1.4 AI Chat Assistant

- Natural language questions about your data
- Uses database schema as context for accurate responses

### 1.5 Multi-Database Support

- PostgreSQL — full support
- MySQL — full support (v1.4)
- SQLite — in progress
- MongoDB — in progress
- Oracle & SQL Server — in progress
- Redis — in progress
- Switch between multiple database connections on the same host

### 1.6 Data Management

- Export table data to CSV, JSON, and Excel
- Bulk insert records via CSV, JSON, or Excel
- Delete table with foreign key constraint support
- Copy table schema
- Delete column from table
- Primary key and foreign key column indicators
- Confirmation dialog for destructive actions

### 1.7 Upcoming Roadmap Features (Included in Active Plan Updates)

- ER diagram — interactive table relationship visualization
- Indexes section — view, add, edit, remove indexes
- Schema section — views, functions, triggers, extensions
- Safe query playground with no risk of data loss
- Query history and saved favorites
- AI-powered SQL generation from plain English
- AI query explanation in simple English
- Query optimization suggestions
- Visual query builder (drag and drop)
- Database structure comparison and diff scripts
- Query results as charts

---

## 2. Pricing Plans

All plans include: custom integration adapted to the Partner's platform, updates during the plan period (Active Plan only), and live support as defined in Section 4.

### 2.1 Plan Tiers

| Plan               | Price (USD) | Effective / Month | Savings vs Quarterly |
| ------------------ | ----------- | ----------------- | -------------------- |
| 3 Months           | $350        | ~$117 / mo        | —                    |
| 6 Months           | $600        | ~$100 / mo        | Save ~$100           |
| 12 Months (Annual) | $1,000      | ~$83 / mo         | Save ~$400           |

Payment is due upfront at the start of each plan period. Late payments beyond 3 days incur a 5% monthly late fee.

### 2.2 Plan Types

| Type                 | What's Included                                              | Price                     |
| -------------------- | ------------------------------------------------------------ | ------------------------- |
| **Active Plan**      | All features + public roadmap updates + support              | Full price above          |
| **Maintenance Plan** | Bug fixes + security patches + support only, no new features | 35% less than active rate |

The Partner may switch from Active to Maintenance at any renewal date with 14 days written notice.

---

## 3. Requested Features Policy

| Plan             | Included Requests | Turnaround |
| ---------------- | ----------------- | ---------- |
| 3 Months         | 2 requests        | 2–3 weeks  |
| 6 Months         | 3 requests        | 2–3 weeks  |
| 12 Months        | 5 requests        | 1–2 weeks  |
| Maintenance Plan | 0 requests        | N/A        |

### 3.1 Extra Requests (Beyond Quota)

| Type                      | Rate                         |
| ------------------------- | ---------------------------- |
| Minor feature / UI change | $50 flat                     |
| Medium feature            | $100–200 flat                |
| Major / complex feature   | $60/hr (quoted before start) |

### 3.2 Rules

- Bug fixes are always free and not counted against the quota
- A "feature request" is any new functionality not on the public roadmap
- Licensor reserves the right to decline any request deemed infeasible or out of scope
- All extra requests must be agreed in writing before work begins
- Unused quota requests do **not** carry over to the next period

---

## 4. Live Support

|                       |                                                             |
| --------------------- | ----------------------------------------------------------- |
| **Primary Channel**   | WhatsApp or Discord (agreed at contract start)              |
| **Secondary Channel** | Email — for formal requests and documentation               |
| **Hours**             | Sunday–Thursday, 9:00 AM – 6:00 PM (GMT+3)                  |
| **Response Time**     | Within 24 hours on business days                            |
| **Emergency**         | Critical production issues: within 4 hours on business days |

### 4.1 What Support Covers

- Answering questions about db-studio usage and configuration
- Debugging connection or integration issues
- Guidance on new features as they are released
- Reviewing and advising on feature requests

### 4.2 What Support Does NOT Cover

- Building new features — falls under Section 3
- Support for the Partner's own infrastructure or third-party services
- After-hours or weekend emergency support (unless separately agreed)

> Support is provided by Hüsam Yıldırım personally. Response times are best-effort and may vary during public holidays.

---

## 5. Renewal & Pricing

### 5.1 Active Plan — Price Increase Policy

Renewal pricing may increase by **up to 20% per term**, reflecting new features and improvements delivered during the prior period. Licensor will notify the Partner at least **30 days before renewal** of any pricing change.

Price increases only apply if the Partner is on the **Active Plan** and new features were shipped during their contract period. If no meaningful updates were delivered, the renewal price remains the same.

### 5.2 Maintenance Plan — No Increases

Partners on the Maintenance Plan receive **no price increases** at renewal. The rate is fixed as long as they remain on maintenance tier.

### 5.3 Early Renewal Discount

If the Partner renews at least **60 days before expiry**, they lock in current pricing for one additional term — no increase applied.

### 5.4 Renewal Trajectory (Annual Active Plan)

| Year   | Price        | Monthly Equiv. | Note          |
| ------ | ------------ | -------------- | ------------- |
| Year 1 | $1,000       | ~$83           | Starting rate |
| Year 2 | $1,100–1,200 | ~$92–100       | Up to +20%    |
| Year 3 | $1,200–1,440 | ~$100–120      | Up to +20%    |

---

## 6. Agreement Terms

### 6.1 License

db-studio is licensed under the **Business Source License 1.1 (BUSL 1.1)**. The Partner is granted a commercial license to use db-studio in production as part of their hosting platform, subject to this agreement. This license is non-transferable and non-sublicensable.

### 6.2 Scope of Custom Work

The Licensor will deliver a version of db-studio adapted to the Partner's hosting platform as described at contract start. Any scope changes must be agreed in writing. Vague or undocumented requests are not covered.

### 6.3 Ownership of Custom Work

Any custom code written specifically for the Partner remains the intellectual property of Hüsam Yıldırım. The Partner receives a license to use it during the active contract period. The Licensor retains the right to reuse patterns and non-Partner-specific code in other projects.

### 6.4 Non-Exclusivity

This agreement is non-exclusive. The Licensor reserves the right to offer db-studio or similar services to other parties, including competing platforms, unless the Partner separately purchases an exclusivity clause (pricing on request).

### 6.5 Termination

- Either party may terminate with **30 days written notice**
- Upon termination, the Partner's commercial license ends
- No refunds are issued for unused portions of a prepaid plan period
- Custom work delivered remains accessible under the agreed license until termination takes effect

### 6.6 After Termination

- The Partner must cease using any db-studio version received under this agreement in production
- The Partner may continue using any version that was MIT-licensed prior to the BUSL license change, subject to those MIT terms

### 6.7 No Liability

db-studio is provided as-is. The Licensor is not liable for any data loss, downtime, or business damages arising from the use of db-studio or its integration. The Partner is responsible for maintaining backups and testing in staging before production use.

### 6.8 Confidentiality

Both parties agree to keep the commercial terms of this agreement (pricing, custom feature details) confidential. The existence of the partnership may be publicly acknowledged with mutual consent.

### 6.9 Governing Law

This agreement is governed by the laws of ******\_\_\_******. Disputes will be resolved through good-faith negotiation first, then mediation if needed.

---

## 7. Signatures

By signing below, both parties agree to the terms outlined in this document.

&nbsp;

| Licensor                           | Partner                            |
| ---------------------------------- | ---------------------------------- |
| **Hüsam Yıldırım**                 | **************\_\_\_************** |
| dbstudio.sh                        | Platform: ********\_\_\_********   |
| &nbsp;                             | &nbsp;                             |
| &nbsp;                             | &nbsp;                             |
| &nbsp;                             | &nbsp;                             |
| Signature: ********\_\_\_********  | Signature: ********\_\_\_********  |
| Date: **********\_\_\_\_********** | Date: **********\_\_\_\_********** |

---

_db-studio · dbstudio.sh · github.com/husamql3/db-studio_
