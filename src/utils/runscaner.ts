import { execFile } from "child_process";
import path from "path";

export function runScanner(): Promise<any> {
  return new Promise((resolve, reject) => {
    const scannerPath = path.resolve(
      "/home/user/Downloads/FDx_SDK_Pro_Linux_v4.0c/FDx_SDK_Pro_Linux/FDx_SDK_PRO_LINUX4_X64_4_0_0/scanner"
    );

    const child = execFile(
      scannerPath,
      [],
      {
        env: {
          ...process.env, // now correctly using Node global process
          LD_LIBRARY_PATH:
            "/home/user/Downloads/FDx_SDK_Pro_Linux_v4.0c/FDx_SDK_Pro_Linux/FDx_SDK_PRO_LINUX4_X64_4_0_0/lib/linux4X64",
        },
      },
      (error, stdout, stderr) => {
        if (error) {
          return reject(error);
        }

        try {
          const result = JSON.parse(stdout);
          resolve(result);
        } catch (err) {
          reject(new Error("Invalid scanner response: " + stdout));
        }
      }
    );
  });
}
