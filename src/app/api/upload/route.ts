import { NextRequest, NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';
import { getAuthUser } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import ImageCreation from '@/models/ImageCreation';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const user = await User.findById(authUser.id).lean() as { _id: string; name?: string; email?: string } | null;
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const folder = formData.get('folder') as string || 'uploads';

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp', 'image/svg+xml'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Allowed: PNG, JPG, GIF, WebP, SVG' },
        { status: 400 }
      );
    }

    // Validate file size (50MB max)
    const maxSize = 50 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File too large. Maximum 50MB allowed.' },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Upload to Cloudinary
    const result = await new Promise<{ secure_url: string; public_id: string; width: number; height: number; format: string; bytes: number }>((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          folder: `fayapoint/${folder}/${user._id}`,
          resource_type: 'image',
          allowed_formats: ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'],
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result as { secure_url: string; public_id: string; width: number; height: number; format: string; bytes: number });
        }
      ).end(buffer);
    });

    // Check if we should save to gallery (for POD designs and uploads)
    const saveToGallery = formData.get('saveToGallery') === 'true';
    const description = formData.get('description') as string || file.name;
    
    let imageRecord = null;
    if (saveToGallery) {
      // Save to ImageCreation for gallery tracking
      imageRecord = await ImageCreation.create({
        userId: user._id,
        userName: user.name || 'Anônimo',
        prompt: description,
        imageUrl: result.secure_url,
        publicId: result.public_id,
        provider: 'upload',
        isPublic: false,
        category: 'general',
        tags: [],
      });
    }

    return NextResponse.json({
      success: true,
      url: result.secure_url,
      publicId: result.public_id,
      width: result.width,
      height: result.height,
      format: result.format,
      size: result.bytes,
      imageId: imageRecord?._id?.toString(),
    });

  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    );
  }
}

// DELETE - Remove uploaded file
export async function DELETE(request: NextRequest) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const user = await User.findById(authUser.id).lean() as { _id: string; name?: string; email?: string } | null;
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const publicId = searchParams.get('publicId');

    if (!publicId) {
      return NextResponse.json({ error: 'publicId required' }, { status: 400 });
    }

    // Verify the file belongs to the user (public_id contains user ID)
    if (!publicId.includes(user._id.toString())) {
      return NextResponse.json({ error: 'Not authorized to delete this file' }, { status: 403 });
    }

    await cloudinary.uploader.destroy(publicId);

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Delete error:', error);
    return NextResponse.json(
      { error: 'Failed to delete file' },
      { status: 500 }
    );
  }
}
