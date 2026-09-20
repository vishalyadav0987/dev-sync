import fs from "fs/promises";
import path from "path";
import os from "os";
import { execFile } from "child_process";
import crypto from "crypto";

export class LocalRunner {
  static async createWorkDir() {
    const tmpDir = os.tmpdir();
    const workDir = path.join(tmpDir, `dsa_exec_${crypto.randomUUID()}`);
    await fs.mkdir(workDir, { recursive: true });
    return workDir;
  }

  static async cleanupWorkDir(workDir) {
    try {
      await fs.rm(workDir, { recursive: true, force: true });
    } catch (err) {
      console.error(`Failed to cleanup ${workDir}:`, err);
    }
  }

  static async runScript(command, args, workDir, stdin, timeLimitMs) {
    return new Promise((resolve) => {
      const start = Date.now();
      const child = execFile(command, args, { cwd: workDir, timeout: timeLimitMs }, (error, stdout, stderr) => {
        const runtimeMs = Date.now() - start;
        if (error) {
          if (error.killed) {
            resolve({ success: false, status: "TIME_LIMIT_EXCEEDED", stdout, stderr, runtimeMs });
          } else {
            resolve({ success: false, status: "RUNTIME_ERROR", stdout, stderr, runtimeMs, error: error.message });
          }
        } else {
          resolve({ success: true, status: "SUCCESS", stdout, stderr, runtimeMs });
        }
      });
      if (stdin) {
        child.stdin.on('error', (err) => {
          // Ignore EPIPE/EOF errors if child closes stdin early
          if (err.code !== 'EPIPE' && err.code !== 'EOF') {
            console.error('stdin error:', err);
          }
        });
        child.stdin.write(stdin);
        child.stdin.end();
      }
      child.on("error", (err) => {
        resolve({ success: false, status: "RUNTIME_ERROR", stdout: "", stderr: err.message, runtimeMs: Date.now() - start, error: err.message });
      });
    });
  }

  static async run(sourceCode, language, stdinInput, timeLimitMs) {
    const workDir = await this.createWorkDir();
    try {
      const lang = language.toLowerCase();
      if (lang === "javascript" || lang === "node" || lang === "js") {
        const filePath = path.join(workDir, "main.js");
        await fs.writeFile(filePath, sourceCode);
        return await this.runScript("node", ["main.js"], workDir, stdinInput, timeLimitMs);
      } else if (lang === "python" || lang === "python3") {
        const filePath = path.join(workDir, "main.py");
        await fs.writeFile(filePath, sourceCode);
        return await this.runScript("python3", ["main.py"], workDir, stdinInput, timeLimitMs);
      } else if (lang === "java") {
        const filePath = path.join(workDir, "Main.java");
        await fs.writeFile(filePath, sourceCode);
        // Compile Java
        return new Promise((resolve) => {
          execFile("javac", ["Main.java"], { cwd: workDir, timeout: 5000 }, async (error, stdout, stderr) => {
            if (error) {
              resolve({ success: false, status: "COMPILE_ERROR", stdout, stderr, runtimeMs: 0, error: error.message });
              return;
            }
            const runRes = await this.runScript("java", ["Main"], workDir, stdinInput, timeLimitMs);
            resolve(runRes);
          });
        });
      } else {
        return { success: false, status: "UNSUPPORTED_LANGUAGE", error: "Language not supported locally" };
      }
    } finally {
      await this.cleanupWorkDir(workDir);
    }
  }
}
