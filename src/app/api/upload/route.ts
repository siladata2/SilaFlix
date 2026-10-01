import { NextResponse, type NextRequest } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const folder = (formData.get('folder') as string) || 'uploads';

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    // Generate safe unique filename
    const ext = file.name.split('.').pop()?.toLowerCase() || 'bin';
    const cleanBase = file.name
      .replace(/\.[^/.]+$/, '')
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-');
    const path = `${folder}/${cleanBase}-${Date.now()}.${ext}`;

    const admin = createAdminClient();
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to Supabase Storage "media" bucket
    const { data: uploadData, error: uploadError } = await admin.storage
      .from('media')
      .upload(path, buffer, {
        contentType: file.type || 'application/octet-stream',
        upsert: true,
      });

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }

    const { data: urlData } = admin.storage.from('media').getPublicUrl(uploadData.path);

    return NextResponse.json({
      url: urlData.publicUrl,
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type,
      path: uploadData.path,
    });
  } catch (err: any) {
    console.error('Upload handler error:', err);
    return NextResponse.json({ error: err.message || 'Upload failed' }, { status: 500 });
  }
}
