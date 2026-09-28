function getWeatherInformation(code) {
  if (code === 0) {
    return {
      icon: "☀",
      description: "Cielo despejado",
    };
  }

  if ([1, 2].includes(code)) {
    return {
      icon: "◐",
      description: "Parcialmente nublado",
    };
  }

  if (code === 3) {
    return {
      icon: "☁",
      description: "Cielo nublado",
    };
  }

  if ([45, 48].includes(code)) {
    return {
      icon: "≋",
      description: "Neblina",
    };
  }

  if (
    [51, 53, 55, 56, 57].includes(code)
  ) {
    return {
      icon: "☂",
      description: "Llovizna",
    };
  }

  if (
    [61, 63, 65, 66, 67].includes(code)
  ) {
    return {
      icon: "☂",
      description: "Lluvia",
    };
  }

  if ([80, 81, 82].includes(code)) {
    return {
      icon: "☔",
      description: "Aguaceros",
    };
  }

  if (
    [95, 96, 99].includes(code)
  ) {
    return {
      icon: "ϟ",
      description: "Tormenta eléctrica",
    };
  }

  return {
    icon: "◉",
    description: "Condición variable",
  };
}

function formatObservationTime(value) {
  if (!value) {
    return "Hora no disponible";
  }

  const observationDate =
    new Date(value);

  if (
    Number.isNaN(
      observationDate.getTime()
    )
  ) {
    return value;
  }

  return new Intl.DateTimeFormat(
    "es-CR",
    {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }
  ).format(observationDate);
}

function WeatherCard({
  weather,
  loading = false,
  error = "",
  onRetry,
}) {
  if (loading) {
    return (
      <section
        className="weather-card weather-card-loading"
        aria-label="Cargando información del clima"
      >
        <div className="weather-loading-icon" />

        <div>
          <span>INFORMACIÓN EXTERNA</span>
          <h2>Consultando el clima...</h2>
          <p>
            Conectando con el servicio
            meteorológico.
          </p>
        </div>
      </section>
    );
  }

  if (error || !weather) {
    return (
      <section
        className="weather-card weather-card-error"
        aria-label="Error al consultar el clima"
      >
        <span
          className="weather-error-icon"
          aria-hidden="true"
        >
          !
        </span>

        <div>
          <span>INFORMACIÓN EXTERNA</span>

          <h2>
            Clima no disponible
          </h2>

          <p>
            {error ||
              "No fue posible obtener la información meteorológica."}
          </p>

          {onRetry && (
            <button
              type="button"
              className="button button-secondary"
              onClick={onRetry}
            >
              Intentar nuevamente
            </button>
          )}
        </div>
      </section>
    );
  }

  const weatherInformation =
    getWeatherInformation(
      weather.weatherCode
    );

  return (
    <section
      className="weather-card"
      aria-labelledby="weather-card-title"
    >
      <div className="weather-main-information">
        <div
          className="weather-symbol"
          aria-hidden="true"
        >
          {weatherInformation.icon}
        </div>

        <div>
          <span className="weather-eyebrow">
            INFORMACIÓN EXTERNA EN VIVO
          </span>

          <h2 id="weather-card-title">
            {weather.location}
          </h2>

          <p className="weather-description">
            {weatherInformation.description}
          </p>

          <span className="weather-observation-time">
            Actualizado a las{" "}
            {formatObservationTime(
              weather.observedAt
            )}
          </span>
        </div>
      </div>

      <div className="weather-temperature">
        <strong>
          {Math.round(
            weather.temperature
          )}
        </strong>

        <span>
          {weather.units.temperature}
        </span>
      </div>

      <div className="weather-details">
        <article>
          <span>SENSACIÓN</span>

          <strong>
            {Math.round(
              weather.apparentTemperature
            )}
            {weather.units.temperature}
          </strong>
        </article>

        <article>
          <span>HUMEDAD</span>

          <strong>
            {weather.humidity}
            {weather.units.humidity}
          </strong>
        </article>

        <article>
          <span>VIENTO</span>

          <strong>
            {weather.windSpeed}{" "}
            {weather.units.windSpeed}
          </strong>
        </article>

        <article>
          <span>PRECIPITACIÓN</span>

          <strong>
            {weather.precipitation}{" "}
            {weather.units.precipitation}
          </strong>
        </article>
      </div>

      <footer className="weather-source">
        <span>
          Fuente externa
        </span>

        <strong>Open-Meteo API</strong>
      </footer>
    </section>
  );
}

export default WeatherCard;