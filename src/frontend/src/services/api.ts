const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api/v1";

export interface ApiError {
  detail: string;
}

export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const token = localStorage.getItem("token");

  const headers: Record<string, string> = {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...((options.headers as Record<string, string>) || {}),
  };

  if (!(options.body instanceof FormData) && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });
  } catch (networkErr: unknown) {
    throw new Error("Unable to connect to the server. Please try again later.");
  }

  if (!response.ok) {
    let errorMessage: string;
    try {
      const errorData = await response.json();
      if (typeof errorData?.detail === "string") {
        errorMessage = errorData.detail;
      } else if (Array.isArray(errorData?.detail)) {
        errorMessage = errorData.detail
          .map((item: any) =>
            typeof item === "string"
              ? item
              : item?.msg ||
                (item?.loc
                  ? `${item.loc.join(".")}: ${item.msg}`
                  : JSON.stringify(item)),
          )
          .join("; ");
      } else if (typeof errorData?.message === "string") {
        errorMessage = errorData.message;
      } else {
        errorMessage = `Request failed (${response.status}: ${response.statusText || "Error"})`;
      }
    } catch {
      errorMessage =
        response.statusText || `Request failed with status ${response.status}`;
    }
    throw new Error(errorMessage);
  }

  return response.json();
}
