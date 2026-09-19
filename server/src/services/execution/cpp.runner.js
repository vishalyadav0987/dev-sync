/**
 * C++ Runner — Generates harness, compiles, and runs C++ code.
 * 
 * Architecture:
 *   User Code + Generated Harness + Test Input → g++ → Executable → Run → Output
 *
 * For function-based problems (LeetCode-style), the user writes a Solution class
 * and the runner wraps it with a main() that reads input, calls the function,
 * and prints the output as JSON.
 */

import { exec } from "child_process";
import fs from "fs/promises";
import path from "path";
import os from "os";
import crypto from "crypto";

// Timeout for compilation (ms)
const COMPILE_TIMEOUT = 10000;
// Default execution timeout (ms)
const DEFAULT_EXEC_TIMEOUT = 5000;

export class CppRunner {
  /**
   * Compile C++ source code.
   * @param {string} code - Full C++ source (user code + harness)
   * @param {string} workDir - Working directory for temp files
   * @returns {{ success: boolean, executablePath?: string, error?: string }}
   */
  static async compile(code, workDir) {
    const srcPath = path.join(workDir, "solution.cpp");
    const execPath = path.join(workDir, "solution");

    await fs.writeFile(srcPath, code, "utf-8");

    return new Promise((resolve) => {
      exec(
        `g++ -std=c++17 -O2 -o "${execPath}" "${srcPath}"`,
        { timeout: COMPILE_TIMEOUT, cwd: workDir },
        (error, stdout, stderr) => {
          if (error) {
            // Sanitize compile error — remove absolute paths
            let errMsg = (stderr || error.message || "Compilation failed")
              .replace(new RegExp(workDir.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), '')
              .replace(/solution\.cpp/g, 'solution.cpp');

            resolve({
              success: false,
              error: errMsg.trim()
            });
          } else {
            resolve({
              success: true,
              executablePath: execPath
            });
          }
        }
      );
    });
  }

  /**
   * Run a compiled executable with given stdin input.
   * @param {string} executablePath - Path to compiled binary
   * @param {string} stdinInput - Input to pass via stdin
   * @param {number} timeLimitMs - Execution time limit
   * @param {number} memoryLimitMb - Memory limit (advisory, enforced via ulimit)
   * @returns {{ success: boolean, stdout?: string, stderr?: string, runtimeMs: number, status: string }}
   */
  static async run(executablePath, stdinInput = "", timeLimitMs = DEFAULT_EXEC_TIMEOUT, memoryLimitMb = 256) {
    const startTime = Date.now();

    return new Promise((resolve) => {
      // Use ulimit to restrict memory on Unix systems
      const memBytes = memoryLimitMb * 1024 * 1024;
      const cmd = process.platform === "darwin"
        ? `"${executablePath}"`
        : `ulimit -v ${Math.floor(memBytes / 1024)} 2>/dev/null; "${executablePath}"`;

      const proc = exec(cmd, {
        timeout: timeLimitMs,
        maxBuffer: 10 * 1024 * 1024, // 10MB max output
        env: { ...process.env, PATH: process.env.PATH }
      }, (error, stdout, stderr) => {
        const runtimeMs = Date.now() - startTime;

        if (error) {
          if (error.killed || error.signal === "SIGTERM") {
            resolve({
              success: false,
              stdout: "",
              stderr: "",
              runtimeMs,
              status: runtimeMs >= timeLimitMs ? "TIME_LIMIT_EXCEEDED" : "MEMORY_LIMIT_EXCEEDED"
            });
          } else if (error.code) {
            resolve({
              success: false,
              stdout: stdout || "",
              stderr: stderr || error.message || "",
              runtimeMs,
              status: "RUNTIME_ERROR"
            });
          } else {
            resolve({
              success: false,
              stdout: "",
              stderr: error.message,
              runtimeMs,
              status: "RUNTIME_ERROR"
            });
          }
        } else {
          resolve({
            success: true,
            stdout: stdout || "",
            stderr: stderr || "",
            runtimeMs,
            status: "SUCCESS"
          });
        }
      });

      // Write stdin
      if (stdinInput) {
        proc.stdin.write(stdinInput);
      }
      proc.stdin.end();
    });
  }

  /**
   * Generate a C++ test harness that wraps the user's Solution class.
   * The harness reads structured JSON input from stdin, calls the function,
   * and prints the output as JSON to stdout.
   *
   * @param {string} userCode - The user's Solution class code
   * @param {string} functionName - e.g. "twoSum"
   * @param {string} returnType - e.g. "vector<int>"
   * @param {string[]} paramTypes - e.g. ["vector<int>", "int"]
   * @param {string[]} paramNames - e.g. ["nums", "target"]
   * @returns {string} Complete C++ source with harness
   */
  static generateHarness(userCode, functionName, returnType, paramTypes, paramNames) {
    const paramDeclarations = paramTypes.map((type, i) => {
      const name = paramNames[i] || `param${i}`;
      return this.generateInputParser(type, name);
    }).join("\n");

    const paramCallArgs = paramNames.join(", ");
    const outputPrinter = this.generateOutputPrinter(returnType);

    return `
#include <bits/stdc++.h>
using namespace std;

// ─── Helper: JSON-like I/O ────────────────────────────────────
// Simple parsers for common competitive programming types

void skipWhitespace(istream& in) {
  while (in.peek() == ' ' || in.peek() == '\\n' || in.peek() == '\\r' || in.peek() == '\\t')
    in.get();
}

int readInt(istream& in) {
  skipWhitespace(in);
  int val; in >> val; return val;
}

long long readLongLong(istream& in) {
  skipWhitespace(in);
  long long val; in >> val; return val;
}

double readDouble(istream& in) {
  skipWhitespace(in);
  double val; in >> val; return val;
}

string readString(istream& in) {
  skipWhitespace(in);
  string s;
  char c = in.get(); // opening quote
  if (c == '"') {
    while (in.get(c) && c != '"') s += c;
  } else {
    s += c;
    while (in.get(c) && c != ' ' && c != '\\n' && c != ',' && c != ']') s += c;
    if (c == ',' || c == ']') in.putback(c);
  }
  return s;
}

bool readBool(istream& in) {
  skipWhitespace(in);
  string s;
  in >> s;
  return s == "true" || s == "1";
}

char readChar(istream& in) {
  skipWhitespace(in);
  char c;
  if (in.peek() == '\\'') { in.get(); in.get(c); in.get(); }
  else if (in.peek() == '"') { in.get(); in.get(c); in.get(); }
  else in.get(c);
  return c;
}

vector<int> readVectorInt(istream& in) {
  vector<int> v;
  skipWhitespace(in);
  char c; in.get(c); // '['
  skipWhitespace(in);
  if (in.peek() == ']') { in.get(); return v; }
  while (true) {
    v.push_back(readInt(in));
    skipWhitespace(in);
    in.get(c);
    if (c == ']') break;
  }
  return v;
}

vector<long long> readVectorLongLong(istream& in) {
  vector<long long> v;
  skipWhitespace(in);
  char c; in.get(c);
  skipWhitespace(in);
  if (in.peek() == ']') { in.get(); return v; }
  while (true) {
    v.push_back(readLongLong(in));
    skipWhitespace(in);
    in.get(c);
    if (c == ']') break;
  }
  return v;
}

vector<string> readVectorString(istream& in) {
  vector<string> v;
  skipWhitespace(in);
  char c; in.get(c);
  skipWhitespace(in);
  if (in.peek() == ']') { in.get(); return v; }
  while (true) {
    v.push_back(readString(in));
    skipWhitespace(in);
    in.get(c);
    if (c == ']') break;
  }
  return v;
}

vector<vector<int>> readVectorVectorInt(istream& in) {
  vector<vector<int>> v;
  skipWhitespace(in);
  char c; in.get(c);
  skipWhitespace(in);
  if (in.peek() == ']') { in.get(); return v; }
  while (true) {
    v.push_back(readVectorInt(in));
    skipWhitespace(in);
    in.get(c);
    if (c == ']') break;
  }
  return v;
}

// ─── Output Printers ──────────────────────────────────────────
void printInt(int v) { cout << v; }
void printLongLong(long long v) { cout << v; }
void printDouble(double v) { cout << fixed << setprecision(6) << v; }
void printBool(bool v) { cout << (v ? "true" : "false"); }
void printString(const string& v) { cout << "\\"" << v << "\\""; }
void printChar(char v) { cout << "\\"" << v << "\\""; }

void printVectorInt(const vector<int>& v) {
  cout << "[";
  for (int i = 0; i < (int)v.size(); i++) {
    if (i) cout << ",";
    cout << v[i];
  }
  cout << "]";
}

void printVectorLongLong(const vector<long long>& v) {
  cout << "[";
  for (int i = 0; i < (int)v.size(); i++) {
    if (i) cout << ",";
    cout << v[i];
  }
  cout << "]";
}

void printVectorString(const vector<string>& v) {
  cout << "[";
  for (int i = 0; i < (int)v.size(); i++) {
    if (i) cout << ",";
    printString(v[i]);
  }
  cout << "]";
}

void printVectorVectorInt(const vector<vector<int>>& v) {
  cout << "[";
  for (int i = 0; i < (int)v.size(); i++) {
    if (i) cout << ",";
    printVectorInt(v[i]);
  }
  cout << "]";
}

void printVectorBool(const vector<bool>& v) {
  cout << "[";
  for (int i = 0; i < (int)v.size(); i++) {
    if (i) cout << ",";
    cout << (v[i] ? "true" : "false");
  }
  cout << "]";
}

// ─── User Code ────────────────────────────────────────────────
${userCode}

// ─── Generated Main ───────────────────────────────────────────
int main() {
  ios_base::sync_with_stdio(false);
  cin.tie(nullptr);

  Solution solution;

${paramDeclarations}

  auto result = solution.${functionName}(${paramCallArgs});

  ${outputPrinter}

  cout << endl;
  return 0;
}
`;
  }

  /**
   * Generate input parsing code for a given C++ type
   */
  static generateInputParser(type, name) {
    const normalized = type.replace(/\s+/g, "");

    const typeMap = {
      "int": `  int ${name} = readInt(cin);`,
      "long": `  long long ${name} = readLongLong(cin);`,
      "longlong": `  long long ${name} = readLongLong(cin);`,
      "double": `  double ${name} = readDouble(cin);`,
      "float": `  double ${name} = readDouble(cin);`,
      "string": `  string ${name} = readString(cin);`,
      "bool": `  bool ${name} = readBool(cin);`,
      "char": `  char ${name} = readChar(cin);`,
      "vector<int>": `  vector<int> ${name} = readVectorInt(cin);`,
      "vector<long>": `  vector<long long> ${name} = readVectorLongLong(cin);`,
      "vector<longlong>": `  vector<long long> ${name} = readVectorLongLong(cin);`,
      "vector<string>": `  vector<string> ${name} = readVectorString(cin);`,
      "vector<vector<int>>": `  vector<vector<int>> ${name} = readVectorVectorInt(cin);`,
    };

    return typeMap[normalized] || `  // TODO: unsupported type ${type} for ${name}`;
  }

  /**
   * Generate output printer code based on return type
   */
  static generateOutputPrinter(returnType) {
    const normalized = returnType.replace(/\s+/g, "");

    const printerMap = {
      "int": "printInt(result);",
      "long": "printLongLong(result);",
      "longlong": "printLongLong(result);",
      "double": "printDouble(result);",
      "float": "printDouble(result);",
      "string": "printString(result);",
      "bool": "printBool(result);",
      "char": "printChar(result);",
      "vector<int>": "printVectorInt(result);",
      "vector<long>": "printVectorLongLong(result);",
      "vector<longlong>": "printVectorLongLong(result);",
      "vector<string>": "printVectorString(result);",
      "vector<vector<int>>": "printVectorVectorInt(result);",
      "vector<bool>": "printVectorBool(result);",
    };

    return printerMap[normalized] || `cout << result;`;
  }

  /**
   * Generate stdin input string from structured JSON test case input.
   * Each parameter value is serialized on its own line.
   */
  static generateStdin(inputJson, paramNames) {
    const lines = [];
    for (const name of paramNames) {
      const value = inputJson[name];
      if (value === undefined) continue;
      lines.push(this.serializeValue(value));
    }
    return lines.join("\n") + "\n";
  }

  /**
   * Serialize a JS value to the format our C++ parsers expect.
   */
  static serializeValue(value) {
    if (Array.isArray(value)) {
      if (value.length > 0 && Array.isArray(value[0])) {
        // 2D array
        return "[" + value.map(row => "[" + row.join(",") + "]").join(",") + "]";
      }
      if (value.length > 0 && typeof value[0] === "string") {
        return "[" + value.map(s => `"${s}"`).join(",") + "]";
      }
      return "[" + value.join(",") + "]";
    }
    if (typeof value === "string") {
      return `"${value}"`;
    }
    if (typeof value === "boolean") {
      return value ? "true" : "false";
    }
    return String(value);
  }

  /**
   * Create a temporary working directory for compilation
   */
  static async createWorkDir() {
    const id = crypto.randomUUID();
    const dir = path.join(os.tmpdir(), `dsa_exec_${id}`);
    await fs.mkdir(dir, { recursive: true });
    return dir;
  }

  /**
   * Clean up working directory
   */
  static async cleanupWorkDir(dir) {
    try {
      await fs.rm(dir, { recursive: true, force: true });
    } catch {
      // ignore cleanup errors
    }
  }
}
