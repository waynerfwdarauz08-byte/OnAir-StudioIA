const WEATHER_CONDITIONS = {
  clear: {
    icon: "SUN",
    es: "Cielo despejado",
    en: "Clear sky",
  },
  partlyCloudy: {
    icon: "SUN/CLD",
    es: "Parcialmente nublado",
    en: "Partly cloudy",
  },
  cloudy: {
    icon: "CLD",
    es: "Cielo nublado",
    en: "Cloudy sky",
  },
  fog: {
    icon: "FOG",
    es: "Neblina",
    en: "Fog",
  },
  drizzle: {
    icon: "DRZ",
    es: "Llovizna",
    en: "Drizzle",
  },
  rain: {
    icon: "RAIN",
    es: "Lluvia",
    en: "Rain",
  },
  showers: {
    icon: "RAIN",
    es: "Aguaceros",
    en: "Rain showers",
  },
  thunderstorm: {
    icon: "STORM",
    es: "Tormenta eléctrica",
    en: "Thunderstorm",
  },
  variable: {
    icon: "VAR",
    es: "Condición variable",
    en: "Variable conditions",
  },
};

function getWeatherInformation(code, language) {
  let condition;

  if (code === 0) {
    condition = WEATHER_CONDITIONS.clear;
  } else if ([1, 2].includes(code)) {
    condition = WEATHER_CONDITIONS.partlyCloudy;
  } else if (code === 3) {
    condition = WEATHER_CONDITIONS.cloudy;
  } else if ([45, 48].includes(code)) {
    condition = WEATHER_CONDITIONS.fog;
  } else if ([51, 53, 55, 56, 57].includes(code)) {
    condition = WEATHER_CONDITIONS.drizzle;
  } else if ([61, 63, 65, 66, 67].includes(code)) {
    condition = WEATHER_CONDITIONS.rain;
  } else if ([80, 81, 82].includes(code)) {
    condition = WEATHER_CONDITIONS.showers;
  } else if ([95, 96, 99].includes(code)) {
    condition = WEATHER_CONDITIONS.thunderstorm;
  } else {
    condition = WEATHER_CONDITIONS.variable;
  }

  return {
    icon: condition.icon,
    description: condition[language === "en" ? "en" : "es"],
  };
}

function formatObservationTime(value, language) {
  if (!value) {
    return language === "en"
      ? "Time unavailable"
      : "Hora no disponible";
  }

  const observationDate = new Date(value);

  if (Number.isNaN(observationDate.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat(
    language === "en" ? "en-US" : "es-CR",
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
  language = "es",
  onRetry,
}) {
  const isEnglish = language === "en";

  if (loading) {
    return (
      <section
        className="weather-card weather-card-loading"
        aria-label={
          isEnglish
            ? "Loading weather information"
            : "Cargando información del clima"
        }
        role="status"
      >
        <div className="weather-loading-icon" />

        <div>
          <span>
            {isEnglish ? "EXTERNAL INFORMATION" : "INFORMACIÓN EXTERNA"}
          </span>

          <h2>
            {isEnglish
              ? "Checking the weather..."
              : "Consultando el clima..."}
          </h2>

          <p>
            {isEnglish
              ? "Connecting to the weather service."
              : "Conectando con el servicio meteorológico."}
          </p>
        </div>
      </section>
    );
  }

  if (error || !weather) {
    return (
      <section
        className="weather-card weather-card-error"
        aria-label={
          isEnglish
            ? "Weather unavailable"
            : "Clima no disponible"
        }
        role="status"
      >
        <span
          className="weather-error-icon"
          aria-hidden="true"
        >
          !
        </span>

        <div>
          <span>
            {isEnglish ? "EXTERNAL INFORMATION" : "INFORMACIÓN EXTERNA"}
          </span>

          <h2>
            {isEnglish
              ? "Weather unavailable"
              : "Clima no disponible"}
          </h2>

          <p>
            {error ||
              (isEnglish
                ? "Weather information could not be retrieved."
                : "No fue posible obtener la información meteorológica.")}
          </p>

          {onRetry && (
            <button
              type="button"
              className="button button-secondary"
              onClick={onRetry}
            >
              {isEnglish ? "Try again" : "Intentar nuevamente"}
            </button>
          )}
        </div>
      </section>
    );
  }

  const weatherInformation = getWeatherInformation(
    weather.weatherCode,
    language
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
            {isEnglish
              ? "LIVE EXTERNAL INFORMATION"
              : "INFORMACIÓN EXTERNA EN VIVO"}
          </span>

          <h2 id="weather-card-title">
            {weather.location}
          </h2>

          <p className="weather-description">
            {weatherInformation.description}
          </p>

          <span className="weather-observation-time">
            {isEnglish ? "Updated at " : "Actualizado a las "}
            {formatObservationTime(
              weather.observedAt,
              language
            )}
          </span>
        </div>
      </div>

      <div
        className="weather-temperature"
        aria-label={
          isEnglish
            ? `Temperature: ${Math.round(weather.temperature)} ${weather.units.temperature}`
            : `Temperatura: ${Math.round(weather.temperature)} ${weather.units.temperature}`
        }
      >
        <strong>{Math.round(weather.temperature)}</strong>
        <span>{weather.units.temperature}</span>
      </div>

      <div className="weather-details">
        <article>
          <span>{isEnglish ? "FEELS LIKE" : "SENSACIÓN"}</span>

          <strong>
            {Math.round(weather.apparentTemperature)}
            {weather.units.temperature}
          </strong>
        </article>

        <article>
          <span>{isEnglish ? "HUMIDITY" : "HUMEDAD"}</span>

          <strong>
            {weather.humidity}
            {weather.units.humidity}
          </strong>
        </article>

        <article>
          <span>{isEnglish ? "WIND" : "VIENTO"}</span>

          <strong>
            {weather.windSpeed} {weather.units.windSpeed}
          </strong>
        </article>

        <article>
          <span>{isEnglish ? "PRECIPITATION" : "PRECIPITACIÓN"}</span>

          <strong>
            {weather.precipitation} {weather.units.precipitation}
          </strong>
        </article>
      </div>

      <footer className="weather-source">
        <span>{isEnglish ? "External source" : "Fuente externa"}</span>
        <strong>Open-Meteo API</strong>
      </footer>
    </section>
  );
}

export default WeatherCard;
