// SMS utility using Twilio
// Required env vars: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER

type SendSMSParams = {
  to: string;
  body: string;
};

type TwilioMessage = {
  sid: string;
  status: string;
  to: string;
  body: string;
};

function isTwilioConfigured(): boolean {
  return !!(
    process.env.TWILIO_ACCOUNT_SID &&
    process.env.TWILIO_AUTH_TOKEN &&
    process.env.TWILIO_PHONE_NUMBER
  );
}

export async function sendSMS({ to, body }: SendSMSParams): Promise<{ success: boolean; disabled?: boolean; message?: TwilioMessage; error?: string }> {
  if (!isTwilioConfigured()) {
    console.warn('[SMS] Twilio environment variables are not set; SMS sending disabled.');
    return { success: false, disabled: true };
  }

  const accountSid = process.env.TWILIO_ACCOUNT_SID!;
  const authToken = process.env.TWILIO_AUTH_TOKEN!;
  const fromNumber = process.env.TWILIO_PHONE_NUMBER!;

  // Format the phone number - ensure it has country code
  let formattedTo = to.replace(/\D/g, ''); // Remove non-digits
  if (formattedTo.length === 10) {
    formattedTo = '1' + formattedTo; // Add US country code
  }
  if (!formattedTo.startsWith('+')) {
    formattedTo = '+' + formattedTo;
  }

  try {
    const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + Buffer.from(`${accountSid}:${authToken}`).toString('base64'),
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        To: formattedTo,
        From: fromNumber,
        Body: body,
      }).toString(),
    });

    if (!response.ok) {
      const errorData = await response.json() as { message?: string };
      console.error('[SMS] Twilio error:', errorData);
      return { success: false, error: errorData.message || 'Failed to send SMS' };
    }

    const message = await response.json() as TwilioMessage;
    console.log(`[SMS] Message sent successfully to ${formattedTo}, SID: ${message.sid}`);
    return { success: true, message };
  } catch (error) {
    console.error('[SMS] Error sending message:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

export function formatPhoneForSMS(phone: string | null | undefined): string | null {
  if (!phone) return null;
  
  // Remove all non-digits
  const digits = phone.replace(/\D/g, '');
  
  // Must have at least 10 digits for a valid US number
  if (digits.length < 10) return null;
  
  return digits;
}

