import { useExec } from "@raycast/utils";
import { useState, useEffect, useRef } from "react";
import { Values, Storage, ListData } from "../types";
import { cache } from "./store";

export const useTunelCmd = (values: Values, listData: ListData[]) => {
  const [tunnelParams, setTunnelParams] = useState<Partial<Values>>({ ...values });

  const shouldEstablish = useRef(true);

  const { name, sshport, user, remote, localport, remoteport } = tunnelParams;

  const {
    isLoading,
    data: pid,
    revalidate: establish,
    mutate: mutatePid,
    error,
  } = useExec(
    "nohup",
    [
      "ssh",
      "-N",
      "-oServerAliveInterval=60",
      "-p",
      `${sshport?.trim() ?? 22}`,
      `${user?.trim()}@${remote?.trim()}`,
      "-L",
      `${localport?.trim()}:127.0.0.1:${remoteport?.trim()}`,
      ">",
      `/tmp/${name?.trim()}.log`,
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
    if (shouldEstablish.current) establish();
    else shouldEstablish.current = true;
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
    shouldEstablish,
  };
};
