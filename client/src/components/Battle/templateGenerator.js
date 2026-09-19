/**
 * LeetCode-style starter template generator for the Battle editor.
 *
 * IMPORTANT: `BattleProblem.returnType` / `paramTypes` are authored in
 * C++ syntax (e.g. "vector<int>", "bool") — see server/prisma/battle.prisma
 * and server/seedBattleProblems.js. This file mirrors the canonical type
 * table in server/src/services/execution/battleTypes.js (there's no shared
 * package between client/server in this repo, so the two are kept in sync
 * by hand — update both when adding a new supported type).
 *
 * Earlier versions of this file only recognized an "abstract" type
 * spelling (`int[]`, `boolean`, ...) that never matched what's actually
 * stored in the database, so any array-based problem (e.g. Two Sum, whose
 * paramTypes are ["vector<int>", "int"]) rendered invalid Java/Python
 * templates. resolveKind() below accepts both spellings.
 */

const KIND = {
  INT: "INT", LONG: "LONG", DOUBLE: "DOUBLE", BOOL: "BOOL", CHAR: "CHAR", STRING: "STRING",
  INT_ARRAY: "INT_ARRAY", LONG_ARRAY: "LONG_ARRAY", STRING_ARRAY: "STRING_ARRAY",
  BOOL_ARRAY: "BOOL_ARRAY", INT_MATRIX: "INT_MATRIX",
};

const ALIASES = {
  "int": KIND.INT,
  "long": KIND.LONG, "longlong": KIND.LONG,
  "double": KIND.DOUBLE, "float": KIND.DOUBLE,
  "bool": KIND.BOOL, "boolean": KIND.BOOL,
  "char": KIND.CHAR,
  "string": KIND.STRING,
  "vector<int>": KIND.INT_ARRAY, "int[]": KIND.INT_ARRAY,
  "vector<long>": KIND.LONG_ARRAY, "vector<longlong>": KIND.LONG_ARRAY, "long[]": KIND.LONG_ARRAY,
  "vector<string>": KIND.STRING_ARRAY, "string[]": KIND.STRING_ARRAY,
  "vector<bool>": KIND.BOOL_ARRAY, "boolean[]": KIND.BOOL_ARRAY, "bool[]": KIND.BOOL_ARRAY,
  "vector<vector<int>>": KIND.INT_MATRIX, "int[][]": KIND.INT_MATRIX,
};

function resolveKind(rawType) {
  if (!rawType) return null;
  const normalized = String(rawType).replace(/\s+/g, "").toLowerCase();
  return ALIASES[normalized] || null;
}

const CPP_TYPE = {
  [KIND.INT]: "int", [KIND.LONG]: "long long", [KIND.DOUBLE]: "double",
  [KIND.BOOL]: "bool", [KIND.CHAR]: "char", [KIND.STRING]: "string",
  [KIND.INT_ARRAY]: "vector<int>", [KIND.LONG_ARRAY]: "vector<long long>",
  [KIND.STRING_ARRAY]: "vector<string>", [KIND.BOOL_ARRAY]: "vector<bool>",
  [KIND.INT_MATRIX]: "vector<vector<int>>",
};

const JAVA_TYPE = {
  [KIND.INT]: "int", [KIND.LONG]: "long", [KIND.DOUBLE]: "double",
  [KIND.BOOL]: "boolean", [KIND.CHAR]: "char", [KIND.STRING]: "String",
  [KIND.INT_ARRAY]: "int[]", [KIND.LONG_ARRAY]: "long[]",
  [KIND.STRING_ARRAY]: "String[]", [KIND.BOOL_ARRAY]: "boolean[]",
  [KIND.INT_MATRIX]: "int[][]",
};

const PYTHON_TYPE = {
  [KIND.INT]: "int", [KIND.LONG]: "int", [KIND.DOUBLE]: "float",
  [KIND.BOOL]: "bool", [KIND.CHAR]: "str", [KIND.STRING]: "str",
  [KIND.INT_ARRAY]: "list[int]", [KIND.LONG_ARRAY]: "list[int]",
  [KIND.STRING_ARRAY]: "list[str]", [KIND.BOOL_ARRAY]: "list[bool]",
  [KIND.INT_MATRIX]: "list[list[int]]",
};

const JSDOC_TYPE = {
  [KIND.INT]: "number", [KIND.LONG]: "number", [KIND.DOUBLE]: "number",
  [KIND.BOOL]: "boolean", [KIND.CHAR]: "string", [KIND.STRING]: "string",
  [KIND.INT_ARRAY]: "number[]", [KIND.LONG_ARRAY]: "number[]",
  [KIND.STRING_ARRAY]: "string[]", [KIND.BOOL_ARRAY]: "boolean[]",
  [KIND.INT_MATRIX]: "number[][]",
};

// Falls back to the raw type string (rather than throwing) if it's ever
// unresolvable — a template comment being slightly imprecise is far
// better UX than the editor failing to load at all. The backend's
// battleTypes.js is stricter (throws) because generating a broken
// harness there silently corrupts every submission.
function mapType(table, rawType) {
  const kind = resolveKind(rawType);
  return kind ? table[kind] : rawType;
}

export function generateTemplate(language, functionName, returnType, paramTypes, paramNames) {
  // Safe defaults if schema data is missing
  if (!functionName) functionName = 'solve';
  if (!returnType) returnType = 'void';
  if (!paramTypes) paramTypes = [];
  if (!paramNames) paramNames = [];

  const safeLang = (language || '').toLowerCase();

  switch (safeLang) {
    case 'cpp':
      return generateCppTemplate(functionName, returnType, paramTypes, paramNames);
    case 'java':
      return generateJavaTemplate(functionName, returnType, paramTypes, paramNames);
    case 'python':
      return generatePythonTemplate(functionName, returnType, paramTypes, paramNames);
    case 'javascript':
    default:
      return generateJsTemplate(functionName, returnType, paramTypes, paramNames);
  }
}

// ─── Generators ──────────────────────────────────────────────

function generateCppTemplate(functionName, returnType, paramTypes, paramNames) {
  const ret = mapType(CPP_TYPE, returnType);
  const args = paramTypes.map((t, i) => {
    const cppType = mapType(CPP_TYPE, t);
    // Use const reference for vectors/strings
    if (cppType.includes('vector') || cppType === 'string') {
      return `const ${cppType}& ${paramNames[i] || 'param' + i}`;
    }
    return `${cppType} ${paramNames[i] || 'param' + i}`;
  }).join(', ');

  return `class Solution {
public:
    ${ret} ${functionName}(${args}) {
        // Write your solution here
        
    }
};`;
}

function generateJavaTemplate(functionName, returnType, paramTypes, paramNames) {
  const ret = mapType(JAVA_TYPE, returnType);
  const args = paramTypes.map((t, i) => {
    return `${mapType(JAVA_TYPE, t)} ${paramNames[i] || 'param' + i}`;
  }).join(', ');

  return `class Solution {
    public ${ret} ${functionName}(${args}) {
        // Write your solution here
        
    }
}`;
}

function generatePythonTemplate(functionName, returnType, paramTypes, paramNames) {
  const ret = mapType(PYTHON_TYPE, returnType);
  const args = paramTypes.map((t, i) => {
    return `${paramNames[i] || 'param' + i}: ${mapType(PYTHON_TYPE, t)}`;
  });
  args.unshift('self');
  const argsStr = args.join(', ');

  return `class Solution:
    def ${functionName}(${argsStr}) -> ${ret}:
        # Write your solution here
        pass`;
}

function generateJsTemplate(functionName, returnType, paramTypes, paramNames) {
  // JSDoc comments
  const docLines = paramTypes.map((t, i) => {
    const finalType = mapType(JSDOC_TYPE, t) || 'any';
    return ` * @param {${finalType}} ${paramNames[i] || 'param' + i}`;
  });

  const retFinal = mapType(JSDOC_TYPE, returnType) || 'any';
  docLines.push(` * @return {${retFinal}}`);

  const docBlock = `/**\n${docLines.join('\n')}\n */`;
  const args = paramNames.join(', ');

  return `${docBlock}
var ${functionName} = function(${args}) {
    // Write your solution here
    
};`;
}
