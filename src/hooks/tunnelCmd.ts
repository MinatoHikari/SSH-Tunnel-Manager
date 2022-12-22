import { useExec } from "@raycast/utils";
import { useState, useEffect } from "react";
import { Values, Storage, ListData } from "../types";
import { cache } from "./store";

export const useTunelCmd = (values: Values, listData: ListData[]) => {
  const [tunnelParams, setTunnelParams] = useState<Partial<Values>>({ ...values });

  const { name, sshport, user, remote, localport, remoteport } = tunnelParams;

  const {
    isLoading,
    data: pid,
    revalidate: establish,
    mutate: mutatePid,
  } = useExec(
    "nohup",
    [
      "ssh",
      "-N",
      "-oServerAliveInterval=60",
      "-p",
      `${sshport}`,
      `${user}@${remote}`,
      "-L",
      `${localport}:127.0.0.1:${remoteport}`,
      ">",
      `/tmp/${name}.log`,
      "2>&1",
      "&",
      "echo",
      "$!",
    ],
    {
      shell: true,
      execute: false,
      initialData: null,
    }
  );

  useEffect(() => {
    establish();
  }, [tunnelParams]);

  useEffect(() => {
    cache.set(Storage.List, JSON.stringify(listData.filter((i) => i.name)));
    mutatePid(undefined, {
      optimisticUpdate: (data) => null,
      shouldRevalidateAfter: false,
    });
  }, [listData]);

  return {
    isLoading,
    setTunnelParams,
    pid,
    establish,
    mutatePid,
    name,
  };
};
