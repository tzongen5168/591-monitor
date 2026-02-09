import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

/**
 * LINE Messaging API Webhook
 *
 * 處理用戶加好友事件，自動綁定 LINE userId 到 Firebase
 *
 * 環境變數：
 * - LINE_CHANNEL_SECRET
 * - FIREBASE_ADMIN_KEY (JSON string)
 */

const CHANNEL_SECRET = process.env.LINE_CHANNEL_SECRET || "";

// 驗證 LINE 簽名
function verifySignature(body: string, signature: string): boolean {
    const hash = crypto
        .createHmac("sha256", CHANNEL_SECRET)
        .update(body)
        .digest("base64");
    return hash === signature;
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

        for (const event of events) {
            if (event.type === "follow") {
                // 用戶加好友事件
                const lineUserId = event.source.userId;
                console.log(`New follower: ${lineUserId}`);

                // TODO: 這裡需要串接 Firebase Admin SDK 來更新用戶資料
                // 由於 Next.js API Route 無法直接使用 Admin SDK，
                // 建議透過 Cloud Functions 或獨立的後端服務處理
                //
                // 方案 1: 用戶在 Dashboard 輸入綁定碼
                // 方案 2: 用戶發送包含 email 的訊息來綁定
                // 方案 3: 透過 Cloud Functions 處理
            }

            if (event.type === "message" && event.message.type === "text") {
                const lineUserId = event.source.userId;
                const text = event.message.text;

                // 如果用戶發送 email 格式的訊息，嘗試綁定
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (emailRegex.test(text.trim())) {
                    console.log(`Bind request: ${lineUserId} -> ${text.trim()}`);
                    // TODO: 查詢 Firebase 中該 email 的用戶並綁定 lineUserId
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
