import { NextRequest, NextResponse } from "next/server";
import imagekit from "@/lib/imagekit";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const authenticationParameters = imagekit.getAuthenticationParameters();
    
    return NextResponse.json(authenticationParameters, { status: 200 });
  } catch (error) {
    console.error("Upload auth error", error);
    return NextResponse.json(
      { error: "Failed to get upload authentication" },
      { status: 500 }
    );
  }
}