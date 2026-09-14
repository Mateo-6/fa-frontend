"use client";

import * as React from "react";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { MarkdownContent } from "@/components/assistant/markdown-content";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast";
import {
  AgentConversation,
  AgentConversationSummary,
  AgentExecutedAction,
  PendingAgentAction,
  confirmAgentAction,
  deleteAgentConversation,
  getAgentConversation,
  getAgentConversations,
  sendAgentMessage,
} from "@/lib/api";
import { cn } from "@/lib/utils";
import {
  Check,
  CheckCircle2,
  Loader2,
  MessageSquareText,
  Plus,
  Send,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  actions?: AgentExecutedAction[];
  isLocalError?: boolean;
}

const WELCOME_MESSAGE: ChatMessage = {
  id: "welcome",
  role: "assistant",
  content:
    "¡Hola! Soy AMI, tu asistente financiero. Puedes pedirme cosas como «Gasté 50 mil en el mercado con la tarjeta» o «¿Cuánto gasté este mes?» y yo me encargo.",
};

const SUGGESTIONS = [
  "Gasté 50 mil en el mercado",
  "¿Cuánto gasté este mes?",
  "Registra un ingreso de 2 millones",
];

/** Formats a conversation timestamp: time for today, short date otherwise. */
function formatConversationDate(isoDate: string): string {
  const date = new Date(isoDate);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  if (isToday) {
    return date.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
  }
  return date.toLocaleDateString("es-ES", { day: "numeric", month: "short" });
}

/** Maps a persisted conversation snapshot to local chat messages. */
function mapSnapshotMessages(conversation: AgentConversation): ChatMessage[] {
  return conversation.messages.map((m, index) => ({
    id: `${conversation.id}-${index}`,
    role: m.role,
    content: m.content,
    actions: m.actions,
  }));
}

export default function AssistantPage() {
  const { toast } = useToast();

  const [conversations, setConversations] = React.useState<AgentConversationSummary[]>([]);
  const [activeId, setActiveId] = React.useState<string | null>(null);
  const [messages, setMessages] = React.useState<ChatMessage[]>([WELCOME_MESSAGE]);
  const [input, setInput] = React.useState("");
  const [isSending, setIsSending] = React.useState(false);
  const [isLoadingList, setIsLoadingList] = React.useState(true);
  const [isLoadingConversation, setIsLoadingConversation] = React.useState(false);
  const [listOpenMobile, setListOpenMobile] = React.useState(false);
  const [deleteTarget, setDeleteTarget] = React.useState<AgentConversationSummary | null>(null);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [pendingAction, setPendingAction] = React.useState<PendingAgentAction | null>(null);
  const [isConfirming, setIsConfirming] = React.useState(false);

  const scrollRef = React.useRef<HTMLDivElement>(null);
  const idCounter = React.useRef(0);

  const nextId = (): string => {
    idCounter.current += 1;
    return `msg-${idCounter.current}`;
  };

  // Load conversation list on mount
  React.useEffect(() => {
    getAgentConversations()
      .then(setConversations)
      .catch(() => {
        toast({ kind: "error", title: "No se pudieron cargar las conversaciones" });
      })
      .finally(() => setIsLoadingList(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-scroll on new messages
  React.useEffect(() => {
    const container = scrollRef.current;
    if (container) container.scrollTop = container.scrollHeight;
  }, [messages, isSending, isLoadingConversation]);

  const startNewChat = (): void => {
    setActiveId(null);
    setMessages([WELCOME_MESSAGE]);
    setPendingAction(null);
    setListOpenMobile(false);
  };

  const openConversation = async (id: string): Promise<void> => {
    if (id === activeId) {
      setListOpenMobile(false);
      return;
    }
    setActiveId(id);
    setIsLoadingConversation(true);
    setListOpenMobile(false);
    try {
      const conversation = await getAgentConversation(id);
      setMessages(mapSnapshotMessages(conversation));
      // Restore the confirmation card if the conversation has an unresolved action
      setPendingAction(conversation.pendingAction ?? null);
    } catch {
      toast({ kind: "error", title: "No se pudo cargar la conversación" });
      setActiveId(null);
      setMessages([WELCOME_MESSAGE]);
      setPendingAction(null);
    } finally {
      setIsLoadingConversation(false);
    }
  };

  const sendMessage = async (text: string): Promise<void> => {
    const trimmed = text.trim();
    if (!trimmed || isSending || isLoadingConversation) return;

    const userMessage: ChatMessage = { id: nextId(), role: "user", content: trimmed };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsSending(true);

    try {
      const response = await sendAgentMessage(trimmed, activeId ?? undefined);
      setMessages((prev) => [
        ...prev,
        { id: nextId(), role: "assistant", content: response.reply, actions: response.actions },
      ]);
      setPendingAction(response.pendingAction ?? null);
      // A brand-new conversation was created on the first message
      if (!activeId) {
        setActiveId(response.conversationId);
      }
      // Refresh the list in the background (new title / bumped order)
      getAgentConversations().then(setConversations).catch(() => {});
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: nextId(),
          role: "assistant",
          content: "No pude conectarme con el servidor. Revisa tu conexión e intenta de nuevo.",
          isLocalError: true,
        },
      ]);
    } finally {
      setIsSending(false);
    }
  };

  const resolvePending = async (approved: boolean): Promise<void> => {
    if (!activeId || !pendingAction || isConfirming) return;
    setIsConfirming(true);
    try {
      const response = await confirmAgentAction(activeId, approved);
      setMessages((prev) => [
        ...prev,
        { id: nextId(), role: "assistant", content: response.reply, actions: response.actions },
      ]);
      setPendingAction(null);
      getAgentConversations().then(setConversations).catch(() => {});
    } catch {
      toast({ kind: "error", title: "No se pudo procesar la confirmación" });
    } finally {
      setIsConfirming(false);
    }
  };

  const confirmDelete = async (): Promise<void> => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await deleteAgentConversation(deleteTarget.id);
      setConversations((prev) => prev.filter((c) => c.id !== deleteTarget.id));
      if (activeId === deleteTarget.id) {
        startNewChat();
      }
      toast({ title: "Conversación eliminada" });
    } catch {
      toast({ kind: "error", title: "No se pudo eliminar la conversación" });
    } finally {
      setIsDeleting(false);
      setDeleteTarget(null);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>): void => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void sendMessage(input);
    }
  };

  const showSuggestions = !activeId && messages.length === 1 && !isSending;
  const activeTitle = activeId
    ? conversations.find((c) => c.id === activeId)?.title ?? "Conversación"
    : "Nuevo chat";

  const renderConversationList = () => (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="p-3">
        <button
          type="button"
          onClick={startNewChat}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-accent px-3 py-2 text-sm font-medium text-accent-foreground transition-opacity hover:opacity-90"
        >
          <Plus className="h-4 w-4" />
          Nuevo chat
        </button>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-3">
        {isLoadingList ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-ink-muted" />
          </div>
        ) : conversations.length === 0 ? (
          <p className="px-3 py-6 text-center text-xs text-ink-muted">
            Aún no tienes conversaciones. Envía tu primer mensaje.
          </p>
        ) : (
          <div className="flex flex-col gap-0.5">
            {conversations.map((conversation) => {
              const isActive = conversation.id === activeId;
              return (
                <div
                  key={conversation.id}
                  className={cn(
                    "group flex items-start gap-1 rounded-lg px-2 py-2 transition-colors",
                    isActive ? "bg-glass-hover" : "hover:bg-glass-hover"
                  )}
                >
                  <button
                    type="button"
                    onClick={() => void openConversation(conversation.id)}
                    className="min-w-0 flex-1 text-left"
                  >
                    <p
                      className={cn(
                        "truncate text-sm font-medium",
                        isActive ? "text-ink" : "text-ink-muted group-hover:text-ink"
                      )}
                    >
                      {conversation.title}
                    </p>
                    <p className="mt-0.5 truncate text-xs text-ink-subtle">
                      {conversation.lastMessage ?? "Sin mensajes"}
                    </p>
                    <p className="mt-0.5 text-[10px] text-ink-subtle">
                      {formatConversationDate(conversation.updatedAt)}
                    </p>
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteTarget(conversation)}
                    aria-label="Eliminar conversación"
                    className="mt-0.5 rounded p-1 text-ink-subtle opacity-0 transition-opacity hover:text-danger group-hover:opacity-100"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <DashboardShell>
      <main className="flex min-h-0 flex-1">
        {/* Desktop conversation list */}
        <aside className="hidden w-72 shrink-0 flex-col border-r border-glass-border bg-ground-deep md:flex">
          {renderConversationList()}
        </aside>

        {/* Mobile conversation drawer */}
        {listOpenMobile && (
          <>
            <div
              className="fixed inset-0 z-40 bg-black/50 md:hidden"
              onClick={() => setListOpenMobile(false)}
              aria-hidden="true"
            />
            <aside className="fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-glass-border bg-ground-deep md:hidden">
              <div className="flex items-center justify-between px-4 py-3">
                <span className="text-sm font-semibold text-ink">Conversaciones</span>
                <button
                  type="button"
                  onClick={() => setListOpenMobile(false)}
                  aria-label="Cerrar lista"
                  className="rounded-lg p-1.5 text-ink-muted hover:bg-glass-hover hover:text-ink"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              {renderConversationList()}
            </aside>
          </>
        )}

        {/* Chat area */}
        <section className="flex min-w-0 flex-1 flex-col">
          {/* Header */}
          <div className="flex items-center gap-3 border-b border-glass-border px-4 py-4 sm:px-6">
            <button
              type="button"
              onClick={() => setListOpenMobile(true)}
              aria-label="Abrir conversaciones"
              className="rounded-lg p-1.5 text-ink-muted hover:bg-glass-hover hover:text-ink md:hidden"
            >
              <MessageSquareText className="h-5 w-5" />
            </button>
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground">
              <Sparkles className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <h1 className="truncate text-base font-semibold text-ink">{activeTitle}</h1>
              <p className="text-xs text-ink-muted">Asistente AMI</p>
            </div>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto">
            <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 px-4 py-6 sm:px-6">
              {isLoadingConversation ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-ink-muted" />
                </div>
              ) : (
                <>
                  {messages.map((message) => {
                    const isUser = message.role === "user";
                    return (
                      <div
                        key={message.id}
                        className={cn("flex items-end gap-2", isUser ? "justify-end" : "justify-start")}
                      >
                        {!isUser && (
                          <div className="mb-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground">
                            <Sparkles className="h-3.5 w-3.5" />
                          </div>
                        )}
                        <div className="max-w-[80%]">
                          <div
                            className={cn(
                              "rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
                              isUser
                                ? "rounded-br-md bg-accent text-accent-foreground"
                                : "rounded-bl-md border border-glass-border bg-ground-raised text-ink"
                            )}
                          >
                            {isUser ? (
                              message.content
                            ) : (
                              <MarkdownContent content={message.content} />
                            )}
                          </div>
                          {message.actions && message.actions.length > 0 && (
                            <div className="mt-1.5 flex flex-col gap-1">
                              {message.actions.map((action, index) => (
                                <div
                                  key={`${message.id}-action-${index}`}
                                  className="flex items-center gap-1.5 rounded-lg bg-income/10 px-2.5 py-1.5 text-xs font-medium text-income"
                                >
                                  <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                                  <span>{action.summary}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {isSending && (
                    <div className="flex items-end gap-2">
                      <div className="mb-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground">
                        <Sparkles className="h-3.5 w-3.5" />
                      </div>
                      <div className="flex items-center gap-2 rounded-2xl rounded-bl-md border border-glass-border bg-ground-raised px-4 py-2.5 text-sm text-ink-muted">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Pensando...
                      </div>
                    </div>
                  )}

                  {/* Pending action confirmation card */}
                  {pendingAction && !isSending && (
                    <div className="flex items-end gap-2">
                      <div className="w-7 shrink-0" />
                      <div className="max-w-[80%] rounded-2xl border border-accent/40 bg-ground-raised p-4">
                        <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
                          Acción pendiente de confirmación
                        </p>
                        <p className="mt-1.5 text-sm font-medium text-ink">{pendingAction.summary}</p>
                        <p className="mt-1 text-xs text-ink-subtle">
                          Nada se ha guardado todavía. También puedes responder «sí» o «no», o pedirme ajustes.
                        </p>
                        <div className="mt-3 flex gap-2">
                          <button
                            type="button"
                            onClick={() => void resolvePending(true)}
                            disabled={isConfirming}
                            className="flex items-center gap-1.5 rounded-lg bg-income px-3.5 py-1.5 text-xs font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                          >
                            {isConfirming ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Check className="h-3.5 w-3.5" />
                            )}
                            Confirmar
                          </button>
                          <button
                            type="button"
                            onClick={() => void resolvePending(false)}
                            disabled={isConfirming}
                            className="flex items-center gap-1.5 rounded-lg border border-glass-border bg-ground px-3.5 py-1.5 text-xs font-semibold text-ink-muted transition-colors hover:bg-glass-hover hover:text-ink disabled:opacity-50"
                          >
                            <X className="h-3.5 w-3.5" />
                            Cancelar
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Suggestions */}
          {showSuggestions && (
            <div className="mx-auto flex w-full max-w-3xl flex-wrap gap-2 px-4 pb-2 sm:px-6">
              {SUGGESTIONS.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => void sendMessage(suggestion)}
                  className="rounded-full border border-glass-border bg-ground-raised px-3.5 py-1.5 text-xs font-medium text-ink-muted transition-colors hover:bg-glass-hover hover:text-ink"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="border-t border-glass-border px-4 py-3 sm:px-6">
            <div className="mx-auto flex w-full max-w-3xl items-end gap-2">
              <textarea
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Escríbele a AMI..."
                rows={1}
                maxLength={500}
                disabled={isSending || isLoadingConversation}
                className="max-h-32 flex-1 resize-none rounded-2xl border border-glass-border bg-ground-raised px-4 py-2.5 text-sm text-ink placeholder:text-ink-subtle focus:border-accent focus:outline-none disabled:opacity-50"
              />
              <button
                type="button"
                onClick={() => void sendMessage(input)}
                disabled={!input.trim() || isSending || isLoadingConversation}
                aria-label="Enviar mensaje"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground transition-opacity disabled:opacity-40"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>
        </section>
      </main>

      <ConfirmDialog
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => void confirmDelete()}
        title="Eliminar conversación"
        description={`Se eliminará «${deleteTarget?.title ?? ""}» con todos sus mensajes. Esta acción no se puede deshacer.`}
        confirmLabel="Eliminar"
        isLoading={isDeleting}
      />
    </DashboardShell>
  );
}
