import { NextResponse } from "next/server"

export const runtime = "edge"

export async function POST(request: Request) {
  try {
    const json = await request.json()

    const upstreamRes = await fetch("https://437ae64f64f6.ngrok-free.app/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(json),
    })

    const data = await upstreamRes.json()

    return NextResponse.json(data, {
      status: upstreamRes.status,
    })
  } catch (err) {
    console.error("/api/generate proxy error", err)
    return NextResponse.json({ message: "Proxy error" }, { status: 500 })
  }
} 