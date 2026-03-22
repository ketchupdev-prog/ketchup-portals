# PSD-12 Cybersecurity Framework
## Ketchup SmartPay G2P Platform

**Document Type:** Regulatory Compliance Framework  
**Prepared by:** Ketchup Software Solutions - Security Team  
**Date:** March 18, 2026  
**Status:** For Bank of Namibia Review  
**Reference:** PSD-12 - Determination of the Operational and Cybersecurity Standards within the National Payment System  
**Effective Date:** July 1, 2023

---

## Executive Summary

This document establishes the **cybersecurity framework** for Ketchup SmartPay in compliance with Bank of Namibia's PSD-12 determination. The framework covers the five domains of cyber resilience: **Identification, Protection, Detection, Response, and Recovery**.

**Regulatory Requirement:** PSD-12 applies to all Financial Market Infrastructures (FMIs), Non-Bank Financial Institutions (NBFIs), Payment Service Providers (PSPs), and FinTech participants in the National Payment System.

**Compliance Status:** Framework approved by Board of Directors [Date: TBD]

**Key Commitments:**
- ✅ **99.9% Uptime** for critical systems (max 43.2 minutes downtime/month)
- ✅ **2-Hour RTO** (Recovery Time Objective) for critical operations
- ✅ **5-Minute RPO** (Recovery Point Objective) via Neon automated backups
- ✅ **24-Hour Incident Notification** to Bank of Namibia
- ✅ **Bi-Annual DR Testing** (twice per year)
- ✅ **3-Year Penetration Testing Cycle**

---

## Table of Contents

1. [Governance & Accountability](#1-governance--accountability)
2. [Domain 1: Identification](#2-domain-1-identification)
3. [Domain 2: Protection](#3-domain-2-protection)
4. [Domain 3: Detection](#4-domain-3-detection)
5. [Domain 4: Response](#5-domain-4-response)
6. [Domain 5: Recovery](#6-domain-5-recovery)
7. [Third-Party Risk Management](#7-third-party-risk-management)
8. [Incident Reporting](#8-incident-reporting)
9. [Testing & Validation](#9-testing--validation)
10. [Continuous Improvement](#10-continuous-improvement)
11. [Appendices](#11-appendices)

---

## 1. Governance & Accountability

### 1.1 Board Responsibility

**PSD-12 Requirement:** Board of Directors must establish, approve, and oversee cybersecurity framework.

**Ketchup SmartPay Governance:**
- ✅ Board approves framework (quarterly reviews)
- ✅ Chief Information Security Officer (CISO) reports directly to Board
- ✅ Quarterly cybersecurity risk profile presentations (minimum 4 times/year)
- ✅ Segregation of duties: Security Officer separate from operational management

**Board Cybersecurity Committee:**
| Member | Role | Responsibility |
|--------|------|----------------|
| [CEO Name] | Chairperson | Overall accountability |
| [CTO Name] | Technical Lead | Infrastructure oversight |
| [CISO Name] | Security Lead | Framework implementation |
| [Compliance Officer] | Compliance Lead | Regulatory adherence |

**Meeting Schedule:** Quarterly (January, April, July, October)

### 1.2 Organizational Structure

```
Board of Directors
       │
       ├─── CEO/COO (Accountable)
       │
       ├─── CISO (Responsible)
       │     │
       │     ├─── Security Operations Center (SOC)
       │     ├─── Incident Response Team
       │     └─── Compliance Team
       │
       ├─── CTO (Infrastructure)
       │     │
       │     ├─── DevOps Team
       │     └─── Backend Engineers
       │
       └─── CFO (Financial Controls)
             └─── Internal Audit
```

### 1.3 Framework Review

**Review Frequency:** Annual (minimum)  
**Trigger Events for Ad-Hoc Review:**
- Major system architecture change
- New payment service launched
- Significant security incident
- New regulatory requirement
- Failed DR test or penetration test

**Last Review:** March 18, 2026  
**Next Review:** March 2027

---

## 2. Domain 1: Identification

### 2.1 Asset Inventory

**Critical Systems:**
| System | Type | Criticality | RTO | RPO |
|--------|------|-------------|-----|-----|
| Ketchup Portals (Next.js) | Application | HIGH | 2 hours | 5 min |
| Neon PostgreSQL Database | Data Store | CRITICAL | 2 hours | 5 min |
| Vercel Edge Network | Hosting | HIGH | 1 hour | N/A |
| SMTP Email Service | Communication | MEDIUM | 4 hours | N/A |
| SMS Gateway | Communication | MEDIUM | 4 hours | N/A |
| Buffr API Integration | Integration | HIGH | 2 hours | N/A |

**Supporting Systems:**
- GitHub (source code repository)
- Namecheap (DNS, domain management)
- Third-party libraries (npm dependencies)

### 2.2 Data Classification

| Data Type | Sensitivity | Location | Protection Level |
|-----------|-------------|----------|------------------|
| **Beneficiary PII** | CRITICAL | Neon DB (`users` table) | Encrypted at rest + TLS 1.3 |
| **Voucher Data** | HIGH | Neon DB (`vouchers` table) | Encrypted at rest + TLS 1.3 |
| **Financial Data (Trust Account)** | CRITICAL | Neon DB (`reconciliation` tables) | Encrypted at rest + TLS 1.3 + Audit logs |
| **Authentication Credentials** | CRITICAL | Neon DB (`portal_users` table) | Bcrypt hashed (12 rounds) + TLS 1.3 |
| **Agent Transaction History** | HIGH | Neon DB (`agent_transactions` table) | Encrypted at rest + TLS 1.3 |
| **Audit Logs** | HIGH | Neon DB (`audit_logs` table) | Encrypted at rest + Immutable (append-only) |

### 2.3 Annual Risk Assessment

**Methodology:** NIST Cybersecurity Framework + OWASP Top 10

**Risk Assessment Schedule:**
- **Full Risk Assessment:** Annual (January)
- **Targeted Risk Assessment:** Quarterly (after each Board review)
- **Ad-Hoc Assessment:** After significant security incident

**Last Assessment:** March 2026  
**Next Assessment:** January 2027

**Key Risks Identified (2026):**
| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| SIM Swap Attacks | HIGH | CRITICAL | Device binding + 48-hour cooldown (SEC-006) |
| Phishing Attacks | HIGH | HIGH | User education + email authentication markers (SEC-008) |
| Agent Fraud | MEDIUM | HIGH | Agent fraud detection system (SEC-010) |
| DDoS Attack | MEDIUM | MEDIUM | Rate limiting + Vercel DDoS protection (SEC-004) |
| Database Breach | LOW | CRITICAL | Encryption + access controls + audit logging |

---

## 3. Domain 2: Protection

### 3.1 Access Control

**Multi-Factor Authentication (2FA):**
- ✅ **Mandatory for:** `ketchup_finance`, `ketchup_compliance` (sensitive roles)
- ✅ **Implementation:** TOTP (Time-based One-Time Password) using `speakeasy` library
- ✅ **Backup codes:** 10 one-time recovery codes per user
- ✅ **Enforcement:** Middleware requires 2FA on login if enabled

**Role-Based Access Control (RBAC):**
- ✅ **Roles:** 9 roles defined (ketchup_ops, ketchup_finance, gov_manager, agent, etc.)
- ✅ **Permissions:** 40+ permission slugs (dashboard.summary, vouchers.issue, etc.)
- ✅ **Enforcement:** `requirePermission` middleware on ALL sensitive API routes
- ✅ **Audit:** All permission checks logged

**Session Management:**
- ✅ **Cookie-based sessions:** `portal-auth` HTTP-only cookie
- ✅ **JWT tokens:** Bearer token option for mobile/API access
- ✅ **Expiry:** 24-hour session timeout (refreshed on activity)
- ✅ **Revocation:** Logout clears cookie + session record

**Database Access Control:**
- ✅ **Principle of Least Privilege:** Application uses `neondb_owner` role (restricted permissions)
- ✅ **No direct DB access:** Users access data via API only (no direct SQL console)
- ✅ **Connection security:** TLS 1.3, `sslmode=require`, `channel_binding=require`

### 3.2 Data Protection

**Encryption at Rest:**
- ✅ **Database:** Neon PostgreSQL with AES-256 encryption (provider default)
- ✅ **Sensitive fields:** Passwords hashed with bcrypt (12 rounds, salt per user)
- ✅ **Backup encryption:** Neon automated backups encrypted

**Encryption in Transit:**
- ✅ **TLS 1.3:** All API endpoints (Vercel enforces HTTPS)
- ✅ **Certificate management:** Vercel automatic SSL certificate renewal
- ✅ **Database connections:** TLS 1.3 with `sslmode=require`

**Data Masking:**
- ✅ **PII in logs:** Beneficiary phone numbers masked (e.g., +264 81 XXX 1234)
- ✅ **API responses:** Sensitive fields excluded from error messages
- ✅ **Audit logs:** Full data stored (unmasked) for compliance

**Data Retention:**
- ✅ **Audit logs:** 5 years (FIA requirement)
- ✅ **Transaction history:** 7 years (tax/legal requirement)
- ✅ **Voucher data:** Indefinite (reconciliation requirement)
- ✅ **User accounts:** Soft delete (retain for compliance)

### 3.3 Secure Development Lifecycle

**Code Security:**
- ✅ **TypeScript:** Type safety prevents entire classes of bugs
- ✅ **Input validation:** Zod schemas on ALL API inputs
- ✅ **SQL injection prevention:** Parameterized queries (Drizzle ORM)
- ✅ **XSS prevention:** React auto-escaping, DaisyUI sanitized components
- ✅ **CSRF protection:** SameSite cookie attributes, CSRF tokens (to be implemented)

**Dependency Management:**
- ✅ **Automated scanning:** Dependabot enabled (GitHub)
- ✅ **Security patches:** Applied within 30 days (critical), 90 days (high)
- ✅ **Vulnerability monitoring:** npm audit on every build

**Code Review:**
- ✅ **Peer review:** All PRs require 1+ approval
- ✅ **Security review:** PRs with auth/payment/PII changes require security team approval
- ✅ **Automated checks:** ESLint, TypeScript, unit tests on every PR (CI/CD)

---

## 4. Domain 3: Detection

### 4.1 Continuous Monitoring

**Security Monitoring:**
| Metric | Threshold | Alert Action |
|--------|-----------|--------------|
| Failed login attempts | > 5 per user in 15 minutes | Lock account + email alert |
| Unauthorized API access (403) | > 10 per IP in 5 minutes | Rate limit + log review |
| Database query time | > 1 second (p95) | Performance alert (Slack) |
| API error rate | > 1% | Incident notification (PagerDuty) |
| Suspicious redemptions | Fraud score > 80 | Manual review queue |

**Real-time Fraud Detection:**
- ✅ **Multiple redemptions:** Same voucher redeemed twice (duplicate detection)
- ✅ **Geographic anomaly:** Redemption location != issuance location (>50km)
- ✅ **Time anomaly:** Redemptions at unusual hours (2-5 AM)
- ✅ **Velocity anomaly:** >3 redemptions per beneficiary in 24 hours
- ✅ **Agent anomaly:** Agent redemptions >N$50,000/day

**Monitoring Tools:**
| Tool | Purpose | Integration |
|------|---------|-------------|
| **Vercel Analytics** | Uptime, page speed, errors | Built-in |
| **Neon Metrics** | DB performance, query time | Built-in console |
| **Datadog/New Relic (Planned)** | APM, logs, traces, alerts | Q2 2026 |
| **Sentry (Planned)** | Error tracking, stack traces | Q2 2026 |

### 4.2 Anomaly Detection

**User Behavior Analytics:**
- ✅ Baseline: Establish normal usage patterns per user role
- ✅ Deviations: Alert on unusual activity (e.g., admin accessing system at 3 AM)
- ✅ Machine learning: Train fraud detection model on historical fraud data (Q3 2026)

**Transaction Monitoring:**
- ✅ **AML/CFT:** Red flags per FIA requirements (>N$10,000 single transaction, structuring)
- ✅ **Fraud patterns:** Phone scams, SIM swaps, phishing (from 10-year NPS fraud trends)

### 4.3 Log Aggregation

**Audit Log Coverage:**
- ✅ All authentication events (login, logout, password change)
- ✅ All sensitive operations (voucher issue, float approve, reconciliation)
- ✅ All permission checks (authorized + unauthorized attempts)
- ✅ All API errors (500, 403, 401)

**Log Retention:** 5 years (stored in `audit_logs` table, encrypted at rest)

**Log Analysis:**
- Weekly: Review high-risk events (failed logins, 403 errors, fraud alerts)
- Monthly: Generate audit report for compliance team
- Quarterly: Present security metrics to Board

---

## 5. Domain 4: Response

### 5.1 Incident Response Plan

**Incident Categories:**
| Category | Severity | Response Time | Escalation |
|----------|----------|---------------|------------|
| **Cyberattack (successful)** | CRITICAL | Immediate | BoN notification within 24 hours |
| **Data breach (PII exposed)** | CRITICAL | Immediate | BoN + FIC notification within 24 hours |
| **System downtime (>1 hour)** | HIGH | 15 minutes | CISO + CTO notified |
| **Failed login spike** | MEDIUM | 1 hour | SOC review |
| **Fraud detection alert** | MEDIUM | 2 hours | Compliance review |
| **Vulnerability disclosed** | MEDIUM | 4 hours | Security patch within 30 days |

**Response Procedure:**

**Step 1: Detection (0-15 minutes)**
- Automated alert (monitoring system)
- SOC acknowledges incident
- Initial triage (severity assessment)

**Step 2: Containment (15-60 minutes)**
- Isolate affected systems (if necessary)
- Prevent further damage (disable compromised accounts, block malicious IPs)
- Preserve evidence (logs, snapshots)

**Step 3: Investigation (1-24 hours)**
- Root cause analysis
- Scope assessment (affected users, data, systems)
- Evidence collection (forensics)

**Step 4: Notification (24 hours)**
- **Bank of Namibia:** Preliminary notification within 24 hours
- **Affected users:** If PII breach, notify within 72 hours (GDPR-style)
- **Internal stakeholders:** Executive team, Board (if critical)

**Step 5: Recovery (24-72 hours)**
- Implement fixes (patch vulnerabilities, restore from backups)
- Verify integrity (test affected systems)
- Resume operations (staged rollout)

**Step 6: Post-Incident (7-30 days)**
- **30-day report to BoN:** Complete impact assessment (financial loss, data loss, availability loss)
- **Root cause analysis:** Document lessons learned
- **Preventive measures:** Update controls to prevent recurrence

### 5.2 Incident Response Team

| Role | Member | Contact | Responsibilities |
|------|--------|---------|------------------|
| **Incident Commander** | CISO | [Phone] | Overall incident coordination |
| **Technical Lead** | CTO | [Phone] | System restoration, technical analysis |
| **Communications Lead** | Compliance Officer | [Phone] | BoN notification, user communication |
| **Forensics Lead** | Security Engineer | [Phone] | Evidence collection, root cause analysis |
| **Legal Counsel** | [Name] | [Phone] | Legal obligations, liability assessment |

**24/7 On-Call Rotation:** SOC team (rotates weekly)

### 5.3 Communication Templates

**Template 1: 24-Hour Preliminary Notification to BoN**

```
Subject: [INCIDENT NOTIFICATION] Ketchup SmartPay - [Incident Type] - [Date]

Bank of Namibia
NPS Policy & Data Analytics
Email: [BoN contact email]

Dear Sir/Madam,

This is to notify the Bank of Namibia of a cybersecurity incident at Ketchup SmartPay 
in accordance with PSD-12 requirements.

INCIDENT SUMMARY:
- Date/Time Detected: [YYYY-MM-DD HH:MM CAT]
- Incident Type: [Cyberattack / Data Breach / System Downtime]
- Severity: [Critical / High / Medium]
- Systems Affected: [List systems]
- Status: [Contained / Under Investigation / Resolved]

PRELIMINARY IMPACT ASSESSMENT:
- Financial Loss: [Amount or "Under assessment"]
- Data Loss: [Number of records or "None detected"]
- Availability Loss: [Downtime duration or "None"]
- Users Affected: [Number or "Under assessment"]

ACTIONS TAKEN:
- [List containment actions]
- [List investigative actions]

NEXT STEPS:
- Full impact assessment and root cause analysis in progress
- 30-day detailed report will be submitted by [Date]

Contact: [CISO Name], [Phone], [Email]

Regards,
Ketchup Software Solutions
```

**Template 2: 30-Day Full Report to BoN**

*(Detailed report template with RCA, impact, remediation, preventive measures)*

---

## 6. Domain 5: Recovery

### 6.1 Business Continuity Plan

**Critical Functions (Must Resume Within 2 Hours):**
1. Voucher issuance (government programmes cannot be delayed)
2. Voucher redemption (beneficiaries depend on immediate access)
3. Agent float management (agents need real-time float visibility)
4. Trust account reconciliation (financial integrity)

**Recovery Priorities:**
| Function | RTO | Recovery Strategy |
|----------|-----|-------------------|
| **Ketchup Portals (Web App)** | 2 hours | Vercel auto-deploy from GitHub (last stable commit) |
| **Database** | 2 hours | Neon point-in-time restore (5-minute granularity) |
| **API Endpoints** | 2 hours | Vercel edge functions (stateless, auto-scale) |
| **DNS** | 1 hour | Namecheap (redundant nameservers) |

### 6.2 Disaster Recovery Procedures

**Scenario 1: Database Corruption/Loss**

**Recovery Steps:**
1. **Detect:** Monitoring alerts on query errors or data inconsistency (5 minutes)
2. **Assess:** Determine scope (entire DB or specific tables) (15 minutes)
3. **Restore:** Neon point-in-time restore to last known good state (30 minutes)
4. **Verify:** Run data integrity checks (`npm run db:check`, sample queries) (30 minutes)
5. **Resume:** Re-enable application access (15 minutes)
6. **Post-mortem:** Identify root cause, prevent recurrence (24 hours)

**Total RTO:** 95 minutes (within 2-hour target) ✅

**Scenario 2: Vercel Deployment Failure**

**Recovery Steps:**
1. **Detect:** Deployment failure alert or uptime monitor (5 minutes)
2. **Rollback:** Revert to previous stable deployment via Vercel dashboard (10 minutes)
3. **Verify:** Test critical paths (login, voucher issuance, redemption) (15 minutes)
4. **Resume:** Normal operations (0 minutes - no downtime if caught quickly)
5. **Fix:** Debug deployment issue, re-deploy when stable (1-4 hours)

**Total RTO:** 30 minutes (within 2-hour target) ✅

**Scenario 3: Third-Party Service Outage (Buffr API)**

**Recovery Steps:**
1. **Detect:** Buffr API health check failure (1 minute)
2. **Fallback:** Queue voucher sync operations (webhook delivery when Buffr recovers) (0 minutes)
3. **Manual reconciliation:** If extended outage (>24 hours), manual CSV export/import (2 hours)
4. **Resume:** Auto-resume when Buffr API recovers (0 minutes)

**Impact:** Degraded (voucher sync delayed) but NOT critical (beneficiaries can still redeem)

### 6.3 Disaster Recovery Testing

**Test Schedule:**
- **Full DR Test:** Twice per year (June, December)
- **Tabletop Exercise:** Quarterly (simulate incident response without actual failover)

**Test Procedure (Full DR Test):**
1. **Pre-test:** Notify stakeholders, schedule maintenance window (off-hours)
2. **Simulate failure:** Force database restore or deployment rollback
3. **Execute recovery:** Follow recovery procedures (documented above)
4. **Measure:** Record RTO/RPO actuals
5. **Verify:** Test critical workflows (voucher issuance, redemption, reconciliation)
6. **Report:** Document test results, issues, improvements
7. **Update plan:** Refine procedures based on lessons learned

**Last Test:** [Not yet conducted]  
**Next Test:** June 2026

**Success Criteria:**
- ✅ RTO < 2 hours (achieved in test)
- ✅ RPO < 5 minutes (data loss < 5 minutes)
- ✅ All critical functions operational after recovery
- ✅ No data integrity issues detected

---

## 7. Third-Party Risk Management

### 7.1 Critical Third-Party Dependencies

| Vendor | Service | Risk Level | Contract Terms |
|--------|---------|------------|----------------|
| **Neon** | PostgreSQL database | CRITICAL | 99.95% SLA, SOC 2 Type II |
| **Vercel** | Hosting & edge network | CRITICAL | 99.99% SLA, ISO 27001 |
| **Buffr** | Mobile app integration | HIGH | Custom SLA (99.9% target) |
| **SMS Gateway** | Bulk SMS delivery | MEDIUM | 99% SLA |
| **Namecheap** | DNS & email | MEDIUM | 99.9% SLA |
| **GitHub** | Source code repository | MEDIUM | 99.95% SLA |

### 7.2 Vendor Security Requirements

**Mandatory Certifications:**
- ✅ SOC 2 Type II (audit report within last 12 months)
- ✅ ISO 27001 (information security management)
- ✅ Data residency: GDPR-compliant or Namibia-approved jurisdiction

**Vendor Agreements Must Include:**
- ✅ Security incident notification (within 24 hours)
- ✅ Data protection obligations (encryption, access controls)
- ✅ Right to audit (annual security questionnaire)
- ✅ SLA commitments (uptime, response time)
- ✅ Data portability (exit strategy if vendor terminated)

### 7.3 Vendor Review Schedule

**Annual Vendor Security Assessment:**
- Request updated SOC 2 / ISO 27001 certificates
- Review SLA performance (uptime, incident response)
- Assess financial stability (publicly traded or funded)
- Test failover procedures (if applicable)

**Quarterly Vendor Health Check:**
- Review incident reports from vendor
- Check for disclosed vulnerabilities (vendor security bulletins)
- Monitor service degradation alerts

---

## 8. Incident Reporting

### 8.1 Bank of Namibia Notification Requirements

**PSD-12 Timeline:**
- ✅ **24 hours:** Preliminary notification (incident summary, containment actions)
- ✅ **30 days:** Complete impact assessment (financial loss, data loss, availability loss)

**Reportable Incidents:**
- Successful cyberattack (unauthorized access, malware, DDoS)
- Data breach (PII exposure, unauthorized data access)
- System downtime (>4 hours cumulative in a month)
- Fraud detection (significant financial loss, e.g., >N$100,000)

**Non-Reportable (Internal Only):**
- Failed attack attempts (blocked by firewall/rate limiting)
- Minor vulnerabilities discovered and patched before exploitation
- Planned maintenance downtime

### 8.2 Internal Incident Log

All incidents (reportable + non-reportable) logged in `incidents` table:

**Fields:**
- Incident ID (UUID)
- Type (cyberattack, data_breach, system_downtime, fraud, vulnerability)
- Severity (critical, high, medium, low)
- Detected at (timestamp)
- Resolved at (timestamp)
- RCA (root cause analysis, markdown)
- Actions taken (containment, remediation)
- BoN notified (boolean)
- BoN notification sent at (timestamp)

**Access:** Ketchup Portal → Compliance & Audit → Incidents (for compliance officers)

---

## 9. Testing & Validation

### 9.1 Security Testing Schedule

| Test Type | Frequency | Last Conducted | Next Scheduled |
|-----------|-----------|----------------|----------------|
| **Vulnerability Scanning** | Weekly | [Not started] | Mar 25, 2026 |
| **Penetration Testing** | Every 3 years | [Not started] | Sep 30, 2026 |
| **Disaster Recovery Test** | Twice annually | [Not started] | Jun 30, 2026 |
| **Security Code Review** | Every PR | Ongoing | Continuous |
| **OWASP Top 10 Assessment** | Quarterly | [Not started] | Mar 31, 2026 |
| **Load Testing** | Before major release | [Not started] | Nov 15, 2026 |

### 9.2 Penetration Testing Scope (Q3 2026)

**External Penetration Test:**
- **Target:** Ketchup Portals web application (all 4 portals)
- **Scope:** 
  - Authentication bypass attempts
  - Authorization bypass (RBAC circumvention)
  - SQL injection (all API endpoints)
  - XSS (all form inputs)
  - CSRF (state-changing operations)
  - Session hijacking
  - API abuse (rate limiting effectiveness)
- **Methodology:** OWASP Testing Guide, PTES (Penetration Testing Execution Standard)
- **Budget:** N$50,000 (external firm)
- **Timeline:** 2 weeks testing + 1 week remediation + 1 week re-test

**Internal Security Review (Quarterly):**
- Code audit (focus on auth, payment, PII handling)
- Dependency vulnerability scan (npm audit, Snyk)
- Access control review (least privilege validation)

### 9.3 Acceptance Criteria

**Security Testing Pass Criteria:**
- ✅ **0 critical vulnerabilities** (must fix before launch)
- ✅ **0 high vulnerabilities** (must fix within 30 days)
- ✅ **< 5 medium vulnerabilities** (fix within 90 days)
- ✅ **Low vulnerabilities:** Document and accept risk (or fix opportunistically)

---

## 10. Continuous Improvement

### 10.1 Security Metrics (Monthly Reporting)

**Board Dashboard KPIs:**
| Metric | Target | Current | Trend |
|--------|--------|---------|-------|
| **Uptime** | 99.9% | [TBD] | - |
| **Mean Time to Detect (MTTD)** | < 24 hours | [TBD] | - |
| **Mean Time to Respond (MTTR)** | < 72 hours | [TBD] | - |
| **Security Patches Applied** | 100% critical (30 days) | [TBD] | - |
| **Failed Login Rate** | < 1% | [TBD] | - |
| **Fraud Detection Rate** | < 0.05% transaction value | [TBD] | - |
| **2FA Adoption** | 100% (sensitive roles) | [TBD] | - |

### 10.2 Framework Updates

**Trigger Events for Framework Review:**
- New PSD determination issued by BoN
- Significant security incident
- Failed DR test or penetration test
- Introduction of new payment service
- Material change to risk profile

**Update Procedure:**
1. Security team drafts proposed changes
2. Stakeholder review (legal, compliance, operations)
3. Board approval (quarterly meeting)
4. Communication to all staff
5. Training (if procedures changed)
6. Update documentation (this document)

### 10.3 Security Training

**Mandatory Training (All Staff):**
- **New hire orientation:** Security awareness, phishing simulation, incident reporting
- **Annual refresher:** Updated threats (phone scams, SIM swaps), policy changes
- **Quarterly phishing simulation:** Test staff vigilance (target: <5% click rate)

**Role-Specific Training:**
| Role | Training | Frequency |
|------|----------|-----------|
| **Developers** | Secure coding (OWASP Top 10, input validation) | Annual |
| **SOC Team** | Incident response, forensics | Quarterly |
| **Compliance Team** | Regulatory updates, BoN guidance | Quarterly |
| **Executives** | Cyber risk management, Board reporting | Annual |

---

## 11. Appendices

### Appendix A: Critical System Definition

**Criteria for "Critical System":**
- Revenue impact > N$1M if down for 24 hours
- Affects > 10,000 users
- Required for regulatory compliance (trust account reconciliation)
- No manual workaround available

**Ketchup SmartPay Critical Systems:**
1. Voucher issuance API
2. Voucher redemption API
3. Database (Neon PostgreSQL)
4. Authentication system
5. Trust account reconciliation

### Appendix B: Regulatory References

- **PSD-12:** Determination of the Operational and Cybersecurity Standards within the National Payment System (December 2022)
- **PSMA 2023:** Payment System Management Act 14 of 2023
- **PSD-3:** Determination on Issuing of Electronic Money in Namibia
- **FIA:** Financial Intelligence Act (AML/CFT requirements)

### Appendix C: Contact Information

**Ketchup SmartPay Security Contacts:**
- **CISO:** [Name], [Email], [Phone]
- **SOC 24/7 Hotline:** [Phone]
- **Incident Email:** security-incidents@ketchup.cc

**Bank of Namibia Contacts:**
- **NPS Policy:** Iyisha Garises, Principal Analyst
- **Cybersecurity:** [BoN Security Contact]
- **Emergency:** [BoN 24/7 Hotline]

### Appendix D: Revision History

| Version | Date | Changes | Approved By |
|---------|------|---------|-------------|
| 1.0 | March 18, 2026 | Initial framework | [Board Chairperson] |

---

## Framework Approval

**Prepared by:**
- [CISO Name], Chief Information Security Officer

**Reviewed by:**
- [CTO Name], Chief Technology Officer
- [Compliance Officer Name], Compliance Officer
- [Legal Counsel Name], Legal Counsel

**Approved by:**
- [CEO Name], Chief Executive Officer
- [Board Chairperson Name], Board Chairperson

**Approval Date:** [TBD - Present to Board in Q1 2026]

**Next Review:** March 2027 (Annual) or upon trigger event

---

**CONFIDENTIAL – For Internal Use and Bank of Namibia Review Only**
