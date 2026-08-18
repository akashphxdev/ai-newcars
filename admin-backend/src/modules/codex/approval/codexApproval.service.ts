import { ApiError } from '@/core/errors/ApiError';
import { createLog } from '@/core/utils/createLog';
import { prisma } from '@/prisma/client';
import type { CodexEntity } from './codexApproval.types';
import type { CodexListQueryParsed, CodexRunListQueryParsed } from './codexApproval.validation';

type PrismaAny = Record<string, any>;

interface EntityConfig {
  delegate: string;
  label: string;
  searchFields: string[];
  listSelect: Record<string, true>;
}

const ENTITY_CONFIG: Record<CodexEntity, EntityConfig> = {
  brands: {
    delegate: 'codexBrand',
    label: 'brand',
    searchFields: ['name', 'slug'],
    listSelect: { id: true, runId: true, name: true, slug: true, logoUrl: true, proposalStatus: true, reviewedBy: true, reviewedAt: true, createdAt: true, updatedAt: true },
  },
  'car-models': {
    delegate: 'codexCarModel',
    label: 'car model',
    searchFields: ['name', 'slug'],
    listSelect: { id: true, runId: true, brandId: true, codexBrandId: true, name: true, slug: true, launchStatus: true, priceMin: true, priceMax: true, coverImageUrl: true, proposalStatus: true, reviewedBy: true, reviewedAt: true, createdAt: true, updatedAt: true },
  },
  'car-variants': {
    delegate: 'codexCarVariant',
    label: 'car variant',
    searchFields: ['variantName'],
    listSelect: { id: true, runId: true, modelId: true, codexModelId: true, variantName: true, price: true, seatingCapacity: true, transmissionId: true, proposalStatus: true, reviewedBy: true, reviewedAt: true, createdAt: true, updatedAt: true },
  },
  'powertrains-ice': {
    delegate: 'codexPowertrainIce',
    label: 'ICE powertrain',
    searchFields: [],
    listSelect: { id: true, runId: true, variantId: true, codexVariantId: true, fuelType: true, fuelTypeSubCategory: true, engineDisplacement: true, powerPs: true, proposalStatus: true, reviewedBy: true, reviewedAt: true, createdAt: true, updatedAt: true },
  },
  'powertrains-electric': {
    delegate: 'codexPowertrainElectric',
    label: 'electric powertrain',
    searchFields: [],
    listSelect: { id: true, runId: true, variantId: true, codexVariantId: true, batteryCapacity: true, claimedRange: true, powerPs: true, proposalStatus: true, reviewedBy: true, reviewedAt: true, createdAt: true, updatedAt: true },
  },
  'feature-categories': {
    delegate: 'codexFeatureCategory',
    label: 'feature category',
    searchFields: ['name'],
    listSelect: { id: true, runId: true, name: true, sortOrder: true, proposalStatus: true, reviewedBy: true, reviewedAt: true, createdAt: true, updatedAt: true },
  },
  features: {
    delegate: 'codexFeature',
    label: 'feature',
    searchFields: ['name'],
    listSelect: { id: true, runId: true, name: true, categoryId: true, codexCategoryId: true, proposalStatus: true, reviewedBy: true, reviewedAt: true, createdAt: true, updatedAt: true },
  },
  'variant-features': {
    delegate: 'codexVariantFeature',
    label: 'variant feature',
    searchFields: ['value'],
    listSelect: { id: true, runId: true, variantId: true, codexVariantId: true, featureId: true, codexFeatureId: true, value: true, proposalStatus: true, reviewedBy: true, reviewedAt: true, createdAt: true, updatedAt: true },
  },
  'car-colors': {
    delegate: 'codexCarColor',
    label: 'car color',
    searchFields: ['colorName'],
    listSelect: { id: true, runId: true, modelId: true, codexModelId: true, colorName: true, imageUrl: true, additionalCost: true, proposalStatus: true, reviewedBy: true, reviewedAt: true, createdAt: true, updatedAt: true },
  },
  'car-color-shades': {
    delegate: 'codexCarColorShade',
    label: 'car color shade',
    searchFields: ['colorHex'],
    listSelect: { id: true, runId: true, colorId: true, codexColorId: true, colorHex: true, sortOrder: true, proposalStatus: true, reviewedBy: true, reviewedAt: true, createdAt: true, updatedAt: true },
  },
  'car-images': {
    delegate: 'codexCarImage',
    label: 'car image',
    searchFields: ['imageUrl', 'angle'],
    listSelect: { id: true, runId: true, modelId: true, codexModelId: true, colorId: true, codexColorId: true, imageUrl: true, isPrimary: true, angle: true, proposalStatus: true, reviewedBy: true, reviewedAt: true, createdAt: true, updatedAt: true },
  },
  articles: {
    delegate: 'codexArticle',
    label: 'article',
    searchFields: ['title', 'slug', 'excerpt'],
    listSelect: { id: true, runId: true, categoryId: true, authorId: true, title: true, slug: true, excerpt: true, coverImageUrl: true, status: true, isActive: true, publishedAt: true, proposalStatus: true, reviewedBy: true, reviewedAt: true, createdAt: true, updatedAt: true },
  },
  'article-brands': {
    delegate: 'codexArticleBrand',
    label: 'article brand link',
    searchFields: [],
    listSelect: { id: true, runId: true, articleId: true, codexArticleId: true, brandId: true, codexBrandId: true, proposalStatus: true, reviewedBy: true, reviewedAt: true, createdAt: true, updatedAt: true },
  },
  'article-car-models': {
    delegate: 'codexArticleCarModel',
    label: 'article car model link',
    searchFields: [],
    listSelect: { id: true, runId: true, articleId: true, codexArticleId: true, modelId: true, codexModelId: true, proposalStatus: true, reviewedBy: true, reviewedAt: true, createdAt: true, updatedAt: true },
  },
  'car-faqs': {
    delegate: 'codexCarFaq',
    label: 'car FAQ',
    searchFields: ['question', 'answer'],
    listSelect: { id: true, runId: true, modelId: true, codexModelId: true, question: true, displayOrder: true, isActive: true, proposalStatus: true, reviewedBy: true, reviewedAt: true, createdAt: true, updatedAt: true },
  },
};

function prismaDelegate(delegate: string, client: PrismaAny = prisma as PrismaAny) {
  return client[delegate];
}

function toJsonSafe<T>(value: T): T {
  return JSON.parse(
    JSON.stringify(value, (_key, item) => (typeof item === 'bigint' ? item.toString() : item)),
  ) as T;
}

function buildWhere(entity: CodexEntity, query: CodexListQueryParsed): Record<string, unknown> {
  const config = ENTITY_CONFIG[entity];
  const where: Record<string, unknown> = {
    ...(query.status ? { proposalStatus: query.status } : { proposalStatus: { in: ['pending', 'rejected'] } }),
    ...(query.runId ? { runId: query.runId } : {}),
  };

  if (query.search && config.searchFields.length > 0) {
    where.OR = config.searchFields.map((field) => ({
      [field]: { contains: query.search, mode: 'insensitive' },
    }));
  }

  return where;
}

export async function listRuns(query: CodexRunListQueryParsed) {
  const where = {
    ...(query.status ? { status: query.status } : {}),
    ...(query.taskType ? { taskType: query.taskType } : {}),
  };
  const client = prisma as PrismaAny;

  const [items, total] = await Promise.all([
    client.codexRun.findMany({
      where,
      select: {
        id: true,
        taskType: true,
        status: true,
        sourceUrl: true,
        errorMessage: true,
        startedAt: true,
        finishedAt: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { startedAt: query.sortOrder },
      skip: (query.page - 1) * query.limit,
      take: query.limit,
    }),
    client.codexRun.count({ where }),
  ]);

  return {
    items: toJsonSafe(items),
    pagination: {
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.ceil(total / query.limit) || 1,
    },
  };
}

export async function listRunEvents(runId: bigint) {
  const client = prisma as PrismaAny;
  const run = await client.codexRun.findUnique({ where: { id: runId }, select: { id: true } });
  if (!run) {
    throw ApiError.notFound('Codex run not found');
  }

  const events = await client.codexProposalEvent.findMany({
    where: { runId },
    select: {
      id: true,
      runId: true,
      entityType: true,
      entityId: true,
      action: true,
      message: true,
      payload: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' },
  });
  return toJsonSafe(events);
}

export async function listProposals(entity: CodexEntity, query: CodexListQueryParsed) {
  const delegate = prismaDelegate(ENTITY_CONFIG[entity].delegate);
  const where = buildWhere(entity, query);

  const [items, total] = await Promise.all([
    delegate.findMany({
      where,
      select: ENTITY_CONFIG[entity].listSelect,
      orderBy: { createdAt: query.sortOrder },
      skip: (query.page - 1) * query.limit,
      take: query.limit,
    }),
    delegate.count({ where }),
  ]);

  return {
    items: toJsonSafe(items),
    pagination: {
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.ceil(total / query.limit) || 1,
    },
  };
}

export async function getProposalById(entity: CodexEntity, id: number) {
  const proposal = await prismaDelegate(ENTITY_CONFIG[entity].delegate).findUnique({ where: { id } });
  if (!proposal) {
    throw ApiError.notFound(`Codex ${ENTITY_CONFIG[entity].label} proposal not found`);
  }
  return toJsonSafe(proposal);
}

export async function rejectProposal(entity: CodexEntity, id: number, actorId: number, ipAddress?: string | null) {
  await getProposalById(entity, id);

  const proposal = await prismaDelegate(ENTITY_CONFIG[entity].delegate).update({
    where: { id },
    data: {
      proposalStatus: 'rejected',
      reviewedBy: actorId,
      reviewedAt: new Date(),
    },
  });

  await createLog({
    adminId: actorId,
    description: `Rejected Codex ${ENTITY_CONFIG[entity].label} proposal (id ${id})`,
    ipAddress,
  });

  return toJsonSafe(proposal);
}

export async function approveProposal(entity: CodexEntity, id: number, actorId: number, ipAddress?: string | null) {
  const result = await prisma.$transaction(async (tx) => approveInTransaction(tx as PrismaAny, entity, id, actorId));

  await createLog({
    adminId: actorId,
    description: `Approved Codex ${ENTITY_CONFIG[entity].label} proposal (staging id ${id}, real id ${result.id})`,
    ipAddress,
  });

  return toJsonSafe(result);
}

async function approveInTransaction(tx: PrismaAny, entity: CodexEntity, id: number, actorId: number) {
  switch (entity) {
    case 'brands':
      return approveBrand(tx, id);
    case 'car-models':
      return approveCarModel(tx, id);
    case 'car-variants':
      return approveCarVariant(tx, id);
    case 'powertrains-ice':
      return approvePowertrainIce(tx, id);
    case 'powertrains-electric':
      return approvePowertrainElectric(tx, id);
    case 'feature-categories':
      return approveFeatureCategory(tx, id);
    case 'features':
      return approveFeature(tx, id);
    case 'variant-features':
      return approveVariantFeature(tx, id);
    case 'car-colors':
      return approveCarColor(tx, id);
    case 'car-color-shades':
      return approveCarColorShade(tx, id);
    case 'car-images':
      return approveCarImage(tx, id);
    case 'articles':
      return approveArticle(tx, id, actorId);
    case 'article-brands':
      return approveArticleBrand(tx, id);
    case 'article-car-models':
      return approveArticleCarModel(tx, id);
    case 'car-faqs':
      return approveCarFaq(tx, id);
    default:
      throw ApiError.badRequest('Unsupported Codex entity');
  }
}

async function getStage(tx: PrismaAny, delegate: string, id: number) {
  const row = await tx[delegate].findUnique({ where: { id } });
  if (!row) {
    throw ApiError.notFound('Codex proposal not found');
  }
  if (!['pending', 'rejected'].includes(row.proposalStatus)) {
    throw ApiError.badRequest('Only pending or rejected Codex proposals can be approved');
  }
  return row;
}

async function approveBrand(tx: PrismaAny, id: number) {
  const row = await getStage(tx, 'codexBrand', id);
  const duplicate = await tx.brand.findUnique({ where: { slug: row.slug }, select: { id: true } });
  if (duplicate) {
    throw ApiError.conflict(`A brand with slug "${row.slug}" already exists`);
  }

  const created = await tx.brand.create({
    data: {
      name: row.name,
      slug: row.slug,
      logoUrl: row.logoUrl,
      countryOriginId: row.countryOriginId,
      isActive: row.isActive,
    },
  });

  await tx.codexCarModel.updateMany({ where: { codexBrandId: id }, data: { brandId: created.id, codexBrandId: null } });
  await tx.codexArticleBrand.updateMany({ where: { codexBrandId: id }, data: { brandId: created.id, codexBrandId: null } });
  await tx.codexBrand.delete({ where: { id } });
  return created;
}

async function approveCarModel(tx: PrismaAny, id: number) {
  const row = await getStage(tx, 'codexCarModel', id);
  if (!row.brandId) {
    throw ApiError.badRequest('Approve the linked Codex brand first or provide a real brandId');
  }

  const duplicate = await tx.carModel.findUnique({ where: { slug: row.slug }, select: { id: true } });
  if (duplicate) {
    throw ApiError.conflict(`A car model with slug "${row.slug}" already exists`);
  }

  const created = await tx.carModel.create({
    data: {
      brandId: row.brandId,
      name: row.name,
      slug: row.slug,
      bodyTypeId: row.bodyTypeId,
      launchStatus: row.launchStatus,
      expectedLaunchDate: row.expectedLaunchDate,
      priceMin: row.priceMin,
      priceMax: row.priceMax,
      ratingAvg: row.ratingAvg,
      coverImageUrl: row.coverImageUrl,
    },
  });

  await tx.codexCarVariant.updateMany({ where: { codexModelId: id }, data: { modelId: created.id, codexModelId: null } });
  await tx.codexCarColor.updateMany({ where: { codexModelId: id }, data: { modelId: created.id, codexModelId: null } });
  await tx.codexCarImage.updateMany({ where: { codexModelId: id }, data: { modelId: created.id, codexModelId: null } });
  await tx.codexCarFaq.updateMany({ where: { codexModelId: id }, data: { modelId: created.id, codexModelId: null } });
  await tx.codexArticleCarModel.updateMany({ where: { codexModelId: id }, data: { modelId: created.id, codexModelId: null } });
  await tx.codexCarModel.delete({ where: { id } });
  return created;
}

async function approveCarVariant(tx: PrismaAny, id: number) {
  const row = await getStage(tx, 'codexCarVariant', id);
  if (!row.modelId) {
    throw ApiError.badRequest('Approve the linked Codex car model first or provide a real modelId');
  }

  const duplicate = await tx.carVariant.findFirst({
    where: { modelId: row.modelId, variantName: row.variantName },
    select: { id: true },
  });
  if (duplicate) {
    throw ApiError.conflict(`A variant named "${row.variantName}" already exists for this model`);
  }

  const created = await tx.carVariant.create({
    data: {
      modelId: row.modelId,
      variantName: row.variantName,
      price: row.price,
      seatingCapacity: row.seatingCapacity,
      transmissionId: row.transmissionId,
      isTopSeller: row.isTopSeller,
      length: row.length,
      width: row.width,
      height: row.height,
      wheelBase: row.wheelBase,
      groundClearance: row.groundClearance,
      bootSpace: row.bootSpace,
      frontSuspension: row.frontSuspension,
      rearSuspension: row.rearSuspension,
      steeringType: row.steeringType,
      frontBrakeType: row.frontBrakeType,
      rearBrakeType: row.rearBrakeType,
    },
  });

  await tx.codexPowertrainIce.updateMany({ where: { codexVariantId: id }, data: { variantId: created.id, codexVariantId: null } });
  await tx.codexPowertrainElectric.updateMany({ where: { codexVariantId: id }, data: { variantId: created.id, codexVariantId: null } });
  await tx.codexVariantFeature.updateMany({ where: { codexVariantId: id }, data: { variantId: created.id, codexVariantId: null } });
  await tx.codexCarVariant.delete({ where: { id } });
  return created;
}

async function approvePowertrainIce(tx: PrismaAny, id: number) {
  const row = await getStage(tx, 'codexPowertrainIce', id);
  if (!row.variantId) {
    throw ApiError.badRequest('Approve the linked Codex variant first or provide a real variantId');
  }

  const created = await tx.carPowertrainIce.create({
    data: {
      variantId: row.variantId,
      fuelType: row.fuelType,
      fuelTypeSubCategory: row.fuelTypeSubCategory,
      fuelTankCapacity: row.fuelTankCapacity,
      cngTankCapacity: row.cngTankCapacity,
      kerbWeight: row.kerbWeight,
      engineDisplacement: row.engineDisplacement,
      cubicCapacity: row.cubicCapacity,
      cylinders: row.cylinders,
      numGears: row.numGears,
      isFourByFour: row.isFourByFour,
      drivetrainId: row.drivetrainId,
      powerPs: row.powerPs,
      powerMinRpm: row.powerMinRpm,
      powerMaxRpm: row.powerMaxRpm,
      torqueNm: row.torqueNm,
      torqueMinRpm: row.torqueMinRpm,
      torqueMaxRpm: row.torqueMaxRpm,
      claimedFe: row.claimedFe,
      realWorldMileage: row.realWorldMileage,
      topSpeedKmph: row.topSpeedKmph,
      topSpeedTimeSec: row.topSpeedTimeSec,
      isDefault: row.isDefault,
      isDeleted: row.isDeleted,
      deletedBy: row.deletedBy,
      deletedAt: row.deletedAt,
      expiresAt: row.expiresAt,
      emissionNormCompliance: row.emissionNormCompliance,
      turboCharger: row.turboCharger,
    },
  });
  await tx.codexPowertrainIce.delete({ where: { id } });
  return created;
}

async function approvePowertrainElectric(tx: PrismaAny, id: number) {
  const row = await getStage(tx, 'codexPowertrainElectric', id);
  if (!row.variantId) {
    throw ApiError.badRequest('Approve the linked Codex variant first or provide a real variantId');
  }

  const created = await tx.carPowertrainElectric.create({
    data: {
      variantId: row.variantId,
      numMotors: row.numMotors,
      motorType: row.motorType,
      batteryCapacity: row.batteryCapacity,
      batteryChemistry: row.batteryChemistry,
      thermalManagementSystem: row.thermalManagementSystem,
      drivetrainId: row.drivetrainId,
      powerPs: row.powerPs,
      torqueNm: row.torqueNm,
      claimedRange: row.claimedRange,
      realWorldRange: row.realWorldRange,
      topSpeedKmph: row.topSpeedKmph,
      topSpeedTimeSec: row.topSpeedTimeSec,
      acChargingOutput: row.acChargingOutput,
      acChargingTime: row.acChargingTime,
      dcChargingOutput: row.dcChargingOutput,
      dcFastChargingTime: row.dcFastChargingTime,
      batteryWarrantyKm: row.batteryWarrantyKm,
      batteryWarrantyYears: row.batteryWarrantyYears,
      motorWarrantyKm: row.motorWarrantyKm,
      motorWarrantyYears: row.motorWarrantyYears,
      standardWarrantyKm: row.standardWarrantyKm,
      standardWarrantyYears: row.standardWarrantyYears,
      isDefault: row.isDefault,
      isDeleted: row.isDeleted,
      deletedBy: row.deletedBy,
      deletedAt: row.deletedAt,
      expiresAt: row.expiresAt,
      emissionNormCompliance: row.emissionNormCompliance,
      motorPowerKw: row.motorPowerKw,
      chargingPort: row.chargingPort,
      chargingOptionsRaw: row.chargingOptionsRaw,
      regenerativeBraking: row.regenerativeBraking,
      regenerativeBrakingLevels: row.regenerativeBrakingLevels,
    },
  });
  await tx.codexPowertrainElectric.delete({ where: { id } });
  return created;
}

async function approveFeatureCategory(tx: PrismaAny, id: number) {
  const row = await getStage(tx, 'codexFeatureCategory', id);
  const duplicate = await tx.featureCategory.findUnique({ where: { name: row.name }, select: { id: true } });
  if (duplicate) {
    throw ApiError.conflict(`A feature category named "${row.name}" already exists`);
  }

  const created = await tx.featureCategory.create({ data: { name: row.name, sortOrder: row.sortOrder } });
  await tx.codexFeature.updateMany({ where: { codexCategoryId: id }, data: { categoryId: created.id, codexCategoryId: null } });
  await tx.codexFeatureCategory.delete({ where: { id } });
  return created;
}

async function approveFeature(tx: PrismaAny, id: number) {
  const row = await getStage(tx, 'codexFeature', id);
  const duplicate = await tx.feature.findUnique({ where: { name: row.name }, select: { id: true } });
  if (duplicate) {
    throw ApiError.conflict(`A feature named "${row.name}" already exists`);
  }

  const created = await tx.feature.create({ data: { name: row.name, categoryId: row.categoryId } });
  await tx.codexVariantFeature.updateMany({ where: { codexFeatureId: id }, data: { featureId: created.id, codexFeatureId: null } });
  await tx.codexFeature.delete({ where: { id } });
  return created;
}

async function approveVariantFeature(tx: PrismaAny, id: number) {
  const row = await getStage(tx, 'codexVariantFeature', id);
  if (!row.variantId || !row.featureId) {
    throw ApiError.badRequest('Approve linked Codex variant/feature first or provide real variantId and featureId');
  }

  const duplicate = await tx.variantFeature.findUnique({
    where: { variantId_featureId: { variantId: row.variantId, featureId: row.featureId } },
    select: { id: true },
  });
  if (duplicate) {
    throw ApiError.conflict('This variant feature already exists');
  }

  const created = await tx.variantFeature.create({
    data: { variantId: row.variantId, featureId: row.featureId, value: row.value },
  });
  await tx.codexVariantFeature.delete({ where: { id } });
  return created;
}

async function approveCarColor(tx: PrismaAny, id: number) {
  const row = await getStage(tx, 'codexCarColor', id);
  if (!row.modelId) {
    throw ApiError.badRequest('Approve the linked Codex car model first or provide a real modelId');
  }

  const created = await tx.carColor.create({
    data: {
      modelId: row.modelId,
      colorName: row.colorName,
      imageUrl: row.imageUrl,
      additionalCost: row.additionalCost,
    },
  });
  await tx.codexCarColorShade.updateMany({ where: { codexColorId: id }, data: { colorId: created.id, codexColorId: null } });
  await tx.codexCarImage.updateMany({ where: { codexColorId: id }, data: { colorId: created.id, codexColorId: null } });
  await tx.codexCarColor.delete({ where: { id } });
  return created;
}

async function approveCarColorShade(tx: PrismaAny, id: number) {
  const row = await getStage(tx, 'codexCarColorShade', id);
  if (!row.colorId) {
    throw ApiError.badRequest('Approve the linked Codex color first or provide a real colorId');
  }

  const created = await tx.carColorShade.create({
    data: { colorId: row.colorId, colorHex: row.colorHex, sortOrder: row.sortOrder },
  });
  await tx.codexCarColorShade.delete({ where: { id } });
  return created;
}

async function approveCarImage(tx: PrismaAny, id: number) {
  const row = await getStage(tx, 'codexCarImage', id);
  if (!row.modelId) {
    throw ApiError.badRequest('Approve the linked Codex car model first or provide a real modelId');
  }

  const created = await tx.carImage.create({
    data: {
      modelId: row.modelId,
      colorId: row.colorId,
      imageUrl: row.imageUrl,
      isPrimary: row.isPrimary,
      angle: row.angle,
    },
  });
  await tx.codexCarImage.delete({ where: { id } });
  return created;
}

async function approveArticle(tx: PrismaAny, id: number, actorId: number) {
  const row = await getStage(tx, 'codexArticle', id);
  const duplicate = await tx.article.findUnique({ where: { slug: row.slug }, select: { id: true } });
  if (duplicate) {
    throw ApiError.conflict(`An article with slug "${row.slug}" already exists`);
  }

  const created = await tx.article.create({
    data: {
      categoryId: row.categoryId,
      authorId: row.authorId ?? actorId,
      createdBy: row.createdBy ?? actorId,
      updatedBy: row.updatedBy,
      title: row.title,
      slug: row.slug,
      excerpt: row.excerpt,
      body: row.body,
      coverImageUrl: row.coverImageUrl,
      readTimeMinutes: row.readTimeMinutes,
      status: row.status,
      isActive: row.isActive,
      scheduledAt: row.scheduledAt,
      publishedAt: row.publishedAt,
      viewCount: row.viewCount,
      metaTitle: row.metaTitle,
      metaDescription: row.metaDescription,
      metaKeywords: row.metaKeywords,
      ogImageUrl: row.ogImageUrl,
    },
  });

  await tx.codexArticleBrand.updateMany({ where: { codexArticleId: id }, data: { articleId: created.id, codexArticleId: null } });
  await tx.codexArticleCarModel.updateMany({ where: { codexArticleId: id }, data: { articleId: created.id, codexArticleId: null } });
  await tx.codexArticle.delete({ where: { id } });
  return created;
}

async function approveArticleBrand(tx: PrismaAny, id: number) {
  const row = await getStage(tx, 'codexArticleBrand', id);
  if (!row.articleId || !row.brandId) {
    throw ApiError.badRequest('Approve linked Codex article/brand first or provide real articleId and brandId');
  }

  const duplicate = await tx.articleBrand.findFirst({
    where: { articleId: row.articleId, brandId: row.brandId },
    select: { id: true },
  });
  if (duplicate) {
    throw ApiError.conflict('This article-brand link already exists');
  }

  const created = await tx.articleBrand.create({ data: { articleId: row.articleId, brandId: row.brandId } });
  await tx.codexArticleBrand.delete({ where: { id } });
  return created;
}

async function approveArticleCarModel(tx: PrismaAny, id: number) {
  const row = await getStage(tx, 'codexArticleCarModel', id);
  if (!row.articleId || !row.modelId) {
    throw ApiError.badRequest('Approve linked Codex article/model first or provide real articleId and modelId');
  }

  const duplicate = await tx.articleCarModel.findFirst({
    where: { articleId: row.articleId, modelId: row.modelId },
    select: { id: true },
  });
  if (duplicate) {
    throw ApiError.conflict('This article-model link already exists');
  }

  const created = await tx.articleCarModel.create({ data: { articleId: row.articleId, modelId: row.modelId } });
  await tx.codexArticleCarModel.delete({ where: { id } });
  return created;
}

async function approveCarFaq(tx: PrismaAny, id: number) {
  const row = await getStage(tx, 'codexCarFaq', id);
  if (!row.modelId) {
    throw ApiError.badRequest('Approve the linked Codex car model first or provide a real modelId');
  }

  const duplicate = await tx.carFaq.findFirst({
    where: { modelId: row.modelId, displayOrder: row.displayOrder },
    select: { id: true },
  });
  if (duplicate) {
    throw ApiError.conflict('A FAQ with this displayOrder already exists for this model');
  }

  const created = await tx.carFaq.create({
    data: {
      modelId: row.modelId,
      question: row.question,
      answer: row.answer,
      displayOrder: row.displayOrder,
      isActive: row.isActive,
      viewCount: row.viewCount,
    },
  });
  await tx.codexCarFaq.delete({ where: { id } });
  return created;
}
