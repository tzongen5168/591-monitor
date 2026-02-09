"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth";

export default function PricingPage() {
    const { user, userData } = useAuth();

    const plans = [
        {
            id: "free",
            name: "免費體驗",
            price: 0,
            features: [
                "1 個監控區域",
                "每日 3 則通知",
                "每 5 分鐘掃描",
                "LINE 即時通知",
            ],
        },
        {
            id: "standard",
            name: "標準版",
            price: 149,
            features: [
                "2 個監控區域",
                "每日 10 則通知",
                "即時通知",
                "優先支援",
            ],
        },
        {
            id: "pro",
            name: "專業版",
            price: 299,
            features: [
                "5 個監控區域",
                "每日 30 則通知",
                "歷史記錄查詢",
                "優先客服",
            ],
            popular: true,
        },
        {
            id: "unlimited",
            name: "無限版",
            price: 599,
            features: [
                "全台監控",
                "每日無上限通知",
                "API 存取",
                "專屬客服",
                "多帳號管理",
            ],
        },
    ];

    // 導向綠界付款
    const handlePurchase = async (planId: string) => {
        if (!user) {
            alert("請先登入");
            return;
        }

        if (planId === "free") {
            alert("您目前已是免費版");
            return;
        }

        // 呼叫後端 API 建立訂單
        const res = await fetch("/api/checkout", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ planId, userId: user.uid }),
        });

        const html = await res.text();

        // 開啟付款表單
        const newWindow = window.open("", "_blank");
        if (newWindow) {
            newWindow.document.write(html);
        }
    };

    return (
        <div className="min-h-screen bg-gray-900 text-white py-12 px-4">
            <div className="max-w-6xl mx-auto">
                <div className="text-center mb-12">
                    <h1 className="text-3xl font-bold mb-4">選擇適合您的方案</h1>
                    <p className="text-gray-400">
                        隨時升級或降級，不綁約、無隱藏費用
                    </p>
                </div>

                <div className="grid md:grid-cols-4 gap-6">
                    {plans.map((plan) => (
                        <div
                            key={plan.id}
                            className={`p-6 rounded-2xl border ${plan.popular
                                ? "border-emerald-500 bg-gray-800 ring-2 ring-emerald-500"
                                : "border-gray-700 bg-gray-800"
                                }`}
                        >
                            {plan.popular && (
                                <div className="text-center mb-4">
                                    <span className="px-3 py-1 bg-emerald-600 rounded-full text-xs">
                                        最受歡迎
                                    </span>
                                </div>
                            )}

                            <h2 className="text-xl font-bold text-center mb-2">
                                {plan.name}
                            </h2>

                            <div className="text-center mb-6">
                                {plan.price === 0 ? (
                                    <span className="text-4xl font-bold">免費</span>
                                ) : (
                                    <>
                                        <span className="text-4xl font-bold">NT${plan.price}</span>
                                        <span className="text-gray-400">/月</span>
                                    </>
                                )}
                            </div>

                            <ul className="space-y-3 mb-6">
                                {plan.features.map((feature) => (
                                    <li key={feature} className="flex items-center gap-2">
                                        <span className="text-emerald-400">✓</span>
                                        {feature}
                                    </li>
                                ))}
                            </ul>

                            <button
                                onClick={() => handlePurchase(plan.id)}
                                disabled={userData?.subscription_status === plan.id}
                                className={`w-full py-3 rounded-lg font-medium ${userData?.subscription_status === plan.id
                                    ? "bg-gray-600 cursor-not-allowed"
                                    : plan.popular
                                        ? "bg-emerald-600 hover:bg-emerald-700"
                                        : "bg-gray-700 hover:bg-gray-600"
                                    }`}
                            >
                                {userData?.subscription_status === plan.id
                                    ? "目前方案"
                                    : plan.price === 0
                                        ? "目前方案"
                                        : "立即訂閱"}
                            </button>
                        </div>
                    ))}
                </div>

                <div className="text-center mt-8">
                    <Link
                        href="/dashboard"
                        className="text-emerald-400 hover:underline"
                    >
                        ← 返回 Dashboard
                    </Link>
                </div>

                {/* 說明區 */}
                <div className="mt-12 p-6 bg-gray-800 rounded-lg">
                    <h3 className="text-lg font-semibold mb-4">💡 方案說明</h3>
                    <div className="grid md:grid-cols-2 gap-4 text-sm text-gray-300">
                        <div>
                            <p className="font-medium text-white mb-2">監控區域</p>
                            <p>每個區域可獨立設定出售/租屋、價格區間等條件。</p>
                        </div>
                        <div>
                            <p className="font-medium text-white mb-2">每日通知上限</p>
                            <p>避免訊息轟炸，確保您收到最重要的物件通知。</p>
                        </div>
                        <div>
                            <p className="font-medium text-white mb-2">LINE 即時通知</p>
                            <p>加入我們的 LINE 官方帳號，自動綁定即可收到通知。</p>
                        </div>
                        <div>
                            <p className="font-medium text-white mb-2">掃描頻率</p>
                            <p>每 5 分鐘掃描一次 591，搶先發現新上架物件。</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
