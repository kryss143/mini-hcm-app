const devBase = import.meta.env.VITE_API_BASE || "";
const prodBase = import.meta.env.VITE_API_PROD_BASE || "";

const base = import.meta.env.PROD ? prodBase : devBase;

export async function api(path, options = {}) {
  console.log(base);
  const { token, ...rest } = options;
  const headers = {
    "Content-Type": "application/json",
    ...(rest.headers || {}),
  };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${base}${path}`, { ...rest, headers });
  const text = await res.text();
  let data;
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { error: text };
  }
  if (!res.ok) {
    const err = new Error(data.error || res.statusText);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}
