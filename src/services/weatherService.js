const WEATHER_API_URL =
  "https://api.open-meteo.com/v1/forecast";

const LOCATION = {
  name: "San José, Costa Rica",
  latitude: 9.9281,
  longitude: -84.0907,
};

export const weatherService = {
  async getCurrent(signal) {
    const parameters =
      new URLSearchParams({
        latitude: String(
          LOCATION.latitude
        ),
        longitude: String(
          LOCATION.longitude
        ),
        current: [
          "temperature_2m",
          "relative_humidity_2m",
          "apparent_temperature",
          "precipitation",
          "weather_code",
          "is_day",
          "wind_speed_10m",
        ].join(","),
        timezone:
          "America/Costa_Rica",
        forecast_days: "1",
      });

    const response = await fetch(
      `${WEATHER_API_URL}?${parameters.toString()}`,
      {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
        signal,
      }
    );

    if (!response.ok) {
      throw new Error(
        `No fue posible consultar el clima (${response.status}).`
      );
    }

    const data = await response.json();

    if (!data.current) {
      throw new Error(
        "El servicio meteorológico no devolvió información actual."
      );
    }

    return {
      location: LOCATION.name,
      latitude: data.latitude,
      longitude: data.longitude,
      timezone: data.timezone,
      temperature:
        data.current.temperature_2m,
      apparentTemperature:
        data.current
          .apparent_temperature,
      humidity:
        data.current
          .relative_humidity_2m,
      precipitation:
        data.current.precipitation,
      windSpeed:
        data.current.wind_speed_10m,
      weatherCode:
        data.current.weather_code,
      isDay: data.current.is_day,
      observedAt: data.current.time,
      units: {
        temperature:
          data.current_units
            ?.temperature_2m || "°C",
        humidity:
          data.current_units
            ?.relative_humidity_2m ||
          "%",
        precipitation:
          data.current_units
            ?.precipitation || "mm",
        windSpeed:
          data.current_units
            ?.wind_speed_10m ||
          "km/h",
      },
    };
  },
};
