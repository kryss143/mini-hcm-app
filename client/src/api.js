const devBase = import.meta.env.VITE_API_BASE || "";
const prodBase = import.meta.env.VITE_API_PROD_BASE || "";

const base = import.meta.env.PROD ? prodBase : devBase;

if (import.meta.env.PROD && !prodBase) {
  throw new Error("Missing VITE_API_PROD_BASE in production");
}

export async function api(path, options = {}) {
  const { token, ...rest } = options;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  const headers = {
    "Content-Type": "application/json",
    ...(rest.headers || {}),
  };

  if (token) headers.Authorization = `Bearer ${token}`;

  const url = `${base.replace(/\/$/, "")}/${path.replace(/^\//, "")}`;

  try {
    const res = await fetch(url, {
      ...rest,
      headers,
      signal: controller.signal,
    });

    const text = await res.text();

    let data = {};
    if (text) {
      try {
        data = JSON.parse(text);
      } catch {
        data = { error: text };
      }
    }

    if (!res.ok) {
      const err = new Error(data.error || res.statusText);
      err.status = res.status;
      err.data = data;
      throw err;
    }

    return data;
  } finally {
    clearTimeout(timeout);
  }
}
