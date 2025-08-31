import { NextResponse } from "next/server"

export const runtime = "edge"

// POST /api/transcribe
export async function POST(request: Request) {
  try {
    const formData = await request.formData()

    const upstreamRes = await fetch("https://9d87def518cb.ngrok-free.app/transcribe", {
      method: "POST",
      body: formData,
    })

    const contentType = upstreamRes.headers.get("content-type") || "application/json"
    const body = await upstreamRes.arrayBuffer()

    return new NextResponse(body, {
      status: upstreamRes.status,
      headers: {
        "content-type": contentType,
      },
    })
  } catch (err) {
    console.error("/api/transcribe proxy error", err)
    return NextResponse.json({ message: "Proxy error" }, { status: 500 })
  }
} 