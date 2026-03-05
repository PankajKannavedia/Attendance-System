import fs from 'fs';
import path from 'path';

// Load holidays configuration
let holidayConfig: Record<string, string> = {};
try {
  const configPath = path.join(process.cwd(), 'config', 'holidays.json');
  if (fs.existsSync(configPath)) {
    const rawData = fs.readFileSync(configPath, 'utf8');
    holidayConfig = JSON.parse(rawData);
  }
} catch (error) {
  console.error("Error loading holidays.json", error);
}

/**
 * Calculates the number of Paid Holidays (Sundays, specific Saturdays, and JSON holidays) between two dates.
 */
export const calculatePaidHolidayUnits = (startDateStr: string, endDateStr: string): number => {
  const start = new Date(startDateStr + "T00:00:00");
  const end = new Date(endDateStr + "T23:59:59");
  let paidUnits = 0;

  // Track which saturday of the month it is. We can do this by keeping a count per month
  // But a simple way per date: Math.floor((date.getDate() - 1) / 7) + 1 is the Nth day of that month.
  
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const dateString = d.toISOString().split('T')[0];
    const dayOfWeek = d.getDay(); // 0 = Sunday, 6 = Saturday

    // 1. JSON Holidays (takes precedence if we want it to, assuming they are full days)
    if (dateString && holidayConfig[dateString]) {
      paidUnits += 1;
      continue;
    }

    // 2. Sundays
    if (dayOfWeek === 0) {
      paidUnits += 1;
    } 
    // 3. Saturdays
    else if (dayOfWeek === 6) {
      const nthSaturday = Math.floor((d.getDate() - 1) / 7) + 1;
      if (nthSaturday === 1 || nthSaturday === 3 || nthSaturday === 5) {
        // Full day off
        paidUnits += 1;
      } else if (nthSaturday === 2 || nthSaturday === 4) {
        // Half day off
        paidUnits += 0.5;
      }
    }
  }

  return paidUnits;
};

/**
 * Gets total days in a given range
 */
export const getTotalDaysInRange = (startDateStr: string, endDateStr: string): number => {
  const start = new Date(startDateStr + "T00:00:00");
  const end = new Date(endDateStr + "T23:59:59");
  const diffTime = Math.abs(end.getTime() - start.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};
