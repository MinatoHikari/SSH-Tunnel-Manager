import { cache } from "./store";
import { Storage, Mode } from "../types";
import { spawn } from "child_process";
import { useEffect, useState } from "react";
import { useCache } from "./store";

export const useSshPidList = (getMode: () => Mode) => {
  const [reRenderVal, reRender] = useState(false);
  const modeDep = getMode();

  const checkPid = () => {
    let content = "";
    const sshPidList: string[] = [];
    const { alivePidSet } = useCache();
    const prevSize = alivePidSet.size;

    const process = spawn("/usr/sbin/lsof", ["-i", "-nP", "|", "grep", "ssh", "|", "awk", "'{print $2}'"], {
      shell: true,
    });

    process.stderr.on("close", () => {
      console.log(content);
      if (content) {
        sshPidList.push(...content.split("\n").map((pid) => pid.trim()));
      } else {
        alivePidSet.clear();
      }

      let refreshFlag = false;

      alivePidSet.forEach((pid) => {
        if (!sshPidList.includes(pid)) {
          alivePidSet.delete(pid);
          refreshFlag = true;
        }
      });

      cache.set(Storage.AlivePidList, JSON.stringify(Array.from(alivePidSet)));
      if (alivePidSet.size !== prevSize || refreshFlag) {
        reRender((state) => !state);
      }
      process.stdout.destroy();
    });

    process.stdout.on("data", (chunk: Buffer) => {
      content = chunk.toString();
    });
  };

  useEffect(() => {
    console.log(global.setInterval);
    if (getMode() === Mode.List) {
      checkPid();
      const interval = global.setInterval(() => {
        checkPid();
      }, 3000);
      return () => {
        clearInterval(interval);
      };
    }
  }, [reRenderVal, modeDep]);

  const refreshList = () => {
    reRender((state) => !state);
  };

  return {
    refreshList,
    checkPid,
  };
};
