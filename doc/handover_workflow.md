# Airbnb Website Handover Workflow

## Pre-Setup Steps

### 1. Email Setup

- Go to [Guerrilla Mail](https://www.guerrillamail.com/) to get a temporary email
- Name the email after the villa (e.g., `airlift-villazori`)

### 2. Cloudflare Account Setup

- Create a new Cloudflare account
- Add email and password to the [credentials spreadsheet](https://docs.google.com/spreadsheets/d/18Co4IN-iwzo5Pd9ntBviQocYAMOIT1fFhlVmfJ6JZoE/edit?gid=0#gid=0)
- Verify the email address
- Rename the Cloudflare account name to match the villa name. This is done in the account overview.

## Domain & Deployment Setup

### 3. Domain Purchase

- Purchase the domain for the requested number of years using fake billing adress as it is visible on invoice later.
- Register under "John Doe" for privacy. Both domain register and billing adress.
- Remove payment details after purchase

### 4. Website Deployment

- Upload the project folder to Cloudflare Pages
- Deploy the website

### 5. DNS Configuration

- Add custom domain for both `www.domain.com` and `domain.com`

### 6. Analytics Setup

- Enable Web Analytics for the site
- Access via: Analytics & Logs > Web Analytics
- Redeploy the site after enabling analytics

### 7. Email Forwarding Setup

- Account home > click on domain name > Email > Email Routing
- **Important**: Client will receive a verification link for email forwarding
- Click on skip getting started and just enable email routing directly on the next page. It will work once the email has been verified.

## Final Handover

### 8. Send Handover Email

Include the following information in your handover email:

#### Essential Information

- **Website Link**: Direct link to the live website
- **Cloudflare Login Credentials**: Username and password
- **All Project Code**: Attach the complete project folder

#### Instructions for Client

1. **Update Account Information**: Instructions for how to update email and password for the account
2. **Add Personal Information**: Instructions for updating domain registration details (must do to not risk losing it?)
3. **Email Verification**: Mention that they should have received a verification link for email forwarding. (annrs följd /guide för hur man skickar om verifieringsmail.. eller ändrar email forwarding)
4. **Guides Link**: Include link to `/guides` for additional documentation about your website. How to update it etc.

#### Email Template Structure

```
Subject: [Villa Name] - Website Handover Complete

Hi [Client Name],

Your Airbnb website is now live and ready! Here's everything you need:

🌐 Website: [LIVE_WEBSITE_URL]

🔐 Cloudflare Login:
- Username: [EMAIL]
- Password: [PASSWORD]

📋 Next Steps:
1. Change your Cloudflare email and password immediately
2. Add your personal details to the domain registration
3. Check your email for the forwarding verification link

📚 Additional Resources:
- Guides: [WEBSITE_URL]/guides

📁 Project Files: [ATTACHED]

Let me know if you need any help with the setup!

Best regards,
[Your Name]
```

## Payment Request

### Payment Details

- **Account Number**: 5050026398
- **Account Name**: Widalia sitinjak
- **Bank**: BCA

### Payment Request Email Template

```
Subject: [Villa Name] - Payment Request for Website

Hi [Client Name],

Thank you for your order, we are glad you liked the demo and want to launch your site!

To proceed please complete the payment using the following details:

Payment Information:
- Bank: BCA
- Account Number: 5050026398
- Account Name: Widalia sitinjak
- Amount due: IDR 4,283,000 ($259.90)

Please send the payment confirmation receipt, and we will proceed with the handover immediately.

Once payment is confirmed, we will finalize your website to your specifications and launch it for you.

When the website is launched we will notify you and hand over account details to you.
We will also include detailed guides for how to update content and configurations on your site in the future.

Thank you for choosing our services!

```

## Notes

- Always test the email forwarding verification process
- Ensure all credentials are properly documented
- Keep a backup of all project files
- Follow up with client after 24-48 hours to ensure smooth transition
- Send payment request before final handover
