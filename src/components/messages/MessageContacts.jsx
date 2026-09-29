import { useMemo, useState } from "react";

import {
  getRoleLabel,
} from "../../utils/roles.js";

function MessageContacts({
  contacts = [],
  selectedUserId = "",
  unreadCounts = {},
  onSelect,
}) {
  const [search, setSearch] = useState("");

  const filteredContacts = useMemo(() => {
    const normalizedSearch = search
      .trim()
      .toLocaleLowerCase("es");

    if (!normalizedSearch) {
      return contacts;
    }

    return contacts.filter((contact) => {
      const searchableContent = [
        contact.name,
        contact.email,
        getRoleLabel(contact.role),
      ]
        .filter(Boolean)
        .join(" ")
        .toLocaleLowerCase("es");

      return searchableContent.includes(
        normalizedSearch
      );
    });
  }, [contacts, search]);

  function getInitial(name) {
    return (
      String(name || "U")
        .trim()
        .charAt(0)
        .toUpperCase() || "U"
    );
  }

  return (
    <aside
      className="message-contacts"
      aria-label="Contactos disponibles"
    >
      <header className="message-contacts-heading">
        <div>
          <span>DIRECTORIO INTERNO</span>
          <h2>Contactos</h2>
        </div>

        <strong>{contacts.length}</strong>
      </header>

      <div className="message-contact-search">
        <label htmlFor="message-contact-search">
          Buscar contacto
        </label>

        <input
          id="message-contact-search"
          type="search"
          value={search}
          placeholder="Nombre, correo o función..."
          onChange={(event) =>
            setSearch(event.target.value)
          }
        />
      </div>

      <div className="message-contact-list">
        {filteredContacts.length > 0 ? (
          filteredContacts.map((contact) => {
            const unreadCount =
              unreadCounts[contact.id] || 0;

            const isSelected =
              selectedUserId === contact.id;

            return (
              <button
                key={contact.id}
                type="button"
                className={`message-contact-button ${
                  isSelected ? "active" : ""
                }`}
                aria-pressed={isSelected}
                onClick={() => onSelect(contact)}
              >
                <span
                  className="message-contact-avatar"
                  aria-hidden="true"
                >
                  {getInitial(contact.name)}
                </span>

                <span className="message-contact-information">
                  <strong>{contact.name}</strong>

                  <small>
                    {getRoleLabel(contact.role)}
                  </small>
                </span>

                <span className="message-contact-status">
                  {unreadCount > 0 && (
                    <span
                      className="message-unread-count"
                      aria-label={`${unreadCount} mensajes sin leer`}
                    >
                      {unreadCount > 99
                        ? "99+"
                        : unreadCount}
                    </span>
                  )}

                  <span
                    className="message-active-indicator"
                    title="Usuario activo"
                    aria-label="Usuario activo"
                  />
                </span>
              </button>
            );
          })
        ) : (
          <div className="message-contact-empty">
            <strong>
              No encontramos contactos
            </strong>

            <p>
              Prueba escribiendo otro nombre o
              correo.
            </p>
          </div>
        )}
      </div>
    </aside>
  );
}

export default MessageContacts;