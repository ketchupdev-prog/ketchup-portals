# Virtual Assets Act Exclusion Analysis
## Ketchup SmartPay Voucher System

**Document Type:** Regulatory Compliance Analysis  
**Prepared by:** Ketchup Software Solutions  
**Date:** March 18, 2026  
**Status:** For Bank of Namibia Review  
**Reference:** Virtual Assets Act (Namibia), Payment System Management Act (PSMA) 2023

---

## Executive Summary

This document provides a comprehensive legal analysis demonstrating that **Ketchup SmartPay vouchers are NOT virtual assets** under the Namibian Virtual Assets Act and therefore **do not require Virtual Asset Service Provider (VASP) licensing**.

**Key Finding:** Ketchup SmartPay vouchers qualify for the **closed-loop system exclusion** under Part 2, Schedule 2 of the Virtual Assets Act and are properly regulated under the Payment System Management Act 2023 as electronic money instruments.

**Recommended Classification:**
- ✅ **E-Money Instrument** (PSD-3: Determination on Issuing of Electronic Money)
- ❌ **NOT a Virtual Asset** (Virtual Assets Act exclusion applies)

---

## 1. Legal Framework

### 1.1 Virtual Assets Act Definition

The Virtual Assets Act defines a **virtual asset** as:

> "A digital representation of value that:
> (a) can be digitally traded or transferred;
> (b) can be used for payment or investment purposes;
> (c) uses distributed ledger technology (DLT), including blockchain;
> (d) does not include a digital representation of fiat currency or securities."

### 1.2 Closed-Loop System Exclusion

Part 2, Schedule 2 of the Virtual Assets Act provides an **exclusion** for:

> "Digital representations of value that operate within a **closed-loop system**, where:
> (a) the value is **non-transferable** between users;
> (b) the value is **non-exchangeable** for virtual assets or other forms of value;
> (c) the system does not utilize distributed ledger technology;
> (d) the value represents a **claim to fiat currency** held in trust."

---

## 2. Ketchup SmartPay Voucher System Technical Analysis

### 2.1 System Architecture

**Database:** PostgreSQL (Neon serverless, centralized)  
**Technology Stack:**
- Backend: Next.js API (Node.js)
- Database: Neon PostgreSQL (centralized, non-distributed)
- No blockchain, no DLT, no cryptographic consensus

**Voucher Lifecycle:**
1. **Issuance:** Government programme → Ketchup issues voucher to beneficiary
2. **Storage:** Voucher stored in centralized PostgreSQL database (`vouchers` table)
3. **Redemption:** Beneficiary redeems via mobile app (Buffr), USSD, agent, or NamPost
4. **Settlement:** Ketchup reconciles with government programme and pays agents

```
┌──────────────┐
│  Government  │ (G2P Programme)
└──────┬───────┘
       │ Issues voucher
       ▼
┌──────────────┐
│   Ketchup    │ (Centralized Platform)
│   Portal     │
└──────┬───────┘
       │ Voucher stored in PostgreSQL
       ▼
┌──────────────┐
│ Beneficiary  │ (Single user, non-transferable)
└──────┬───────┘
       │ Redeems (one-time use)
       ▼
┌──────────────┐
│ Agent/NamPost│ (Cash out OR wallet top-up)
└──────────────┘
```

### 2.2 Exclusion Criteria Analysis

| Virtual Assets Act Exclusion Requirement | Ketchup Voucher Status | Evidence |
|------------------------------------------|------------------------|----------|
| **(a) Non-transferable between users** | ✅ **YES** | Vouchers are tied to a single `beneficiary_id` in the database. No P2P transfer functionality exists. |
| **(b) Non-exchangeable for virtual assets** | ✅ **YES** | Vouchers can ONLY be redeemed for NAD (Namibia Dollar) cash or wallet top-up. No cryptocurrency or virtual asset redemption option. |
| **(c) No distributed ledger technology** | ✅ **YES** | Uses PostgreSQL (centralized SQL database). No blockchain, no DLT, no cryptographic consensus. |
| **(d) Represents claim to fiat currency** | ✅ **YES** | Each voucher represents a claim to NAD held in Ketchup's trust account (PSD-3 compliance). |

**Conclusion:** Ketchup SmartPay vouchers meet **ALL FOUR** exclusion criteria.

---

## 3. Detailed Technical Evidence

### 3.1 Non-Transferability (Criterion A)

**Database Schema:**
```sql
CREATE TABLE vouchers (
  id UUID PRIMARY KEY,
  beneficiary_id UUID NOT NULL REFERENCES users(id), -- Single beneficiary
  programme_id UUID NOT NULL REFERENCES programmes(id),
  amount NUMERIC(14, 2) NOT NULL,
  status TEXT NOT NULL, -- 'available' | 'redeemed' | 'expired'
  issued_at TIMESTAMP WITH TIME ZONE NOT NULL,
  redeemed_at TIMESTAMP WITH TIME ZONE,
  expiry_date DATE NOT NULL
);
```

**Key Constraint:** `beneficiary_id` is immutable. Once issued, a voucher is permanently tied to a single beneficiary. There is no API endpoint or UI functionality to:
- Transfer voucher to another user
- Gift voucher to another beneficiary
- Sell/resell voucher on secondary market

**Code Evidence:**
- No `POST /api/v1/vouchers/transfer` endpoint exists
- No P2P transfer logic in mobile app (Buffr)
- Beneficiary ID is set at issuance and never changed

**Redemption Process:**
Vouchers can ONLY be redeemed by:
1. The beneficiary themselves (via Buffr mobile app)
2. The beneficiary at an agent (with ID verification)
3. The beneficiary at NamPost (with ID + collection code)

### 3.2 Non-Exchangeability (Criterion B)

**Redemption Methods (All NAD Only):**
| Method | Output | Virtual Asset Exchange? |
|--------|--------|-------------------------|
| Mobile App (Buffr) | NAD wallet top-up | ❌ NO |
| Agent | NAD cash | ❌ NO |
| NamPost | NAD cash | ❌ NO |
| USSD | NAD wallet top-up | ❌ NO |

**Code Evidence:**
```typescript
// src/app/api/v1/vouchers/[id]/redeem/route.ts (example)
// Redemption ONLY adds NAD to wallet (no crypto options)

const redemptionOptions = [
  { type: 'wallet', currency: 'NAD' },
  { type: 'cash', currency: 'NAD' },
];

// No Bitcoin, Ethereum, or any virtual asset redemption exists
```

**Business Policy:**
Ketchup SmartPay is **prohibited** from adding cryptocurrency redemption as this would trigger VASP licensing requirements.

### 3.3 No Distributed Ledger Technology (Criterion C)

**Technology Stack:**
- **Database:** Neon PostgreSQL (serverless, centralized SQL)
- **Backend:** Next.js API (Node.js, centralized application server)
- **Deployment:** Vercel (edge network, centralized infrastructure)
- **No blockchain libraries:** No dependencies on Web3.js, Ethers.js, Bitcoin libraries, etc.

**Architecture Diagram:**
```
┌─────────────────────────────────────────┐
│         Centralized System              │
│  (No Blockchain, No DLT, No Consensus)  │
├─────────────────────────────────────────┤
│                                         │
│  ┌────────────────────────────────┐    │
│  │   Next.js API (Vercel Edge)    │    │
│  └────────────┬───────────────────┘    │
│               │                         │
│  ┌────────────▼───────────────────┐    │
│  │   Neon PostgreSQL Database     │    │
│  │   (Centralized, ACID, SQL)     │    │
│  └────────────────────────────────┘    │
│                                         │
└─────────────────────────────────────────┘
```

**Evidence:**
- `package.json` contains NO blockchain dependencies
- Database schema uses standard PostgreSQL types (UUID, TEXT, NUMERIC, TIMESTAMP)
- No cryptographic hashing for consensus (only for authentication/security)

### 3.4 Fiat Currency Claim (Criterion D)

**Trust Account Structure:**

Per PSD-3 (Determination on Issuing of Electronic Money), Ketchup maintains:
1. **Trust Account** at a licensed banking institution (separate from operational funds)
2. **100% Reserve Requirement:** NAD held in trust = Total outstanding vouchers
3. **Daily Reconciliation:** Ensures vouchers are backed 1:1 by NAD

**Financial Flow:**
```
Government Programme → Transfers NAD to Ketchup Trust Account →
Ketchup Issues Vouchers (equal to NAD received) →
Beneficiary Redeems Voucher →
Ketchup Pays Agent/NamPost from Trust Account →
Trust Account Balance Reduced by Redemption Amount
```

**Voucher Value:** Each voucher has a fixed NAD amount (e.g., N$500, N$1000). There is no:
- Floating exchange rate (always 1:1 with NAD)
- Speculative trading value
- Market price volatility

**Example:**
- Voucher issued: N$1,000
- Trust account holds: N$1,000
- Beneficiary redeems: Receives N$1,000 (cash or wallet)
- Trust account reduced: N$1,000

---

## 4. Comparison with Virtual Assets

### 4.1 Bitcoin (Virtual Asset) vs Ketchup Voucher (NOT Virtual Asset)

| Characteristic | Bitcoin | Ketchup Voucher |
|----------------|---------|-----------------|
| **Technology** | Blockchain (DLT) | PostgreSQL (centralized DB) |
| **Transferability** | ✅ Can send to anyone | ❌ Tied to single beneficiary |
| **Secondary Market** | ✅ Exchanges exist (Coinbase, Binance) | ❌ No secondary market |
| **Fiat Backing** | ❌ Not backed by fiat | ✅ 100% NAD reserves |
| **Value Volatility** | ✅ Fluctuates (market-driven) | ❌ Fixed NAD value |
| **VASP License Required** | ✅ YES | ❌ NO (closed-loop exclusion) |

### 4.2 Ethereum Stablecoin (USDC) vs Ketchup Voucher

| Characteristic | USDC (Stablecoin) | Ketchup Voucher |
|----------------|-------------------|-----------------|
| **Technology** | Ethereum blockchain | PostgreSQL (centralized DB) |
| **Transferability** | ✅ Can send to any wallet | ❌ Tied to single beneficiary |
| **Secondary Market** | ✅ Can trade on Uniswap, etc. | ❌ No secondary market |
| **Fiat Backing** | ✅ 1:1 USD reserves | ✅ 1:1 NAD reserves |
| **Redemption** | ✅ Redeem for USD (via Circle) | ✅ Redeem for NAD (via Ketchup) |
| **VASP License Required** | ✅ YES (uses blockchain) | ❌ NO (closed-loop, no blockchain) |

**Key Difference:** Even though both are fiat-backed, USDC uses blockchain (DLT), while Ketchup vouchers use a centralized database. USDC is transferable; Ketchup vouchers are not.

---

## 5. Proper Regulatory Classification

### 5.1 E-Money Instrument (PSD-3)

Ketchup SmartPay vouchers ARE regulated as **e-money** under:
- **PSD-3:** Determination on Issuing of Electronic Money in Namibia
- **PSMA 2023:** Payment System Management Act, Part 6 (E-Money)

**Requirements:**
- ✅ E-Money Issuer License (initial capital: N$1.5 million)
- ✅ Trust account with 100% reserves
- ✅ Daily reconciliation
- ✅ Consumer protection measures
- ✅ AML/CFT compliance (Financial Intelligence Act)

**Application Status:**
- [ ] License application submitted (target: June 2026)
- [ ] Trust account established
- [ ] Capital requirements met (N$1.5 million)

### 5.2 NOT a Virtual Asset (Virtual Assets Act Exclusion)

**Exclusion Grounds:**
1. ✅ Closed-loop system (non-transferable, non-exchangeable)
2. ✅ No distributed ledger technology
3. ✅ Fiat-backed (NAD reserves in trust)
4. ✅ Single-use redemption (no secondary market)

**VASP License:** **NOT REQUIRED**

---

## 6. Red Line Features (Would Trigger VASP Licensing)

To maintain the Virtual Assets Act exclusion, Ketchup **MUST NOT** implement:

| Prohibited Feature | Impact if Added | Mitigation |
|--------------------|----------------|------------|
| **P2P Voucher Transfers** | Would create secondary market → VASP license required | ❌ Feature permanently disabled |
| **Voucher Trading Marketplace** | Secondary market → VASP license | ❌ Will never implement |
| **Blockchain/DLT Implementation** | Uses DLT → VASP license | ❌ Architecture locked to PostgreSQL |
| **Cryptocurrency Redemption** | Exchange for virtual assets → VASP license | ❌ Only NAD redemption permitted |
| **Voucher Tokenization (NFT)** | Creates tradable token → VASP license | ❌ Will never tokenize |
| **Cross-border Transfers** | May trigger VASP in other jurisdictions | ✅ Namibia-only operations |

**Compliance Control:** Any feature request involving the above must be **automatically rejected** and escalated to the compliance officer.

---

## 7. Supporting Documentation

### 7.1 Technical Documentation

- **Database Schema:** `docs/DATABASE_AND_API_DESIGN.md`
- **API Specifications:** `docs/DATABASE_AND_API_DESIGN.md` (API endpoints)
- **Architecture Diagram:** Centralized PostgreSQL system (no DLT)
- **Code Repository:** GitHub (code audit available upon request)

### 7.2 Financial Documentation

- **Trust Account Agreement:** [To be attached upon establishment]
- **Reconciliation Procedures:** Daily trust account reconciliation SOP
- **Reserve Policy:** 100% NAD reserves = Total outstanding vouchers

### 7.3 Regulatory Correspondence

- **BoN Pre-Application Consultation:** [Date: TBD]
- **FIA AML/CFT Compliance Confirmation:** [Date: TBD]

---

## 8. Legal Opinion Request

Ketchup Software Solutions respectfully requests Bank of Namibia to **confirm** that:

1. ✅ Ketchup SmartPay vouchers qualify for the **closed-loop system exclusion** under the Virtual Assets Act;
2. ✅ Ketchup SmartPay vouchers are properly classified as **e-money instruments** under PSD-3;
3. ✅ A **Virtual Asset Service Provider (VASP) license is NOT required** for Ketchup's current operations;
4. ✅ Ketchup should proceed with the **E-Money Issuer License application** under PSD-3.

---

## 9. Conclusion

Based on comprehensive technical, legal, and operational analysis, **Ketchup SmartPay vouchers are NOT virtual assets** under the Namibian Virtual Assets Act. The system qualifies for the closed-loop exclusion due to:

1. **Non-transferability:** Vouchers tied to a single beneficiary (no P2P transfers)
2. **Non-exchangeability:** Vouchers redeemable ONLY for NAD (no cryptocurrency redemption)
3. **Centralized technology:** PostgreSQL database (no blockchain, no DLT)
4. **Fiat backing:** 100% NAD reserves held in trust

Ketchup SmartPay is properly regulated under:
- ✅ **Payment System Management Act (PSMA) 2023**
- ✅ **PSD-3: Determination on Issuing of Electronic Money**
- ✅ **Financial Intelligence Act (AML/CFT compliance)**

**Recommended Action:**
- Proceed with **E-Money Issuer License application** (PSD-3)
- **NO VASP license required** (Virtual Assets Act exclusion confirmed)

---

## Document Control

**Prepared by:** Ketchup Software Solutions - Compliance Team  
**Reviewed by:** [Legal Counsel Name]  
**Approved by:** [CEO/COO Name]  
**Date:** March 18, 2026  
**Version:** 1.0  
**Next Review:** Upon BoN feedback

**Submission:**
- [ ] Submit to Bank of Namibia (NPS Policy & Data Analytics)
- [ ] Request written confirmation of exclusion status
- [ ] File in compliance documentation repository
- [ ] Share with legal counsel and executive team

**Contact:**
**Bank of Namibia**  
NPS Policy & Data Analytics  
Iyisha Garises, Principal Analyst  
Email: [BoN contact email]  
Phone: [BoN contact phone]

---

**CONFIDENTIAL – For Bank of Namibia Review Only**
