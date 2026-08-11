import type { Metadata } from "next";
import ProfileClient from "@/components/profile/ProfileClient";

export const metadata: Metadata = {
  title: "Profile | TimesAuto",
  robots: { index: false, follow: false },
};

export default function ProfilePage() {
  return <ProfileClient />;
}
