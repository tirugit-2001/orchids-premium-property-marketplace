import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const user_id = formData.get("user_id") as string;
    const property_id = formData.get("property_id") as string;

    if (!file || !user_id) {
      return NextResponse.json(
        { error: "File and user_id required" },
        { status: 400 }
      );
    }

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/gif",
      "image/x-exr",
      "image/exr",
    ];
    const allowedExtensions = ["jpg", "jpeg", "png", "webp", "gif", "exr"];
    const fileExt = file.name.split(".").pop()?.toLowerCase();

    // Check MIME type or file extension (for .exr which might not have proper MIME type)
    if (
      !allowedTypes.includes(file.type) &&
      !(fileExt && allowedExtensions.includes(fileExt))
    ) {
      return NextResponse.json(
        {
          error:
            "Invalid file type. Allowed: JPEG, PNG, WebP, GIF, EXR. Note: EXR files may need conversion for web display.",
        },
        { status: 400 }
      );
    }

    // For EXR files, use a generic image MIME type or the detected extension
    let contentType = file.type;
    if (fileExt === "exr" && !contentType) {
      contentType = "image/x-exr";
    }

    const maxSize = 500 * 1024 * 1024; // 500MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "File too large. Maximum 500MB allowed" },
        { status: 400 }
      );
    }

    // Ensure fileExt is defined
    if (!fileExt) {
      return NextResponse.json({ error: "Invalid file name" }, { status: 400 });
    }

    const fileName = `${user_id}/${property_id || "temp"}/${Date.now()}.${fileExt}`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { data, error } = await supabase.storage
      .from("property-images")
      .upload(fileName, buffer, {
        contentType: contentType || file.type,
        upsert: false,
      });

    if (error) {
      console.error("Upload error:", error);
      return NextResponse.json(
        { error: "Failed to upload image" },
        { status: 500 }
      );
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from("property-images").getPublicUrl(data.path);

    return NextResponse.json({
      success: true,
      url: publicUrl,
      path: data.path,
    });
  } catch (error) {
    console.error("Image upload error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const path = searchParams.get("path");

    if (!path) {
      return NextResponse.json({ error: "Path required" }, { status: 400 });
    }

    const { error } = await supabase.storage
      .from("property-images")
      .remove([path]);

    if (error) {
      console.error("Delete error:", error);
      return NextResponse.json(
        { error: "Failed to delete image" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Image delete error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
