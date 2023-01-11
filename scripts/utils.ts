import * as childProcess from "node:child_process";

export function executeCommand(command: string, options: string[]) {
  return new Promise((resolve) => {
    const runningCommand = childProcess.spawn(command, options, {
      stdio: "inherit",
    });
    runningCommand.on("data", (data) => {
      console.log(data.toString());
    });

    runningCommand.on("close", (code) => {
      console.log(
        `\nRunning "${command} ${options.join(
          " "
        )}" exited with code ${code}.\n`
      );
      resolve(code);
    });
  });
}
