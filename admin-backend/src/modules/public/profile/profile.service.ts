import { Prisma } from '@prisma/client';
import { prisma } from '@/prisma/client';
import { ApiError } from '@/core/errors/ApiError';
import type { ProfileAlert, ProfileEnquiry, ProfileOverview, ProfileReview, ProfileSavedCar } from './profile.types';

const PROFILE_LIMIT = 6;

const BRAND_SELECT = { id: true, name: true, slug: true } as const;
const MODEL_SELECT = { id: true, name: true, slug: true } as const;
const CAR_SUMMARY_SELECT = {
  id: true,
  name: true,
  slug: true,
  launchStatus: true,
  priceMin: true,
  priceMax: true,
  coverImageUrl: true,
  brand: { select: BRAND_SELECT },
} as const;

function toIso(value: Date | null): string | null {
  return value ? value.toISOString() : null;
}

function decimalToString(value: Prisma.Decimal | null): string | null {
  return value?.toString() ?? null;
}

type SavedCarRow = Prisma.WishlistGetPayload<{
  select: {
    id: true;
    modelId: true;
    createdAt: true;
    model: { select: typeof CAR_SUMMARY_SELECT };
  };
}>;

function shapeSavedCar(row: SavedCarRow): ProfileSavedCar {
  return {
    id: row.id,
    modelId: row.modelId,
    createdAt: row.createdAt.toISOString(),
    model: {
      ...row.model,
      priceMin: decimalToString(row.model.priceMin),
      priceMax: decimalToString(row.model.priceMax),
    },
  };
}

type LeadRow = {
  id: number;
  status?: string;
  isActive?: boolean;
  createdAt: Date;
  brand: { id: number; name: string; slug: string } | null;
  model: { id: number; name: string; slug: string } | null;
};

function enquiry(
  row: LeadRow,
  type: ProfileEnquiry['type'],
  label: string,
  detail: string | null = null,
): ProfileEnquiry {
  return {
    id: row.id,
    type,
    label,
    status: row.status ?? (row.isActive ? 'active' : 'inactive'),
    createdAt: row.createdAt.toISOString(),
    brand: row.brand,
    model: row.model,
    detail,
  };
}

type ReviewRow = Prisma.ReviewGetPayload<{
  select: {
    id: true;
    rating: true;
    title: true;
    body: true;
    status: true;
    helpfulCount: true;
    createdAt: true;
    model: { select: { id: true; name: true; slug: true; brand: { select: typeof BRAND_SELECT } } };
    variant: { select: { id: true; variantName: true } };
  };
}>;

function shapeReview(row: ReviewRow): ProfileReview {
  return {
    ...row,
    rating: decimalToString(row.rating),
    createdAt: row.createdAt.toISOString(),
  };
}

type AlertRow = LeadRow & { notifiedAt: Date | null };

function alert(row: AlertRow, type: ProfileAlert['type'], label: string): ProfileAlert {
  return {
    id: row.id,
    type,
    label,
    isActive: Boolean(row.isActive),
    notifiedAt: toIso(row.notifiedAt),
    createdAt: row.createdAt.toISOString(),
    model: row.model,
    brand: row.brand,
  };
}

export async function getProfileOverview(userId: number): Promise<ProfileOverview> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      mobile: true,
      isVerified: true,
      status: true,
      createdAt: true,
      lastLoginAt: true,
      city: { select: { id: true, name: true } },
    },
  });

  if (!user) {
    throw ApiError.notFound('User not found');
  }

  const modelLeadSelect = {
    id: true,
    status: true,
    createdAt: true,
    brand: { select: BRAND_SELECT },
    model: { select: MODEL_SELECT },
  } as const;
  const alertSelect = {
    id: true,
    isActive: true,
    notifiedAt: true,
    createdAt: true,
    brand: { select: BRAND_SELECT },
    model: { select: MODEL_SELECT },
  } as const;

  const [
    savedCount,
    newCarCount,
    loanCount,
    insuranceCount,
    priceDropCount,
    launchNotifyCount,
    softLeadCount,
    reviewCount,
    activePriceDropCount,
    activeLaunchNotifyCount,
    savedCars,
    newCarLeads,
    loanLeads,
    insuranceLeads,
    priceDropLeads,
    launchNotifyLeads,
    softLeads,
    reviews,
    activePriceDropAlerts,
    activeLaunchAlerts,
  ] = await Promise.all([
    prisma.wishlist.count({ where: { userId } }),
    prisma.buyNewCarLead.count({ where: { userId } }),
    prisma.loanLead.count({ where: { userId } }),
    prisma.insuranceLead.count({ where: { userId } }),
    prisma.priceDropAlertLead.count({ where: { userId } }),
    prisma.launchNotifyLead.count({ where: { userId } }),
    prisma.softLead.count({ where: { userId } }),
    prisma.review.count({ where: { userId } }),
    prisma.priceDropAlertLead.count({ where: { userId, isActive: true } }),
    prisma.launchNotifyLead.count({ where: { userId, isActive: true } }),
    prisma.wishlist.findMany({
      where: { userId },
      select: { id: true, modelId: true, createdAt: true, model: { select: CAR_SUMMARY_SELECT } },
      orderBy: { createdAt: 'desc' },
      take: PROFILE_LIMIT,
    }),
    prisma.buyNewCarLead.findMany({ where: { userId }, select: modelLeadSelect, orderBy: { createdAt: 'desc' }, take: PROFILE_LIMIT }),
    prisma.loanLead.findMany({
      where: { userId },
      select: { ...modelLeadSelect, lender: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
      take: PROFILE_LIMIT,
    }),
    prisma.insuranceLead.findMany({ where: { userId }, select: modelLeadSelect, orderBy: { createdAt: 'desc' }, take: PROFILE_LIMIT }),
    prisma.priceDropAlertLead.findMany({ where: { userId }, select: alertSelect, orderBy: { createdAt: 'desc' }, take: PROFILE_LIMIT }),
    prisma.launchNotifyLead.findMany({ where: { userId }, select: alertSelect, orderBy: { createdAt: 'desc' }, take: PROFILE_LIMIT }),
    prisma.softLead.findMany({
      where: { userId },
      select: { ...modelLeadSelect, calculatorType: true },
      orderBy: { createdAt: 'desc' },
      take: PROFILE_LIMIT,
    }),
    prisma.review.findMany({
      where: { userId },
      select: {
        id: true,
        rating: true,
        title: true,
        body: true,
        status: true,
        helpfulCount: true,
        createdAt: true,
        model: { select: { id: true, name: true, slug: true, brand: { select: BRAND_SELECT } } },
        variant: { select: { id: true, variantName: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: PROFILE_LIMIT,
    }),
    prisma.priceDropAlertLead.findMany({ where: { userId, isActive: true }, select: alertSelect, orderBy: { createdAt: 'desc' }, take: PROFILE_LIMIT }),
    prisma.launchNotifyLead.findMany({ where: { userId, isActive: true }, select: alertSelect, orderBy: { createdAt: 'desc' }, take: PROFILE_LIMIT }),
  ]);

  const recentEnquiries = [
    ...newCarLeads.map((row) => enquiry(row, 'new_car', 'New car enquiry')),
    ...loanLeads.map((row) => enquiry(row, 'loan', 'Loan enquiry', row.lender?.name ?? null)),
    ...insuranceLeads.map((row) => enquiry(row, 'insurance', 'Insurance enquiry')),
    ...priceDropLeads.map((row) => enquiry(row, 'price_drop', 'Price drop alert')),
    ...launchNotifyLeads.map((row) => enquiry(row, 'launch_notify', 'Launch notification')),
    ...softLeads.map((row) => enquiry(row, 'soft_lead', 'Calculator enquiry', row.calculatorType)),
  ]
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
    .slice(0, PROFILE_LIMIT);

  const alerts = [
    ...activePriceDropAlerts.map((row) => alert(row, 'price_drop', 'Price drop')),
    ...activeLaunchAlerts.map((row) => alert(row, 'launch_notify', 'Launch notify')),
  ]
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
    .slice(0, PROFILE_LIMIT);

  return {
    user: {
      ...user,
      createdAt: user.createdAt.toISOString(),
      lastLoginAt: toIso(user.lastLoginAt),
    },
    stats: {
      savedCars: savedCount,
      enquiries: newCarCount + loanCount + insuranceCount + priceDropCount + launchNotifyCount + softLeadCount,
      reviews: reviewCount,
      activeAlerts: activePriceDropCount + activeLaunchNotifyCount,
    },
    savedCars: savedCars.map(shapeSavedCar),
    recentEnquiries,
    reviews: reviews.map(shapeReview),
    alerts,
  };
}
