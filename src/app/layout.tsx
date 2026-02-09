"use client";

import { AuthProvider, useAuth } from "@/lib/auth";
import { usePathname } from "next/navigation";
import "./globals.css";

function LoginGate({ children }: { children: React.ReactNode }) {
  const { user, loading, signIn } = useAuth();
  const pathname = usePathname();

  // 公開頁面不需要登入
  const publicPaths = ["/", "/pricing"];
  if (publicPaths.includes(pathname)) {
    return <>{children}</>;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white">載入中...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white mb-8">
            591 搶案神器
          </h1>
          <p className="text-gray-400 mb-8">
            即時監控屋主自售物件，搶先一步取得房源
          </p>
          <button
            onClick={signIn}
            className="px-8 py-3 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition"
          >
            使用 Google 登入
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-TW">
      <body>
        <AuthProvider>
          <LoginGate>{children}</LoginGate>
        </AuthProvider>
      </body>
    </html>
  );
}
