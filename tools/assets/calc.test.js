// Real correctness test for calc.js - run with: node calc.test.js
// Hand-computed expected values, not derived from the implementation.
var C = require("./calc.js");
var failures = 0;

function assertEq(label, actual, expected) {
  if (actual !== expected) {
    failures++;
    console.error("FAIL " + label + ": got " + actual + ", expected " + expected);
  } else {
    console.log("PASS " + label + " = " + actual);
  }
}

// --- Quote calculator ---
// 20 hrs @ $85/hr labor = $1700
// materials $400 with 20% markup = $480
// subtotal = $2180
// overhead 10% = $218 -> pre-tax = $2398
// tax 7% of 2398 = $167.86 -> grand total = $2565.86
var q1 = C.calcQuote({
  laborRate: 85,
  hours: 20,
  materials: 400,
  materialsMarkupPct: 20,
  overheadPct: 10,
  taxPct: 7
});
assertEq("quote.laborTotal", q1.laborTotal, 1700);
assertEq("quote.materialsWithMarkup", q1.materialsWithMarkup, 480);
assertEq("quote.subtotal", q1.subtotal, 2180);
assertEq("quote.overheadAmount", q1.overheadAmount, 218);
assertEq("quote.preTaxTotal", q1.preTaxTotal, 2398);
assertEq("quote.taxAmount", q1.taxAmount, 167.86);
assertEq("quote.grandTotal", q1.grandTotal, 2565.86);

// Zero materials, zero overhead, zero tax - should equal labor exactly.
var q2 = C.calcQuote({ laborRate: 60, hours: 3, materials: 0, materialsMarkupPct: 0, overheadPct: 0, taxPct: 0 });
assertEq("quote.simple.grandTotal", q2.grandTotal, 180);

// Negative / garbage input never goes negative or NaN.
var q3 = C.calcQuote({ laborRate: -50, hours: "abc", materials: null, materialsMarkupPct: -10, overheadPct: 0, taxPct: 0 });
assertEq("quote.garbage.grandTotal", q3.grandTotal, 0);

// --- Invoice generator ---
// 3 hrs @ $75 = 225, 1 unit @ $120 = 120, 2 units @ $15.50 = 31 -> subtotal 376
// tax 6% of 376 = 22.56 -> total 398.56, paid 100 -> balance 298.56
var inv = C.calcInvoice(
  [
    { description: "Service call", qty: 3, unitPrice: 75 },
    { description: "Part A", qty: 1, unitPrice: 120 },
    { description: "Fastener kit", qty: 2, unitPrice: 15.5 }
  ],
  6,
  100
);
assertEq("invoice.subtotal", inv.subtotal, 376);
assertEq("invoice.taxAmount", inv.taxAmount, 22.56);
assertEq("invoice.total", inv.total, 398.56);
assertEq("invoice.balanceDue", inv.balanceDue, 298.56);
assertEq("invoice.lineItems.length", inv.lineItems.length, 3);
assertEq("invoice.line0.lineTotal", inv.lineItems[0].lineTotal, 225);

// Empty invoice is zero, not NaN/undefined.
var inv2 = C.calcInvoice([], 0, 0);
assertEq("invoice.empty.total", inv2.total, 0);
assertEq("invoice.empty.balanceDue", inv2.balanceDue, 0);

// --- Rate / pricing calculator ---
// desired income 70000 + overhead 15000 = base need 85000
// 20% margin -> requiredRevenue = 85000 / 0.8 = 106250
// annual billable hours = 48 weeks * 5 days * 5.5 billable hrs/day = 1320
// hourly rate = 106250 / 1320 = 80.492424... -> round 80.49
var r1 = C.calcRate({
  desiredIncome: 70000,
  weeksPerYear: 48,
  daysPerWeek: 5,
  billableHoursPerDay: 5.5,
  annualOverhead: 15000,
  profitMarginPct: 20
});
assertEq("rate.annualBillableHours", r1.annualBillableHours, 1320);
assertEq("rate.baseNeed", r1.baseNeed, 85000);
assertEq("rate.requiredRevenue", r1.requiredRevenue, 106250);
assertEq("rate.hourlyRate", r1.hourlyRate, 80.49);
assertEq("rate.dayRate", r1.dayRate, round2Local(80.49242424242424 * 5.5));
assertEq("rate.monthlyRevenueTarget", r1.monthlyRevenueTarget, round2Local(106250 / 12));

function round2Local(n) {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

// Zero overhead, zero margin -> required revenue == desired income exactly.
var r2 = C.calcRate({
  desiredIncome: 50000,
  weeksPerYear: 50,
  daysPerWeek: 5,
  billableHoursPerDay: 6,
  annualOverhead: 0,
  profitMarginPct: 0
});
assertEq("rate.zeroOverheadMargin.requiredRevenue", r2.requiredRevenue, 50000);
assertEq("rate.zeroOverheadMargin.annualBillableHours", r2.annualBillableHours, 1500);
assertEq("rate.zeroOverheadMargin.hourlyRate", r2.hourlyRate, round2Local(50000 / 1500));

console.log("\n" + (failures === 0 ? "ALL TESTS PASSED" : failures + " TEST(S) FAILED"));
process.exit(failures === 0 ? 0 : 1);
