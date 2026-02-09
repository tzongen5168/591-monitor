import { NextResponse } from "next/server";

export async function GET() {
    const key = process.env.FIREBASE_ADMIN_KEY;

    return NextResponse.json({
        exists: !!key,
        length: key ? key.length : 0,
        preview: key ? `${key.substring(0, 20)}...${key.substring(key.length - 20)}` : null,
        node_env: process.env.NODE_ENV,
    });
}
