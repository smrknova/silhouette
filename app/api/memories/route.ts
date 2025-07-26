import { connectToDatabase } from "@/lib/db";
import Memory from "@/models/Memory";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();
    
    const memories = await Memory.find({ userId: session.user.id })
      .sort({ createdAt: -1 });

    return NextResponse.json({ memories }, { status: 200 });
  } catch (error) {
    console.error("Get memories error", error);
    return NextResponse.json(
      { error: "Failed to fetch memories" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const {
      title,
      description,
      content,
      type,
      images,
      videos,
      location,
      tags,
      isPublic
    } = await request.json();

    if (!title || !type) {
      return NextResponse.json(
        { error: "Title and type are required" },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const memory = await Memory.create({
      userId: session.user.id,
      title,
      description,
      content,
      type,
      images: images || [],
      videos: videos || [],
      location,
      tags: tags || [],
      isPublic: isPublic || false,
    });

    return NextResponse.json({ memory }, { status: 201 });
  } catch (error) {
    console.error("Create memory error", error);
    return NextResponse.json(
      { error: "Failed to create memory" },
      { status: 500 }
    );
  }
}