export enum Storage {
  List = "list",
  AlivePidList = "alivePidList",
}

export enum TunnelType {
  Local = "local",
  Remote = "remote",
}

export type Values = {
  name: string;
  localport: string;
  user: string;
  sshport: string;
  remote: string;
  remoteport: string;
  proxy: boolean;
  type: TunnelType;
};

export type ListData = {
  name: string;
  pid: string | null;
} & Partial<Values>;
