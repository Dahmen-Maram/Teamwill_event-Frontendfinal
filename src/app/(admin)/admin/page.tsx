"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/shared/ui/card";
import { Header } from "@/components/layout/header";
import { apiService } from "@/lib/api";
import { useLanguage } from "@/lib/i18n";
import { LoadingSpinner } from "@/shared/ui/loading-spinner";

export default function AdminPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    (async () => {
      try {
        const u = await apiService.getCurrentUser();
        setUser(u);
        if (u.role !== "Admin") {
          router.replace("/");
        }
      } catch {
        router.replace("/auth/login");
      }
    })();
  }, []);

  const { t } = useLanguage();
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [result, setResult] = useState<any[]>([]);

  const handleUpload = async () => {
    if (!file) return;
    setIsUploading(true);
    try {
      const res = await apiService.uploadUsersCSV(file);
      setResult(res);
    } catch (e) {
      console.error(e);
      alert("Upload failed");
    } finally {
      setIsUploading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const handleLogout = () => {
    apiService.logout();
    router.replace("/auth/login");
  };

  return (
    <div className="min-h-screen bg-muted/30">
      <Header user={user} onLogout={handleLogout} />
      <div className="container mx-auto px-4 max-w-4xl py-12 space-y-10">
        <div className="mb-10 text-center space-y-2">
          <h1 className="text-4xl font-extrabold tracking-tight text-white">{t("navigation.csvUpload")}</h1>
          <p className="text-muted-foreground max-w-md mx-auto">
            {t("admin.csvSubtitle")}
          </p>
        </div>

        {/* Upload Card */}
        <Card className="shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-primary">
              {t("navigation.csvUpload")}
            </CardTitle>
            <CardDescription>{t("admin.csvSubtitle")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
          <label
            htmlFor="csvInput"
            className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-primary/40 rounded-lg cursor-pointer hover:bg-primary/5 transition-colors">
            <svg
              aria-hidden="true"
              className="w-10 h-10 mb-3 text-primary"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1M12 12V4m0 0L8 8m4-4l4 4"></path>
            </svg>
            <p className="text-sm text-muted-foreground">
              {file ? file.name : t("admin.dropOrClick")}
            </p>
            <input
              id="csvInput"
              type="file"
              accept=".csv"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="hidden"
            />
          </label>

          <Button className="w-full" disabled={!file || isUploading} onClick={handleUpload}>
            {isUploading ? <LoadingSpinner size="sm" /> : t("common.upload")}
          </Button>
                  </CardContent>
        </Card>

        {/* Results */}
        {result.length > 0 && (
          <div className="mt-10 bg-background rounded-2xl border shadow p-6 max-h-[60vh] overflow-auto">
            <h2 className="text-xl font-semibold mb-4">{t("admin.uploadResults")}</h2>
            <ul className="space-y-2 text-sm">
              {result.map((r: any, idx) => (
                <li key={idx} className="flex items-center justify-between">
                  <span>{r.email}</span>
                  {r.status === "success" ? (
                    <span className="text-primary">✔️ {t("common.success")}</span>
                  ) : (
                    <span className="text-destructive">❌ {t("common.error")}</span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
