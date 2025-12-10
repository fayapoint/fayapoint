# Fulfillment System Documentation

## Overview

The FayaPoint fulfillment system automatically processes and delivers all product types the moment a transaction is approved via Asaas payment gateway.

## Product Types Supported

### 1. Digital Products (Courses)
- **Delivery Method**: Instant access
- **Process**:
  1. User enrolled automatically in `user.enrolledCourses`
  2. Access granted to course portal
  3. Google Drive folder shared (if configured)
  4. Confirmation email sent with access link

### 2. Subscriptions
- **Delivery Method**: Instant activation
- **Process**:
  1. User plan upgraded (starter/pro/business)
  2. Plan expiration set (30 days)
  3. Confirmation email with benefits list

### 3. POD Products (Print-on-Demand)
- **Providers**: Printify, Prodigi
- **Process**:
  1. Order automatically sent to POD provider
  2. Provider manufactures product
  3. Tracking number received via webhook
  4. Customer notified of shipping
  5. Creator commission tracked
  6. Earnings finalized on delivery

### 4. Dropshipping Products
- **Process**:
  1. Order queued for manual processing
  2. Admin places order with supplier
  3. Tracking info added when available
  4. Customer notified of shipping

### 5. Services
- **Delivery Method**: Email confirmation
- **Process**:
  1. Service purchase recorded
  2. Customer receives confirmation
  3. Team notified for follow-up

---

## Configuration

### Environment Variables

```env
# Email (Resend API)
RESEND_API_KEY=re_xxxxxxxxxxxx
EMAIL_FROM=noreply@fayapoint.com
ADMIN_EMAIL=ricardofaya@gmail.com

# Google Drive (for course content)
GOOGLE_SERVICE_ACCOUNT_EMAIL=service@project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"

# Printify
Printify_API=xxxxxxxxxxxxxxxx
PRINTIFY_WEBHOOK_SECRET=your-webhook-secret

# Prodigi
PRODIGI_API_KEY=xxxxxxxxxxxxxxxx
PRODIGI_ENV=live  # or 'sandbox' for testing
```

### Webhook URLs

Configure these in your provider dashboards:

| Provider | Webhook URL |
|----------|-------------|
| Asaas | `https://fayapoint.com/api/payments/webhook` |
| Printify | `https://fayapoint.com/api/webhooks/printify` |
| Prodigi | `https://fayapoint.com/api/webhooks/prodigi` |

---

## How It Works

### Flow Diagram

```
Customer Payment → Asaas Webhook → Fulfillment Processor
                                        ↓
            ┌───────────────────────────┴───────────────────────────┐
            ↓                           ↓                           ↓
      Digital Items              POD Items                  Physical Items
            ↓                           ↓                           ↓
    Grant Access              Send to Printify/Prodigi       Queue for Manual
    Share Google Drive              ↓                        Processing
    Send Email               Provider Manufactures                 ↓
            ↓                           ↓                    Admin Ships
    ✓ DELIVERED               Webhook: Shipped                     ↓
                                    ↓                        ✓ DELIVERED
                              Customer Notified
                                    ↓
                              Webhook: Delivered
                                    ↓
                              Finalize Earnings
                                    ↓
                              ✓ DELIVERED
```

### Fulfillment Statuses

| Status | Description |
|--------|-------------|
| `pending` | Awaiting payment confirmation |
| `processing` | Being processed |
| `awaiting_supplier` | Waiting for supplier response |
| `in_production` | Being manufactured (POD) |
| `shipped` | On the way |
| `delivered` | Delivered to customer |
| `cancelled` | Order cancelled |
| `failed` | Failed to fulfill |
| `refunded` | Refunded |

---

## Files Structure

```
src/
├── models/
│   └── FulfillmentOrder.ts          # Order fulfillment tracking
├── lib/
│   ├── fulfillment.ts               # Main fulfillment service
│   ├── email-service.ts             # Email notifications
│   ├── google-drive.ts              # Google Drive integration
│   ├── printify-api.ts              # Printify API client
│   └── prodigi-api.ts               # Prodigi API client
└── app/api/
    ├── payments/webhook/route.ts    # Asaas webhook (triggers fulfillment)
    ├── fulfillment/
    │   ├── route.ts                 # List user orders
    │   └── [orderId]/route.ts       # Get/update specific order
    └── webhooks/
        ├── printify/route.ts        # Printify webhooks
        └── prodigi/route.ts         # Prodigi webhooks
```

---

## Course Content Delivery

### Option 1: Database Field
Store content URLs directly in the product database.

### Option 2: Google Drive Folder
1. Create a folder in Google Drive for each course
2. Add the folder ID to `COURSE_FOLDERS` in `google-drive.ts`:

```typescript
const COURSE_FOLDERS: Record<string, string> = {
  'chatgpt-masterclass': '1abc123...',
  'n8n-automacao-avancada': '1def456...',
};
```

3. The system will automatically share the folder with students

---

## API Endpoints

### List User Orders
```
GET /api/fulfillment
Authorization: Bearer <token>
Query: ?page=1&limit=10&status=delivered
```

### Get Order Details
```
GET /api/fulfillment/{orderId}
Authorization: Bearer <token>
```

### Update Tracking (Admin)
```
PUT /api/fulfillment/{orderId}
Authorization: Bearer <token>
Body: {
  "action": "update_tracking",
  "trackingInfo": {
    "carrier": "Correios",
    "trackingNumber": "ABC123",
    "trackingUrl": "https://..."
  }
}
```

### Mark as Delivered (Admin)
```
PUT /api/fulfillment/{orderId}
Authorization: Bearer <token>
Body: {
  "action": "mark_delivered"
}
```

---

## Email Templates

The system sends beautiful HTML emails for:

1. **Order Confirmed** - When payment is received
2. **Order Shipped** - When tracking number is available
3. **Order Delivered** - When delivery is confirmed
4. **Course Access** - Specific template for digital courses
5. **Subscription Activated** - Plan upgrade confirmation
6. **Order Failed** - If fulfillment fails

---

## Creator Commissions (POD)

For POD products with creators:

1. Commission calculated at order time (default 70% to creator)
2. Stored in `pendingEarnings` until delivery
3. Moved to `totalEarnings` when delivered
4. Tracked in `PODOrder` and `User.podEarnings`

---

## Testing

### Test Digital Fulfillment
1. Create a course product
2. Make a test purchase
3. Verify:
   - User enrolled in course
   - Email sent with access link
   - Google Drive shared (if configured)

### Test POD Fulfillment
1. Configure Printify/Prodigi sandbox
2. Create a POD product
3. Make a test purchase
4. Verify:
   - Order sent to provider
   - Timeline updated on webhook events
   - Emails sent at each stage
   - Creator earnings tracked

---

## Troubleshooting

### Module Import Errors
If you see "Cannot find module './email-service'" errors, restart the TypeScript server or run:
```bash
npm run build
```

### Webhook Not Receiving
1. Check webhook URL is correct in provider dashboard
2. Verify no firewall blocking
3. Check Netlify function logs

### Email Not Sending
1. Verify `RESEND_API_KEY` is set
2. Check Resend dashboard for errors
3. System continues even if email fails (graceful degradation)
