import { prisma } from "../lib/prisma.js";

type Context =
  | {
      type: "AWAITING_TABLE_SELECTION";
      requestedAt: string;
      endTime: string;
      tableIds: string[];
    }
  | { type: "NONE" };

const defaultContext: Context = { type: "NONE" };

async function getContext(lineUserId: string): Promise<Context> {
  const state = await prisma.conversationState.findUnique({ where: { lineUserId } });
  if (!state) return defaultContext;
  return state.context as Context;
}

async function setContext(lineUserId: string, context: Context) {
  await prisma.conversationState.upsert({
    where: { lineUserId },
    update: { context },
    create: { lineUserId, context },
  });
}

async function clearContext(lineUserId: string) {
  await prisma.conversationState.delete({ where: { lineUserId } }).catch(() => undefined);
}

export const conversationService = {
  getContext,
  setContext,
  clearContext,
};
