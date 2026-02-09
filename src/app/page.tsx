"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth";

export default function HomePage() {
  const { user, signIn } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900">
      {/* Hero */}
      <div className="max-w-5xl mx-auto px-4 py-20">
        <div className="text-center">
          <h1 className="text-5xl font-bold text-white mb-6">
            <span className="text-emerald-400">591</span> 搶案神器
          </h1>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            自動監控屋主自售物件，第一時間收到 LINE 通知，
            <br />
            搶先聯繫屋主，省下仲介費！
          </p>

          <div className="flex justify-center gap-4">
            {user ? (
              <Link
                href="/dashboard"
                className="px-8 py-4 bg-emerald-600 text-white rounded-xl font-medium text-lg hover:bg-emerald-700 transition shadow-lg shadow-emerald-900/50"
              >
                進入 Dashboard →
              </Link>
            ) : (
              <button
                onClick={signIn}
                className="px-8 py-4 bg-emerald-600 text-white rounded-xl font-medium text-lg hover:bg-emerald-700 transition shadow-lg shadow-emerald-900/50"
              >
                免費開始使用
              </button>
            )}
            <Link
              href="/pricing"
              className="px-8 py-4 border border-gray-600 text-gray-300 rounded-xl font-medium text-lg hover:bg-gray-800 transition"
            >
              查看方案
            </Link>
          </div>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-8 mt-24">
          <div className="p-6 bg-gray-800/50 rounded-2xl border border-gray-700">
            <div className="text-4xl mb-4">🔍</div>
            <h3 className="text-xl font-bold text-white mb-2">智能監控</h3>
            <p className="text-gray-400">
              每 5 分鐘自動掃描 591，鎖定「屋主自售」物件，不錯過任何新房源。
            </p>
          </div>

          <div className="p-6 bg-gray-800/50 rounded-2xl border border-gray-700">
            <div className="text-4xl mb-4">⚡</div>
            <h3 className="text-xl font-bold text-white mb-2">即時通知</h3>
            <p className="text-gray-400">
              透過 LINE Notify 即時推送，手機秒收通知，比別人快一步行動。
            </p>
          </div>

          <div className="p-6 bg-gray-800/50 rounded-2xl border border-gray-700">
            <div className="text-4xl mb-4">💰</div>
            <h3 className="text-xl font-bold text-white mb-2">省仲介費</h3>
            <p className="text-gray-400">
              直接與屋主交易，動輒省下數十萬仲介費，月費只要 99 元起。
            </p>
          </div>
        </div>

        {/* How it works */}
        <div className="mt-24 text-center">
          <h2 className="text-3xl font-bold text-white mb-12">如何運作？</h2>
          <div className="flex flex-col md:flex-row items-center justify-center gap-8">
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 bg-emerald-600 rounded-full flex items-center justify-center text-2xl font-bold text-white mb-4">
                1
              </div>
              <p className="text-gray-300">設定監控區域與預算</p>
            </div>
            <div className="text-4xl text-gray-600">→</div>
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 bg-emerald-600 rounded-full flex items-center justify-center text-2xl font-bold text-white mb-4">
                2
              </div>
              <p className="text-gray-300">系統自動掃描 591</p>
            </div>
            <div className="text-4xl text-gray-600">→</div>
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 bg-emerald-600 rounded-full flex items-center justify-center text-2xl font-bold text-white mb-4">
                3
              </div>
              <p className="text-gray-300">LINE 即時收到新物件</p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-800 py-8 text-center text-gray-500 text-sm">
        © 2026 591搶案神器. All rights reserved.
      </footer>
    </div>
  );
}
