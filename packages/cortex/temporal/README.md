# Cortex Temporal

[![Website](https://img.shields.io/badge/ravenjs.dev-000000?style=flat&logo=firefox&logoColor=white)](https://ravenjs.dev)
[![Zero Dependencies](https://img.shields.io/badge/Zero-Dependencies-brightgreen.svg)](https://github.com/Anonyfox/ravenjs)
[![ESM Only](https://img.shields.io/badge/ESM-Only-purple.svg)](https://nodejs.org/api/esm.html)
[![Node.js 22.5+](https://img.shields.io/badge/Node.js-22.5+-green.svg)](https://nodejs.org/)

Temporal computation functions for holiday calculations and date manipulation.

## Purpose

Holiday calculations for 30+ countries with governmental precision. Calculate Easter Sunday, national holidays, and regional variations using pure JavaScript date algorithms. Handle fixed dates, Easter-relative calculations, and custom governmental patterns.

Bureaucratic temporal patterns that survive political changes. Each country's holiday system encoded as computational artifacts with precise calculation logic for legal compliance and business applications.

## Install

```bash
npm install @raven-js/cortex
```

## Usage

```javascript
// Easter calculation using astronomical algorithms
import { calculateEasterSunday } from "@raven-js/cortex/temporal";

// Calculate Easter for any year (1583+)
const easter2024 = calculateEasterSunday(2024);
console.log(easter2024.toISOString().split("T")[0]); // "2024-03-31"

const easter2025 = calculateEasterSunday(2025);
console.log(easter2025.toISOString().split("T")[0]); // "2025-04-20"

// Works for any Gregorian calendar year
const easter1900 = calculateEasterSunday(1900);
console.log(easter1900.toISOString().split("T")[0]); // "1900-04-15"
```

```javascript
// Holiday calculations by country and region
import { calculateHolidaysOfYear } from "@raven-js/cortex/temporal";

// German federal and state holidays
const germanHolidays = calculateHolidaysOfYear({
  year: 2024,
  country: "DE",
  region: "BY", // Bavaria
});

console.log(`Germany (Bavaria): ${germanHolidays.length} holidays`);
germanHolidays.forEach((holiday) => {
  console.log(
    `${holiday.name} - ${holiday.date.toISOString().split("T")[0]} (${
      holiday.isWorkFree ? "work-free" : "observance"
    })`
  );
});

// United States federal and state holidays
const usHolidays = calculateHolidaysOfYear({
  year: 2024,
  country: "US",
  region: "CA", // California
});

console.log(`USA (California): ${usHolidays.length} holidays`);
```

```javascript
// Holiday object inspection and filtering
import { calculateHolidaysOfYear } from "@raven-js/cortex/temporal";

const holidays = calculateHolidaysOfYear({
  year: 2024,
  country: "GB", // United Kingdom
  region: "ENG", // England
});

// Filter work-free holidays only
const workFreeHolidays = holidays.filter((h) => h.isWorkFree);
console.log(`Work-free holidays: ${workFreeHolidays.length}`);

// Check specific dates
const christmasDay = holidays.find((h) => h.name.includes("Christmas"));
console.log(christmasDay.toString());
// "Christmas Day (2024-12-25) - National Work-free"

// Find holidays on specific date
const targetDate = new Date("2024-12-25");
const holidaysOnDate = holidays.filter((h) => h.isOnDate(targetDate));
console.log(
  `Holidays on ${targetDate.toDateString()}: ${holidaysOnDate.length}`
);
```

```javascript
// Timezone-naive date manipulation
import { NaiveDateTime } from "@raven-js/cortex/temporal";

// Create from Unix timestamp (seconds)
const dateFromUnix = new NaiveDateTime(1704067200);
console.log(dateFromUnix.toISOString()); // "2024-01-01T00:00:00.000Z"

// Create from ISO string (removes timezone offset)
const dateFromISO = new NaiveDateTime("2024-01-01T00:00:00+02:00");
console.log(dateFromISO.toISOString()); // "2023-12-31T22:00:00.000Z"

// Unix timestamp in seconds (not milliseconds)
console.log(dateFromUnix.getTime()); // 1704067200
console.log(dateFromUnix.toUnix()); // 1704067200 (same as getTime)
```

## Supported Countries

Currently supports holiday calculations for 30+ countries including:

**Europe**: AT, BE, CH, CZ, DE, DK, ES, FI, FR, GB, IE, IT, LU, NL, NO, PL, PT, SE
**Americas**: CA, MX, US
**Asia-Pacific**: AU, CN, ID, IN, JP, KR, MY, NZ, PH, SG, TH, VN

Each country includes national holidays and major regional variations. Regional codes follow ISO standards where applicable.

## Requirements

- Node.js 22.5+
- ESM module support

## The Raven's Temporal Awareness

Ravens demonstrate sophisticated temporal cognition, remembering seasonal patterns and coordinating activities across time. Cortex Temporal mirrors this chronological intelligence—precise date calculations that encode governmental patterns surviving political changes.

## 🦅 Support RavenJS Development

If you find RavenJS helpful, consider supporting its development:

[![GitHub Sponsors](https://img.shields.io/badge/Sponsor%20on%20GitHub-%23EA4AAA?style=for-the-badge&logo=github&logoColor=white)](https://github.com/sponsors/Anonyfox)

Your sponsorship helps keep RavenJS **zero-dependency**, **modern**, and **developer-friendly**.

---

**Built with ❤️ by [Anonyfox](https://anonyfox.com)**
