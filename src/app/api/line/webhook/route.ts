import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

/**
 * LINE Messaging API Webhook
 *
 * 處理用戶加好友和訊息事件，綁定 LINE userId 到 Firebase
 *
 * 綁定流程：
 * 1. 用戶在網站登入（使用 Google）
 * 2. 用戶在 LINE 加官方帳號好友
 * 3. 用戶在 LINE 發送自己的 Email
 * 4. 系統自動將 LINE userId 綁定到對應的 Firebase 用戶
 */

const CHANNEL_SECRET = process.env.LINE_CHANNEL_SECRET || "";
const CHANNEL_ACCESS_TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN || "";

// 初始化 Firebase Admin
function getFirebaseAdmin() {
    if (getApps().length === 0) {
        // 使用環境變數中的 service account
        const serviceAccountStr = process.env.FIREBASE_ADMIN_KEY;
        if (serviceAccountStr) {
            try {
                const serviceAccount = JSON.parse(serviceAccountStr);
                initializeApp({
                    credential: cert(serviceAccount),
                    projectId: serviceAccount.project_id,
                });
            } catch (error) {
                console.error("Firebase Admin init error:", error);
                throw new Error("Failed to initialize Firebase Admin SDK");
            }
        } else {
            throw new Error("FIREBASE_ADMIN_KEY environment variable is not set");
        }
    }
    return getFirestore();
}

// 驗證 LINE 簽名
function verifySignature(body: string, signature: string): boolean {
    const hash = crypto
        .createHmac("sha256", CHANNEL_SECRET)
        .update(body)
        .digest("base64");
    return hash === signature;
}

// 發送 LINE 訊息
async function replyMessage(replyToken: string, text: string) {
    try {
        await fetch("https://api.line.me/v2/bot/message/reply", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${CHANNEL_ACCESS_TOKEN}`,
            },
            body: JSON.stringify({
                replyToken,
                messages: [{ type: "text", text }],
            }),
        });
    } catch (error) {
        console.error("Reply message error:", error);
    }
}

// 發送推播訊息
async function pushMessage(userId: string, text: string) {
    try {
        await fetch("https://api.line.me/v2/bot/message/push", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${CHANNEL_ACCESS_TOKEN}`,
            },
            body: JSON.stringify({
                to: userId,
                messages: [{ type: "text", text }],
            }),
        });
    } catch (error) {
        console.error("Push message error:", error);
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.text();
        const signature = request.headers.get("x-line-signature") || "";

        // 驗證簽名
        if (!verifySignature(body, signature)) {
            console.error("Invalid LINE webhook signature");
            return NextResponse.json({ error: "Invalid signature" }, { status: 403 });
        }

        const data = JSON.parse(body);
        const events = data.events || [];
        const db = getFirebaseAdmin();

        for (const event of events) {
            const lineUserId = event.source?.userId;
            if (!lineUserId) continue;

            // 用戶加好友事件
            if (event.type === "follow") {
                console.log(`New follower: ${lineUserId}`);
                await pushMessage(
                    lineUserId,
                    "🏠 歡迎使用 591 搶案神器！\n\n" +
                    "請輸入您在網站註冊時使用的 Email 進行綁定，例如：\n" +
                    "example@gmail.com\n\n" +
                    "綁定成功後，當有符合條件的新物件時，我會立即通知您！"
                );
            }

            // 用戶發送訊息
            if (event.type === "message" && event.message.type === "text") {
                const text = event.message.text.trim();
                const replyToken = event.replyToken;

                // 檢查是否為 email 格式
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (emailRegex.test(text)) {
                    const email = text.toLowerCase();
                    console.log(`Bind request: ${lineUserId} -> ${email}`);

                    try {
                        // 查詢該 email 的用戶
                        const usersRef = db.collection("users");
                        const snapshot = await usersRef.where("email", "==", email).get();

                        if (snapshot.empty) {
                            await replyMessage(
                                replyToken,
                                `❌ 找不到使用此 Email 的帳號：${email}\n\n` +
                                "請確認您已在網站上完成註冊，並使用相同的 Email。\n" +
                                "網站：https://591-monitor.vercel.app"
                            );
                        } else {
                            // 找到用戶，更新 lineUserId
                            const userDoc = snapshot.docs[0];
                            await userDoc.ref.update({
                                lineUserId: lineUserId,
                                lineLinkedAt: new Date(),
                            });

                            await replyMessage(
                                replyToken,
                                "✅ 綁定成功！\n\n" +
                                "當有符合您監控條件的新物件時，我會立即通知您。\n\n" +
                                "💡 小提醒：請確認您已在網站上設定好監控區域和價格範圍。"
                            );

                            console.log(`Bound ${lineUserId} to user ${userDoc.id}`);
                        }
                    } catch (error) {
                        console.error("Binding error:", error);
                        await replyMessage(
                            replyToken,
                            "❌ 綁定過程發生錯誤，請稍後再試。"
                        );
                    }
                } else {
                    // 非 Email 格式的訊息
                    await replyMessage(
                        replyToken,
                        "📧 請輸入您在網站註冊時使用的 Email 進行綁定。\n\n" +
                        "例如：example@gmail.com"
                    );
                }
            }
        }

        return NextResponse.json({ status: "ok" });
    } catch (error) {
        console.error("LINE Webhook error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// LINE 會使用 GET 驗證 webhook URL
export async function GET() {
    return NextResponse.json({ status: "LINE Webhook is active" });
}
