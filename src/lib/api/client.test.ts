import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * `API_URL` and the dev token are read once, at module load. Every test re-imports
 * `./client` with `vi.resetModules()` after fixing `process.env`, so the precedence
 * rules are exercised against the values the module actually captured.
 */
const cookiesGet = vi.hoisted(() => vi.fn());

vi.mock("next/headers", () => ({
  cookies: async () => ({ get: cookiesGet }),
}));

const fetchMock = vi.fn();

let client: typeof import("./client");

async function loadClient(devToken: string | undefined) {
  vi.resetModules();
  process.env.API_URL = "https://api.test";
  if (devToken === undefined) delete process.env.API_DEV_TOKEN;
  else process.env.API_DEV_TOKEN = devToken;

  client = await import("./client");
  return client;
}

beforeEach(() => {
  cookiesGet.mockReset();
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
  delete process.env.API_URL;
  delete process.env.API_DEV_TOKEN;
});

describe("apiGet", () => {
  it("prefers the session cookie over the dev token", async () => {
    const { apiGet } = await loadClient("dev:nutri-1:nutri@correo.hn");
    cookiesGet.mockReturnValue({ value: "session-token" });
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({ ok: true }) });

    await apiGet("/dashboard");

    const init = fetchMock.mock.calls[0][1] as {
      headers: Record<string, string>;
    };
    expect(init.headers.Authorization).toBe("Bearer session-token");
  });

  it("falls back to the dev token when there is no session cookie", async () => {
    const { apiGet } = await loadClient("dev:nutri-1:nutri@correo.hn");
    cookiesGet.mockReturnValue(undefined);
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({ ok: true }) });

    await apiGet("/dashboard");

    const init = fetchMock.mock.calls[0][1] as {
      headers: Record<string, string>;
    };
    expect(init.headers.Authorization).toBe("Bearer dev:nutri-1:nutri@correo.hn");
  });

  it("requests <API_URL><path> with a bearer token and without server caching", async () => {
    const { apiGet } = await loadClient("dev-token");
    cookiesGet.mockReturnValue(undefined);
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({ data: 1 }) });

    await expect(apiGet("/pacientes?page=1")).resolves.toEqual({ data: 1 });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith("https://api.test/pacientes?page=1", {
      headers: {
        Accept: "application/json",
        Authorization: "Bearer dev-token",
      },
      cache: "no-store",
    });
  });

  it("throws an ApiError carrying the response status and the path", async () => {
    const { apiGet, ApiError } = await loadClient("dev-token");
    cookiesGet.mockReturnValue(undefined);
    fetchMock.mockResolvedValue({ ok: false, status: 403 });

    const error = await apiGet("/dashboard").catch((thrown: unknown) => thrown);

    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ status: 403, path: "/dashboard" });
  });

  it("maps a failed fetch to a status 0 ApiError", async () => {
    const { apiGet, ApiError } = await loadClient("dev-token");
    cookiesGet.mockReturnValue(undefined);
    fetchMock.mockRejectedValue(new TypeError("fetch failed"));

    const error = await apiGet("/dashboard").catch((thrown: unknown) => thrown);

    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ status: 0, path: "/dashboard" });
  });
});

describe("apiPost", () => {
  it("sends a POST with a JSON body, the session token and without server caching", async () => {
    const { apiPost } = await loadClient("dev-token");
    cookiesGet.mockReturnValue({ value: "session-token" });
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({ id: "p1" }) });

    await apiPost("/pacientes", { nombre: "Ana" });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith("https://api.test/pacientes", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: "Bearer session-token",
      },
      body: JSON.stringify({ nombre: "Ana" }),
      cache: "no-store",
    });
  });

  it("falls back to the dev token when there is no session cookie", async () => {
    const { apiPost } = await loadClient("dev:nutri-1:nutri@correo.hn");
    cookiesGet.mockReturnValue(undefined);
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({ id: "p1" }) });

    await apiPost("/pacientes", {});

    const init = fetchMock.mock.calls[0][1] as { headers: Record<string, string> };
    expect(init.headers.Authorization).toBe("Bearer dev:nutri-1:nutri@correo.hn");
  });

  it("resolves with the parsed response body", async () => {
    const { apiPost } = await loadClient("dev-token");
    cookiesGet.mockReturnValue(undefined);
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({ id: "p1", nombre: "Ana" }) });

    await expect(apiPost("/pacientes", {})).resolves.toEqual({ id: "p1", nombre: "Ana" });
  });

  it("keeps the API validation detail in the ApiError of a 400", async () => {
    const { apiPost, ApiError } = await loadClient("dev-token");
    cookiesGet.mockReturnValue(undefined);
    const detalle = {
      statusCode: 400,
      message: ["correo must be an email", "condiciones must not be empty"],
      error: "Bad Request",
    };
    fetchMock.mockResolvedValue({ ok: false, status: 400, json: async () => detalle });

    const error = await apiPost("/pacientes", {}).catch((thrown: unknown) => thrown);

    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ status: 400, path: "/pacientes", detalle });
  });

  it("keeps the ApiError intact when the error body is not JSON", async () => {
    const { apiPost, ApiError } = await loadClient("dev-token");
    cookiesGet.mockReturnValue(undefined);
    fetchMock.mockResolvedValue({
      ok: false,
      status: 409,
      json: async () => {
        throw new SyntaxError("Unexpected token < in JSON");
      },
    });

    const error = await apiPost("/pacientes", {}).catch((thrown: unknown) => thrown);

    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ status: 409, path: "/pacientes" });
    expect((error as { detalle?: unknown }).detalle).toBeUndefined();
  });

  it("maps a failed fetch to a status 0 ApiError", async () => {
    const { apiPost, ApiError } = await loadClient("dev-token");
    cookiesGet.mockReturnValue(undefined);
    fetchMock.mockRejectedValue(new TypeError("fetch failed"));

    const error = await apiPost("/pacientes", {}).catch((thrown: unknown) => thrown);

    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ status: 0, path: "/pacientes" });
  });
});
