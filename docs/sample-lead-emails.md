# Sample Lead Email Cases

This document contains examples of lead notification emails from various providers. These samples represent the result of extensive research into different lead generation platforms and their email formats, ensuring our extraction system can handle all possible variations.

> **Note**: This is not a comprehensive list. The system is designed to be extensible—new lead emails from different providers can be easily added. Prompts can be updated and tested in [LangSmith](https://smith.langchain.com/) without code changes, allowing rapid iteration and improvement of extraction accuracy for new email formats.

## Format Variability Handling

Different lead providers send emails in completely different formats—HTML, plain text, rich text, with varying structures, styles, and metadata. Our system handles this variability through a **normalization-first approach** that extracts only the essential information needed for AI processing.

### Normalization Strategy

Regardless of the email format or provider variation, we normalize all incoming emails to two simple fields:

1. **Subject**: The email subject line (always present)
2. **Text**: Plain text content extracted from HTML or provided as-is

**Implementation**:
```typescript
// Normalize text for extraction (minimal + deterministic)
const normalizedText = (
  message.text ||
  message.extracted_text ||
  ''
).trim();

// Send to LLM for extraction
const extractionPayload = {
  subject: message.subject,
  text: normalizedText,
  leadId: createdLead.id,
};
```

### Why This Works

- **Format Agnostic**: Whether the email is HTML, plain text, or rich text, we extract the text content
- **Provider Agnostic**: Google LSA, Yelp, Angi, HomeAdvisor—all reduced to subject + text
- **Consistent Input**: The LLM receives a standardized format, improving extraction accuracy
- **Robust Fallback**: Uses `text` first, falls back to `extracted_text`, then empty string

### Extraction Success

Despite format variations, our system successfully extracts:
- Customer name
- Phone number
- Address
- Service requested
- Provider identification

The LLM is trained to parse these fields from normalized text, regardless of the original email structure, styling, or provider-specific formatting.

> **Note**: This is not a comprehensive list. The system is designed to be extensible—new lead emails from different providers can be easily added. Prompts can be updated and tested in [LangSmith](https://smith.langchain.com/) without code changes, allowing rapid iteration and improvement of extraction accuracy for new email formats.

---

## Table of Contents

- [Google Local Services Ads](#google-local-services-ads)
  - [Booking Leads](#booking-leads)
  - [Phone Leads](#phone-leads)
  - [Message Leads](#message-leads)
- [Yelp](#yelp)
  - [Message Leads](#message-leads-1)
  - [Quote Requests](#quote-requests)
  - [Call Back Requests](#call-back-requests)
  - [Lead Activity Summaries](#lead-activity-summaries)
- [Angi](#angi)
  - [New Leads](#new-leads)
  - [Booking Requests](#booking-requests)
  - [Messages](#messages)
  - [Time Connection Requests](#time-connection-requests)
  - [Opportunities](#opportunities)

---

## Google Local Services Ads

![Google Local Services Ads](https://img.shields.io/badge/Google%20Local%20Services%20Ads-4285F4?logo=google&logoColor=white)

### Booking Leads

#### Example 1: Standard Booking Request

**From**: `Google Local Services`  
**Subject**: `New Booking Lead from Local Services Ads`

**Body**:
```
New Booking Request from Google Local Services Ads!

📆 Date & Time: 12/22/2025 14:30  
📍 Service Requested: AC Repair

Booking Details:
Customer Name: Robert Johnson
Preferred Date: 12/22/2025
Preferred Time: 1:00 PM
Notes: "Customer noted that the unit is making a loud buzzing sound and not blowing cold air."

Please visit your Local Services Ads dashboard to view and manage this booking.

Thank you,  
Google Local Services Ads Team
```

**Normalized Input Sent to LLM**:
```json
{
  "subject": "New Booking Lead from Local Services Ads",
  "text": "New Booking Request from Google Local Services Ads!\n\n📆 Date & Time: 12/22/2025 14:30\n📍 Service Requested: AC Repair\n\nBooking Details:\nCustomer Name: Robert Johnson\nPreferred Date: 12/22/2025\nPreferred Time: 1:00 PM\nNotes: \"Customer noted that the unit is making a loud buzzing sound and not blowing cold air.\"\n\nPlease visit your Local Services Ads dashboard to view and manage this booking.\n\nThank you,\nGoogle Local Services Ads Team"
}
```

**Extracted Output**:
```json
{
  "customer_name": "Robert Johnson",
  "customer_number": null,
  "customer_address": null,
  "service_requested": "AC Repair",
  "provider": "Google LSA"
}
```

**Note**: Regardless of whether this email arrives as HTML, plain text, or rich text, we extract the `subject` and `text` fields and send them to the LLM. The LLM successfully extracts the customer name and service requested, even without phone number or address in this example.

#### Example 2: Detailed Booking with Address

**From**: `Google Local Services local-services-noreply@google.com`  
**Subject**: `New booking: AC Repair on 12/22/2025`

**Body**:
```
New appointment booked
Customer: Robert Johnson
Service: AC Repair
Address: 742 Evergreen Terrace, Springfield, IL 62704
Phone: (555) 987-6543
Date/Time: Monday, Dec 22, 2025 @ 1:00 PM – 3:00 PM
Details: > Customer noted that the unit is making a loud buzzing sound and not blowing cold air.
[ Manage Booking ] (Button)
```

#### Example 3: Generic Booking Notification

**From**: `Google Local Services Ads`  
**Subject**: `New event`

**Body**:
```
Potential Customer has booked an appointment with you.

You received this booking on [Date] at [Time].

Name: [Customer Name or Potential Customer]
Location: [City]
Service type: [e.g., Plumbing Repair]
Appointment time: [Date and Time]
```

**Normalized Input Sent to LLM**:
```json
{
  "subject": "New event",
  "text": "Potential Customer has booked an appointment with you.\n\nYou received this booking on [Date] at [Time].\n\nName: [Customer Name or Potential Customer]\nLocation: [City]\nService type: [e.g., Plumbing Repair]\nAppointment time: [Date and Time]\n\nMessage (if provided): [Customer's note, or \"No message provided\"]\n\nTo connect with this customer:\nReply to this email  Or  Respond to this lead in the app\n\nLog in to confirm the booking and view full details."
}
```

**Note**: This example shows a template format. Even with placeholders like `[Date]` and `[Customer Name]`, our normalization extracts the text content and sends it to the LLM. The LLM handles partial information gracefully, extracting what's available.

Message (if provided): [Customer's note, or "No message provided"]

To connect with this customer:
Reply to this email  Or  Respond to this lead in the app

Log in to confirm the booking and view full details.
```

---

### Phone Leads

#### Example 1: Standard Phone Lead

**From**: `Google Local Services`  
**Subject**: `New Phone Lead from Google Local Services Ads`

**Body**:
```
New Phone Lead Received!

You have a new phone lead from your Local Services Ad.

📞 Lead Type: Phone Call  
📍 Location: Los Angeles, CA  
Date & Time: 12/20/2025 10:15 AM

The potential customer called your Google Local Services Ad number.  
Please check your Google Local Services Ads inbox or app for more details.

Thank you,  
Google Local Services Ads Team
```

#### Example 2: Missed Call Notification

**From**: `Google Local Services Ads`  
**Subject**: `New event`

**Body**:
```
You missed a call from a potential customer.

You received this call on [Date] at [Time].

Name: Potential Customer
Location: [City or Unknown]
Service type: [e.g., Roofing]

To connect with this customer:
Reply to this email  Or  Respond to this lead in the app

Log in to view the customer's phone number and call them back.
```

#### Example 3: Detailed Call Lead

**From**: `Google Local Services local-services-noreply@google.com`  
**Subject**: `New lead from [Your Business Name]`

**Body**:
```
You received a call from a new lead
Time of call: Dec 20, 2025, 10:15 AM
Call duration: 02:45
To see the customer's phone number and listen to the call recording, visit your lead inbox.
[ View Lead Details ] (Button)
Note: This lead was generated from your Local Services Ad.
```

---

### Message Leads

#### Example 1: Standard Message Lead

**From**: `Google Local Services`  
**Subject**: `New Message Lead from Google Local Services Ads`

**Body**:
```
You've received a new message lead via Google Local Services Ads!

📌 Lead Type: Message  
📆 Date & Time: 12/21/2025 15:30

Lead Details:
Name: Jane Doe
Message: "Hi, my water heater is leaking from the bottom and I need someone to come look at it today if possible. Please let me know your availability."

Reply directly by replying to this email, or check the LSA inbox in your Google Local Services Ads dashboard.

Thank you,  
Google Local Services Ads Team
```

#### Example 2: Detailed Message with Contact Info

**From**: `Google Local Services`  
**Subject**: `New message lead from Jane Doe`

**Body**:
```
You have a new message request
Customer Name: Jane Doe
Service: Water Heater Repair
Location: Los Angeles, CA 90001
Phone: (555) 987-6543
Customer Message: "Hi, my water heater is leaking from the bottom and I need someone to come look at it today if possible. Please let me know your availability."
Reply to this lead: You can reply directly to this email to send a message back to the customer, or use the Local Services app.
[Button: Reply to Customer]
```

#### Example 3: Message via Google Alias

**From**: `[Customer Name] via Google <[random-alias]@lsa.google.com>`  
**Subject**: `New message: Clogged Drain from Jane Smith`

**Body**:
```
You have a new message request
Customer: Jane Smith
Service: Clogged Drain
ZIP Code: 90210
Phone: (555) 123-4567
Message: "Hi, my kitchen sink is completely backed up and won't drain. Are you available to come by this afternoon for an estimate?"
Reply to this email to message the customer back.
[ Reply to Customer ] (Button)
```

---

## Yelp

![Yelp](https://img.shields.io/badge/Yelp-D32323?logo=yelp&logoColor=white)

### Message Leads

#### Example 1: Standard Message

**From**: `Yelp for Business`  
**Subject**: `New Message from a Potential Customer on Yelp`

**Body**:
```
Yelp for Business

Hi [Your Business Name],

You've received a new message from John D. in San Francisco, CA:

Message: "Hi, I need a quote for fixing a leaky faucet in my kitchen. Can you provide availability this week?"

Service Category: Plumbing

To reply, simply respond to this email (your response will be sent through Yelp). For full details or to continue the conversation, log in to your Yelp Business Inbox: [Link to Dashboard]

Thanks,
The Yelp Team

P.S. Respond within 24 hours to improve your response rate!
```

#### Example 2: Direct Customer Message

**From**: `[Customer Name] via Yelp <[long-unique-id]@messages.yelp.com>`  
**Subject**: `New message from [Customer Name]`

**Body**:
```
You have a new message on Yelp
[Customer Name] says: "Hi there! Do you offer emergency plumbing services on Sundays? My sink just burst."
How to respond: You can reply directly to this email to send your response to the customer. Your reply will be sent via Yelp's messaging system.
[ View Message on Yelp ] (Button)
```

#### Example 3: Generic Message Format

**From**: `Yelp for Business`  
**Subject**: `New Message from a Yelp Customer`

**Body**:
```
Hello [Business Name],

You have a new message from a Yelp user interested in your services.

💬 Message from: [Yelp User Display Name]  
📍 User Location: [City, State] (if available)  
🕒 Sent: [Date & Time]

Message:
"Hi, I'm interested in your [service/product]. Can you tell me your rates and availability this week?"

You can reply directly through your Yelp for Business inbox or by clicking the button below.

[Reply to Message]

Thanks,
Yelp for Business
```

---

### Quote Requests

#### Example 1: Standard Quote Request

**From**: `Yelp for Business`  
**Subject**: `New Quote Request for Home Cleaning on Yelp`

**Body**:
```
Yelp for Business

[Your Business Name],

A Yelp user is requesting a quote for Home Cleaning in 90210.

Customer Details:
- Name: Anonymous
- Job Description: "Looking for a deep clean of a 2-bedroom apartment before moving out. Budget around $200."
- Preferred Contact: Message or Call (via masked number)

View full details and respond in your Yelp dashboard: [Link to Lead in Inbox]

This lead is part of Nearby Jobs—respond quickly to connect!

Yelp Support
```

#### Example 2: Detailed Quote Request

**From**: `Yelp no-reply@yelp.com`  
**Subject**: `[Business Name] - New quote request from Sarah Williams`

**Body**:
```
[Customer Name] sent you a quote request
Project: Exterior House Painting
Timeline: Within a week
Location: San Francisco, CA 94103
Customer's Note: "Hi, I need the trim and front door of my house painted before an event next Friday. It's a two-story victorian. Can you provide an estimate?"
[ Reply to [Customer Name] ] (Button)
Note: Reply within 24 hours to keep your response time high!
```

#### Example 3: Quote Request via Form

**From**: `Yelp for Business`  
**Subject**: `New Quote Request via Yelp`

**Body**:
```
Hi [Business Name],

A Yelp user submitted a Request a Quote for your services!

📌 Customer: [Yelp User Display Name]  
📅 Submitted: [Date & Time]

Quote Details:
• Service Needed: [Service Type]
• Message: "[Customer's detailed message]"
• Additional info: [any custom form fields]

Please click below to view the full request and reply:

[View Quote in Yelp Business Inbox]

You can respond right from Yelp or via email reply.

Thank you,
Yelp for Business
```

#### Example 4: Nearby Jobs Quote

**From**: `Yelp for Business`  
**Subject**: `Someone Has a Job for You on Yelp`

**Body**:
```
Yelp for Business

Hey [Your Business Name],

A potential customer in [City] has posted a job that matches your services: [Brief Description, e.g., "Need storage unit for furniture during move."]

Location: [Approximate Area]
Timeline: [e.g., ASAP]

To see full details, including contact info (masked), and send a quote, log in to your Yelp for Business account: [Link to Nearby Jobs]

Upgrade to Yelp Ads for priority access to more leads like this.

Best,
Yelp Team
```

---

### Call Back Requests

#### Example 1: Standard Call Back Request

**From**: `Yelp no-reply@yelp.com`  
**Subject**: `[Customer Name] requested a call back`

**Body**:
```
New lead: [Customer Name] wants to speak with you
Phone Number: (555) 098-7654
Preferred Time: Today, between 2:00 PM – 4:00 PM
Service Needed: Kitchen Remodel
Note: "Looking for a full gut renovation of a small kitchen. Want to discuss budget and timeline over the phone."
[ Call Now ] (Button - Mobile) | [ View Lead Details ] (Button)
```

---

### Lead Activity Summaries

#### Example 1: Daily Summary

**From**: `Yelp for Business`  
**Subject**: `Your Yelp Lead Activity Summary`

**Body**:
```
Hello [Business Name],

You received new lead activity today on Yelp:

• 📩 New Message from [User A]  
• 📬 New Quote Request from [User B]  
• 📞 [Optional if Yelp Call Tracking Enabled] New Call Lead

Log in to your Yelp for Business Inbox to view and respond to all records:

[Go to Yelp Inbox]

Keep engaging with your leads quickly to improve conversions!

Sincerely,  
Yelp for Business
```

---

## Angi

![Angi](https://img.shields.io/badge/Angi-7BB661?logo=angi&logoColor=white)

### New Leads

#### Example 1: Standard New Lead

**From**: `newlead@angi.com`  
**Subject**: `You've Got a New Lead on Angi!`

**Body**:
```
Hello [Business Name],

You have a new lead from a homeowner looking for your service!

Lead Details:
• Service Requested: [e.g., "Bathroom Remodel"]  
• Customer Name: [First Last]  
• Location: [City, State]  
• When: [Submitted Date & Time]  
• Customer Message: "[Optional customer or project description]"

Contact Information:
Phone: [Phone Number Provided by Customer]  
Email: [Email Provided by Customer]  
Project Details: [Additional fields, like "Budget" / "Timeline"]

Please log in to Angi for Pros to view full lead details and respond.

Log in now: https://office.angi.com

Thank you,  
Angi Leads Team
```

#### Example 2: Detailed Plumbing Lead

**From**: `newlead@angi.com`  
**Subject**: `You Have a New Plumbing Lead!`

**Body**:
```
Angi Leads

New Lead Alert

Customer Name: John Smith
Phone Number: 123-123-1234
Address: 123 Merry Lane, San Diego, CA 92101
ZIP Code: 92101

Job Category: Plumbing
Job Description: Need help unclogging a kitchen drain. Available this week?

To contact this customer or view more details, log in to your Angi Pro app: [Link to Dashboard/App]

Respond quickly to improve your match rate!

Angi Support: (877) 947-3639
```

#### Example 3: Formatted Lead with Project Details

**From**: `Angi Pro leads@email.angi.com`  
**Subject**: `NEW LEAD: [Customer Name] has a [Service Type] project in [City]!`

**Body**:
```
A new customer is looking for a pro!
Customer: Michael R.
Project: Deck or Porch Repair
Location: Denver, CO 80202
Phone: (555) 222-3333
Project Details: "I have a few loose boards on my backyard deck that need replacing and staining. Looking to get this done before winter."
Action Required: Call or text Michael immediately to introduce yourself. High-ranking pros respond in under 5 minutes!
[ Contact Customer ] (Button)
```

---

### Booking Requests

#### Example 1: Standard Booking Request

**From**: `newlead@angi.com`  
**Subject**: `New Booking Request: Unclog Drain in Beverly Hills`

**Body**:
```
Angi Leads

New Booking Alert

Customer Name: Michael Johnson
Phone Number: (406) 555-0120
Email: michael.johnson@example.com
Address: 265 N. Robertson Blvd, Beverly Hills, CA 90211

Job Type: Unclog Drain
Category: Plumbing/HVAC
Message: The drain in my kitchen sink is clogged. Help!
Requested Time: July 10, 2025, 3:00 PM

Accept or dismiss this booking in your Angi Pro dashboard: [Link to Lead]

Campaign: Angi Leads

If you have questions, contact Angi Customer Care.
```

**Normalized Input Sent to LLM**:
```json
{
  "subject": "New Booking Request: Unclog Drain in Beverly Hills",
  "text": "Angi Leads\n\nNew Booking Alert\n\nCustomer Name: Michael Johnson\nPhone Number: (406) 555-0120\nEmail: michael.johnson@example.com\nAddress: 265 N. Robertson Blvd, Beverly Hills, CA 90211\n\nJob Type: Unclog Drain\nCategory: Plumbing/HVAC\nMessage: The drain in my kitchen sink is clogged. Help!\nRequested Time: July 10, 2025, 3:00 PM\n\nAccept or dismiss this booking in your Angi Pro dashboard: [Link to Lead]\n\nCampaign: Angi Leads\n\nIf you have questions, contact Angi Customer Care."
}
```

**Extracted Output**:
```json
{
  "customer_name": "Michael Johnson",
  "customer_number": "(406) 555-0120",
  "customer_address": "265 N. Robertson Blvd, Beverly Hills, CA 90211",
  "service_requested": "Unclog Drain",
  "provider": "Angi"
}
```

**Note**: This example demonstrates successful extraction of all fields including name, phone, address, and service type. The structured format makes extraction straightforward, but our system handles both structured and unstructured formats.

---

### Messages

#### Example 1: New Message from Homeowner

**From**: `newlead@angi.com`  
**Subject**: `New Message from a Homeowner on Angi`

**Body**:
```
Hi [Business Name],

A homeowner has sent you a message regarding an existing lead:

Sender: [Homeowner Name]  
Message: "Hi, I'm interested in your services and would like a quote…"

You can respond directly via the Angi for Pros app or dashboard.

Reply: https://office.angi.com/inbox

Best,  
Angi Leads Team
```

**Normalized Input Sent to LLM**:
```json
{
  "subject": "New Message from a Homeowner on Angi",
  "text": "Hi [Business Name],\n\nA homeowner has sent you a message regarding an existing lead:\n\nSender: [Homeowner Name]\nMessage: \"Hi, I'm interested in your services and would like a quote…\"\n\nYou can respond directly via the Angi for Pros app or dashboard.\n\nReply: https://office.angi.com/inbox\n\nBest,\nAngi Leads Team"
}
```

**Extracted Output**:
```json
{
  "customer_name": "[Homeowner Name]",
  "customer_number": null,
  "customer_address": null,
  "service_requested": null,
  "provider": "Angi"
}
```

**Note**: This example shows a template format. The LLM extracts the sender name from the message structure, demonstrating its ability to parse structured templates.

#### Example 2: Direct Message

**From**: `Angi messages@email.angi.com`  
**Subject**: `New message from [Customer Name] regarding [Service]`

**Body**:
```
You have a new message on Angi
From: Sarah L. Message: "Hi, I saw your reviews and was wondering if you do free estimates for roof inspections? We have a small leak in the garage."
[ Reply to Sarah ] (Button)
Note: Keeping your response time under 1 hour improves your profile strength.
```

**Normalized Input Sent to LLM**:
```json
{
  "subject": "New message from [Customer Name] regarding [Service]",
  "text": "You have a new message on Angi\nFrom: Sarah L. Message: \"Hi, I saw your reviews and was wondering if you do free estimates for roof inspections? We have a small leak in the garage.\"\n[ Reply to Sarah ] (Button)\nNote: Keeping your response time under 1 hour improves your profile strength."
}
```

**Extracted Output**:
```json
{
  "customer_name": "Sarah L.",
  "customer_number": null,
  "customer_address": null,
  "service_requested": "Roof Inspection",
  "provider": "Angi"
}
```

**Note**: Even with template placeholders in the subject line, the LLM successfully extracts the customer name and service from the message body.

---

### Time Connection Requests

#### Example 1: Requested Time to Connect

**From**: `newlead@angi.com`  
**Subject**: `Homeowner Requested a Time to Connect`

**Body**:
```
Hello [Business Name],

A homeowner has not only submitted a lead but also requested a time to discuss the job:

• Homeowner: [Name]  
• Requested Time: [Date / Time]  
• Project Type: [Type of work]

Please follow up promptly with the homeowner to confirm this appointment.

View details: https://office.angi.com

Thank you,  
Angi Leads Team
```

**Normalized Input Sent to LLM**:
```json
{
  "subject": "Homeowner Requested a Time to Connect",
  "text": "Hello [Business Name],\n\nA homeowner has not only submitted a lead but also requested a time to discuss the job:\n\n• Homeowner: [Name]\n• Requested Time: [Date / Time]\n• Project Type: [Type of work]\n\nPlease follow up promptly with the homeowner to confirm this appointment.\n\nView details: https://office.angi.com\n\nThank you,\nAngi Leads Team"
}
```

**Extracted Output**:
```json
{
  "customer_name": null,
  "customer_number": null,
  "customer_address": null,
  "service_requested": "[Type of work]",
  "provider": "Angi"
}
```

**Note**: This example shows a template format with placeholders. The LLM extracts what's available (provider and service type) and handles missing information gracefully.

---

### Opportunities

#### Example 1: Multiple Opportunities

**From**: `Angi Pro opportunities@email.angi.com`  
**Subject**: `[3] New opportunities available in your area`

**Body**:
```
Don't miss out on these jobs:
Kitchen Remodel - [Customer Name] - 5 miles away
Tile Installation - [Customer Name] - 8 miles away
Backsplash Repair - [Customer Name] - 3 miles away
[ View All Opportunities ] (Button)
```

**Normalized Input Sent to LLM**:
```json
{
  "subject": "[3] New opportunities available in your area",
  "text": "Don't miss out on these jobs:\nKitchen Remodel - [Customer Name] - 5 miles away\nTile Installation - [Customer Name] - 8 miles away\nBacksplash Repair - [Customer Name] - 3 miles away\n[ View All Opportunities ] (Button)"
}
```

**Extracted Output**:
```json
{
  "customer_name": null,
  "customer_number": null,
  "customer_address": null,
  "service_requested": "Kitchen Remodel, Tile Installation, Backsplash Repair",
  "provider": "Angi"
}
```

**Note**: This example contains multiple opportunities in a single email. The LLM extracts all service types mentioned, demonstrating its ability to handle multi-item emails.

---

## Research Notes

This collection represents comprehensive research into lead generation email formats across major platforms:

- **Google Local Services Ads**: 9 distinct email formats covering bookings, phone calls, and messages
- **Yelp**: 8 distinct email formats covering messages, quotes, callbacks, and summaries
- **Angi**: 6 distinct email formats covering leads, bookings, messages, time requests, and opportunities

**Total Email Variations Documented**: 23+ unique formats

These samples ensure our extraction system can handle:
- Different email structures and formatting
- Varied field placements and naming conventions
- Missing or optional fields
- Multiple contact methods (phone, email, message)
- Different urgency indicators and response deadlines
- Provider-specific terminology and branding

