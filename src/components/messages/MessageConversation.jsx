import {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  getRoleLabel,
} from "../../utils/roles.js";

function formatMessageTime(dateValue) {
  if (!dateValue) {
    return "";
  }

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat("es-CR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function MessageConversation({
  currentUser,
  selectedContact,
  messages = [],
  sending = false,
  onSend,
}) {
  const [content, setContent] = useState("");

  const messageListRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    setContent("");
  }, [selectedContact?.id]);

  useEffect(() => {
    const messageList = messageListRef.current;

    if (!messageList) {
      return undefined;
    }

    const animationFrame =
      window.requestAnimationFrame(() => {
        messageList.scrollTo({
          top: messageList.scrollHeight,
          behavior: "smooth",
        });
      });

    return () => {
      window.cancelAnimationFrame(
        animationFrame
      );
    };
  }, [
    messages,
    selectedContact?.id,
  ]);

  async function handleSubmit(event) {
    event.preventDefault();

    const preparedContent = content.trim();

    if (!preparedContent || sending) {
      return;
    }

    const sent = await onSend(
      preparedContent
    );

    if (sent !== false) {
      setContent("");

      window.requestAnimationFrame(() => {
        textareaRef.current?.focus();
      });
    }
  }

  function handleKeyDown(event) {
    if (
      event.key === "Enter" &&
      !event.shiftKey
    ) {
      event.preventDefault();

      event.currentTarget.form?.requestSubmit();
    }
  }

  if (!selectedContact) {
    return (
      <section className="message-conversation message-conversation-empty">
        <div className="message-empty-symbol">
          <span aria-hidden="true">✦</span>
        </div>

        <h2>Selecciona un contacto</h2>

        <p>
          Elige una persona del directorio para
          comenzar una conversación interna.
        </p>
      </section>
    );
  }

  return (
    <section
      className="message-conversation"
      aria-label={`Conversación con ${selectedContact.name}`}
    >
      <header className="message-conversation-heading">
        <div className="message-conversation-user">
          <span
            className="message-contact-avatar"
            aria-hidden="true"
          >
            {selectedContact.name
              ?.trim()
              .charAt(0)
              .toUpperCase() || "U"}
          </span>

          <div>
            <h2>
              {selectedContact.name}
            </h2>

            <p>
              {getRoleLabel(
                selectedContact.role
              )}

              <span aria-hidden="true">
                {" "}·{" "}
              </span>

              <span className="message-online-text">
                Disponible
              </span>
            </p>
          </div>
        </div>

        <span className="message-private-label">
          CONVERSACIÓN INTERNA
        </span>
      </header>

      <div
        ref={messageListRef}
        className="message-list"
        aria-live="polite"
      >
        {messages.length > 0 ? (
          messages.map((message) => {
            const isOwnMessage =
              message.senderId ===
              currentUser.id;

            return (
              <article
                key={message.id}
                className={`message-bubble-row ${
                  isOwnMessage
                    ? "message-own"
                    : "message-received"
                }`}
              >
                <div className="message-bubble">
                  <p>{message.content}</p>

                  <footer>
                    <time
                      dateTime={
                        message.createdAt
                      }
                    >
                      {formatMessageTime(
                        message.createdAt
                      )}
                    </time>

                    {isOwnMessage && (
                      <span
                        className={
                          message.read
                            ? "message-read"
                            : ""
                        }
                      >
                        {message.read
                          ? "Leído"
                          : "Enviado"}
                      </span>
                    )}
                  </footer>
                </div>
              </article>
            );
          })
        ) : (
          <div className="message-list-empty">
            <span aria-hidden="true">
              ✉
            </span>

            <h3>
              Inicia la conversación
            </h3>

            <p>
              Todavía no hay mensajes entre
              ustedes.
            </p>
          </div>
        )}
      </div>

      <form
        className="message-composer"
        onSubmit={handleSubmit}
      >
        <label htmlFor="internal-message">
          Escribir mensaje
        </label>

        <div className="message-composer-row">
          <textarea
            ref={textareaRef}
            id="internal-message"
            value={content}
            rows="2"
            maxLength="1000"
            placeholder={`Escribe un mensaje para ${selectedContact.name}...`}
            disabled={sending}
            onChange={(event) =>
              setContent(
                event.target.value
              )
            }
            onKeyDown={handleKeyDown}
          />

          <button
            className="button button-primary message-send-button"
            type="submit"
            disabled={
              sending ||
              !content.trim()
            }
          >
            {sending
              ? "Enviando..."
              : "Enviar"}

            {!sending && (
              <span aria-hidden="true">
                →
              </span>
            )}
          </button>
        </div>

        <div className="message-composer-help">
          <small>
            Enter para enviar · Shift + Enter
            para otra línea
          </small>

          <small>
            {content.length}/1000
          </small>
        </div>
      </form>
    </section>
  );
}

export default MessageConversation;