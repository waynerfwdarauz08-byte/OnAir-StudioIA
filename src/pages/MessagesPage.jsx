import useTranslation from "../hooks/useTranslation.js";
import {
  useEffect,
  useMemo,
  useState,
} from "react";

import PageHeader from "../components/common/PageHeader.jsx";

import {
  ErrorState,
  LoadingState,
} from "../components/common/FeedbackStates.jsx";

import MessageContacts from "../components/messages/MessageContacts.jsx";
import MessageConversation from "../components/messages/MessageConversation.jsx";

import useAuth from "../hooks/useAuth.js";

import { messageService } from "../services/messageService.js";
import { userService } from "../services/userService.js";

import {
  ROLES,
} from "../utils/roles.js";

function createMessageId() {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return `message-${crypto.randomUUID()}`;
  }

  return `message-${Date.now()}`;
}

function MessagesPage() {
  const { translate } = useTranslation();
  const { user } = useAuth();
  const [syncError, setSyncError] = useState("");
  const [syncKey, setSyncKey] = useState(0);

  const [users, setUsers] = useState([]);
  const [messages, setMessages] = useState([]);

  const [
    selectedContact,
    setSelectedContact,
  ] = useState(null);

  const [loading, setLoading] =
    useState(true);

  const [sending, setSending] =
    useState(false);

  const [error, setError] =
    useState("");

  const [sendError, setSendError] =
    useState("");

  const [reloadKey, setReloadKey] =
    useState(0);

  useEffect(() => {
    const controller = new AbortController();

    async function loadMessagingData() {
      setLoading(true);
      setError("");

      try {
        const [
          usersData,
          messagesData,
        ] = await Promise.all([
          userService.getAll(
            controller.signal
          ),
          messageService.getAll(
            controller.signal
          ),
        ]);

        if (controller.signal.aborted) {
          return;
        }

        setUsers(
          Array.isArray(usersData)
            ? usersData
            : []
        );

        setMessages(
          Array.isArray(messagesData)
            ? messagesData
            : []
        );
      } catch (loadError) {
        if (!controller.signal.aborted) {
          setError(
            loadError.message ||
              "No fue posible cargar la mensajería."
          );
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    loadMessagingData();

    return () => {
      controller.abort();
    };
  }, [reloadKey]);

  useEffect(() => {
    if (loading || error) {
      return undefined;
    }

    let stopped = false;
    let refreshing = false;
    let controller;

    async function refreshMessages() {
      if (stopped || refreshing) return;
      refreshing = true;
      controller = new AbortController();

      try {
        const messagesData =
          await messageService.getAll(
            controller.signal
          );

        if (!stopped && !controller.signal.aborted) {
          setSyncError("");
          setMessages(
            Array.isArray(messagesData)
              ? messagesData
              : []
          );
        }
      } catch (refreshError) {
        if (
          !stopped &&
          !controller.signal.aborted &&
          refreshError.name !== "AbortError"
        ) {
          setSyncError("No se pudieron actualizar los mensajes. La conversación visible puede estar desactualizada. Se reintentará automáticamente.");
        }
      } finally {
        refreshing = false;
      }
    }

    if (syncKey > 0) refreshMessages();
    const intervalId = window.setInterval(
      refreshMessages,
      3000
    );

    return () => {
      stopped = true;
      controller?.abort();
      window.clearInterval(intervalId);
    };
  }, [loading, error, syncKey]);

  useEffect(() => {
    if (loading || error) {
      return;
    }

    window.dispatchEvent(
      new CustomEvent("onair:messages-updated", {
        detail: messages,
      })
    );
  }, [messages, loading, error]);

  const availableContacts = useMemo(() => {
    return users
      .filter((registeredUser) => {
        if (
          registeredUser.id === user.id ||
          !registeredUser.active
        ) {
          return false;
        }

        if (
          user.role === ROLES.PRESENTER
        ) {
          return [
            ROLES.ADMIN,
            ROLES.MODERATOR,
          ].includes(registeredUser.role);
        }

        return true;
      })
      .sort((firstUser, secondUser) =>
        firstUser.name.localeCompare(
          secondUser.name,
          "es"
        )
      );
  }, [
    users,
    user.id,
    user.role,
  ]);

  const conversationMessages =
    useMemo(() => {
      if (!selectedContact) {
        return [];
      }

      return messages
        .filter((message) => {
          const sentByCurrentUser =
            message.senderId === user.id &&
            message.receiverId ===
              selectedContact.id;

          const receivedByCurrentUser =
            message.senderId ===
              selectedContact.id &&
            message.receiverId === user.id;

          return (
            sentByCurrentUser ||
            receivedByCurrentUser
          );
        })
        .sort(
          (firstMessage, secondMessage) =>
            new Date(
              firstMessage.createdAt
            ).getTime() -
            new Date(
              secondMessage.createdAt
            ).getTime()
        );
    }, [
      messages,
      selectedContact,
      user.id,
    ]);

  const unreadCounts = useMemo(() => {
    return messages.reduce(
      (counts, message) => {
        if (
          message.receiverId === user.id &&
          !message.read
        ) {
          counts[message.senderId] =
            (counts[message.senderId] || 0) +
            1;
        }

        return counts;
      },
      {}
    );
  }, [messages, user.id]);

  useEffect(() => {
    if (!selectedContact) {
      return;
    }

    const unreadMessages = messages.filter(
      (message) =>
        message.senderId ===
          selectedContact.id &&
        message.receiverId === user.id &&
        !message.read
    );

    if (unreadMessages.length === 0) {
      return;
    }

    let cancelled = false;

    async function markMessagesAsRead() {
      try {
        await Promise.all(
          unreadMessages.map((message) =>
            messageService.partialUpdate(
              message.id,
              {
                read: true,
                readAt:
                  new Date().toISOString(),
              }
            )
          )
        );

        if (!cancelled) {
          const readIds = new Set(
            unreadMessages.map(
              (message) => message.id
            )
          );

          setMessages(
            (currentMessages) =>
              currentMessages.map(
                (message) =>
                  readIds.has(message.id)
                    ? {
                        ...message,
                        read: true,
                        readAt:
                          new Date().toISOString(),
                      }
                    : message
              )
          );
        }
      } catch (readError) {
        console.error(
          "No fue posible marcar los mensajes como leídos.",
          readError
        );
      }
    }

    markMessagesAsRead();

    return () => {
      cancelled = true;
    };
  }, [
    selectedContact,
    messages,
    user.id,
  ]);

  async function handleSend(content) {
    if (!selectedContact) {
      return false;
    }

    setSending(true);
    setSendError("");

    try {
      const newMessage = {
        id: createMessageId(),
        senderId: user.id,
        receiverId:
          selectedContact.id,
        content,
        read: false,
        createdAt:
          new Date().toISOString(),
        readAt: null,
      };

      const savedMessage =
        await messageService.create(
          newMessage
        );

      setMessages(
        (currentMessages) => [
          ...currentMessages,
          savedMessage,
        ]
      );

      return true;
    } catch (sendMessageError) {
      setSendError(
        sendMessageError.message ||
          "No fue posible enviar el mensaje."
      );

      return false;
    } finally {
      setSending(false);
    }
  }

  function handleSelectContact(contact) {
    setSelectedContact(contact);
    setSendError("");
  }

  return (
    <>
      <PageHeader
        eyebrow={translate("COMUNICACIÓN INTERNA")}
        title={translate("Mensajería")}
        description={translate("Comunícate con los integrantes del equipo editorial de acuerdo con tu función.")}
      />

      {loading && (
        <LoadingState message={translate("Preparando la mensajería interna...")} />
      )}

      {!loading && error && (
        <ErrorState
          message={error}
          onRetry={() =>
            setReloadKey(
              (currentValue) =>
                currentValue + 1
            )
          }
        />
      )}

      {!loading && !error && (
        <>
          {syncError && <div className="form-alert" role="alert">{translate(syncError)} <button type="button" className="button button-secondary" onClick={() => setSyncKey((value) => value + 1)}>{translate("Reintentar conexión")}</button></div>}
          {sendError && (
            <div
              className="form-alert"
              role="alert"
            >
              {translate(sendError)}
            </div>
          )}

          <div className="messages-layout">
            <MessageContacts
              contacts={availableContacts}
              selectedUserId={
                selectedContact?.id || ""
              }
              unreadCounts={unreadCounts}
              onSelect={
                handleSelectContact
              }
            />

            <MessageConversation
              key={selectedContact?.id || "no-contact"}
              currentUser={user}
              selectedContact={
                selectedContact
              }
              messages={
                conversationMessages
              }
              sending={sending}
              onSend={handleSend}
            />
          </div>
        </>
      )}
    </>
  );
}

export default MessagesPage;
