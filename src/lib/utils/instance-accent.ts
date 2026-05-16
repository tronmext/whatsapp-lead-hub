const ACCENT_PALETTE = [
  {
    bg: "bg-orange-10/10",
    text: "text-orange-10",
    border: "border-orange-10/20",
  },
  {
    bg: "bg-blue-10/10",
    text: "text-blue-10",
    border: "border-blue-10/20",
  },
  {
    bg: "bg-green-4/10",
    text: "text-green-4",
    border: "border-green-4/20",
  },
  {
    bg: "bg-red-5/10",
    text: "text-red-5",
    border: "border-red-5/20",
  },
] as const;

export type InstanceAccent = (typeof ACCENT_PALETTE)[number];

export function getInstanceAccent(
  instanceId: string | undefined | null,
  instanceIds: string[] = [],
): InstanceAccent {
  if (!instanceId) return ACCENT_PALETTE[0];
  const index = instanceIds.indexOf(instanceId);
  if (index >= 0) return ACCENT_PALETTE[index % ACCENT_PALETTE.length];
  let hash = 0;
  for (let i = 0; i < instanceId.length; i++) {
    hash = (hash + instanceId.charCodeAt(i)) % ACCENT_PALETTE.length;
  }
  return ACCENT_PALETTE[hash];
}

export function getInstanceIdList(instances: Array<{ name: string }> | undefined): string[] {
  return instances?.map((i) => i.name) ?? [];
}
