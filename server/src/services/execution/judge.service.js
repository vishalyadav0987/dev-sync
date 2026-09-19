/**
 * Judge Service — Output Validation/Comparison
 * Compares actual program output against expected output
 * with different comparison strategies.
 */

export class JudgeService {
  /**
   * Compare actual output against expected output.
   * @param {*} actual - The actual output from the program
   * @param {*} expected - The expected output
   * @param {string} mode - Comparison mode: "exact", "unordered", "numeric"
   * @returns {{ passed: boolean, message?: string }}
   */
  static compare(actual, expected, mode = "exact") {
    switch (mode) {
      case "unordered":
        return this.compareUnordered(actual, expected);
      case "numeric":
        return this.compareNumeric(actual, expected);
      case "exact":
      default:
        return this.compareExact(actual, expected);
    }
  }

  /**
   * Exact match after normalizing whitespace and trimming
   */
  static compareExact(actual, expected) {
    const normalizedActual = this.normalize(JSON.stringify(actual));
    const normalizedExpected = this.normalize(JSON.stringify(expected));

    if (normalizedActual === normalizedExpected) {
      return { passed: true };
    }

    return {
      passed: false,
      message: `Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`
    };
  }

  /**
   * Unordered comparison for arrays (e.g., Two Sum where [0,1] and [1,0] are both valid)
   */
  static compareUnordered(actual, expected) {
    if (!Array.isArray(actual) || !Array.isArray(expected)) {
      return this.compareExact(actual, expected);
    }

    if (actual.length !== expected.length) {
      return {
        passed: false,
        message: `Expected array of length ${expected.length}, got ${actual.length}`
      };
    }

    // Sort function that handles numbers properly and falls back to string comparison
    const sortFn = (a, b) => {
      if (typeof a === 'number' && typeof b === 'number') return a - b;
      return JSON.stringify(a).localeCompare(JSON.stringify(b));
    };

    const sortedActual = [...actual].sort(sortFn);
    const sortedExpected = [...expected].sort(sortFn);

    if (JSON.stringify(sortedActual) === JSON.stringify(sortedExpected)) {
      return { passed: true };
    }

    return {
      passed: false,
      message: `Expected ${JSON.stringify(expected)} (any order), got ${JSON.stringify(actual)}`
    };
  }

  /**
   * Numeric comparison with tolerance for floating point
   */
  static compareNumeric(actual, expected, tolerance = 1e-6) {
    if (typeof actual === "number" && typeof expected === "number") {
      if (Math.abs(actual - expected) <= tolerance) {
        return { passed: true };
      }
      return {
        passed: false,
        message: `Expected ${expected}, got ${actual} (tolerance: ${tolerance})`
      };
    }
    return this.compareExact(actual, expected);
  }

  /**
   * Normalize a string for comparison: trim whitespace, collapse internal whitespace
   */
  static normalize(str) {
    return String(str).trim().replace(/\s+/g, " ");
  }

  /**
   * Parse raw stdout output into a structured value for comparison.
   * Tries JSON parse first, then falls back to string.
   */
  static parseOutput(stdout) {
    const trimmed = (stdout || "").trim();
    if (!trimmed) return null;

    try {
      return JSON.parse(trimmed);
    } catch {
      // If not valid JSON, return as trimmed string
      return trimmed;
    }
  }
}
