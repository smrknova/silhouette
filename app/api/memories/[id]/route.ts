import { connectToDatabase } from "@/lib/db";
import Memory from "@/models/Memory";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();
    
    const memory = await Memory.findOne({
      _id: params.id,
      userId: session.user.id
    });

    if (!memory) {
      return NextResponse.json(
        { error: "Memory not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ memory }, { status: 200 });
  } catch (error) {
    console.error("Get memory error", error);
    return NextResponse.json(
      { error: "Failed to fetch memory" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const updateData = await request.json();

    await connectToDatabase();
    
    const memory = await Memory.findOneAndUpdate(
      { _id: params.id, userId: session.user.id },
      updateData,
      { new: true }
    );

    if (!memory) {
      return NextResponse.json(
        { error: "Memory not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ memory }, { status: 200 });
  } catch (error) {
    console.error("Update memory error", error);
    return NextResponse.json(
      { error: "Failed to update memory" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();
    
    const memory = await Memory.findOneAndDelete({
      _id: params.id,
      userId: session.user.id
    });

    if (!memory) {
      return NextResponse.json(
        { error: "Memory not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: "Memory deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Delete memory error", error);
    return NextResponse.json(
      { error: "Failed to delete memory" },
      { status: 500 }
    );
  }
}
