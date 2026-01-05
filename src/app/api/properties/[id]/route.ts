import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createClient as createServerClient } from "@/lib/supabase/server";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { ...propertyData } = body;

    // Validate required fields
    if (
      !propertyData.title ||
      !propertyData.address ||
      !propertyData.city ||
      !propertyData.price
    ) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Check if property exists and belongs to user
    const { data: existingProperty, error: fetchError } = await supabaseAdmin
      .from("properties")
      .select("owner_id")
      .eq("id", id)
      .single();

    if (fetchError || !existingProperty) {
      return NextResponse.json(
        { error: "Property not found" },
        { status: 404 }
      );
    }

    if (existingProperty.owner_id !== user.id) {
      return NextResponse.json(
        { error: "Unauthorized. You can only edit your own properties." },
        { status: 403 }
      );
    }

    // Ensure images_360 is always an array
    const updateData: any = {
      ...propertyData,
      updated_at: new Date().toISOString(),
      // Reset status to pending if significant changes were made
      status:
        existingProperty.status === "approved"
          ? "pending"
          : existingProperty.status,
    };

    // Always include images_360 - ensure it's an array
    if (propertyData.images_360 !== undefined) {
      updateData.images_360 = Array.isArray(propertyData.images_360)
        ? propertyData.images_360
        : propertyData.images_360
          ? [propertyData.images_360]
          : [];
    }

    console.log("📝 Updating property with images_360:", {
      property_id: id,
      images_360_count: updateData.images_360?.length || 0,
      images_360: updateData.images_360,
    });

    // Update property
    const { data, error } = await supabaseAdmin
      .from("properties")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Property update error:", error);
      return NextResponse.json(
        { error: `Failed to update property: ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, property: data });
  } catch (error) {
    console.error("Property update API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data, error } = await supabaseAdmin
      .from("properties")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      return NextResponse.json(
        { error: "Property not found" },
        { status: 404 }
      );
    }

    // Check if user owns the property
    if (data.owner_id !== user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    return NextResponse.json({ success: true, property: data });
  } catch (error) {
    console.error("Property fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
