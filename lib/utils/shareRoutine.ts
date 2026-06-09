export interface SharedExercise {
  name: string;
  role: string;
  mechanics: string;
  equipment: string | null;
  target_sets: number | null;
  notes: string | null;
  superset_group: number | null;
}

export interface SharedRoutine {
  v: 1;
  name: string;
  description: string | null;
  color: string | null;
  exercises: SharedExercise[];
}

export function encodeRoutine(data: SharedRoutine): string {
  const json = JSON.stringify(data);
  const bytes = new TextEncoder().encode(json);
  let binary = "";
  bytes.forEach((b) => { binary += String.fromCharCode(b); });
  return btoa(binary);
}

export function decodeRoutine(code: string): SharedRoutine {
  const trimmed = code.trim().replace(/\s/g, "");
  const decoded = atob(trimmed);
  const len = decoded.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = decoded.charCodeAt(i);
  }
  const json = new TextDecoder().decode(bytes);
  const data = JSON.parse(json) as unknown;
  if (
    typeof data !== "object" ||
    data === null ||
    (data as SharedRoutine).v !== 1
  ) {
    throw new Error("Código inválido");
  }
  return data as SharedRoutine;
}
