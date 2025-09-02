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
- Register under "John Doe" for privacy if customer has not shared their personal information.
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

See gmail template hands-off. Use correct one depending on if user needs to add their contact information for domain reg.
