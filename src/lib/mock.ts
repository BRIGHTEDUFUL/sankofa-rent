export const properties = [
  { name: "Adenta Court", area: "Adenta, Accra", units: 12, occupied: 11, rent: 18400 },
  { name: "Osu Garden Flats", area: "Osu, Accra", units: 8, occupied: 8, rent: 21600 },
  { name: "Kumasi Ridge Homes", area: "Ahodwo, Kumasi", units: 6, occupied: 4, rent: 7200 },
  { name: "Tema Comm. 25 Block", area: "Tema", units: 10, occupied: 9, rent: 11700 },
  { name: "East Legon Annex", area: "East Legon, Accra", units: 4, occupied: 3, rent: 9600 },
];
export const tenants = [
  { name: "Ama Owusu", phone: "024 512 3381", unit: "Adenta Court · A3", since: "Mar 2024", balance: 0 },
  { name: "Kwame Asante", phone: "020 778 1402", unit: "Osu Garden · 2B", since: "Jan 2025", balance: 2700 },
  { name: "Efua Mensah", phone: "055 901 2290", unit: "Tema C25 · 104", since: "Aug 2023", balance: 0 },
  { name: "Yaw Boateng", phone: "027 334 8810", unit: "Kumasi Ridge · 1", since: "Jun 2025", balance: 1200 },
  { name: "Akosua Darko", phone: "050 245 6671", unit: "East Legon · 2", since: "Oct 2024", balance: 0 },
  { name: "Kofi Annan Jr.", phone: "024 117 0093", unit: "Adenta Court · B1", since: "Feb 2026", balance: 3200 },
];
export const leases = [
  { tenant: "Ama Owusu", unit: "Adenta Court · A3", start: "01 Mar 2024", end: "28 Feb 2027", rent: 1600, advance: "12 mo", status: "Active" },
  { tenant: "Kwame Asante", unit: "Osu Garden · 2B", start: "01 Jan 2025", end: "31 Dec 2026", rent: 2700, advance: "6 mo", status: "Expiring" },
  { tenant: "Efua Mensah", unit: "Tema C25 · 104", start: "01 Aug 2023", end: "31 Jul 2027", rent: 1300, advance: "12 mo", status: "Active" },
  { tenant: "Yaw Boateng", unit: "Kumasi Ridge · 1", start: "01 Jun 2025", end: "31 May 2026", rent: 1200, advance: "6 mo", status: "Ended" },
  { tenant: "Akosua Darko", unit: "East Legon · 2", start: "01 Oct 2024", end: "30 Sep 2026", rent: 2400, advance: "12 mo", status: "Expiring" },
];
export const invoices = [
  { no: "INV-1042", tenant: "Kwame Asante", period: "Nov 2026", due: "05 Nov", amount: 2700, status: "Overdue" },
  { no: "INV-1041", tenant: "Kofi Annan Jr.", period: "Nov 2026", due: "05 Nov", amount: 1600, status: "Partial" },
  { no: "INV-1040", tenant: "Ama Owusu", period: "Nov 2026", due: "05 Nov", amount: 1600, status: "Paid" },
  { no: "INV-1039", tenant: "Efua Mensah", period: "Nov 2026", due: "05 Nov", amount: 1300, status: "Paid" },
  { no: "INV-1038", tenant: "Yaw Boateng", period: "Oct 2026", due: "05 Oct", amount: 1200, status: "Overdue" },
  { no: "INV-1037", tenant: "Akosua Darko", period: "Nov 2026", due: "05 Nov", amount: 2400, status: "Sent" },
];
export const payments = [
  { ref: "RCP-0881", tenant: "Ama Owusu", method: "MTN MoMo", date: "Today, 09:14", amount: 1600 },
  { ref: "RCP-0880", tenant: "Efua Mensah", method: "Bank transfer", date: "Yesterday, 15:22", amount: 1300 },
  { ref: "RCP-0879", tenant: "Kofi Annan Jr.", method: "Telecel Cash", date: "08 Nov, 11:05", amount: 1600 },
  { ref: "RCP-0878", tenant: "Akosua Darko", method: "Cash", date: "03 Nov, 17:40", amount: 2400 },
  { ref: "RCP-0877", tenant: "Kwame Asante", method: "AirtelTigo Money", date: "28 Oct, 10:12", amount: 2700 },
];
export const maintenance = [
  { title: "Leaking kitchen tap", unit: "Osu Garden · 2B", reported: "Kwame Asante", date: "10 Nov", priority: "Medium", status: "In progress" },
  { title: "No water — tank pump", unit: "Adenta Court · all", reported: "Caretaker", date: "09 Nov", priority: "High", status: "Open" },
  { title: "Broken louvre blades", unit: "Tema C25 · 104", reported: "Efua Mensah", date: "02 Nov", priority: "Low", status: "Resolved" },
  { title: "ECG prepaid meter fault", unit: "East Legon · 2", reported: "Akosua Darko", date: "31 Oct", priority: "High", status: "In progress" },
];
export const announcements = [
  { title: "Water supply interruption", body: "GWCL works on Saturday 14 Nov, 8am–4pm. Please store water ahead.", to: "Adenta Court", date: "11 Nov", pinned: true },
  { title: "November rent reminder", body: "Rent is due on the 5th. Pay via MoMo to 024 000 1122 and use your unit as reference.", to: "All properties", date: "01 Nov", pinned: false },
  { title: "Compound fumigation", body: "Fumigation of all common areas on 20 Nov. Keep windows closed in the morning.", to: "Osu Garden Flats", date: "28 Oct", pinned: false },
];
export const monthly = [
  { m: "Jun", collected: 62000, due: 70000 }, { m: "Jul", collected: 66500, due: 70000 },
  { m: "Aug", collected: 59000, due: 70500 }, { m: "Sep", collected: 68800, due: 72000 },
  { m: "Oct", collected: 64200, due: 72000 }, { m: "Nov", collected: 61300, due: 68500 },
];
