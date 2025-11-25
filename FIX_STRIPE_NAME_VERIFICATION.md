# Fix Stripe Name Verification Issue

## The Problem
Stripe allowed payment even when the name was misspelled. You want to prevent this.

## Important Note
**Stripe does NOT verify names against credit cards by default.** This is standard Stripe behavior because:
- Card names can vary (nicknames, middle names, etc.)
- Name matching is unreliable
- Stripe focuses on CVC and postal code verification instead

## Solutions

### Option 1: Enable Stripe Radar (Recommended)
Stripe Radar is Stripe's fraud detection system that can help catch suspicious payments.

1. In Stripe, go to **"Radar"** in the left sidebar
2. Go to **"Rules"** or **"Settings"**
3. Enable fraud detection rules
4. This will help catch suspicious patterns (but won't verify names specifically)

### Option 2: Add Frontend Validation (User Experience)
Add validation in your registration form to warn users, but this won't block payments:

1. In `frontend/src/pages/Register.tsx`
2. Add a warning message if name looks suspicious
3. This is just a warning, not a block

### Option 3: Use Stripe's Payment Intent with Additional Verification
For more control, you could:
1. Use Payment Intents instead of Checkout
2. Add additional verification steps
3. But this is more complex and may reduce conversion

## Recommendation
**Use Stripe Radar** - it's the best way to catch fraud without blocking legitimate users. Name verification is not a standard payment security method.

## What Stripe Actually Verifies
- ✅ CVC (Card Verification Code)
- ✅ Postal/ZIP code
- ✅ Card number validity
- ✅ Expiration date
- ❌ Name (not verified - this is normal)

## Industry Standard
Most payment processors (Stripe, PayPal, Square) do NOT verify names because:
- Names on cards vary
- It causes false rejections
- CVC + postal code are more reliable

Would you like me to help you set up Stripe Radar, or add frontend validation warnings?

