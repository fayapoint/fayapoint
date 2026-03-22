# Asaas Payment Gateway Skill

Use this skill whenever working with the Asaas payment gateway — creating payments, subscriptions, customers, handling webhooks, debugging payment errors, or configuring the integration.

## API Authentication

**Key Formats:**
- Production: `$aact_prod_...` (older) or `$aact_...` (newer format, base64 encoded)
- Sandbox: `$aact_hmlg_...`
- Keys are shown ONCE at creation — irrecoverable after that

**Endpoints:**
- Production: `https://api.asaas.com/v3`
- Sandbox: `https://api-sandbox.asaas.com/v3` (NOT `sandbox.asaas.com/api/v3`)

**Headers:**
```
Content-Type: application/json
access_token: <api_key>
User-Agent: FayAi/1.0
```

**Critical Rule:** Using a production key against sandbox endpoint (or vice versa) returns `invalid_environment` 401. ALWAYS verify key format matches environment.

**Key Lifecycle:**
- 3 months inactivity: auto-disabled (re-enable in dashboard)
- 6 months inactivity: permanently expired (must generate new)

## Customer Management

**Create Customer — POST /v3/customers**

Required fields:
- `name` (string)
- `cpfCnpj` (string, digits only, 11 for CPF or 14 for CNPJ)

Optional but recommended: `email`, `mobilePhone`, `phone`, `postalCode`, `address`, `addressNumber`, `externalReference`

**CPF/CNPJ Rules:**
- MUST be digits only — no dots, dashes, or slashes
- Asaas validates checksum — fake/invalid CPFs are REJECTED
- CPF: 11 digits with valid check digits
- CNPJ: 14 digits with valid check digits
- The fallback `00000000000` will ALWAYS fail in production

**Deduplication:** Asaas allows duplicate customers. Always search first by cpfCnpj or email.

## Payment Creation — POST /v3/payments

Required: `customer`, `billingType`, `value`, `dueDate` (YYYY-MM-DD, today or future)

Billing types: `BOLETO`, `CREDIT_CARD`, `PIX`, `UNDEFINED`

### PIX Flow
1. Create payment with `billingType: "PIX"`
2. Call `GET /v3/payments/{id}/pixQrCode`
3. Response: `encodedImage` (base64 PNG), `payload` (copy-paste), `expirationDate`
4. QR code valid 12 months after due date, payable only once
5. Webhook: `PAYMENT_CREATED` then `PAYMENT_RECEIVED` (instant)

### Boleto Flow
1. Create with `billingType: "BOLETO"`
2. Response has `bankSlipUrl` and `identificationField`
3. Webhook: `PAYMENT_CREATED` then `PAYMENT_CONFIRMED` then `PAYMENT_RECEIVED`

### Credit Card Flow
Direct: send `creditCard` + `creditCardHolderInfo` + `remoteIp`
Tokenized: send `creditCardToken` + `remoteIp`
MUST use HTTPS. Min 60s timeout. holderName must match bank records.

### Installments
Single payment: use `value` only.
Multiple: use `installmentCount` + `totalValue` (NOT `value`). Never mix.

## Subscriptions — POST /v3/subscriptions

Required: `customer`, `billingType`, `nextDueDate`, `value`, `cycle`

Cycles: `WEEKLY`, `BIWEEKLY`, `MONTHLY`, `QUARTERLY`, `SEMIANNUALLY`, `YEARLY`

**Critical:** Creation does NOT return first payment ID. Call `GET /v3/subscriptions/{id}/payments` after ~1 second delay to get charges.

## Webhook Events

Key events: `PAYMENT_CREATED`, `PAYMENT_CONFIRMED`, `PAYMENT_RECEIVED`, `PAYMENT_OVERDUE`, `PAYMENT_REFUNDED`, `PAYMENT_CREDIT_CARD_CAPTURE_REFUSED`, `PAYMENT_DELETED`

Same event can fire multiple times — implement idempotency.

**FayAi webhook URL:** `https://fayai.com.br/api/payments/webhook/?access_token=fayapoint_asaas_webhook_secret_2024`

## Common Errors

| Error | Fix |
|-------|-----|
| `invalid_environment` (401) | Key/endpoint mismatch |
| `invalid_cpfCnpj` (400) | Validate checksum before sending |
| `invalid_value` (400) | Positive number, 2 decimal max |
| `invalid_dueDate` (400) | Must be today or future, YYYY-MM-DD |
| `invalid_customer` (400) | Create customer first |
| `invalid_creditCard` (400) | Generic — check with Asaas support |
| 429 Too Many Requests | Max 50 concurrent GETs, implement backoff |

## FayAi Configuration

**Files:** `src/lib/asaas.ts`, `src/app/api/subscriptions/route.ts`, `src/app/api/payments/route.ts`, `src/app/api/payments/webhook/route.ts`, `src/models/Payment.ts`, `src/models/Subscription.ts`, `src/app/[locale]/(site)/checkout/[plan]/page.tsx`

**Env vars:** `ASAAS_API_KEY`, `ASAAS_ENV` (production/sandbox), `ASAAS_WEBHOOK_TOKEN`

**Plans:** Explorador R$57/mo R$570/yr, Profissional R$97/mo R$970/yr, Expert R$167/mo R$1670/yr

**Domain:** Always `fayai.com.br` (NOT `fayai.shop`)

## Debugging Checklist

1. Check Asaas dashboard Logs de Requisicoes
2. Verify API key matches ASAAS_ENV
3. Validate CPF/CNPJ checksum
4. Verify dueDate is today or future
5. For cards: HTTPS, timeout, card data format
6. For PIX: QR code fetched AFTER payment creation
7. For subscriptions: first payment fetched with delay
