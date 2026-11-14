import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";
const crons = cronJobs();
crons.daily("mark overdue invoices", { hourUTC: 6, minuteUTC: 0 }, internal.invoices.markOverdue);
crons.monthly("generate rent invoices", { day: 1, hourUTC: 6, minuteUTC: 0 }, internal.invoices.generateMonthly);
crons.daily("flag expiring leases", { hourUTC: 6, minuteUTC: 30 }, internal.leases.flagExpiring); // end within 60 days
export default crons;
