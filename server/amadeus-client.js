const PROD_BASE = "https://api.amadeus.com";
const TEST_BASE = "https://test.api.amadeus.com";

export class AmadeusError extends Error {
  constructor(message, status, body) {
    super(message);
    this.name = "AmadeusError";
    this.status = status;
    this.body = body;
  }
}

/**
 * Thin OAuth + Flight Availabilities client. Credentials stay on the server;
 * this module is only ever imported from server/*, never from src/main.js.
 */
export function createAmadeusClient({
  clientId = process.env.AMADEUS_CLIENT_ID,
  clientSecret = process.env.AMADEUS_CLIENT_SECRET,
  env = process.env.AMADEUS_ENV,
  fetchImpl = fetch,
} = {}) {
  const configured = Boolean(clientId && clientSecret);
  const production = env === "production";
  const baseUrl = production ? PROD_BASE : TEST_BASE;
  const source = production ? "amadeus-production" : "amadeus-test-cache";
  let cachedToken = null;

  async function requestJson(url, options) {
    const response = await fetchImpl(url, options);
    if (!response.ok) {
      const body = await response.text().catch(() => "");
      throw new AmadeusError(
        `Amadeus respondió HTTP ${response.status}`,
        response.status,
        body,
      );
    }
    return response.json();
  }

  async function getAccessToken() {
    if (cachedToken && cachedToken.expiresAt > Date.now() + 5000) {
      return cachedToken.accessToken;
    }
    const body = new URLSearchParams({
      grant_type: "client_credentials",
      client_id: clientId,
      client_secret: clientSecret,
    });
    const token = await requestJson(`${baseUrl}/v1/security/oauth2/token`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });
    cachedToken = {
      accessToken: token.access_token,
      expiresAt: Date.now() + (Number(token.expires_in) || 0) * 1000,
    };
    return cachedToken.accessToken;
  }

  async function searchAvailability({ origin, destination, date }) {
    const accessToken = await getAccessToken();
    const body = {
      originDestinations: [
        {
          id: "1",
          originLocationCode: origin,
          destinationLocationCode: destination,
          departureDateTime: { date },
        },
      ],
      travelers: [{ id: "1", travelerType: "ADULT" }],
      sources: ["GDS"],
    };
    return requestJson(
      `${baseUrl}/v1/shopping/availability/flight-availabilities`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      },
    );
  }

  return { configured, source, searchAvailability };
}
