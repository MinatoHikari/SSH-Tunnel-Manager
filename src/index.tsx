import { Form, ActionPanel, Action, List, Icon, Color, showToast, closeMainWindow } from "@raycast/api";
import { useExec } from "@raycast/utils";
import { useEffect, useState } from "react";
import { cache, useCache } from "./hooks/store";
import { Mode, ListData, Values, TunnelType, Storage } from "./types";
import { useSshPidList } from "./hooks/pidList";
import { initForm } from "./hooks/form";
import { useTunelCmd } from "./hooks/tunnelCmd";

export default function Command() {
  const { cachedList, alivePidSet } = useCache();
  const [mode, setMode] = useState<Mode>(Mode.List);
  const [listData, setListData] = useState<ListData[]>(cachedList ?? []);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [pidToKill, setPidToKill] = useState<string | null>(null);

  const toCreate = () => {
    setMode(Mode.Form);
  };

  const toList = () => {
    setMode(Mode.List);
  };

  const generateListData = () => {
    listData.forEach((data) => {
      if (data.pid && !alivePidSet.has(data.pid)) data.pid = null;
    });
    cache.set(Storage.List, JSON.stringify(listData));
  };

  const { values, itemProps, handleSubmit } = initForm(listData, (values: Values) => {
    if (shouldEstablish.current) setTunnelParams({ ...values });
    else {
      listData.push({ ...values, pid: null });
      setListData([...listData]);
      shouldEstablish.current = true
    }
    toList();
  });

  const { setTunnelParams, pid, isLoading, name, shouldEstablish } = useTunelCmd(values, listData);

  const { refreshList } = useSshPidList(() => mode);

  const { revalidate: killTunnel } = useExec("kill", ["-9", `${pidToKill}`], {
    execute: false,
  });

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
      alivePidSet.delete(itemToDelete.pid);
      cache.set(Storage.AlivePidList, JSON.stringify(Array.from(alivePidSet)));
      killTunnel();
    }
    showToast({ title: "Tunnel deleted" });
  };

  useEffect(() => {
    if (pid) {
      alivePidSet.add(pid.trim());
      cache.set(Storage.AlivePidList, JSON.stringify(Array.from(alivePidSet)));
    }
    const listItem = listData.find((i) => i.name === name);
    if (pid && !listItem && values.name) {
      listData.push({ ...values, pid: pid.trim() });
    } else if (pid && listItem) {
      listItem.pid = pid.trim();
    }
    setListData([...listData]);
  }, [pid]);

  useEffect(() => {
    if (pidToKill) killTunnel();
  }, [pidToKill]);

  generateListData();

  return mode === Mode.Form ? (
    <Form
      isLoading={isLoading}
      actions={
        <ActionPanel>
          <Action.SubmitForm title="Create and establish tunnel" onSubmit={handleSubmit} />
          <Action.SubmitForm
            title="Create tunnel"
            onSubmit={(values: Values) => {
              shouldEstablish.current = false;
              return handleSubmit(values);
            }}
          />
          <Action
            title="Tunnel List"
            onAction={toList}
            shortcut={{
              modifiers: ["shift"],
              key: "tab",
            }}
          />
        </ActionPanel>
      }
    >
      <Form.Description text="SSH tunnel config" />
      <Form.TextField title="Name" placeholder="Alias name of tunnel" {...itemProps.name} />
      <Form.TextField title="Local Port" placeholder="Enter a port" {...itemProps.localport} />
      <Form.TextField title="User" placeholder="Enter username" {...itemProps.user} />
      <Form.TextField title="SSH Port" placeholder="Enter ssh port (default: 22)" {...itemProps.sshport} />
      <Form.TextField title="Remote Host" placeholder="Enter remote host" {...itemProps.remote} />
      <Form.TextField title="Remote Port" placeholder="Enter remote port" {...itemProps.remoteport} />
      <Form.Separator />
      <Form.Checkbox id="proxy" title="Proxy(WIP)" label="Use Proxy" storeValue />
      <Form.Dropdown id="type" title="Tunnel Type">
        <Form.Dropdown.Item value={TunnelType.Local} title="Local" />
        <Form.Dropdown.Item value={TunnelType.Remote} title="Remote(WIP)" />
      </Form.Dropdown>
      {/* <Form.TagPicker id="tokeneditor" title="Tag picker">
        <Form.TagPicker.Item value="tagpicker-item" title="Tag Picker Item" />
      </Form.TagPicker> */}
    </Form>
  ) : (
    <List
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
                  title="Connect/Disconnect and close main window"
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
