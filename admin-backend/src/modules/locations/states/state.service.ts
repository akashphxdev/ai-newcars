// src/modules/locations/state/state.service.ts

import { Prisma } from '@prisma/client';
import { prisma } from '@/prisma/client';
import { ApiError } from '@/core/errors/ApiError';
import { createLog } from '@/core/utils/createLog';
import type {
  StateListQueryParsed,
  StateOptionsQueryParsed,
  CreateStateParsed,
  UpdateStateParsed,
} from './state.validation';

const STATE_SELECT = {
  id: true,
  countryId: true,
  name: true,
  code: true,
  country: { select: { id: true, name: true, code: true } },
} as const;

export async function listStates(query: StateListQueryParsed) {
  const { page, limit, search, countryId, sortBy, sortOrder } = query;

  const where: Prisma.StateWhereInput = {
    ...(countryId ? { countryId } : {}),
    ...(search ? { name: { contains: search, mode: 'insensitive' } } : {}),
  };

  const [items, total] = await Promise.all([
    prisma.state.findMany({
      where,
      select: STATE_SELECT,
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.state.count({ where }),
  ]);

  return {
    items,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
}

// Dropdown-only source — returns every matching state in one shot (no
// pagination), optionally scoped to a country. Same "why" as
// country.service.ts's listCountryOptions — the regular listStates()
// stays paginated for the States list page.
export async function listStateOptions(query: StateOptionsQueryParsed) {
  const { countryId } = query;

  const where: Prisma.StateWhereInput = {
    ...(countryId ? { countryId } : {}),
  };

  return prisma.state.findMany({
    where,
    select: { id: true, name: true, code: true, countryId: true },
    orderBy: { name: 'asc' },
  });
}

export async function getStateById(id: number) {
  const state = await prisma.state.findUnique({
    where: { id },
    select: STATE_SELECT,
  });

  if (!state) {
    throw ApiError.notFound('State not found');
  }

  return state;
}

async function assertCountryExists(countryId: number) {
  const country = await prisma.country.findUnique({ where: { id: countryId }, select: { id: true } });
  if (!country) {
    throw ApiError.badRequest('Invalid countryId — country does not exist');
  }
}

// A state name only needs to be unique WITHIN its own country (two
// different countries can both have a state called "Eastern Province").
// Schema has no @unique for this, so it's enforced here, same as
// country.service.ts enforcing name/code uniqueness at the app level.
async function assertNameAvailableInCountry(countryId: number, name: string, excludeId?: number) {
  const conflict = await prisma.state.findFirst({
    where: {
      countryId,
      name: { equals: name, mode: 'insensitive' },
      id: excludeId ? { not: excludeId } : undefined,
    },
    select: { id: true },
  });

  if (conflict) {
    throw ApiError.conflict('A state with this name already exists in the selected country');
  }
}

export async function createState(input: CreateStateParsed, actorId: number) {
  await assertCountryExists(input.countryId);
  await assertNameAvailableInCountry(input.countryId, input.name);

  const state = await prisma.state.create({
    data: {
      countryId: input.countryId,
      name: input.name,
      code: input.code,
    },
    select: STATE_SELECT,
  });

  await createLog({
    adminId: actorId,
    description: `Created state "${state.name}" (id ${state.id}) under country "${state.country.name}"`,
  });

  return state;
}

export async function updateState(id: number, input: UpdateStateParsed, actorId: number) {
  const existing = await getStateById(id);

  const targetCountryId = input.countryId ?? existing.countryId;

  if (input.countryId) {
    await assertCountryExists(input.countryId);
  }

  if (input.name || input.countryId) {
    await assertNameAvailableInCountry(targetCountryId, input.name ?? existing.name, id);
  }

  const state = await prisma.state.update({
    where: { id },
    data: { ...input },
    select: STATE_SELECT,
  });

  await createLog({
    adminId: actorId,
    description: `Updated state "${state.name}" (id ${state.id})`,
  });

  return state;
}

export async function deleteState(id: number, actorId: number) {
  const state = await getStateById(id);

  // Same "protect referenced parent rows" rule as country.service.ts's
  // deleteCountry — a state with districts under it can't be deleted.
  const districtCount = await prisma.district.count({ where: { stateId: id } });
  if (districtCount > 0) {
    throw ApiError.badRequest(
      `Cannot delete this state — ${districtCount} district(s) are linked to it. Delete or reassign them first.`,
    );
  }

  await prisma.state.delete({ where: { id } });

  await createLog({
    adminId: actorId,
    description: `Deleted state "${state.name}" (id ${id})`,
  });

  return { message: 'State deleted successfully' };
}