import { openDB } from "idb";
export type Project = {
  id: string;
  name: string;
  category: string;
  width: number;
  height: number;
  background: string;
  canvas: Record<string, unknown>;
  thumbnail: string;
  updated: number;
  status: "draft" | "final";
  favorite: boolean;
};
const db = openDB("my-atelier", 1, {
  upgrade(db) {
    db.createObjectStore("projects", { keyPath: "id" });
    db.createObjectStore("settings");
  },
});
export const listProjects = async (): Promise<Project[]> =>
  (await (await db).getAll("projects")).sort((a, b) => b.updated - a.updated);
export const saveProject = async (p: Project) => (await db).put("projects", p);
export const deleteProject = async (id: string) =>
  (await db).delete("projects", id);
export const getNote = async (): Promise<string> =>
  (await (await db).get("settings", "note")) ?? "";
export const saveNote = async (note: string) =>
  (await db).put("settings", note, "note");
export async function restoreProjects(items: Project[]) {
  const tx = (await db).transaction("projects", "readwrite");
  for (const p of items) await tx.store.put(p);
  await tx.done;
}
export function download(content: Blob | string, name: string) {
  const url =
    typeof content === "string" ? content : URL.createObjectURL(content);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  if (typeof content !== "string")
    setTimeout(() => URL.revokeObjectURL(url), 1000);
}
