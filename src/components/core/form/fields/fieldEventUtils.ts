export type SyntheticFormEvent = {
  target: {
    name?: string;
    value: any;
    type?: string;
    checked?: boolean;
  };
};

export function buildSyntheticChangeEvent(
  name: string | undefined,
  value: any,
  type?: string,
  checked?: boolean
): SyntheticFormEvent {
  return {
    target: {
      name,
      value,
      type,
      checked,
    },
  } as any;
}
