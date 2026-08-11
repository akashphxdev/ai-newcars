"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import AuthModal from "@/components/common/AuthModal";
import { getCurrentUser, getUserInitials, subscribeAuthChange } from "@/features/auth/currentUser";
import type { AuthUser } from "@/features/auth/auth.types";
import { getMyProfile } from "@/features/profile/profile.api";
import type { ProfileOverview } from "@/features/profile/profile.types";
import { removeFromWishlist } from "@/features/wishlist/wishlist.api";
import { getUploadUrl } from "@/lib/apiClient";
import { formatPriceRange } from "@/lib/format";

const FALLBACK_IMG =
  "data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='360' height='240' viewBox='0 0 360 240'%3E%3Crect width='360' height='240' fill='%23e5e7eb'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dy='.3em' font-family='sans-serif' font-size='14' fill='%239ca3af'%3EImage unavailable%3C/text%3E%3C/svg%3E";

function formatDate(value: string | null): string {
  if (!value) return "-";
  return new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(value));
}

function statusClass(status: string): string {
  const normalized = status.toLowerCase();
  if (["active", "approved", "visible"].includes(normalized)) return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (["pending", "new"].includes(normalized)) return "border-amber-200 bg-amber-50 text-amber-700";
  return "border-border bg-page text-muted";
}

function EmptyState({ title }: { title: string }) {
  return (
    <div className="flex min-h-32 items-center justify-center rounded-lg border border-dashed border-border bg-page px-4 text-center">
      <p className="text-[13px] font-semibold text-muted">{title}</p>
    </div>
  );
}

function SectionTitle({ title, count }: { title: string; count?: number }) {
  return (
    <div className="mb-4 flex items-center justify-between gap-3">
      <h2 className="font-head text-xl font-extrabold text-ink">{title}</h2>
      {typeof count === "number" && (
        <span className="rounded-full border border-border bg-surface px-3 py-1 text-[12px] font-bold text-muted">
          {count}
        </span>
      )}
    </div>
  );
}

export default function ProfileClient() {
  const [storedUser, setStoredUser] = useState<AuthUser | null>(null);
  const [profile, setProfile] = useState<ProfileOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [removingModelId, setRemovingModelId] = useState<number | null>(null);
  const [authOpen, setAuthOpen] = useState(false);

  useEffect(() => {
    const syncUser = () => setStoredUser(getCurrentUser());
    syncUser();
    return subscribeAuthChange(syncUser);
  }, []);

  useEffect(() => {
    let alive = true;

    async function loadProfile() {
      if (!getCurrentUser()) {
        setLoading(false);
        setProfile(null);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const data = await getMyProfile();
        if (alive) setProfile(data);
      } catch (err) {
        if (alive) setError(err instanceof Error ? err.message : "Unable to load profile");
      } finally {
        if (alive) setLoading(false);
      }
    }

    loadProfile();
    return () => {
      alive = false;
    };
  }, [storedUser?.id]);

  const initials = profile?.user ? getUserInitials(profile.user) : storedUser ? getUserInitials(storedUser) : "?";

  async function handleRemoveSavedCar(modelId: number) {
    if (!profile || removingModelId) return;
    const previous = profile;

    setRemovingModelId(modelId);
    setProfile({
      ...profile,
      stats: { ...profile.stats, savedCars: Math.max(0, profile.stats.savedCars - 1) },
      savedCars: profile.savedCars.filter((item) => item.modelId !== modelId),
    });

    try {
      await removeFromWishlist(modelId);
    } catch (err) {
      setProfile(previous);
      setError(err instanceof Error ? err.message : "Unable to remove saved car");
    } finally {
      setRemovingModelId(null);
    }
  }

  if (!storedUser && !loading) {
    return (
      <div className="mx-auto flex min-h-[62vh] max-w-7xl flex-col items-center justify-center px-4 py-16 text-center">
        <span className="flex size-16 items-center justify-center rounded-full bg-brand text-xl font-extrabold text-white">TA</span>
        <h1 className="mt-5 font-head text-2xl font-extrabold text-ink sm:text-3xl">Login to view your profile</h1>
        <p className="mt-2 max-w-md text-[14px] leading-relaxed text-muted">
          Your saved cars, enquiries, reviews, and alerts are available after login.
        </p>
        <button
          type="button"
          onClick={() => setAuthOpen(true)}
          className="mt-6 cursor-pointer rounded-full bg-brand px-5 py-2.5 text-[13px] font-bold text-white transition-colors hover:bg-brand-hover"
        >
          Login / Signup
        </button>
        {authOpen && <AuthModal onClose={() => setAuthOpen(false)} />}
      </div>
    );
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-10 sm:py-12">
        <div className="h-36 animate-pulse rounded-lg bg-border-soft" />
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((item) => (
            <div key={item} className="h-24 animate-pulse rounded-lg bg-border-soft" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="mx-auto flex min-h-[62vh] max-w-7xl flex-col items-center justify-center px-4 py-16 text-center">
        <h1 className="font-head text-2xl font-extrabold text-ink">Profile unavailable</h1>
        <p className="mt-2 max-w-md text-[14px] leading-relaxed text-muted">{error ?? "Please try again after a moment."}</p>
      </div>
    );
  }

  return (
    <div className="bg-page">
      <section className="border-b border-border bg-surface">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:py-10">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-center gap-4">
              <span className="flex size-16 shrink-0 items-center justify-center rounded-full bg-brand text-xl font-extrabold text-white">
                {initials}
              </span>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="truncate font-head text-2xl font-extrabold text-ink sm:text-3xl">{profile.user.name}</h1>
                  <span className={`rounded-full border px-2.5 py-1 text-[11px] font-bold capitalize ${statusClass(profile.user.status)}`}>
                    {profile.user.status}
                  </span>
                </div>
                <p className="mt-1 text-[13px] font-medium text-muted">
                  {profile.user.mobile} {profile.user.email ? `- ${profile.user.email}` : ""}
                </p>
                <p className="mt-1 text-[12px] font-semibold text-subtle">
                  Joined {formatDate(profile.user.createdAt)} {profile.user.city ? `- ${profile.user.city.name}` : ""}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {[
                ["Saved Cars", profile.stats.savedCars],
                ["Enquiries", profile.stats.enquiries],
                ["Reviews", profile.stats.reviews],
                ["Alerts", profile.stats.activeAlerts],
              ].map(([label, value]) => (
                <div key={label} className="rounded-lg border border-border bg-page px-4 py-3 text-center">
                  <p className="text-xl font-extrabold text-ink">{value}</p>
                  <p className="mt-0.5 text-[11px] font-bold uppercase tracking-[0.08em] text-muted">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-8 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-8">
          <section>
            <SectionTitle title="Saved Cars" count={profile.savedCars.length} />
            {profile.savedCars.length === 0 ? (
              <EmptyState title="No saved cars yet" />
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {profile.savedCars.map((item) => {
                  const modelUrl = `/${item.model.brand.slug}-cars/${item.model.slug}`;
                  return (
                    <article key={item.id} className="overflow-hidden rounded-lg border border-border bg-surface">
                      <Link href={modelUrl} className="relative block aspect-[4/3] cursor-pointer bg-page">
                        <Image
                          src={getUploadUrl(item.model.coverImageUrl) ?? FALLBACK_IMG}
                          alt={`${item.model.brand.name} ${item.model.name}`}
                          fill
                          sizes="(max-width: 640px) 100vw, 320px"
                          className="object-cover"
                        />
                      </Link>
                      <div className="p-4">
                        <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-muted">{item.model.brand.name}</p>
                        <h3 className="mt-1 text-[16px] font-extrabold text-ink">{item.model.name}</h3>
                        <p className="mt-2 text-[13px] font-bold text-ink">{formatPriceRange(item.model.priceMin, item.model.priceMax)}</p>
                        <div className="mt-4 flex items-center justify-between gap-2">
                          <span className="text-[12px] font-semibold text-muted">Saved {formatDate(item.createdAt)}</span>
                          <div className="flex shrink-0 items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleRemoveSavedCar(item.modelId)}
                              disabled={removingModelId === item.modelId}
                              className="cursor-pointer rounded-full border border-border px-3 py-1.5 text-[12px] font-bold text-muted transition-colors hover:border-brand hover:text-brand disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              {removingModelId === item.modelId ? "Removing" : "Remove"}
                            </button>
                            <Link href={modelUrl} className="cursor-pointer rounded-full border border-brand px-3 py-1.5 text-[12px] font-bold text-brand">
                              View
                            </Link>
                          </div>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>

          <section>
            <SectionTitle title="Recent Enquiries" count={profile.recentEnquiries.length} />
            {profile.recentEnquiries.length === 0 ? (
              <EmptyState title="No enquiries yet" />
            ) : (
              <div className="space-y-3">
                {profile.recentEnquiries.map((item) => (
                  <article key={`${item.type}-${item.id}`} className="rounded-lg border border-border bg-surface p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0">
                        <p className="text-[12px] font-bold uppercase tracking-[0.08em] text-brand">{item.label}</p>
                        <h3 className="mt-1 truncate text-[15px] font-extrabold text-ink">
                          {item.brand?.name ?? "TimesAuto"} {item.model?.name ?? item.detail ?? ""}
                        </h3>
                        <p className="mt-1 text-[12px] font-semibold text-muted">{formatDate(item.createdAt)}</p>
                      </div>
                      <span className={`w-fit rounded-full border px-2.5 py-1 text-[11px] font-bold capitalize ${statusClass(item.status)}`}>
                        {item.status}
                      </span>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>

        <aside className="space-y-6">
          <section>
            <SectionTitle title="My Reviews" count={profile.reviews.length} />
            {profile.reviews.length === 0 ? (
              <EmptyState title="No reviews submitted yet" />
            ) : (
              <div className="space-y-3">
                {profile.reviews.map((review) => (
                  <article key={review.id} className="rounded-lg border border-border bg-surface p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="truncate text-[14px] font-extrabold text-ink">
                          {review.model.brand.name} {review.model.name}
                        </h3>
                        <p className="mt-1 text-[12px] font-semibold text-muted">
                          {review.variant?.variantName ?? "All variants"} - {formatDate(review.createdAt)}
                        </p>
                      </div>
                      <span className="rounded-md bg-brand px-2 py-1 text-[12px] font-extrabold text-white">{review.rating ?? "-"}</span>
                    </div>
                    <p className="mt-3 line-clamp-2 text-[13px] leading-relaxed text-muted">{review.title ?? review.body ?? "Review submitted"}</p>
                    <div className="mt-3 flex items-center justify-between gap-3">
                      <span className={`rounded-full border px-2.5 py-1 text-[11px] font-bold capitalize ${statusClass(review.status)}`}>
                        {review.status}
                      </span>
                      <span className="text-[12px] font-semibold text-muted">{review.helpfulCount} helpful</span>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>

          <section>
            <SectionTitle title="Active Alerts" count={profile.alerts.length} />
            {profile.alerts.length === 0 ? (
              <EmptyState title="No active alerts" />
            ) : (
              <div className="space-y-3">
                {profile.alerts.map((item) => (
                  <article key={`${item.type}-${item.id}`} className="rounded-lg border border-border bg-surface p-4">
                    <p className="text-[12px] font-bold uppercase tracking-[0.08em] text-brand">{item.label}</p>
                    <h3 className="mt-1 text-[14px] font-extrabold text-ink">
                      {item.brand?.name ?? "TimesAuto"} {item.model?.name ?? ""}
                    </h3>
                    <p className="mt-2 text-[12px] font-semibold text-muted">
                      Created {formatDate(item.createdAt)} {item.notifiedAt ? `- Notified ${formatDate(item.notifiedAt)}` : ""}
                    </p>
                  </article>
                ))}
              </div>
            )}
          </section>
        </aside>
      </div>
    </div>
  );
}
