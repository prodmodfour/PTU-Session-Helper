import { prisma } from '~/server/utils/prisma'

export async function resolveNickname(species: string, nickname?: string | null): Promise<string> {
  if (nickname?.trim()) return nickname.trim()
  const count = await prisma.pokemon.count({ where: { species } })
  return `${species} ${count + 1}`
}
