import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import jwt from 'jsonwebtoken';
import { v2 as cloudinary } from 'cloudinary';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';

const JWT_SECRET = process.env.JWT_SECRET || '';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

export async function POST(request: Request) {
  try {
    await dbConnect();

    const headersList = await headers();
    const authHeader = headersList.get('authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let decoded: any;

    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
    }

    const user = await User.findById(decoded.id);
    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    const formData = await request.formData();
    const file = formData.get('avatar') as File;

    if (!file) {
      return NextResponse.json({ error: 'Nenhuma imagem enviada' }, { status: 400 });
    }

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      return NextResponse.json({ 
        error: 'Formato inválido. Use JPG, PNG, WebP ou GIF.' 
      }, { status: 400 });
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ 
        error: 'Imagem muito grande. Máximo 5MB.' 
      }, { status: 400 });
    }

    // Convert file to base64
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64 = `data:${file.type};base64,${buffer.toString('base64')}`;

    // Upload to Cloudinary
    const uploadResult = await cloudinary.uploader.upload(base64, {
      folder: 'fayapoint/avatars',
      public_id: `user_${user._id}`,
      overwrite: true,
      transformation: [
        { width: 400, height: 400, crop: 'fill', gravity: 'face' },
        { quality: 'auto', fetch_format: 'auto' }
      ]
    });

    // Delete old image if exists and is from Cloudinary
    if (user.image && user.image.includes('cloudinary')) {
      try {
        const oldPublicId = user.image.split('/').slice(-2).join('/').split('.')[0];
        await cloudinary.uploader.destroy(oldPublicId);
      } catch (e) {
        console.log('Could not delete old avatar:', e);
      }
    }

    // Update user with new image URL
    user.image = uploadResult.secure_url;
    await user.save();

    return NextResponse.json({
      success: true,
      imageUrl: uploadResult.secure_url,
      message: 'Avatar atualizado com sucesso!'
    });

  } catch (error) {
    console.error('Avatar upload error:', error);
    return NextResponse.json(
      { error: 'Erro ao fazer upload do avatar' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    await dbConnect();

    const headersList = await headers();
    const authHeader = headersList.get('authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let decoded: any;

    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
    }

    const user = await User.findById(decoded.id);
    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    // Delete from Cloudinary if exists
    if (user.image && user.image.includes('cloudinary')) {
      try {
        const publicId = `fayapoint/avatars/user_${user._id}`;
        await cloudinary.uploader.destroy(publicId);
      } catch (e) {
        console.log('Could not delete avatar from Cloudinary:', e);
      }
    }

    // Remove image from user
    user.image = undefined;
    await user.save();

    return NextResponse.json({
      success: true,
      message: 'Avatar removido com sucesso!'
    });

  } catch (error) {
    console.error('Avatar delete error:', error);
    return NextResponse.json(
      { error: 'Erro ao remover avatar' },
      { status: 500 }
    );
  }
}
