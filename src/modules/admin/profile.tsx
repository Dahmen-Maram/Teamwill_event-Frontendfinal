"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { LoadingSpinner } from "@/shared/ui/loading-spinner";
import { ProfileForm } from "@/components/profile/profile-form";
import { Header } from "@/components/layout/header";
import { useLanguage } from "@/lib/i18n";
import { apiService } from "@/lib/api";
import { useAuth } from "@/modules/auth/auth-context";
import type { User } from "@/lib/types";
import Link from "next/link";

export default function AdminProfilePage() {
  const router = useRouter();
  const { t } = useLanguage();
  const { user, loading, refresh, logout } = useAuth();

  useEffect(() => {
    if (!loading && user && user.role !== "Admin") {
      router.replace("/");
    }
  }, [loading, user, router]);

  const handleUserUpdate = async (updatedUser: User) => {
    // Rafraîchir le contexte d'authentification pour mettre à jour l'avatar
    await refresh();
  };

  const handleLogout = () => {
    logout();
    router.replace("/auth/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">{t("common.error")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <Header user={user} onLogout={handleLogout} />
      <div className="container mx-auto px-4 max-w-4xl py-12 space-y-8">
        <div className="flex items-center space-x-4">
          <Button asChild variant="ghost" size="sm">
            <Link href="/admin">
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t("common.back")}
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{t("profile.title")}</h1>
            <p className="text-muted-foreground">{t("profile.subtitle")}</p>
          </div>
        </div>

        <ProfileForm user={user} onUserUpdate={handleUserUpdate} />
      </div>
    </div>
  );
}
