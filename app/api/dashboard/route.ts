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
    
    // Get all memories for timeline
    const memories = await Memory.find({ userId: session.user.id })
      .sort({ createdAt: -1 });

    // Get unique locations for map
    const locations = memories
      .filter(memory => memory.location)
      .map(memory => ({
        id: memory._id,
        title: memory.title,
        location: memory.location,
        type: memory.type,
        createdAt: memory.createdAt
      }));

    // Get statistics
    const stats = {
      totalMemories: memories.length,
      totalImages: memories.reduce((acc, memory) => acc + (memory.images?.length || 0), 0),
      totalVideos: memories.reduce((acc, memory) => acc + (memory.videos?.length || 0), 0),
      locationsVisited: locations.length,
    };

    return NextResponse.json({
      memories,
      locations,
      stats
    }, { status: 200 });
  } catch (error) {
    console.error("Dashboard data error", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard data" },
      { status: 500 }
    );
  }
}
