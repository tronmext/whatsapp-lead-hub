import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Wifi, Trash2, RefreshCw, QrCode, Power, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { ResendCard } from "@/components/ResendCard";
import { TextSmall, TextMono } from "@/components/Typography";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  listInstances,
  createInstance,
  connectInstance,
  connectionState,
  deleteInstance,
  logoutInstance,
} from "@/lib/evolution.functions";
import { getInstances, updateInstanceAlias } from "@/lib/server-functions";

const ACTIVE_KEY = "evolution.activeInstance";

export function getActiveInstance(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(ACTIVE_KEY);
}
export function setActiveInstance(name: string | null) {
  if (typeof window === "undefined") return;
  if (name) localStorage.setItem(ACTIVE_KEY, name);
  else localStorage.removeItem(ACTIVE_KEY);
}

type EvoInstance = {
  instance?: { instanceName?: string; state?: string; status?: string };
  instanceName?: string;
  name?: string;
  state?: string;
  status?: string;
  connectionStatus?: string;
  ownerJid?: string;
  profileName?: string;
  profilePictureUrl?: string;
  profilePicUrl?: string;
  number?: string;
};

function pickName(i: EvoInstance): string {
  return i.instance?.instanceName ?? i.instanceName ?? i.name ?? "—";
}
function pickState(i: EvoInstance): string {
  return (
    i.instance?.state ??
    i.state ??
    i.connectionStatus ??
    i.instance?.status ??
    i.status ??
    "unknown"
  );
}
function pickPicture(i: EvoInstance): string | undefined {
  return i.profilePictureUrl ?? i.profilePicUrl;
}

export function InstancesPanel() {
  const queryClient = useQueryClient();
  const list = useServerFn(listInstances);
  const create = useServerFn(createInstance);
  const del = useServerFn(deleteInstance);
  const logout = useServerFn(logoutInstance);
  const updateAliasFn = useServerFn(updateInstanceAlias);

  const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ["evolution", "instances"],
    queryFn: () => list(),
    refetchInterval: 8000,
  });

  const instances = useMemo<EvoInstance[]>(() => {
    const arr = (data?.instances ?? []) as EvoInstance[];
    return arr.filter(Boolean);
  }, [data]);

  const [active, setActive] = useState<string | null>(null);
  useEffect(() => setActive(getActiveInstance()), []);

  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [newNumber, setNewNumber] = useState("");
  const [qrTarget, setQrTarget] = useState<string | null>(null);

  const [aliases, setAliases] = useState<Record<string, string>>({});
  const [savingAliases, setSavingAliases] = useState<Record<string, boolean>>({});

  // Load aliases from DB
  const getInstancesFn = useServerFn(getInstances);
  const { data: dbInstances } = useQuery({
    queryKey: ["instances", "aliases"],
    queryFn: () => getInstancesFn(),
    refetchInterval: 15000,
  });

  const dbAliasMap = useMemo(() => {
    const map: Record<string, string> = {};
    if (dbInstances) {
      dbInstances.forEach((inst: any) => {
        if (inst.alias) map[inst.name] = inst.alias;
      });
    }
    return map;
  }, [dbInstances]);

  // Initialize aliases from DB on mount and after refetch
  useEffect(() => {
    setAliases(prev => {
      const merged = { ...prev };
      for (const [name, alias] of Object.entries(dbAliasMap)) {
        merged[name] = alias;
      }
      return merged;
    });
  }, [dbAliasMap]);

  const createMutation = useMutation({
    mutationFn: async () => {
      return create({
        data: {
          instanceName: newName.trim(),
          number: newNumber.trim() || undefined,
          qrcode: true,
          integration: "WHATSAPP-BAILEYS",
        },
      });
    },
    onSuccess: (res: any) => {
      toast.success(`Instância "${newName}" criada`);
      setCreating(false);
      setNewName("");
      setNewNumber("");
      queryClient.invalidateQueries({ queryKey: ["evolution", "instances"] });
      // Se já vier QR code, abre direto
      if (res?.qrcode?.base64 || res?.qrcode?.code) {
        setQrTarget(res?.instance?.instanceName ?? newName.trim());
      }
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (name: string) => {
      try {
        await logout({ data: { instanceName: name } });
      } catch {
        /* logout pode falhar se já estiver desconectado */
      }
      return del({ data: { instanceName: name } });
    },
    onSuccess: (_d, name) => {
      toast.success(`Instância "${name}" removida`);
      if (getActiveInstance() === name) {
        setActiveInstance(null);
        setActive(null);
      }
      queryClient.invalidateQueries({ queryKey: ["evolution", "instances"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <section className="space-y-12">
      <div className="flex items-baseline justify-between border-b border-frost-border pb-8">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight mb-2">Instâncias WhatsApp</h2>
          <TextSmall className="text-muted-foreground">
            Conecte e gerencie suas instâncias da Evolution API.
          </TextSmall>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => refetch()}
            className="size-9 rounded-xl frost-border grid place-items-center text-muted-foreground hover:text-foreground hover:bg-white/5 transition-all"
            title="Atualizar"
          >
            <RefreshCw className={cn("size-4", isFetching && "animate-spin")} />
          </button>
          <Button onClick={() => setCreating(true)} size="sm" className="font-bold tracking-widest text-[11px] uppercase">
            <Plus className="size-4 mr-1" /> Nova instância
          </Button>
        </div>
      </div>

      {isLoading && (
        <div className="flex items-center gap-3 text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          <TextSmall>Carregando instâncias…</TextSmall>
        </div>
      )}

      {isError && (
        <div className="frost-border p-6 rounded-2xl border-red-5/30 bg-red-5/5">
          <TextSmall className="text-red-5 font-bold mb-2">Falha ao consultar Evolution API</TextSmall>
          <TextMono className="text-[11px] text-muted-foreground break-all">
            {(error as Error).message}
          </TextMono>
        </div>
      )}

      {!isLoading && !isError && instances.length === 0 && (
        <div className="frost-border rounded-2xl p-12 bg-white/[0.01] border-dashed border-2 text-center">
          <TextSmall className="text-muted-foreground mb-4 block">
            Nenhuma instância encontrada no servidor.
          </TextSmall>
          <Button size="sm" onClick={() => setCreating(true)}>
            <Plus className="size-4 mr-1" /> Criar primeira instância
          </Button>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6">
        {instances.map((inst, idx) => {
          const name = pickName(inst);
          const state = pickState(inst);
          const isActive = active === name;
          return (
            <InstanceLiveCard
              key={`${name}-${idx}`}
              name={name}
              state={state}
              ownerJid={inst.ownerJid}
              profileName={inst.profileName}
              profilePictureUrl={pickPicture(inst)}
              isActive={isActive}
              alias={aliases[name] ?? (inst as any).alias ?? ""}
              saving={savingAliases[name] ?? false}
              onAliasChange={(alias) => {
                setAliases(prev => ({ ...prev, [name]: alias }));
              }}
              onAliasSave={() => {
                const alias = aliases[name] ?? "";
                setSavingAliases(prev => ({ ...prev, [name]: true }));
                updateAliasFn({ data: { id: name, alias } })
                  .then(() => {
                    queryClient.invalidateQueries({ queryKey: ["instances"] });
                    queryClient.invalidateQueries({ queryKey: ["sidebar"] });
                    setSavingAliases(prev => ({ ...prev, [name]: false }));
                    toast.success(`Tag "${alias || name}" salva`);
                  })
                  .catch((err: Error) => {
                    toast.error("Erro ao salvar tag: " + err.message);
                    setSavingAliases(prev => ({ ...prev, [name]: false }));
                  });
              }}
              onActivate={() => {
                setActiveInstance(name);
                setActive(name);
                toast.success(`"${name}" definida como instância ativa`);
              }}
              onShowQr={() => setQrTarget(name)}
              onDelete={() => {
                if (confirm(`Remover instância "${name}"? Essa ação é irreversível.`)) {
                  deleteMutation.mutate(name);
                }
              }}
            />
          );
        })}
      </div>

      {/* Create dialog */}
      <Dialog open={creating} onOpenChange={setCreating}>
        <DialogContent className="bg-card border-frost-border">
          <DialogHeader>
            <DialogTitle>Nova instância</DialogTitle>
            <DialogDescription>
              Cria uma instância no servidor Evolution. O QR Code será exibido em seguida.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <TextSmall className="text-muted-foreground uppercase tracking-widest text-[10px] block mb-2">
                Nome da instância *
              </TextSmall>
              <input
                value={newName}
                onChange={(e) => setNewName(e.target.value.replace(/[^a-zA-Z0-9_-]/g, ""))}
                placeholder="ex.: comercial-sp"
                className="w-full bg-muted border border-frost-border rounded-lg px-3 py-2 text-sm font-mono outline-none focus:border-primary/40"
                maxLength={64}
              />
            </div>
            <div>
              <TextSmall className="text-muted-foreground uppercase tracking-widest text-[10px] block mb-2">
                Número (opcional, formato 5511999999999)
              </TextSmall>
              <input
                value={newNumber}
                onChange={(e) => setNewNumber(e.target.value.replace(/\D/g, ""))}
                placeholder="5511999999999"
                className="w-full bg-muted border border-frost-border rounded-lg px-3 py-2 text-sm font-mono outline-none focus:border-primary/40"
                maxLength={20}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="secondary" size="sm" onClick={() => setCreating(false)}>
              Cancelar
            </Button>
            <Button
              size="sm"
              disabled={!newName.trim() || createMutation.isPending}
              onClick={() => createMutation.mutate()}
            >
              {createMutation.isPending && <Loader2 className="size-4 mr-1 animate-spin" />}
              Criar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* QR dialog */}
      <QrDialog instanceName={qrTarget} onClose={() => setQrTarget(null)} />
    </section>
  );
}

function InstanceLiveCard({
  name,
  state,
  ownerJid,
  profileName,
  profilePictureUrl,
  isActive,
  onActivate,
  onShowQr,
  onDelete,
  alias,
  saving,
  onAliasChange,
  onAliasSave,
}: {
  name: string;
  state: string;
  ownerJid?: string;
  profileName?: string;
  profilePictureUrl?: string;
  isActive: boolean;
  onActivate: () => void;
  onShowQr: () => void;
  onDelete: () => void;
  alias?: string;
  saving?: boolean;
  onAliasChange: (alias: string) => void;
  onAliasSave: () => void;
}) {
  const stateMeta =
    state === "open"
      ? { label: "CONECTADA", color: "text-green-4 border-green-4/30 bg-green-4/10", dot: "bg-green-4" }
      : state === "connecting"
        ? { label: "CONECTANDO", color: "text-orange-10 border-orange-10/30 bg-orange-10/10", dot: "bg-orange-10" }
        : { label: state.toUpperCase() || "DESCONECTADA", color: "text-red-5/80 border-red-5/30 bg-red-5/10", dot: "bg-red-5" };

  return (
    <ResendCard variant="large" className={cn("p-8 relative overflow-hidden group", isActive && "ring-1 ring-primary/40")}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          {profilePictureUrl ? (
            <img src={profilePictureUrl} alt={profileName ?? name} className="size-10 rounded-full object-cover" />
          ) : (
            <div className="size-10 rounded-full bg-primary/10 grid place-items-center">
              <Wifi className="size-4 text-primary" />
            </div>
          )}
          <div>
            <div className="text-[18px] font-semibold tracking-tight">{name}</div>
            {(profileName || ownerJid) && (
              <TextMono className="text-[11px] text-muted-foreground">
                {profileName ?? ownerJid}
              </TextMono>
            )}
          </div>
        </div>
        <div className={cn("flex items-center gap-2 px-3 py-1 rounded-full border", stateMeta.color)}>
          <span className={cn("size-1.5 rounded-full", stateMeta.dot, state === "connecting" && "animate-pulse")} />
          <TextMono className="text-[10px] font-bold">{stateMeta.label}</TextMono>
        </div>
      </div>

      <div className="flex items-center gap-2 mt-2">
        <TextMono className="text-[10px] text-muted-foreground opacity-50">TAG</TextMono>
        <input
          value={alias ?? ""}
          onChange={(e) => onAliasChange(e.target.value.slice(0, 8))}
          placeholder={name}
          className="bg-transparent border border-frost-border/30 rounded px-2 py-0.5 text-[11px] font-mono outline-none focus:border-primary/40 text-foreground w-24"
          maxLength={8}
        />
        {saving ? (
          <Loader2 className="size-3 animate-spin text-muted-foreground" />
        ) : (
          <button
            onClick={onAliasSave}
            disabled={saving}
            className="text-[9px] font-mono font-bold uppercase tracking-wider px-2 py-1 rounded bg-primary/10 text-primary hover:bg-primary/20 transition-all"
          >
            Salvar
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-2 mt-4">
        {state !== "open" && (
          <Button size="sm" onClick={onShowQr} className="text-[11px] font-bold tracking-widest uppercase">
            <QrCode className="size-4 mr-1" /> Conectar (QR)
          </Button>
        )}
        <Button
          size="sm"
          variant={isActive ? "secondary" : "outline"}
          onClick={onActivate}
          className="text-[11px] font-bold tracking-widest uppercase"
        >
          <Power className="size-3.5 mr-1" />
          {isActive ? "Ativa" : "Definir como ativa"}
        </Button>
        <button
          onClick={onDelete}
          className="size-9 rounded-lg frost-border grid place-items-center text-muted-foreground hover:text-red-5 hover:border-red-5/30 transition-all active:scale-90 ml-auto"
          title="Excluir"
        >
          <Trash2 className="size-4" />
        </button>
      </div>
    </ResendCard>
  );
}

function QrDialog({ instanceName, onClose }: { instanceName: string | null; onClose: () => void }) {
  const connect = useServerFn(connectInstance);
  const state = useServerFn(connectionState);

  const open = !!instanceName;

  const qrQuery = useQuery({
    queryKey: ["evolution", "qr", instanceName],
    enabled: open,
    queryFn: () => connect({ data: { instanceName: instanceName! } }),
    refetchInterval: 25_000, // QR codes da Evolution expiram rápido
  });

  const stateQuery = useQuery({
    queryKey: ["evolution", "state", instanceName],
    enabled: open,
    queryFn: () => state({ data: { instanceName: instanceName! } }),
    refetchInterval: 3000,
  });

  const isConnected = stateQuery.data?.instance?.state === "open";

  useEffect(() => {
    if (open && isConnected) {
      toast.success(`"${instanceName}" conectada com sucesso!`);
      const t = setTimeout(onClose, 800);
      return () => clearTimeout(t);
    }
  }, [open, isConnected, instanceName, onClose]);

  const base64 = qrQuery.data?.base64;
  const code = qrQuery.data?.code;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="bg-card border-frost-border max-w-md">
        <DialogHeader>
          <DialogTitle>Conectar {instanceName}</DialogTitle>
          <DialogDescription>
            Abra o WhatsApp &gt; Aparelhos conectados &gt; Conectar aparelho e aponte para o QR.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 flex flex-col items-center gap-4">
          {qrQuery.isLoading && <Loader2 className="size-6 animate-spin text-muted-foreground" />}
          {qrQuery.isError && (
            <TextMono className="text-[11px] text-red-5 break-all">
              {(qrQuery.error as Error).message}
            </TextMono>
          )}
          {base64 && (
            <img
              src={base64}
              alt="QR Code"
              className="size-64 rounded-xl bg-white p-2"
            />
          )}
          {!base64 && code && (
            <div className="bg-muted p-4 rounded-lg text-center">
              <TextSmall className="text-muted-foreground block mb-1">Pairing code</TextSmall>
              <TextMono className="text-2xl font-bold tracking-widest">{code}</TextMono>
            </div>
          )}
          <div className="flex items-center gap-2 text-muted-foreground">
            {stateQuery.data?.instance?.state === "connecting" && (
              <>
                <Loader2 className="size-3 animate-spin" />
                <TextSmall className="text-[11px]">Aguardando leitura…</TextSmall>
              </>
            )}
            {isConnected && <TextSmall className="text-[11px] text-green-4 font-bold">Conectada!</TextSmall>}
          </div>
        </div>

        <DialogFooter>
          <Button variant="secondary" size="sm" onClick={() => qrQuery.refetch()}>
            <RefreshCw className="size-4 mr-1" /> Renovar QR
          </Button>
          <Button size="sm" onClick={onClose}>Fechar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
