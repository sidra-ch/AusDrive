import { createHash } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const formData = (await req.formData()) as any;
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (!cloudName || !apiKey || !apiSecret) {
      return NextResponse.json({ error: "Cloudinary not configured" }, { status: 500 });
    }

    // Convert file to base64 for a signed server-side Cloudinary upload.
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64 = buffer.toString("base64");
    const dataURI = `data:${file.type};base64,${base64}`;

    const folder = "ausdrive-cars";
    const timestamp = Math.round(Date.now() / 1000);
    const signaturePayload = `folder=${folder}&timestamp=${timestamp}${apiSecret}`;
    const signature = createHash("sha256")
      .update(signaturePayload)
      .digest("hex");

    // Upload to Cloudinary
    const uploadFormData = new FormData();
    uploadFormData.append("file", dataURI);
    uploadFormData.append("timestamp", timestamp.toString());
    uploadFormData.append("api_key", apiKey);
    uploadFormData.append("signature", signature);
    uploadFormData.append("folder", folder);

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      {
        method: "POST",
        body: uploadFormData,
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Cloudinary error:", errorText);

      let message = "Upload failed";
      try {
        const parsed = JSON.parse(errorText) as { error?: { message?: string } };
        message = parsed.error?.message || message;
      } catch {
        if (errorText.trim()) {
          message = errorText;
        }
      }

      return NextResponse.json({ error: message }, { status: response.status || 500 });
    }

    const data = await response.json();

    return NextResponse.json({
      url: data.secure_url,
      publicId: data.public_id,
      width: data.width,
      height: data.height,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Upload failed" }, { status: 500 });
  }
}
