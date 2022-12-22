import { FormValidation, useForm } from "@raycast/utils";
import { showToast } from "@raycast/api";
import { Values, TunnelType, ListData } from "../types";

export const initForm = (listData: ListData[], onSubmit: (values: Values) => void) => {
  const { handleSubmit, itemProps, values } = useForm<Values>({
    onSubmit: (values) => {
      onSubmit(values);
      showToast({ title: "Submitted form", message: "See logs for submitted values" });
    },
    validation: {
      name: (value) => {
        if (listData.find((i) => i.name === value)) return "The tunnel had been created";
        else if (!value) {
          return "The item is required";
        }
      },
      sshport: FormValidation.Required,
      user: FormValidation.Required,
      remote: FormValidation.Required,
      localport: (value) => {
        if (listData.find((i) => i.localport === value)) return "This port had been used";
        else if (!value) {
          return "The item is required";
        }
      },
      remoteport: FormValidation.Required,
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
