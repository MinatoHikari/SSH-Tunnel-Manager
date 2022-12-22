import { Action, ActionPanel, Form, useNavigation } from "@raycast/api";
import { MutableRefObject } from "react";
import { initForm } from "../hooks/form";
import { useCache } from "../hooks/store";
import { TunnelType, Values } from "../types";

export function FromScreen(props: { onSubmit: (values: Values) => void; shouldEstablish: MutableRefObject<boolean> }) {
  const { shouldEstablish, onSubmit } = props;
  const { pop } = useNavigation();
  const { cachedList } = useCache();

  const { itemProps, handleSubmit } = initForm(cachedList, (values: Values) => {
    if (!shouldEstablish) return;
    if (shouldEstablish.current) {
      shouldEstablish.current = true;
      onSubmit({ ...values });
    } else {
      shouldEstablish.current = false;
      onSubmit({ ...values });
    }
    pop();
  });

  return (
    <Form
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
            onAction={pop}
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
  );
}
