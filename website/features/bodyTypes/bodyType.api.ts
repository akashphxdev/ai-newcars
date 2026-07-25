// features/bodyTypes/bodyType.api.ts

import { apiFetch, getUploadUrl } from "@/lib/apiClient";
import type { BodyType } from "./bodyType.types";

export async function getBodyTypes(limit = 12): Promise<BodyType[]> {
  const bodyTypes = await apiFetch<BodyType[]>(`/home/body-types?limit=${limit}`, { next: { revalidate: 600 } });
  return bodyTypes.map((b) => ({ ...b, iconUrl: getUploadUrl(b.iconUrl) }));
}
