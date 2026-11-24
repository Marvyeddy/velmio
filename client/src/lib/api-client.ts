const apiUrl = import.meta.env.VITE_API_URL;

let refreshPromise: Promise<boolean> | null = null;


async function refreshSession(): Promise<boolean> {
  try {
    const response = await fetch(
      `${apiUrl}/api/v1/auth/refresh`,
      {
        method: "GET",
        credentials: "include",
        signal: AbortSignal.timeout(10_000),
      },
    );

    return response.ok;
  } catch {
    return false;
  }
}


function refreshSessionOnce(): Promise<boolean> {
  if (!refreshPromise) {
    refreshPromise = refreshSession().finally(() => {
      refreshPromise = null;
    });
  }

  return refreshPromise;
}

export async function apiFetch(
  input: string,
  init: RequestInit = {},
): Promise<Response> {
  const requestOptions: RequestInit = {
    ...init,
    credentials: "include",
  };

  let response = await fetch(`${apiUrl}${input}`, {
    ...requestOptions,
    signal: requestOptions.signal ?? AbortSignal.timeout(15_000),
  });

  if (response.status !== 401) {
    return response;
  }

  // Avoid trying to refresh when authentication itself fails.
  if (
    input.startsWith("/api/v1/auth/refresh") ||
    input.startsWith("/api/v1/auth/signin") ||
    input.startsWith("/api/v1/auth/signup")
  ) {
    return response;
  }

  const refreshed = await refreshSessionOnce();

  if (!refreshed) {
    return response;
  }

  // Retry the original request once with the new session cookie.
  response = await fetch(`${apiUrl}${input}`, requestOptions);

  return response;
}