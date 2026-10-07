import { useMemo, useState } from "react";
import useAccessibility from "../../hooks/useAccessibility.js";

import {
  getRoleLabel,
} from "../../utils/roles.js";

function MessageContacts({
  contacts = [],
  selectedUserId = "",
  unreadCounts = {},
  onSelect,
}) {
  const { language } = useAccessibility();
  const isEnglish = language === "en";
  const [search, setSearch] = useState("");

  const filteredContacts = useMemo(() => {
    const normalizedSearch = search
      .trim()
      .toLocaleLowerCase(language);

    if (!normalizedSearch) {
      return contacts;
    }

    return contacts.filter((contact) => {
      const searchableContent = [
        contact.name,
        contact.email,
        getRoleLabel(contact.role, language),
      ]
        .filter(Boolean)
        .join(" ")
        .toLocaleLowerCase(language);

      return searchableContent.includes(
        normalizedSearch
      );
    });
  }, [contacts, search, language]);

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
      aria-label={isEnglish ? "Available contacts" : "Contactos disponibles"}
    >
      <header className="message-contacts-heading">
        <div>
          <span>{isEnglish ? "INTERNAL DIRECTORY" : "DIRECTORIO INTERNO"}</span>
          <h2>{isEnglish ? "Contacts" : "Contactos"}</h2>
        </div>

        <strong>{contacts.length}</strong>
      </header>

      <div className="message-contact-search">
        <label htmlFor="message-contact-search">
          {isEnglish ? "Search contact" : "Buscar contacto"}
        </label>

        <input
          id="message-contact-search"
          type="search"
          value={search}
          placeholder={isEnglish ? "Name, email, or role..." : "Nombre, correo o función..."}
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
                    {getRoleLabel(contact.role, language)}
                  </small>
                </span>

                <span className="message-contact-status">
                  {unreadCount > 0 && (
                    <span
                      className="message-unread-count"
                      aria-label={`${unreadCount} ${isEnglish ? "unread messages" : "mensajes sin leer"}`}
                    >
                      {unreadCount > 99
                        ? "99+"
                        : unreadCount}
                    </span>
                  )}

                  <span
                    className="message-active-indicator"
                    title={isEnglish ? "Active user" : "Usuario activo"}
                    aria-label={isEnglish ? "Active user" : "Usuario activo"}
                  />
                </span>
              </button>
            );
          })
        ) : (
          <div className="message-contact-empty">
            <strong>
              {isEnglish ? "No contacts found" : "No encontramos contactos"}
            </strong>

            <p>
              {isEnglish ? "Try another name or email." : "Prueba escribiendo otro nombre o correo."}
            </p>
          </div>
        )}
      </div>
    </aside>
  );
}

export default MessageContacts;
