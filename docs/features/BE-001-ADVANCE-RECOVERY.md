# BE-001: Duplicate Redemption Manual Recovery System

**Status:** ✅ Complete  
**Due Date:** March 29, 2026  
**Priority:** P1 (High)  
**Owner:** Backend Engineer

---

## Overview

The Duplicate Redemption Manual Recovery system enables Ketchup Portal operators to manually recover outstanding advances from beneficiaries who received duplicate voucher redemptions due to offline/sync conditions.

### Key Features

- Manual advance recovery via API endpoint
- Automatic calculation of outstanding balances
- RBAC protection (requires `vouchers.recover_advance` permission)
- Rate limiting (50 requests/minute per operator)
- Comprehensive audit logging for compliance
- Support for partial or full recovery
- Recovery transaction history tracking

---

## Architecture

### Database Tables

1. **`beneficiary_advances`**
   - Tracks outstanding advances owed by beneficiaries
   - Status: `outstanding` | `fully_recovered` | `escalated`
   - Links to source duplicate redemption event

2. **`advance_recovery_transactions`**
   - Records each recovery operation (manual or automatic)
   - Links to advance and optional voucher
   - Tracks entitlement vs. deducted amount

3. **`duplicate_redemption_events`**
   - Source of truth for duplicate redemptions
   - Referenced by advances table

### Service Layer

**Location:** `src/lib/services/duplicate-redemption-service.ts`

#### Core Functions

```typescript
// Calculate outstanding advance for beneficiary
getOutstandingAdvance(beneficiaryId: string): Promise<{
  amount: number;
  cycleIds: string[];
}>

// Execute manual recovery
executeManualRecovery(params: {
  beneficiaryId: string;
  cycleId?: string;
  recoveryAmount?: number;
  userId: string;
}): Promise<{
  success: boolean;
  recoveredAmount: number;
  remainingBalance: number;
  transactionId: string;
  message?: string;
}>

// Get recovery history
getRecoveryHistory(
  beneficiaryId: string,
  limit?: number
): Promise<Array<RecoveryTransaction>>
```

### API Endpoint

**Endpoint:** `POST /api/v1/advance-recovery`

**Security:**
- RBAC: `vouchers.recover_advance` permission
- Rate Limit: 50 requests/minute (ADMIN preset)
- Audit Log: ALL operations logged

---

## Usage Examples

### Example 1: Recover Full Outstanding Amount

**Request:**
```bash
curl -X POST https://api.ketchup.cc/api/v1/advance-recovery \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "data": {
      "beneficiary_id": "550e8400-e29b-41d4-a716-446655440000"
    }
  }'
```

**Response (201 Created):**
```json
{
  "data": {
    "transaction_id": "tx-123e4567-e89b-12d3-a456-426614174000",
    "beneficiary_id": "550e8400-e29b-41d4-a716-446655440000",
    "cycle_id": "2026-03-18",
    "recovered_amount": 1000.00,
    "previous_balance": 1000.00,
    "new_balance": 0.00,
    "recovery_date": "2026-03-18T10:30:00Z"
  }
}
```

### Example 2: Partial Recovery (500 NAD from 1000 NAD outstanding)

**Request:**
```bash
curl -X POST https://api.ketchup.cc/api/v1/advance-recovery \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "data": {
      "beneficiary_id": "550e8400-e29b-41d4-a716-446655440000",
      "recovery_amount": 500.00,
      "cycle_id": "2026-03-18"
    }
  }'
```

**Response (201 Created):**
```json
{
  "data": {
    "transaction_id": "tx-234f5678-f90c-23e4-b567-537725285111",
    "beneficiary_id": "550e8400-e29b-41d4-a716-446655440000",
    "cycle_id": "2026-03-18",
    "recovered_amount": 500.00,
    "previous_balance": 1000.00,
    "new_balance": 500.00,
    "recovery_date": "2026-03-18T10:30:00Z"
  }
}
```

### Example 3: Error - No Outstanding Advance

**Request:**
```bash
curl -X POST https://api.ketchup.cc/api/v1/advance-recovery \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "data": {
      "beneficiary_id": "660f9511-f40c-52f5-c827-557836396222"
    }
  }'
```

**Response (400 Bad Request):**
```json
{
  "error": "No outstanding advance to recover for this beneficiary",
  "code": "NoAdvanceFound",
  "details": {
    "beneficiary_id": "660f9511-f40c-52f5-c827-557836396222",
    "route": "POST /api/v1/advance-recovery"
  }
}
```

### Example 4: Error - Recovery Amount Exceeds Outstanding

**Request:**
```bash
curl -X POST https://api.ketchup.cc/api/v1/advance-recovery \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "data": {
      "beneficiary_id": "550e8400-e29b-41d4-a716-446655440000",
      "recovery_amount": 2000.00
    }
  }'
```

**Response (400 Bad Request):**
```json
{
  "error": "Recovery amount exceeds outstanding advance",
  "code": "RecoveryFailed",
  "details": {
    "beneficiary_id": "550e8400-e29b-41d4-a716-446655440000",
    "route": "POST /api/v1/advance-recovery"
  }
}
```

---

## Testing Procedures

### Prerequisites

1. **Database Setup:**
   - Ensure `beneficiary_advances` table has test data
   - Create test beneficiaries with outstanding advances
   - Seed duplicate redemption events

2. **User Setup:**
   - Create test user with `vouchers.recover_advance` permission
   - Obtain valid JWT token for authentication

3. **Environment:**
   - Development: `http://localhost:3000`
   - Staging: `https://staging.ketchup.cc`

### Test Scenarios

#### Scenario 1: Full Recovery Success

**Setup:**
```sql
-- Create beneficiary with 1000 NAD outstanding advance
INSERT INTO beneficiary_advances (
  id, beneficiary_id, source_event_id, programme_id,
  original_amount, recovered_amount, status
) VALUES (
  'adv-test-001', 'ben-test-001', 'dup-test-001', 'prog-test-001',
  1000.00, 0.00, 'outstanding'
);
```

**Test Steps:**
1. Call `POST /api/v1/advance-recovery` with `beneficiary_id: ben-test-001`
2. Verify response status: 201 Created
3. Verify `recovered_amount: 1000.00`
4. Verify `new_balance: 0.00`
5. Check database: `beneficiary_advances.status = 'fully_recovered'`
6. Check audit logs: Action `advance.manual_recovery` logged

**Expected Result:** ✅ Full recovery successful, balance zero

---

#### Scenario 2: Partial Recovery

**Setup:**
```sql
-- Same as Scenario 1 (1000 NAD outstanding)
```

**Test Steps:**
1. Call `POST /api/v1/advance-recovery` with:
   - `beneficiary_id: ben-test-001`
   - `recovery_amount: 500.00`
2. Verify response status: 201 Created
3. Verify `recovered_amount: 500.00`
4. Verify `new_balance: 500.00`
5. Check database: `beneficiary_advances.recovered_amount = 500.00`
6. Check database: `beneficiary_advances.status = 'outstanding'`

**Expected Result:** ✅ Partial recovery successful, 500 NAD remaining

---

#### Scenario 3: No Outstanding Advance

**Setup:**
```sql
-- Beneficiary with no advances
INSERT INTO users (id, phone, full_name, wallet_status)
VALUES ('ben-test-002', '+264811234567', 'Test User 2', 'active');
```

**Test Steps:**
1. Call `POST /api/v1/advance-recovery` with `beneficiary_id: ben-test-002`
2. Verify response status: 400 Bad Request
3. Verify error code: `NoAdvanceFound`
4. Verify error message: "No outstanding advance to recover"

**Expected Result:** ✅ Correct error returned

---

#### Scenario 4: Recovery Exceeds Outstanding

**Setup:**
```sql
-- Beneficiary with 500 NAD outstanding
INSERT INTO beneficiary_advances (
  id, beneficiary_id, source_event_id, programme_id,
  original_amount, recovered_amount, status
) VALUES (
  'adv-test-003', 'ben-test-003', 'dup-test-003', 'prog-test-001',
  500.00, 0.00, 'outstanding'
);
```

**Test Steps:**
1. Call `POST /api/v1/advance-recovery` with:
   - `beneficiary_id: ben-test-003`
   - `recovery_amount: 1000.00`
2. Verify response status: 400 Bad Request
3. Verify error code: `RecoveryFailed`
4. Verify error message: "Recovery amount exceeds outstanding advance"

**Expected Result:** ✅ Correct error returned, no changes to database

---

#### Scenario 5: Multiple Advances (FIFO Recovery)

**Setup:**
```sql
-- Beneficiary with 2 advances (oldest first recovery)
INSERT INTO beneficiary_advances (
  id, beneficiary_id, source_event_id, programme_id,
  original_amount, recovered_amount, status, created_at
) VALUES
  ('adv-test-004a', 'ben-test-004', 'dup-test-004a', 'prog-test-001',
   600.00, 0.00, 'outstanding', '2026-01-15 10:00:00'),
  ('adv-test-004b', 'ben-test-004', 'dup-test-004b', 'prog-test-001',
   400.00, 0.00, 'outstanding', '2026-02-20 15:00:00');
```

**Test Steps:**
1. Call `POST /api/v1/advance-recovery` with:
   - `beneficiary_id: ben-test-004`
   - `recovery_amount: 800.00`
2. Verify response: `recovered_amount: 800.00`, `new_balance: 200.00`
3. Check database:
   - `adv-test-004a`: `recovered_amount: 600.00`, `status: fully_recovered`
   - `adv-test-004b`: `recovered_amount: 200.00`, `status: outstanding`
4. Verify 2 recovery transactions created

**Expected Result:** ✅ FIFO recovery logic works correctly

---

#### Scenario 6: RBAC - Missing Permission

**Setup:**
```sql
-- User without vouchers.recover_advance permission
```

**Test Steps:**
1. Obtain JWT token for user WITHOUT `vouchers.recover_advance` permission
2. Call `POST /api/v1/advance-recovery` with valid beneficiary
3. Verify response status: 403 Forbidden
4. Verify error code: `Forbidden`

**Expected Result:** ✅ RBAC enforcement working

---

#### Scenario 7: Rate Limiting

**Setup:**
```bash
# Script to test rate limiting (50 requests/minute)
```

**Test Steps:**
1. Send 50 valid requests within 1 minute (should succeed)
2. Send 51st request within same minute
3. Verify response status: 429 Too Many Requests
4. Verify `Retry-After` header present
5. Wait for window expiry, send request again (should succeed)

**Expected Result:** ✅ Rate limiting enforced correctly

---

#### Scenario 8: Audit Logging

**Setup:**
```sql
-- Clear audit logs for test
DELETE FROM audit_logs WHERE action = 'advance.manual_recovery';
```

**Test Steps:**
1. Call `POST /api/v1/advance-recovery` successfully
2. Query audit logs:
   ```sql
   SELECT * FROM audit_logs 
   WHERE action = 'advance.manual_recovery'
   ORDER BY created_at DESC LIMIT 1;
   ```
3. Verify audit log entry contains:
   - `user_id` (operator who triggered recovery)
   - `action: 'advance.manual_recovery'`
   - `resource_type: 'beneficiary'`
   - `resource_id: <beneficiary_id>`
   - Metadata: `transactionId`, `recoveredAmount`, `previousBalance`, `newBalance`
   - IP address and user agent

**Expected Result:** ✅ All recovery operations logged

---

## Integration with Voucher Issuance

### Automatic Recovery (Future Enhancement)

The voucher issuance endpoint should automatically check for outstanding advances and deduct recovery amounts:

**Recommended Implementation:**
```typescript
// In POST /api/v1/vouchers/issue
import { getOutstandingAdvance, executeManualRecovery } from '@/lib/services/duplicate-redemption-service';

// After validating voucher issuance request
const outstanding = await getOutstandingAdvance(beneficiaryId);

if (outstanding.amount > 0) {
  // Deduct recovery from voucher amount
  const recoveryAmount = Math.min(outstanding.amount, voucherAmount);
  
  // Execute automatic recovery
  await executeManualRecovery({
    beneficiaryId,
    cycleId: cycleDate,
    recoveryAmount,
    userId: session.userId,
  });
  
  // Issue voucher with reduced amount
  const netAmount = voucherAmount - recoveryAmount;
  
  // Include recovery info in response
  return {
    voucher_amount: voucherAmount,
    recovery_deducted: recoveryAmount,
    net_disbursed: netAmount,
    remaining_advance: outstanding.amount - recoveryAmount,
  };
}
```

---

## Monitoring & Alerts

### Key Metrics

1. **Recovery Success Rate**
   - Target: >99% success rate
   - Alert: If <95% in 1-hour window

2. **Average Outstanding Balance**
   - Monitor total outstanding across all beneficiaries
   - Alert: If exceeds N$100,000

3. **Recovery Transaction Volume**
   - Track manual vs. automatic recovery ratio
   - Target: 90% automatic, 10% manual

4. **Error Rate**
   - Monitor 400/500 errors
   - Alert: If >5% error rate in 1-hour window

### Dashboard Queries

```sql
-- Total outstanding advances
SELECT 
  COUNT(DISTINCT beneficiary_id) as beneficiaries_affected,
  SUM(original_amount - recovered_amount) as total_outstanding_nad
FROM beneficiary_advances
WHERE status = 'outstanding';

-- Recovery rate last 30 days
SELECT 
  DATE(created_at) as date,
  COUNT(*) as recoveries,
  SUM(amount_deducted::numeric) as total_recovered_nad
FROM advance_recovery_transactions
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY DATE(created_at)
ORDER BY date DESC;

-- Top beneficiaries with outstanding advances
SELECT 
  u.full_name,
  ba.beneficiary_id,
  SUM(ba.original_amount - ba.recovered_amount) as outstanding_nad,
  COUNT(*) as advance_count
FROM beneficiary_advances ba
JOIN users u ON ba.beneficiary_id = u.id
WHERE ba.status = 'outstanding'
GROUP BY ba.beneficiary_id, u.full_name
ORDER BY outstanding_nad DESC
LIMIT 20;
```

---

## Security Considerations

### Permission Required

`vouchers.recover_advance` permission should be assigned ONLY to:
- `ketchup_finance` role
- `ketchup_ops` role (senior operators)
- `ketchup_compliance` role (audit purposes)

### Audit Trail

ALL recovery operations are logged with:
- Operator ID
- Beneficiary ID
- Recovery amount
- Transaction ID
- Timestamp
- IP address
- User agent

### Rate Limiting

50 requests/minute per operator prevents:
- Accidental bulk recovery errors
- Malicious recovery attacks
- System overload

---

## Troubleshooting

### Issue: "No outstanding advance to recover"

**Possible Causes:**
1. Beneficiary has no duplicate redemption history
2. All advances already fully recovered
3. Incorrect beneficiary ID

**Resolution:**
- Check `beneficiary_advances` table for beneficiary
- Query recovery history: `getRecoveryHistory(beneficiaryId)`
- Verify beneficiary ID is correct UUID

### Issue: "Recovery amount exceeds outstanding advance"

**Possible Causes:**
1. Partial recovery already executed
2. Outstanding balance changed between check and recovery

**Resolution:**
- Call `getOutstandingAdvance()` to get current balance
- Use returned amount or specify lower recovery amount

### Issue: 403 Forbidden

**Possible Causes:**
1. User missing `vouchers.recover_advance` permission
2. Role not assigned to user

**Resolution:**
- Verify user role: `SELECT role FROM portal_users WHERE id = ?`
- Check role permissions: `SELECT * FROM role_permissions WHERE role_id = ?`
- Assign permission to role or upgrade user role

---

## Related Files

### Service Layer
- `src/lib/services/duplicate-redemption-service.ts` (core logic)

### API Routes
- `src/app/api/v1/advance-recovery/route.ts` (manual recovery endpoint)
- `src/app/api/v1/vouchers/issue/route.ts` (automatic recovery integration)

### Database Schema
- `src/db/schema.ts` (table definitions)
- `drizzle/0006_canonical_redemption_ref.sql` (migration)

### Security & Audit
- `src/lib/services/audit-log-service.ts` (audit logging)
- `src/lib/require-permission.ts` (RBAC enforcement)
- `src/lib/middleware/rate-limit.ts` (rate limiting)

---

## Compliance Notes

### Regulatory Requirements

1. **Financial Intelligence Act (FIA)**
   - All financial transactions logged
   - Audit trail preserved for 7 years
   - Manual recovery flagged for suspicious patterns

2. **PSD-12 Cybersecurity Framework**
   - RBAC enforcement prevents unauthorized access
   - Rate limiting prevents DoS attacks
   - Audit logs track all operator actions

3. **Bank of Namibia (BoN) Oversight**
   - Recovery transactions included in monthly reports
   - Outstanding advances disclosed in financial statements
   - Recovery rate tracked as KPI

---

## Next Steps

- [ ] Integration with voucher issuance (automatic recovery)
- [ ] UI component for manual recovery modal
- [ ] Dashboard widgets for outstanding advances
- [ ] Batch recovery endpoint for multiple beneficiaries
- [ ] SMS notification to beneficiary after recovery
- [ ] Export recovery reports to CSV/PDF

---

**Document Version:** 1.0  
**Last Updated:** March 18, 2026  
**Author:** Backend Engineer  
**Status:** Implementation Complete ✅
