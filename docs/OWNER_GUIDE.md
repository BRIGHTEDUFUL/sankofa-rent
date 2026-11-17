# Sankofa Rent — Owner's Complete Guide

> **Built for:** Ghanaian landlords who want to manage their properties, tenants, rent, and payments from one clean app — on their phone or laptop.
>
> **Live at:** [final-year-rent-project.edimamfaidol.workers.dev](https://final-year-rent-project.edimamfaidol.workers.dev)

---

## Table of Contents

1. [What is Sankofa Rent?](#1-what-is-sankofa-rent)
2. [Getting Started](#2-getting-started)
3. [Dashboard — Your Overview](#3-dashboard--your-overview)
4. [Properties & Units](#4-properties--units)
5. [Tenants](#5-tenants)
6. [Leases](#6-leases)
7. [Invoices](#7-invoices)
8. [Payments & Receipts](#8-payments--receipts)
9. [Maintenance](#9-maintenance)
10. [Announcements & Tenant Notice Board](#10-announcements--tenant-notice-board)
11. [Settings — Your Profile & Payment Details](#11-settings--your-profile--payment-details)
12. [Branding — Customise the App's Look](#12-branding--customise-the-apps-look)
13. [Account Management — Managing Users](#13-account-management--managing-users)
14. [Password Reset System](#14-password-reset-system)
15. [Automated Tasks (What the System Does by Itself)](#15-automated-tasks-what-the-system-does-by-itself)
16. [How Money Works in This App](#16-how-money-works-in-this-app)
17. [Running the App on a New Computer](#17-running-the-app-on-a-new-computer)
18. [Important Technical Notes](#18-important-technical-notes)
19. [Quick Reference — Where to Find Things](#quick-reference--where-to-find-things)

---

## 1. What is Sankofa Rent?

Sankofa Rent is a **web-based property management system** designed specifically for landlords in Ghana. It replaces exercise books, WhatsApp groups, and scattered MoMo screenshots with one organised platform.

### What you can do with it:

| Area | What it handles |
|---|---|
| 🏢 **Properties** | Manage multiple properties and their units |
| 👥 **Tenants** | Store tenant details, contacts, and history |
| 📄 **Leases** | Create and track rental agreements |
| 🧾 **Invoices** | Send rent invoices and track payment status |
| 💳 **Payments** | Record MoMo, bank, and cash payments with receipts |
| 🔧 **Maintenance** | Track repair requests and their progress |
| 📢 **Announcements** | Notify tenants through a public notice board |
| 🎨 **Branding** | Customise the app's name, logo, and colours |
| 👤 **Accounts** | Manage who can log in and their roles |

### Who uses it:
- **Admin (You / the landlord)** — full access to everything including settings, branding, and account management
- **Users (staff or co-managers)** — standard access to daily tasks; no access to settings or branding

---

## 2. Getting Started

### Sign Up
When you first open the app, sign up with your email and a strong password.

> **Important:** The **very first person to sign up** automatically becomes the **Admin**. Everyone who signs up after that becomes a regular user.

### First Things to Do After Signing Up:
1. Go to **Settings** and fill in your profile (name, phone, business name)
2. Add your MoMo number and network (MTN, Telecel, or AirtelTigo)
3. Add your first **Property**
4. Add **Units** to that property
5. Add your **Tenants**
6. Create **Leases** connecting tenants to units
7. Start sending **Invoices**

---

## 3. Dashboard — Your Overview

The dashboard is the first screen you see after logging in. It gives you a snapshot of your rental business at a glance.

### What you see on the Dashboard:

| Card | What it shows |
|---|---|
| **Collected** | Total rent money received this month |
| **Occupancy** | Percentage of your units that are currently rented out (e.g. 75%) |
| **Arrears** | Total money owed to you from previous unpaid invoices |
| **Expected** | Total rent you should receive this month |
| **Collection Rate** | Percentage of expected rent you've actually received |
| **Rent Collection Chart** | 6-month bar chart comparing collected vs invoiced amounts |
| **Portfolio Overview** | Total count of properties, units, and tenants |
| **Recent Payments** | The latest payments recorded in the system |
| **Maintenance** | Active repair/maintenance issues requiring attention |
| **MoMo Setup** | Shortcut to configure your mobile money payment details |
| **Notice Board** | Your most recent pinned tenant announcement |

---

## 4. Properties & Units

### Properties
A **Property** is a building or compound you own (e.g., *"Adenta Court"*, *"Tema Compound"*).

**What you can store per property:**
- Property name
- Area / neighbourhood (e.g., *"Adenta, Accra"*)
- Region
- Ghana Post GPS code
- Property photo

### Units
A **Unit** is a specific rentable space inside a property (e.g., *"Apt A1"*, *"Room 3"*, *"Studio B"*).

**What you can store per unit:**
- Unit label / name
- Number of bedrooms
- Monthly rent amount (in Cedis)
- Status: **Vacant**, **Occupied**, or **Under Maintenance**

> **Tip:** Add all your units before assigning tenants — you need units to exist before you can create leases.

---

## 5. Tenants

The **Tenants** section stores all the people who rent from you.

### Information you can store per tenant:
- Full name
- Phone number
- Email address *(optional)*
- Ghana Card number *(optional)*
- Emergency contact name and number *(optional)*
- Which unit they are currently in
- When they moved in
- Running balance — automatically calculated from their unpaid invoices

### Tenant Status:
- **Active** — currently renting a unit
- **Archived** — no longer renting (moved out). Archived tenants are hidden from daily views but their full payment and lease history is preserved

---

## 6. Leases

A **Lease** is the formal rental agreement between you and a tenant for a specific unit.

### What a lease contains:
- Tenant name and unit
- Start date and end date
- Monthly rent amount
- Number of advance months paid (e.g., 2 months advance)
- Security deposit amount
- Lease status: **Active**, **Expiring**, or **Ended**
- Lease document file upload *(optional — you can attach a PDF of the signed agreement)*

### Lease Statuses:

| Status | Meaning |
|---|---|
| **Active** | Lease is currently running normally |
| **Expiring** | Lease ends within 60 days — the system flags this automatically |
| **Ended** | Lease has been manually closed/terminated |

> **Important:** You cannot put two active leases on the same unit at the same time. The system will prevent this and show a clear error.

> **Automatic:** Every day, the system checks for leases ending within 60 days and marks them as **Expiring** so you know to follow up with the tenant about renewal.

---

## 7. Invoices

An **Invoice** is a rent bill sent to a tenant for a specific month.

### Invoice Lifecycle:

```
Draft  →  Sent  →  Partial  →  Paid ✅
                       ↓
                    Overdue ❌  (if past due date and still unpaid)
```

| Status | Meaning |
|---|---|
| **Draft** | Created but not yet sent to tenant |
| **Sent** | Tenant has been notified |
| **Partial** | Tenant paid some but not all of the amount |
| **Paid** | Fully paid ✅ |
| **Overdue** | Past the due date and still unpaid ❌ |

### Invoice Numbers:
Invoices are automatically numbered in sequence: `INV-1001`, `INV-1002`, `INV-1003`, and so on. You never have to number them yourself.

### Automatic Invoice Generation:
> Every **1st of the month at 6:00 AM**, the system automatically creates rent invoices for all active leases. You do not need to create invoices manually each month.

### Duplicate Protection:
The system will not allow two invoices for the same lease and same month. If you accidentally try to create a duplicate, you will get a clear error message like: *"Invoice INV-1001 already covers this lease and period."*

---

## 8. Payments & Receipts

This is where you record money received from tenants.

### Payment Methods Supported:

| Method | Description |
|---|---|
| **MTN MoMo** | MTN Mobile Money |
| **Telecel Cash** | Telecel (Vodafone) Cash |
| **AirtelTigo Money** | AirtelTigo Mobile Money |
| **Bank Transfer** | Direct bank payment |
| **Cash** | Physical cash in hand |

### What you record for each payment:
- Tenant name
- Which invoice it is paying *(optional — you can record advance payments too)*
- Payment method
- MoMo / bank reference number *(optional)*
- Amount paid
- Date and time of payment

### Receipts:
Every payment automatically generates a **numbered digital receipt** (`RCP-0001`, `RCP-0002`, etc.). The receipt shows all details and can be shared with the tenant as proof of payment.

### How payments update invoices:
When you record a payment against an invoice:
- If it covers the **full amount** → the invoice becomes **Paid** ✅
- If it covers **part of the amount** → the invoice becomes **Partial** (shows exactly how much is still owed)

---

## 9. Maintenance

Track all repair and maintenance issues across your properties.

### What you can record:
- Title / short description of the problem
- Full description *(optional)*
- Which property and unit it's in
- Who reported it (tenant name or staff member)
- **Priority:** Low, Medium, or High
- **Status:** Open, In Progress, or Resolved
- Repair cost *(optional)*
- Photo attachments *(evidence photos of the issue)*

### Maintenance Statuses:

| Status | Meaning |
|---|---|
| **Open** | Issue has been reported, work hasn't started yet |
| **In Progress** | Currently being worked on by a contractor or handyman |
| **Resolved** | Issue has been fixed and closed |

---

## 10. Announcements & Tenant Notice Board

The system has a **two-part announcement system**:

### Part 1 — Announcements (Landlord/Admin Side)
Create announcements from the **Announcements** page. You can:
- Write a title and full message body
- Target a **specific property** or **all properties**
- **Pin** an important announcement so it appears at the very top
- Mark as urgent

### Part 2 — Tenant Notice Board (Public Page — No Login Required)
There is a **public notice board** that your tenants can visit from their phone without needing an account.

The address is your app URL followed by `/notices`:
```
https://final-year-rent-project.edimamfaidol.workers.dev/notices
```

**To share it with tenants:**
1. Go to **Announcements** in the app
2. Click **"Copy tenant notice link"**
3. Paste and send that link to your tenants via WhatsApp or SMS

---

## 11. Settings — Your Profile & Payment Details

Go to **Settings** (found in the left sidebar on desktop, or the **More** tab on mobile).

### Profile Tab:
- First name, last name
- Phone number
- Business name *(e.g., "Nonnon Properties")*
- Region

### Payments Tab *(Important — set this up first)*:
- MoMo number and network (MTN, Telecel, or AirtelTigo)
- Bank name and account number
- These details are shown to tenants so they know exactly how to pay you

### Rent Settings:
- **Rent Due Day** — which day of the month rent is due *(e.g., day 5 means rent is due on the 5th)*
- **Late Fee %** — optional percentage added to overdue invoices

### Notification Preferences:
Toggle on/off:
- SMS notifications
- Email notifications
- WhatsApp notifications

> **Note:** Automated sending of SMS/WhatsApp messages is a planned future feature. The toggle fields are ready and will activate when that feature is added.

---

## 12. Branding — Customise the App's Look

> **Admin only.** Regular users cannot see or access Branding settings.

Found in **Settings → Branding**.

### What you can customise:

| Setting | What it changes |
|---|---|
| **App Name** | The name shown in the app header and browser tab (up to 60 characters) |
| **Tagline** | A short description shown on the login screen (up to 120 characters) |
| **Accent Colour** | The main colour used for buttons, active links, and icons |
| **Logo** | Your business logo — shown in the app and on the public notice board |

### Accent Colour Options:
Choose from **8 curated preset colours**:
- Sage Green, Forest, Ocean, Amber, Rose, Violet, Slate, Charcoal

Or enter a **custom hex colour code** (e.g., `#1a5e3f`)

> **Live update:** All changes apply instantly and all users see them immediately — no need to refresh the page.

---

## 13. Account Management — Managing Users

> **Admin only.** Found in **Settings → Accounts**.

### What admins can do:

| Action | Description |
|---|---|
| **View all accounts** | See every person who has an account |
| **Promote to Admin** | Give another user full admin access |
| **Demote to User** | Remove admin access from someone |
| **Reset Password** | Set a temporary password for a locked-out user |
| **Create Account** | Create a new login account for a staff member |
| **Delete Account** | Permanently remove an account from the system |

### Admin Protection Rules:
- You **cannot demote or delete the last remaining admin**
- This prevents the situation where nobody has access to admin features and the system is locked out

### Roles Summary:

| Role | Access Level |
|---|---|
| **Admin** | Full access — all features including Settings, Branding, Account Management |
| **User** | Standard access — Properties, Tenants, Leases, Invoices, Payments, Maintenance, Announcements |

---

## 14. Password Reset System

The system includes a **self-service password reset request flow** — no email server is required.

### How it works step by step:

**Step 1 — User requests a reset:**
On the login page, they click **"Forgot password?"**, enter their email address, and optionally add a note (e.g., their phone number so the admin can verify their identity).

**Step 2 — Admin sees the request:**
Admins see a **red badge notification** in Settings → Accounts showing the number of pending requests. They click through to review and verify the request.

**Step 3 — Admin issues a temporary password:**
The admin enters a temporary password (e.g., `TempPass2026`) and clicks **Resolve**. The system immediately sets this as the user's password.

**Step 4 — User is forced to change their password:**
The next time the user logs in with the temporary password, they are **immediately asked to create their own new permanent password** before they can access anything in the app.

---

## 15. Automated Tasks (What the System Does by Itself)

The following tasks run automatically in the background — **you don't need to do anything**.

| When | What it does |
|---|---|
| **Every day at 6:00 AM** | Checks all invoices. Any that are past their due date and still unpaid are automatically marked as **Overdue** |
| **1st of every month at 6:00 AM** | Automatically **creates rent invoices** for every active lease for the new month |
| **Every day at 6:30 AM** | Checks all leases. Any lease ending **within 60 days** is automatically marked as **Expiring** |

> These tasks run at **6:00 AM Ghana time** (GMT+0).

---

## 16. How Money Works in This App

All money is stored and calculated in **pesewas** — the smallest unit of the Ghana Cedi.

- GH₵ 1.00 = 100 pesewas
- GH₵ 850.00 = 85,000 pesewas

**Why pesewas and not Cedis?**
Computers have a known problem with decimal numbers — `0.1 + 0.2` does not always equal exactly `0.3` in computer arithmetic. By using whole numbers (pesewas), the app ensures that all totals, balances, and calculations are always **100% precise, down to the last pesewa**.

**What you see in the app:** All amounts are displayed correctly as `GH₵ 1,850.00` — the formatting happens automatically.

**When you type in amounts:** The app understands all these formats:
- `1600`
- `1,600`
- `GH₵ 1,600`
- `GHS 1600.00`

---

## 17. Running the App on a New Computer

The app works in two ways:

### Option A — Use the Live Website *(Recommended)*
Simply open any web browser and go to:
```
https://final-year-rent-project.edimamfaidol.workers.dev
```
No installation required. Works on any device — phone, tablet, or computer.

---

### Option B — Run It Locally on Your Own Computer

**Before you start, install Node.js:**
Download and install **Node.js version 22 or later** from [nodejs.org](https://nodejs.org/) *(choose the LTS version)*.

**Then:**

#### On Windows:
1. Copy the project folder to the new computer *(or clone from GitHub)*
2. **Double-click `run.bat`**
3. A terminal window opens — it sets everything up automatically
4. Your browser will open to `http://localhost:3000` automatically

#### On Mac or Linux:
1. Copy the project folder to the new computer *(or clone from GitHub)*
2. Open a Terminal in the project folder and run:
   ```bash
   chmod +x run.sh && ./run.sh
   ```
3. Your browser will open to `http://localhost:3000` automatically

### What the script does automatically:
- ✅ Checks that Node.js is installed
- ✅ Creates the environment configuration file (`.env.local`) with all credentials
- ✅ Installs all required libraries and dependencies (`npm install`)
- ✅ Verifies the connection to the backend database
- ✅ Runs all 20 unit tests to confirm everything is working
- ✅ Starts the backend sync and frontend server
- ✅ Opens your browser at `http://localhost:3000`

---

## 18. Important Technical Notes

### Two Separate Systems Working Together:

| Part | What it is | Where it lives |
|---|---|---|
| **Frontend** | The website interface you see and interact with | Cloudflare Workers (runs at the network edge, globally fast) |
| **Backend** | The database, authentication, and business logic | Convex Cloud (real-time, serverless) |

### Deployments:

| Environment | Web Address | Purpose |
|---|---|---|
| **Production** *(Live)* | `final-year-rent-project.edimamfaidol.workers.dev` | The real live app everyone uses |
| **Development** *(Local)* | `localhost:3000` | For testing and development only |

### Your Data is Safe in the Cloud:
All data is stored in **Convex Cloud** — not on your local computer. If your computer is lost, broken, or replaced, your data is completely safe and accessible from any other device by logging into the live app.

### Automatic Deployment:
When a developer pushes code improvements to GitHub (branch: `main`), the live website **automatically updates within about 2 minutes**. No manual steps are needed to publish updates.

### Environment File (Backend Keys):
The file `.env.local` contains the connection keys to the database. This file is **kept private and never uploaded to GitHub**. The `run.bat` / `run.sh` scripts recreate it automatically on any new computer.

---

## Quick Reference — Where to Find Things

| I want to... | Go to... |
|---|---|
| See my rent summary and collection rate | **Dashboard** (Home) |
| Add a new property | **Properties & units** → Add property |
| Add a unit to a property | **Properties & units** → Click the property → Add unit |
| Add a new tenant | **Tenants** → Add tenant |
| Create a rental agreement | **Leases** → New lease |
| Send a rent invoice | **Rent invoices** → New invoice |
| Record a payment received | **Payments & receipts** → Record payment |
| Log a repair or maintenance issue | **Maintenance** → New request |
| Announce something to all tenants | **Announcements** → New announcement |
| Get the link to share with tenants | **Announcements** → Copy tenant notice link |
| Update my MoMo number | **Settings** → Payments tab |
| Change the app name or colours | **Settings** → Branding tab *(admin only)* |
| Add a new staff member account | **Settings** → Accounts tab → Create account |
| Reset a user's forgotten password | **Settings** → Accounts tab → Reset password |
| Approve a password reset request | **Settings** → Accounts tab → Pending requests |

---

*Sankofa Rent — Final Year Project, 2026. Developed by Edith Nonnon.*
*For technical support, contact the developer.*
