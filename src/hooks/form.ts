import { useForm } from "@raycast/utils";
import { showToast } from "@raycast/api";
import { Values, TunnelType, ListData } from "../types";

enum Message {
  Required = "The item is required",
}

export const initForm = (listData: ListData[], onSubmit: (values: Values) => void) => {
  const portValidation = (value: string | undefined, required = true) => {
    if (!required && !value) return;
    const num = Number(value);
    if (!num && num !== 0) return "Should be number";
    else if (num < 1 || num > 65535) return "Should be a number between 1-65535";
    else if (!value && required) {
      return Message.Required;
    }
  };

  const { handleSubmit, itemProps, values, setValue } = useForm<Values>({
    onSubmit: (values) => {
      onSubmit(values);
      showToast({ title: "Tunnel Created", message: "Tunnel Successfully created" });
    },
    validation: {
      name: (value) => {
        if (listData.find((i) => i.name === value)) return "The tunnel had been created";
        else if (!value) {
          return Message.Required;
        }
      },
      sshport: (value) => portValidation(value, false),
      user: (value) => {
        if (!value) return Message.Required;
        else if (!value.match(/^[a-z_][a-z0-9_-]*$/)) return "Invalid username";
      },
      remote: (value) => {
        if (!value) return Message.Required;
        else if (!value.match(/^([a-zA-Z0-9]+(-[a-zA-Z0-9]+)*)+(\.([a-zA-Z0-9]+(-[a-zA-Z0-9]+)*))*$/))
          return "Invalid hostname";
      },
      localport: (value) => {
        if (listData.find((i) => i.localport === value)) return "This port had been used";
        return portValidation(value);
      },
      remoteport: portValidation,
    },
    initialValues: {
      name: "",
      localport: "",
      user: "",
      sshport: "",
      remote: "",
      remoteport: "",
      proxy: false,
      type: TunnelType.Local,
    },
  });

  return {
    handleSubmit,
    itemProps,
    values,
  };
};
