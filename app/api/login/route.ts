import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as
    | {
        email?: string;
        password?: string;
      }
    | null;

  const email = body?.email?.trim().toLowerCase();
  const password = body?.password ?? "";

  if (!email || !password) {
    return NextResponse.json({ error: "Missing credentials" }, { status: 400 });
  }

  const csrfResponse = await fetch(new URL("/api/auth/csrf", request.url), {
    headers: {
      cookie: request.headers.get("cookie") ?? "",
    },
  });

  if (!csrfResponse.ok) {
    return NextResponse.json({ error: "Could not start sign in" }, { status: 500 });
  }

  const csrfJson = (await csrfResponse.json()) as { csrfToken?: string };
  const callbackResponse = await fetch(new URL("/api/auth/callback/credentials", request.url), {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      cookie: csrfResponse.headers.get("set-cookie") ?? request.headers.get("cookie") ?? "",
    },
    body: new URLSearchParams({
      csrfToken: csrfJson.csrfToken ?? "",
      email,
      password,
      json: "true",
    }),
    redirect: "manual",
  });

  if (!callbackResponse.ok) {
    return NextResponse.json({ error: "Invalid owner credentials" }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true, redirectTo: "/dashboard" });
  callbackResponse.headers.getSetCookie().forEach((cookie) => {
    response.headers.append("Set-Cookie", cookie);
  });

  return response;
}
