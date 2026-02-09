import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

/**
 * 建立綠界 ECPay 訂單
 *
 * 注意：實際部署時需設定環境變數：
 * - ECPAY_MERCHANT_ID
 * - ECPAY_HASH_KEY
 * - ECPAY_HASH_IV
 * - NEXT_PUBLIC_BASE_URL
 */

const ECPAY_API_URL =
    process.env.NODE_ENV === "production"
        ? "https://payment.ecpay.com.tw/Cashier/AioCheckOut/V5"
        : "https://payment-stage.ecpay.com.tw/Cashier/AioCheckOut/V5";

const MERCHANT_ID = process.env.ECPAY_MERCHANT_ID || "2000132";
const HASH_KEY = process.env.ECPAY_HASH_KEY || "5294y06JbISpM5x9";
const HASH_IV = process.env.ECPAY_HASH_IV || "v77hoKGq4kWxNNIS";
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

// 方案價格
const PLAN_PRICES: Record<string, number> = {
    standard: 149,
    pro: 299,
    unlimited: 599,
};

// 產生 CheckMacValue
function generateCheckMac(params: Record<string, string>): string {
    // 1. 依照 key 排序
    const sorted = Object.keys(params)
        .sort()
        .map((key) => `${key}=${params[key]}`)
        .join("&");

    // 2. 前後加上 HashKey 和 HashIV
    const raw = `HashKey=${HASH_KEY}&${sorted}&HashIV=${HASH_IV}`;

    // 3. URL encode
    const encoded = encodeURIComponent(raw).toLowerCase();

    // 4. MD5 轉大寫
    return crypto.createHash("md5").update(encoded).digest("hex").toUpperCase();
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { planId, userId } = body;

        if (!planId || !userId) {
            return NextResponse.json(
                { error: "Missing planId or userId" },
                { status: 400 }
            );
        }

        const price = PLAN_PRICES[planId];
        if (!price) {
            return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
        }

        // 產生訂單編號
        const timestamp = Date.now();
        const merchantTradeNo = `591_${userId.slice(0, 8)}_${planId}_${timestamp}`;

        // 建立訂單參數
        const now = new Date();
        const merchantTradeDate = now
            .toLocaleString("zh-TW", {
                year: "numeric",
                month: "2-digit",
                day: "2-digit",
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
                hour12: false,
            })
            .replace(/\//g, "/");

        const params: Record<string, string> = {
            MerchantID: MERCHANT_ID,
            MerchantTradeNo: merchantTradeNo.slice(0, 20), // 最多 20 字
            MerchantTradeDate: merchantTradeDate,
            PaymentType: "aio",
            TotalAmount: String(price),
            TradeDesc: "591搶案神器訂閱",
            ItemName: `591搶案神器 ${planId} 方案`,
            ReturnURL: `${BASE_URL}/api/ecpay/callback`,
            ChoosePayment: "Credit",
            EncryptType: "1",
        };

        // 產生 CheckMacValue
        params.CheckMacValue = generateCheckMac(params);

        // 產生 HTML 表單 (讓前端自動提交)
        const formHtml = `
      <!DOCTYPE html>
      <html>
        <body onload="document.forms[0].submit()">
          <form method="post" action="${ECPAY_API_URL}">
            ${Object.entries(params)
                .map(
                    ([key, value]) =>
                        `<input type="hidden" name="${key}" value="${value}">`
                )
                .join("")}
          </form>
        </body>
      </html>
    `;

        return new NextResponse(formHtml, {
            headers: { "Content-Type": "text/html" },
        });
    } catch (error) {
        console.error("Checkout error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
