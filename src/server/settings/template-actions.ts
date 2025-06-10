"use server";

import { db } from "~/server/db";
import { templates } from "~/server/db/schema";
import { eq, and } from "drizzle-orm";

import type { Template, TemplateBlock } from "~/app/types/TeeSheetTypes";
import { revalidatePath } from "next/cache";

export async function createTemplate(
  name: string,
  type: string,
  data: {
    startTime?: string;
    endTime?: string;
    interval?: number;
    maxMembersPerBlock?: number;
    blocks?: TemplateBlock[];
  },
): Promise<{ success: boolean; id?: number }> {
  try {
    const result = await db
      .insert(templates)
      .values({
        name,
        type,
        startTime: data.startTime,
        endTime: data.endTime,
        interval: data.interval,
        maxMembersPerBlock: data.maxMembersPerBlock,
        blocks: data.blocks ? JSON.stringify(data.blocks) : null,
      })
      .returning();

    if (!result?.[0]?.id) {
      console.error("Failed to create template: No ID returned");
      return { success: false };
    }

    revalidatePath("/settings/teesheet");
    revalidatePath("/settings/teesheet/configuration");
    return { success: true, id: result[0].id };
  } catch (error) {
    console.error("Error creating template:", error);
    return { success: false };
  }
}

export async function updateTemplate(
  id: number,
  name: string,
  type: string,
  data: {
    startTime?: string;
    endTime?: string;
    interval?: number;
    maxMembersPerBlock?: number;
    blocks?: TemplateBlock[];
  },
): Promise<{ success: boolean }> {
  try {
    const result = await db
      .update(templates)
      .set({
        name,
        type,
        startTime: data.startTime,
        endTime: data.endTime,
        interval: data.interval,
        maxMembersPerBlock: data.maxMembersPerBlock,
        blocks: data.blocks ? JSON.stringify(data.blocks) : null,
      })
      .where(eq(templates.id, id))
      .returning();

    if (!result?.[0]) {
      console.error("Failed to update template: No rows affected");
      return { success: false };
    }

    revalidatePath("/settings/teesheet");
    revalidatePath("/settings/teesheet/configuration");
    return { success: true };
  } catch (error) {
    console.error("Error updating template:", error);
    return { success: false };
  }
}

export async function deleteTemplate(
  id: number,
): Promise<{ success: boolean }> {
  try {
    const result = await db
      .delete(templates)
      .where(eq(templates.id, id))
      .returning();

    if (!result?.[0]) {
      console.error("Failed to delete template: No rows affected");
      return { success: false };
    }

    revalidatePath("/settings/teesheet");
    revalidatePath("/settings/teesheet/configuration");
    return { success: true };
  } catch (error) {
    console.error("Error deleting template:", error);
    return { success: false };
  }
}

export async function getTemplates(): Promise<Template[]> {
  try {
    const result = await db
      .select()
      .from(templates)
      .orderBy(templates.name);

    return result.map((template) => ({
      ...template,
      blocks: template.blocks ? JSON.parse(template.blocks as string) : [],
    })) as Template[];
  } catch (error) {
    console.error("Error fetching templates:", error);
    return [];
  }
}
