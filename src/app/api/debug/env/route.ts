import { NextResponse } from "next/server";

export async function GET() {
    let key = process.env.FIREBASE_ADMIN_KEY;
    let isBase64 = false;
    let decodedPreview = null;

    if (key && !key.trim().startsWith("{")) {
        try {
            const decoded = Buffer.from(key, 'base64').toString('utf-8');
            isBase64 = true;
            decodedPreview = `${decoded.substring(0, 20)}...${decoded.substring(decoded.length - 20)}`;
        } catch (e) {
            // Not base64 or failed
        }
    }

    return NextResponse.json({
        exists: !!key,
        length: key ? key.length : 0,
        isBase64,
        preview: key ? `${key.substring(0, 10)}...${key.substring(key.length - 10)}` : null,
        decodedPreview,
        node_env: process.env.NODE_ENV,
    });
}
