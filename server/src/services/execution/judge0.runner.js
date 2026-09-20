import axios from "axios";

const JUDGE0_API_URL = process.env.JUDGE0_API_URL || "http://localhost:2358";

// Standard Judge0 CE language IDs
const LANGUAGE_IDS = {
  javascript: 93, // Node.js
  python: 71,     // Python 3
  cpp: 54,        // C++ (GCC 9.2.0)
  java: 91        // Java (JDK 17) - alternative 62 for JDK 13
};

// Fallbacks for older Judge0 instances
const FALLBACK_LANGUAGE_IDS = {
  javascript: 63,
  java: 62
};

export class Judge0Runner {
  static async getLanguageId(language) {
    // If you fetch languages dynamically from /languages, you can cache them.
    // For now, use hardcoded IDs.
    return LANGUAGE_IDS[language.toLowerCase()] || FALLBACK_LANGUAGE_IDS[language.toLowerCase()];
  }

  static generateHarness(code, language, functionName, returnType, paramTypes, paramNames) {
    const lang = language.toLowerCase();
    
    if (lang === 'javascript') {
      return `
${code}

const fs = require('fs');
const input = fs.readFileSync(0, 'utf-8').trim().split('\\n');
if (input.length > 0 && input[0] !== '') {
  const numTestCases = parseInt(input[0]);
  let lineIdx = 1;
  for (let t = 0; t < numTestCases; t++) {
    const args = [];
    for (let p = 0; p < ${paramTypes.length}; p++) {
      args.push(JSON.parse(input[lineIdx++]));
    }
    const result = ${functionName}(...args);
    console.log(JSON.stringify(result));
  }
}
`;
    }
    
    if (lang === 'python') {
      return `
import sys
import json

${code}

if __name__ == "__main__":
    input_lines = [line for line in sys.stdin.read().strip().split('\\n') if line.strip()]
    if input_lines:
        num_test_cases = int(input_lines[0])
        line_idx = 1
        sol = Solution()
        for _ in range(num_test_cases):
            args = []
            for _ in range(${paramTypes.length}):
                args.append(json.loads(input_lines[line_idx]))
                line_idx += 1
            result = getattr(sol, '${functionName}')(*args)
            print(json.dumps(result, separators=(',', ':')))
`;
    }
    
    if (lang === 'java') {
      const typeMap = {
        'int': 'int', 'long': 'long', 'double': 'double', 'boolean': 'boolean', 'string': 'String',
        'int[]': 'int[]', 'long[]': 'long[]', 'int[][]': 'int[][]', 'string[]': 'String[]'
      };
      
      const argsParsing = paramTypes.map((type, i) => {
        return `${typeMap[type] || 'String'} arg${i} = parse_${type.replace(/\\[\\]/g, 'Array')}(lines[lineIdx++]);`;
      }).join('\\n            ');

      const argList = paramTypes.map((_, i) => `arg${i}`).join(', ');

      return `
import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.util.ArrayList;
import java.util.List;

${code}

public class Main {
    public static void main(String[] args) throws Exception {
        BufferedReader reader = new BufferedReader(new InputStreamReader(System.in));
        List<String> linesList = new ArrayList<>();
        String line;
        while ((line = reader.readLine()) != null) {
            if (!line.trim().isEmpty()) {
                linesList.add(line);
            }
        }
        if (linesList.isEmpty()) return;
        String[] lines = linesList.toArray(new String[0]);
        
        int numTestCases = Integer.parseInt(lines[0].trim());
        int lineIdx = 1;
        Solution sol = new Solution();
        for (int t = 0; t < numTestCases; t++) {
            ${argsParsing}
            
            ${typeMap[returnType] || 'void'} result = sol.${functionName}(${argList});
            System.out.println(serialize(result));
        }
    }

    static int parse_int(String s) { return Integer.parseInt(s.trim()); }
    static long parse_long(String s) { return Long.parseLong(s.trim()); }
    static double parse_double(String s) { return Double.parseDouble(s.trim()); }
    static boolean parse_boolean(String s) { return Boolean.parseBoolean(s.trim()); }
    static String parse_string(String s) { 
        s = s.trim();
        if (s.startsWith("\\"") && s.endsWith("\\"")) return s.substring(1, s.length() - 1);
        return s;
    }
    static int[] parse_intArray(String s) {
        s = s.trim();
        if (s.equals("[]")) return new int[0];
        s = s.substring(1, s.length() - 1);
        String[] parts = s.split(",");
        int[] res = new int[parts.length];
        for (int i = 0; i < parts.length; i++) res[i] = Integer.parseInt(parts[i].trim());
        return res;
    }
    static long[] parse_longArray(String s) {
        s = s.trim();
        if (s.equals("[]")) return new long[0];
        s = s.substring(1, s.length() - 1);
        String[] parts = s.split(",");
        long[] res = new long[parts.length];
        for (int i = 0; i < parts.length; i++) res[i] = Long.parseLong(parts[i].trim());
        return res;
    }
    static String[] parse_stringArray(String s) {
        s = s.trim();
        if (s.equals("[]")) return new String[0];
        s = s.substring(1, s.length() - 1);
        // Simple split logic for basic strings without commas
        String[] parts = s.split(",");
        for (int i = 0; i < parts.length; i++) parts[i] = parse_string(parts[i]);
        return parts;
    }
    static int[][] parse_intArrayArray(String s) {
        s = s.trim();
        if (s.equals("[]")) return new int[0][0];
        s = s.substring(1, s.length() - 1).trim();
        List<int[]> list = new ArrayList<>();
        int start = 0;
        int depth = 0;
        for (int i = 0; i < s.length(); i++) {
            if (s.charAt(i) == '[') depth++;
            else if (s.charAt(i) == ']') depth--;
            else if (s.charAt(i) == ',' && depth == 0) {
                list.add(parse_intArray(s.substring(start, i)));
                start = i + 1;
            }
        }
        if (start < s.length()) {
            list.add(parse_intArray(s.substring(start)));
        }
        return list.toArray(new int[0][]);
    }

    static String serialize(int v) { return String.valueOf(v); }
    static String serialize(long v) { return String.valueOf(v); }
    static String serialize(double v) { return String.valueOf(v); }
    static String serialize(boolean v) { return String.valueOf(v); }
    static String serialize(String v) { return "\\"" + v + "\\""; }
    static String serialize(int[] arr) {
        StringBuilder sb = new StringBuilder("[");
        for (int i = 0; i < arr.length; i++) {
            sb.append(arr[i]);
            if (i < arr.length - 1) sb.append(",");
        }
        return sb.append("]").toString();
    }
    static String serialize(long[] arr) {
        StringBuilder sb = new StringBuilder("[");
        for (int i = 0; i < arr.length; i++) {
            sb.append(arr[i]);
            if (i < arr.length - 1) sb.append(",");
        }
        return sb.append("]").toString();
    }
    static String serialize(String[] arr) {
        StringBuilder sb = new StringBuilder("[");
        for (int i = 0; i < arr.length; i++) {
            sb.append(serialize(arr[i]));
            if (i < arr.length - 1) sb.append(",");
        }
        return sb.append("]").toString();
    }
    static String serialize(int[][] arr) {
        StringBuilder sb = new StringBuilder("[");
        for (int i = 0; i < arr.length; i++) {
            sb.append(serialize(arr[i]));
            if (i < arr.length - 1) sb.append(",");
        }
        return sb.append("]").toString();
    }
}
`;
    }
    if (lang === 'cpp') {
      const paramDeclarations = paramTypes.map((type, i) => {
        const name = paramNames[i] || `param${i}`;
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
      }).join("\\n");

      const paramCallArgs = paramNames.join(", ");
      
      const normalizedRet = returnType.replace(/\s+/g, "");
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
      const outputPrinter = printerMap[normalizedRet] || `cout << result;`;

      return `
#include <bits/stdc++.h>
using namespace std;

// ─── Helper: JSON-like I/O ────────────────────────────────────
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
  char c = in.get(); 
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

${code}

int main() {
  ios_base::sync_with_stdio(false);
  cin.tie(nullptr);

  Solution solution;

  int __numTestCases = readInt(cin);
  for (int __t = 0; __t < __numTestCases; __t++) {
${paramDeclarations}

    auto result = solution.${functionName}(${paramCallArgs});

    ${outputPrinter}

    cout << "\\n";
  }

  return 0;
}
`;
    }
    
    return code; // Fallback
  }

  static async run(sourceCode, language, stdinInput, timeLimitMs, memoryLimitMb) {
    try {
      const languageId = await this.getLanguageId(language);
      if (!languageId) {
        return { success: false, status: "UNSUPPORTED_LANGUAGE", error: "Language not supported" };
      }

      // Convert limits to Judge0 format (seconds and KB)
      const cpuTimeLimit = timeLimitMs ? timeLimitMs / 1000 : 2.0;
      const memoryLimitKb = memoryLimitMb ? memoryLimitMb * 1024 : 128000;

      const payload = {
        source_code: Buffer.from(sourceCode).toString('base64'),
        language_id: languageId,
        stdin: stdinInput ? Buffer.from(stdinInput).toString('base64') : "",
        cpu_time_limit: cpuTimeLimit,
        memory_limit: memoryLimitKb,
      };

      // wait=true blocks until execution is complete
      const response = await axios.post(
        `${JUDGE0_API_URL}/submissions?base64_encoded=true&wait=true`,
        payload
      );

      const data = response.data;

      const statusId = data.status?.id;
      let status = "RUNTIME_ERROR";
      let success = false;
      let errorMessage = null;

      if (statusId === 3) {
        status = "PASSED";
        success = true;
      } else if (statusId === 5) {
        status = "TIME_LIMIT_EXCEEDED";
      } else if (statusId === 6) {
        status = "COMPILE_ERROR";
        errorMessage = data.compile_output ? Buffer.from(data.compile_output, 'base64').toString('utf-8') : "Compilation Error";
      } else if (statusId >= 7 && statusId <= 12) {
        status = "RUNTIME_ERROR";
        errorMessage = data.stderr ? Buffer.from(data.stderr, 'base64').toString('utf-8') : "Runtime Error";
      } else {
        status = "RUNTIME_ERROR";
      }

      return {
        success,
        status,
        stdout: data.stdout ? Buffer.from(data.stdout, 'base64').toString('utf-8') : "",
        stderr: data.stderr ? Buffer.from(data.stderr, 'base64').toString('utf-8') : "",
        error: errorMessage,
        runtimeMs: data.time ? parseFloat(data.time) * 1000 : 0
      };
    } catch (err) {
      console.error("[Judge0Runner] Execution engine unreachable:", err.response?.data || err.message);
      return {
        success: false,
        status: "SERVICE_UNAVAILABLE",
        error: "Judge0 execution engine is not reachable"
      };
    }
  }
}
