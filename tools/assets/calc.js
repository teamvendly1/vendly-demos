/*
 * Vendly free tools - shared calculation logic (pure functions, no DOM, no I/O).
 * Kept separate from the page wiring so the exact same code can be required
 * under Node for automated testing AND loaded directly in the browser via
 * <script src="/tools/assets/calc.js"></script>.
 *
 * Every function takes plain numbers/arrays and returns plain objects. No
 * rounding happens until the very last step of each function (round-once
 * discipline) so intermediate math stays exact.
 */
(function (root, factory) {
  var mod = factory();
  if (typeof module === "object" && module.exports) {
    module.exports = mod;
  } else {
    root.VendlyCalc = mod;
  }
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  function round2(n) {
    // Standard banker-safe rounding to the cent, guarding float noise
    // (e.g. 1.005 * 100 -> 100.49999999999999 without the epsilon nudge).
    return Math.round((n + Number.EPSILON) * 100) / 100;
  }

  function num(v, fallback) {
    var n = typeof v === "string" ? parseFloat(v) : v;
    if (typeof n !== "number" || !isFinite(n) || isNaN(n)) return fallback || 0;
    return n;
  }

  // ---------------------------------------------------------------------
  // 1) QUOTE / ESTIMATE CALCULATOR
  //    labor (rate x hours) + materials (with markup) + overhead% + tax%
  // ---------------------------------------------------------------------
  function calcQuote(input) {
    var laborRate = Math.max(0, num(input.laborRate, 0));
    var hours = Math.max(0, num(input.hours, 0));
    var materials = Math.max(0, num(input.materials, 0));
    var markupPct = Math.max(0, num(input.materialsMarkupPct, 0));
    var overheadPct = Math.max(0, num(input.overheadPct, 0));
    var taxPct = Math.max(0, num(input.taxPct, 0));

    var laborTotal = laborRate * hours;
    var materialsWithMarkup = materials * (1 + markupPct / 100);
    var subtotal = laborTotal + materialsWithMarkup;
    var overheadAmount = subtotal * (overheadPct / 100);
    var preTaxTotal = subtotal + overheadAmount;
    var taxAmount = preTaxTotal * (taxPct / 100);
    var grandTotal = preTaxTotal + taxAmount;

    return {
      laborTotal: round2(laborTotal),
      materialsWithMarkup: round2(materialsWithMarkup),
      subtotal: round2(subtotal),
      overheadAmount: round2(overheadAmount),
      preTaxTotal: round2(preTaxTotal),
      taxAmount: round2(taxAmount),
      grandTotal: round2(grandTotal),
      effectiveHourlyIfFlat: hours > 0 ? round2(grandTotal / hours) : 0
    };
  }

  // ---------------------------------------------------------------------
  // 2) INVOICE GENERATOR
  //    lineItems: [{description, qty, unitPrice}], taxPct, amountPaid
  // ---------------------------------------------------------------------
  function calcInvoice(lineItems, taxPct, amountPaid) {
    var items = Array.isArray(lineItems) ? lineItems : [];
    var normalized = items.map(function (li) {
      var qty = Math.max(0, num(li.qty, 0));
      var unitPrice = Math.max(0, num(li.unitPrice, 0));
      var lineTotal = qty * unitPrice;
      return {
        description: (li.description || "").toString(),
        qty: qty,
        unitPrice: round2(unitPrice),
        lineTotal: round2(lineTotal)
      };
    });

    var subtotal = normalized.reduce(function (sum, li) {
      return sum + li.qty * li.unitPrice;
    }, 0);
    var tax = Math.max(0, num(taxPct, 0));
    var taxAmount = subtotal * (tax / 100);
    var total = subtotal + taxAmount;
    var paid = Math.max(0, num(amountPaid, 0));
    var balanceDue = total - paid;

    return {
      lineItems: normalized,
      subtotal: round2(subtotal),
      taxPct: tax,
      taxAmount: round2(taxAmount),
      total: round2(total),
      amountPaid: round2(paid),
      balanceDue: round2(balanceDue)
    };
  }

  // ---------------------------------------------------------------------
  // 3) "WHAT SHOULD I CHARGE" RATE / PRICING CALCULATOR
  //    Solves for the hourly rate a solo/small trades business must charge
  //    to hit a target take-home income after overhead, at a target profit
  //    margin, given real billable-hour capacity (not 2,080 hrs/year -
  //    nobody bills 100% of a 40-hour week).
  // ---------------------------------------------------------------------
  function calcRate(input) {
    var desiredIncome = Math.max(0, num(input.desiredIncome, 0));
    var weeksPerYear = Math.max(0, num(input.weeksPerYear, 50));
    var daysPerWeek = Math.max(0, num(input.daysPerWeek, 5));
    var billableHoursPerDay = Math.max(0, num(input.billableHoursPerDay, 5));
    var annualOverhead = Math.max(0, num(input.annualOverhead, 0));
    var profitMarginPct = Math.min(94, Math.max(0, num(input.profitMarginPct, 0)));

    var annualBillableHours = weeksPerYear * daysPerWeek * billableHoursPerDay;
    var baseNeed = desiredIncome + annualOverhead;
    // Profit margin is layered on top of cost+income so margin% of REVENUE,
    // not a markup on cost - e.g. a 20% margin means 20% of what you charge
    // is profit, so you divide by (1 - margin), never multiply by (1 + margin).
    var marginFactor = 1 - profitMarginPct / 100;
    var requiredRevenue = marginFactor > 0 ? baseNeed / marginFactor : baseNeed;

    var hourlyRate = annualBillableHours > 0 ? requiredRevenue / annualBillableHours : 0;
    var dayRate = hourlyRate * billableHoursPerDay;
    var weekRate = dayRate * daysPerWeek;
    var monthlyRevenueTarget = requiredRevenue / 12;

    return {
      annualBillableHours: round2(annualBillableHours),
      baseNeed: round2(baseNeed),
      requiredRevenue: round2(requiredRevenue),
      hourlyRate: round2(hourlyRate),
      dayRate: round2(dayRate),
      weekRate: round2(weekRate),
      monthlyRevenueTarget: round2(monthlyRevenueTarget)
    };
  }

  return {
    round2: round2,
    num: num,
    calcQuote: calcQuote,
    calcInvoice: calcInvoice,
    calcRate: calcRate
  };
});
