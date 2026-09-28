import { spawn } from "node:child_process";

const isWindows = process.platform === "win32";
const children = [];

function run(command, args) {
  const child = spawn(command, args, { stdio: "inherit", shell: isWindows });
  child.on("exit", (code) => {
    if (code !== 0 && code !== null) shutdown(code);
  });
  children.push(child);
  return child;
}

function shutdown(code = 0) {
  for (const child of children) child.kill();
  process.exitCode = code ?? 0;
  process.exit(process.exitCode);
}

process.on("SIGINT", () => shutdown(0));
process.on("SIGTERM", () => shutdown(0));

run("node", ["server/index.js"]);
run(isWindows ? "npx.cmd" : "npx", ["vite", "--host", "0.0.0.0"]);
