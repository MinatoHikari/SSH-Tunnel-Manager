import { Action, ActionPanel, closeMainWindow, Color, Icon, List, showToast } from "@raycast/api";
import { MutableRefObject, useEffect, useState } from "react";
import { useSshPidList } from "../hooks/pidList";
import { cache, useCache } from "../hooks/store";
import { useTunelCmd, useKillTunnelCmd } from "../hooks/tunnelCmd";
import { ListData, Storage, Values } from "../types";

export function ListScreen(props: {
  shouldEstablish: MutableRefObject<boolean>;
  defaultTunnelParams: Partial<Values>;
  toCreate: () => void;
  markUsed: () => void;
}) {
  const { toCreate, defaultTunnelParams, shouldEstablish, markUsed } = props;
  const { cachedList, alivePidSet } = useCache();
  const [listData, setListData] = useState<ListData[]>(cachedList ?? []);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { setTunnelParams, isLoading } = useTunelCmd(
    listData,
    setListData,
    alivePidSet,
    defaultTunnelParams,
    shouldEstablish
  );

  const { killTunnel, setPidToKill } = useKillTunnelCmd();

  const { refreshList } = useSshPidList();

  const generateListData = () => {
    listData.forEach((data) => {
      if (data.pid && !alivePidSet.has(data.pid)) data.pid = null;
    });
    if (shouldEstablish.current === false && !listData.find((i) => i.name === defaultTunnelParams.name)) {
      listData.push({ ...(defaultTunnelParams as Values), pid: null });
    } else if (shouldEstablish.current === true && !listData.find((i) => i.name === defaultTunnelParams.name)) {
      if (defaultTunnelParams.name) {
        listData.push({ ...(defaultTunnelParams as Values), pid: null });
        setTunnelParams({ ...defaultTunnelParams });
      }
    }
    cache.set(Storage.List, JSON.stringify(listData));
  };

  const tunnelTrigger = () => {
    const tunnelItem = listData.find((i) => i.name === selectedId);
    if (!tunnelItem?.pid) {
      setTunnelParams((params) => {
        const res = { ...params, ...tunnelItem } as Partial<ListData>;
        delete res.pid;
        return res as Values;
      });
      showToast({ title: "Tunnel established" });
    } else {
      setPidToKill(tunnelItem.pid);
      alivePidSet.delete(tunnelItem.pid);
      cache.set(Storage.AlivePidList, JSON.stringify(Array.from(alivePidSet)));
      tunnelItem.pid = null;
      setListData([...listData]);
      showToast({ title: "Tunnel Closed" });
    }
  };

  const deleteTunnel = () => {
    const itemToDelete = listData.find((i) => i.name === selectedId);
    const newListData = listData.filter((i) => i.name !== selectedId);
    setListData(newListData);
    if (itemToDelete?.pid) {
      setPidToKill(itemToDelete.pid);
      alivePidSet.delete(itemToDelete.pid);
      cache.set(Storage.AlivePidList, JSON.stringify(Array.from(alivePidSet)));
      killTunnel();
    }
    markUsed();
    setTunnelParams({});
    showToast({ title: "Tunnel deleted" });
  };

  generateListData();

  return (
    <List
      isLoading={isLoading}
      onSelectionChange={(id) => {
        setSelectedId(id);
      }}
      actions={
        <ActionPanel>
          <Action title="Refresh List" onAction={refreshList} />
          <Action title="Create Tunnel" onAction={toCreate} />
          <Action
            title="Create Tunnel"
            onAction={toCreate}
            shortcut={{
              modifiers: ["shift"],
              key: "tab",
            }}
          />
          <Action
            onAction={refreshList}
            title="Refresh List"
            shortcut={{
              modifiers: ["shift", "cmd"],
              key: "r",
            }}
          />
        </ActionPanel>
      }
    >
      {listData.map((i) => {
        return (
          <List.Item
            title={i.name}
            key={i.name}
            id={i.name}
            icon={{
              source: i.pid ? Icon.CheckCircle : Icon.XMarkCircle,
              tintColor: i.pid ? Color.Green : Color.Red,
            }}
            actions={
              <ActionPanel>
                <Action title="Connect/Disconnect" onAction={tunnelTrigger} />
                <Action
                  title="Connect/Disconnect and Exit"
                  onAction={() => {
                    tunnelTrigger();
                    closeMainWindow();
                  }}
                />
                <Action
                  title="Create Tunnel"
                  onAction={toCreate}
                  shortcut={{
                    modifiers: ["shift"],
                    key: "tab",
                  }}
                />
                <Action
                  onAction={refreshList}
                  title="Refresh List"
                  shortcut={{
                    modifiers: ["shift", "cmd"],
                    key: "r",
                  }}
                />
                <Action
                  onAction={deleteTunnel}
                  title="Delet Tunnel"
                  shortcut={{
                    modifiers: ["cmd"],
                    key: "d",
                  }}
                />
              </ActionPanel>
            }
          ></List.Item>
        );
      })}
    </List>
  );
}
