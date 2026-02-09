"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import {
    collection,
    query,
    where,
    getDocs,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

// Taiwan regions
const REGIONS = [
    "台北市",
    "新北市",
    "桃園市",
    "新竹市",
    "新竹縣",
    "台中市",
    "台南市",
    "高雄市",
    "基隆市",
    "宜蘭縣",
    "花蓮縣",
    "台東縣",
];

interface Monitor {
    id: string;
    type: "rent" | "sale";
    regions: string[];
    priceMin: number;
    priceMax: number;
    isActive: boolean;
}

// LINE 官方帳號 ID（部署時替換）
const LINE_OA_ID = "@591monitor";

export default function DashboardPage() {
    const { user, userData, signOut } = useAuth();
    const [monitors, setMonitors] = useState<Monitor[]>([]);
    const [showSettings, setShowSettings] = useState(false);

    // 載入監控設定
    useEffect(() => {
        if (!user) return;

        const loadMonitors = async () => {
            const q = query(
                collection(db, "monitors"),
                where("userId", "==", user.uid)
            );
            const snapshot = await getDocs(q);
            const data = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            })) as Monitor[];
            setMonitors(data);
        };

        loadMonitors();
    }, [user, userData]);

    // 新增監控
    const addMonitor = async () => {
        if (!user || !userData) return;

        // 檢查訂閱限制
        const activeCount = monitors.filter((m) => m.isActive).length;
        if (activeCount >= userData.maxRegions) {
            alert(`您的方案最多可監控 ${userData.maxRegions} 個區域`);
            return;
        }

        const newMonitor = {
            userId: user.uid,
            type: "sale" as const,
            regions: [],
            priceMin: 0,
            priceMax: 0,
            isActive: true,
            createdAt: new Date(),
        };

        const docRef = await addDoc(collection(db, "monitors"), newMonitor);
        setMonitors([...monitors, { id: docRef.id, ...newMonitor }]);
    };

    // 更新監控
    const updateMonitor = async (id: string, data: Partial<Monitor>) => {
        await updateDoc(doc(db, "monitors", id), data);
        setMonitors(
            monitors.map((m) => (m.id === id ? { ...m, ...data } : m))
        );
    };

    // 刪除監控
    const deleteMonitor = async (id: string) => {
        await deleteDoc(doc(db, "monitors", id));
        setMonitors(monitors.filter((m) => m.id !== id));
    };

    // 訂閱方案對照
    const planLabels: Record<string, string> = {
        free: "免費體驗",
        standard: "標準版",
        pro: "專業版",
        unlimited: "無限版",
    };

    // LINE 綁定狀態
    const isLineLinked = !!userData?.lineUserId;

    return (
        <div className="min-h-screen bg-gray-900 text-white">
            {/* Header */}
            <header className="bg-gray-800 border-b border-gray-700 px-6 py-4 flex justify-between items-center">
                <h1 className="text-xl font-bold text-emerald-400">591 搶案神器</h1>
                <div className="flex items-center gap-4">
                    <span className="text-sm text-gray-400">
                        {userData?.displayName || user?.email}
                    </span>
                    <span className="px-2 py-1 bg-emerald-600 rounded text-xs">
                        {planLabels[userData?.subscription_status || "free"]}
                    </span>
                    <button
                        onClick={signOut}
                        className="text-sm text-gray-400 hover:text-white"
                    >
                        登出
                    </button>
                </div>
            </header>

            <div className="flex">
                {/* Sidebar */}
                <aside className="w-64 bg-gray-800 min-h-[calc(100vh-64px)] p-4 border-r border-gray-700">
                    <nav className="space-y-2">
                        <button className="w-full text-left px-4 py-2 rounded bg-emerald-600">
                            📊 監控總覽
                        </button>
                        <button
                            onClick={() => setShowSettings(!showSettings)}
                            className="w-full text-left px-4 py-2 rounded hover:bg-gray-700"
                        >
                            🔔 LINE 通知設定
                        </button>
                        <a
                            href="/pricing"
                            className="block px-4 py-2 rounded hover:bg-gray-700"
                        >
                            💳 升級方案
                        </a>
                    </nav>
                </aside>

                {/* Main */}
                <main className="flex-1 p-6">
                    {/* LINE 綁定面板 */}
                    {showSettings && (
                        <div className="mb-6 p-4 bg-gray-800 rounded-lg">
                            <h2 className="text-lg font-semibold mb-4">LINE 通知設定</h2>

                            {isLineLinked ? (
                                <div className="flex items-center gap-3 p-4 bg-emerald-900/30 rounded-lg border border-emerald-700">
                                    <span className="text-2xl">✅</span>
                                    <div>
                                        <p className="font-medium text-emerald-400">LINE 已綁定</p>
                                        <p className="text-sm text-gray-400">
                                            您已成功加入官方帳號，新物件通知將會發送到您的 LINE
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div className="p-4 bg-amber-900/30 rounded-lg border border-amber-700">
                                        <p className="text-amber-400 font-medium mb-2">⚠️ 尚未綁定 LINE</p>
                                        <p className="text-sm text-gray-300">
                                            請掃描下方 QR Code 或點擊按鈕加入我們的 LINE 官方帳號，即可接收新物件通知
                                        </p>
                                    </div>

                                    <div className="flex flex-col items-center gap-4 p-6 bg-gray-700 rounded-lg">
                                        {/* QR Code 區域 */}
                                        <div className="w-48 h-48 bg-white rounded-lg flex items-center justify-center">
                                            <div className="text-center text-gray-500">
                                                <div className="text-4xl mb-2">📱</div>
                                                <p className="text-sm">LINE QR Code</p>
                                                <p className="text-xs text-gray-400">(部署後顯示)</p>
                                            </div>
                                        </div>

                                        <p className="text-gray-400 text-sm">或</p>

                                        <a
                                            href={`https://line.me/R/ti/p/${LINE_OA_ID}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="px-6 py-3 bg-[#06C755] hover:bg-[#05B74C] rounded-lg font-medium flex items-center gap-2 transition-colors"
                                        >
                                            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                                                <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314" />
                                            </svg>
                                            加入 LINE 官方帳號
                                        </a>
                                    </div>

                                    <div className="p-3 bg-gray-700 rounded text-sm text-gray-300">
                                        <p className="font-semibold mb-2">📱 綁定說明</p>
                                        <ol className="list-decimal list-inside space-y-1">
                                            <li>掃描 QR Code 或點擊上方按鈕</li>
                                            <li>加入 LINE 官方帳號為好友</li>
                                            <li>在 LINE 中發送任意訊息完成綁定</li>
                                            <li>重新整理本頁面確認綁定狀態</li>
                                        </ol>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* 監控列表 */}
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-semibold">監控設定</h2>
                        <button
                            onClick={addMonitor}
                            className="px-4 py-2 bg-emerald-600 rounded hover:bg-emerald-700"
                        >
                            + 新增監控
                        </button>
                    </div>

                    <div className="space-y-4">
                        {monitors.map((monitor) => (
                            <div
                                key={monitor.id}
                                className="p-4 bg-gray-800 rounded-lg border border-gray-700"
                            >
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex gap-4">
                                        {/* 類型 */}
                                        <select
                                            value={monitor.type}
                                            onChange={(e) =>
                                                updateMonitor(monitor.id, {
                                                    type: e.target.value as "rent" | "sale",
                                                })
                                            }
                                            className="px-3 py-2 bg-gray-700 rounded"
                                        >
                                            <option value="sale">出售</option>
                                            <option value="rent">租屋</option>
                                        </select>

                                        {/* 啟用狀態 */}
                                        <label className="flex items-center gap-2">
                                            <input
                                                type="checkbox"
                                                checked={monitor.isActive}
                                                onChange={(e) =>
                                                    updateMonitor(monitor.id, {
                                                        isActive: e.target.checked,
                                                    })
                                                }
                                                className="w-4 h-4"
                                            />
                                            <span>啟用</span>
                                        </label>
                                    </div>

                                    <button
                                        onClick={() => deleteMonitor(monitor.id)}
                                        className="text-red-400 hover:text-red-300"
                                    >
                                        刪除
                                    </button>
                                </div>

                                {/* 區域選擇 */}
                                <div className="mb-4">
                                    <label className="block text-sm text-gray-400 mb-2">
                                        監控區域
                                    </label>
                                    <div className="flex flex-wrap gap-2">
                                        {REGIONS.map((region) => (
                                            <button
                                                key={region}
                                                onClick={() => {
                                                    const newRegions = monitor.regions.includes(region)
                                                        ? monitor.regions.filter((r) => r !== region)
                                                        : [...monitor.regions, region];
                                                    updateMonitor(monitor.id, { regions: newRegions });
                                                }}
                                                className={`px-3 py-1 rounded text-sm ${monitor.regions.includes(region)
                                                    ? "bg-emerald-600"
                                                    : "bg-gray-700 hover:bg-gray-600"
                                                    }`}
                                            >
                                                {region}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* 價格區間 */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm text-gray-400 mb-1">
                                            最低價格 (萬)
                                        </label>
                                        <input
                                            type="number"
                                            value={monitor.priceMin || ""}
                                            onChange={(e) =>
                                                updateMonitor(monitor.id, {
                                                    priceMin: Number(e.target.value),
                                                })
                                            }
                                            className="w-full px-3 py-2 bg-gray-700 rounded border border-gray-600"
                                            placeholder="0"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm text-gray-400 mb-1">
                                            最高價格 (萬)
                                        </label>
                                        <input
                                            type="number"
                                            value={monitor.priceMax || ""}
                                            onChange={(e) =>
                                                updateMonitor(monitor.id, {
                                                    priceMax: Number(e.target.value),
                                                })
                                            }
                                            className="w-full px-3 py-2 bg-gray-700 rounded border border-gray-600"
                                            placeholder="不限"
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}

                        {monitors.length === 0 && (
                            <div className="text-center text-gray-500 py-12">
                                尚無監控設定，點擊「新增監控」開始使用
                            </div>
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
}
