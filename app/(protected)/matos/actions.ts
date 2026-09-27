"use server";

import { revalidatePath } from "next/cache";
import { addGearItem, setUserGear } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";

export async function toggleGear(
  itemId: number,
  field: "taking" | "packed",
  value: boolean,
): Promise<void> {
  const user = await getCurrentUser();
  if (!user) return;
  setUserGear(user.id, itemId, { [field]: value });
  revalidatePath("/matos");
  revalidatePath("/equipe");
}

export type AddItemState = { error?: string };

export async function addItem(
  _prev: AddItemState,
  formData: FormData,
): Promise<AddItemState> {
  const user = await getCurrentUser();
  if (!user) return { error: "Session expirée, reconnecte-toi." };
  const label = String(formData.get("label") ?? "");
  const shared = formData.get("shared") === "on";
  const taking = formData.get("taking") === "on";
  try {
    const item = addGearItem(label, shared);
    if (taking) setUserGear(user.id, item.id, { taking: true });
  } catch {
    return { error: "Donne un nom à l'item." };
  }
  revalidatePath("/matos");
  revalidatePath("/equipe");
  return {};
}
