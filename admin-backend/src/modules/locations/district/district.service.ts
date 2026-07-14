// src/modules/locations/district/district.service.ts

import { Prisma } from '@prisma/client';
import { prisma } from '@/prisma/client';
import { ApiError } from '@/core/errors/ApiError';
import { createLog } from '@/core/utils/createLog';
import type {
  DistrictListQueryParsed,
  DistrictOptionsQueryParsed,
  CreateDistrictParsed,
  UpdateDistrictParsed,
} from './district.validation';

const DISTRICT_SELECT = {
  id: true,
  stateId: true,
  name: true,
  state: {
    select: {
      id: true,
      name: true,
      country: { select: { id: true, name: true } },
    },
  },
} as const;

export async function listDistricts(query: DistrictListQueryParsed) {
  const { page, limit, search, stateId, sortBy, sortOrder } = query;

  const where: Prisma.DistrictWhereInput = {
    ...(stateId ? { stateId } : {}),
    ...(search ? { name: { contains: search, mode: 'insensitive' } } : {}),
  };

  const [items, total] = await Promise.all([
    prisma.district.findMany({
      where,
      select: DISTRICT_SELECT,
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.district.count({ where }),
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

// Dropdown-only source — returns every matching district in one shot
// (no pagination), optionally scoped to a state. Same "why" as
// country.service.ts's listCountryOptions — the regular listDistricts()
// stays paginated for the Districts list page.
export async function listDistrictOptions(query: DistrictOptionsQueryParsed) {
  const { stateId } = query;

  const where: Prisma.DistrictWhereInput = {
    ...(stateId ? { stateId } : {}),
  };

  return prisma.district.findMany({
    where,
    select: { id: true, name: true, stateId: true },
    orderBy: { name: 'asc' },
  });
}

export async function getDistrictById(id: number) {
  const district = await prisma.district.findUnique({
    where: { id },
    select: DISTRICT_SELECT,
  });

  if (!district) {
    throw ApiError.notFound('District not found');
  }

  return district;
}

async function assertStateExists(stateId: number) {
  const state = await prisma.state.findUnique({ where: { id: stateId }, select: { id: true } });
  if (!state) {
    throw ApiError.badRequest('Invalid stateId — state does not exist');
  }
}

// A district name only needs to be unique WITHIN its own state — same
// scoping pattern as state.service.ts's assertNameAvailableInCountry.
async function assertNameAvailableInState(stateId: number, name: string, excludeId?: number) {
  const conflict = await prisma.district.findFirst({
    where: {
      stateId,
      name: { equals: name, mode: 'insensitive' },
      id: excludeId ? { not: excludeId } : undefined,
    },
    select: { id: true },
  });

  if (conflict) {
    throw ApiError.conflict('A district with this name already exists in the selected state');
  }
}

export async function createDistrict(input: CreateDistrictParsed, actorId: number) {
  await assertStateExists(input.stateId);
  await assertNameAvailableInState(input.stateId, input.name);

  const district = await prisma.district.create({
    data: {
      stateId: input.stateId,
      name: input.name,
    },
    select: DISTRICT_SELECT,
  });

  await createLog({
    adminId: actorId,
    description: `Created district "${district.name}" (id ${district.id}) under state "${district.state.name}"`,
  });

  return district;
}

export async function updateDistrict(id: number, input: UpdateDistrictParsed, actorId: number) {
  const existing = await getDistrictById(id);

  const targetStateId = input.stateId ?? existing.stateId;

  if (input.stateId) {
    await assertStateExists(input.stateId);
  }

  if (input.name || input.stateId) {
    await assertNameAvailableInState(targetStateId, input.name ?? existing.name, id);
  }

  const district = await prisma.district.update({
    where: { id },
    data: { ...input },
    select: DISTRICT_SELECT,
  });

  await createLog({
    adminId: actorId,
    description: `Updated district "${district.name}" (id ${district.id})`,
  });

  return district;
}

export async function deleteDistrict(id: number, actorId: number) {
  const district = await getDistrictById(id);

  // Same "protect referenced parent rows" rule as state.service.ts's
  // deleteState — a district with cities under it can't be deleted.
  const cityCount = await prisma.city.count({ where: { districtId: id } });
  if (cityCount > 0) {
    throw ApiError.badRequest(
      `Cannot delete this district — ${cityCount} cit${cityCount === 1 ? 'y is' : 'ies are'} linked to it. Delete or reassign them first.`,
    );
  }

  await prisma.district.delete({ where: { id } });

  await createLog({
    adminId: actorId,
    description: `Deleted district "${district.name}" (id ${id})`,
  });

  return { message: 'District deleted successfully' };
}