import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createClient as createServerClient } from "@/lib/supabase/server";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Verify admin access
async function verifyAdmin(userId: string) {
  const { data: profile, error } = await supabaseAdmin
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .single();

  if (error || !profile || profile.role !== "admin") {
    return false;
  }
  return true;
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const isAdmin = await verifyAdmin(user.id);
    if (!isAdmin) {
      return NextResponse.json(
        { error: "Forbidden. Admin access required." },
        { status: 403 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from("profiles")
      .select("*")
      .eq("verification_status", "pending")
      .eq("role", "owner")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Fetch error:", error);
      return NextResponse.json(
        { error: "Failed to fetch verifications" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, verifications: data || [] });
  } catch (error) {
    console.error("Get verifications error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const isAdmin = await verifyAdmin(user.id);
    if (!isAdmin) {
      return NextResponse.json(
        { error: "Forbidden. Admin access required." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { userId, action, rejectionReason } = body;

    if (!userId || !action) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    if (action !== "approve" && action !== "reject") {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    if (action === "reject" && !rejectionReason) {
      return NextResponse.json(
        { error: "Rejection reason is required" },
        { status: 400 }
      );
    }

    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (action === "approve") {
      // Set verification_status to null when approved (constraint may not allow 'verified')
      // Use is_verified boolean to track verification state
      updateData.verification_status = null;
      updateData.is_verified = true;
    } else {
      updateData.verification_status = "rejected";
      updateData.is_verified = false;
    }

    // Update without verification_rejection_reason first (in case column doesn't exist)
    let updatedProfile = null;
    const { data, error } = await supabaseAdmin
      .from("profiles")
      .update(updateData)
      .eq("id", userId)
      .select()
      .single();

    if (error) {
      // If error is specifically about missing verification_rejection_reason column, ignore it
      // Otherwise, it's a real error
      if (!error.message?.includes("verification_rejection_reason")) {
        console.error("Update error:", error);
        return NextResponse.json(
          {
            error: `Failed to ${action} verification: ${error.message}`,
          },
          { status: 500 }
        );
      }
      // If it's about the missing column, try to fetch the updated profile anyway
      const { data: profileData } = await supabaseAdmin
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (profileData) {
        updatedProfile = profileData;
      } else {
        return NextResponse.json(
          {
            error: `Failed to ${action} verification`,
          },
          { status: 500 }
        );
      }
    } else {
      updatedProfile = data;
    }

    // Optionally try to update rejection_reason separately if rejecting
    // (This will fail silently if column doesn't exist)
    if (action === "reject" && rejectionReason) {
      try {
        await supabaseAdmin
          .from("profiles")
          .update({ verification_rejection_reason: rejectionReason })
          .eq("id", userId);
      } catch (err) {
        // Ignore - column may not exist
        console.warn(
          "Could not update rejection reason (column may not exist)"
        );
      }
    }

    // Create notification for the user (if notifications table exists)
    try {
      const { error: notifError } = await supabaseAdmin
        .from("notifications")
        .insert({
          user_id: userId,
          type: action === "approve" ? "property_approved" : "general",
          title:
            action === "approve"
              ? "Verification Approved"
              : "Verification Rejected",
          message:
            action === "approve"
              ? "Your owner verification has been approved. You can now list properties."
              : `Your verification was rejected. Reason: ${rejectionReason || "Please check your documents and try again."}`,
          link: "/dashboard/verify",
          is_read: false,
        });

      if (notifError) {
        console.error(
          "Notification creation error (non-critical):",
          notifError
        );
        // Continue even if notification creation fails
      }
    } catch (err) {
      console.error("Notification creation error (non-critical):", err);
      // Continue even if notification creation fails
    }

    return NextResponse.json({
      success: true,
      message: `Verification ${action}d successfully`,
      profile: updatedProfile,
    });
  } catch (error) {
    console.error("Verification action error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
