import { createClient } from '@/lib/supabase';

export interface UploadResult {
  url: string;
  path: string;
  fileId?: string;
  error?: string;
}

export async function uploadFile(
  file: File,
  orderId: string,
  fileType: 'statement' | 'previous',
  userId?: string | null,
  guestEmail?: string | null,
  guestName?: string | null
): Promise<UploadResult> {
  console.log('🚀 Starting file upload...');
  console.log('📁 File:', file.name, 'Size:', file.size, 'bytes');
  console.log('📦 Order ID:', orderId);
  console.log('🏷️ File type:', fileType);

  const supabase = createClient();

  // Validate file size (10MB max)
  const maxSize = 10 * 1024 * 1024; // 10MB in bytes
  if (file.size > maxSize) {
    console.error('❌ File too large:', file.size, 'bytes');
    return {
      url: '',
      path: '',
      error: 'Filen är för stor. Maximal filstorlek är 10MB.',
    };
  }
  console.log('✅ File size OK');

  // Validate file type
  const allowedTypes = {
    statement: [
      'application/pdf',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/csv',
    ],
    previous: [
      'application/pdf',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/csv',
    ],
  };

  console.log('🔍 File MIME type:', file.type);
  if (!allowedTypes[fileType].includes(file.type)) {
    console.error('❌ Invalid file type:', file.type);
    return {
      url: '',
      path: '',
      error: `Ogiltigt filformat. Tillåtna format: PDF, Excel, CSV`,
    };
  }
  console.log('✅ File type OK');

  // Generate unique filename
  const timestamp = Date.now();
  const fileExt = file.name.split('.').pop();
  const sanitizedName = file.name
    .replace(/[^a-zA-Z0-9.-]/g, '_')
    .substring(0, 50);
  const fileName = `${timestamp}_${sanitizedName}`;
  const filePath = `${orderId}/${fileType}s/${fileName}`;

  console.log('📝 Generated file path:', filePath);

  try {
    console.log('☁️ Uploading to Supabase Storage...');
    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('order-files')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      console.error('❌ Upload error:', error);
      return {
        url: '',
        path: '',
        error: `Uppladdning misslyckades: ${error.message}`,
      };
    }

    console.log('✅ Upload successful!', data);

    // Get public URL
    console.log('🔗 Getting public URL...');
    const { data: urlData } = supabase.storage
      .from('order-files')
      .getPublicUrl(filePath);

    console.log('✅ Got public URL:', urlData.publicUrl);

    // Save file metadata to database
    console.log('💾 Saving file metadata to database...');
    const { data: fileRecord, error: dbError } = await supabase
      .from('files')
      .insert({
        order_id: null, // Will be linked later when order is created
        user_id: userId || null,
        file_type: fileType,
        file_name: file.name,
        file_path: filePath,
        file_url: urlData.publicUrl,
        file_size: file.size,
        mime_type: file.type,
        guest_email: guestEmail || null,
        guest_name: guestName || null,
      })
      .select('id')
      .single();

    if (dbError) {
      console.error('⚠️ Database save error (file uploaded but not tracked):', dbError);
      // File is uploaded successfully, but we couldn't track it in DB
      // Return success anyway so user can continue
    } else {
      console.log('✅ File metadata saved! File ID:', fileRecord?.id);
    }

    return {
      url: urlData.publicUrl,
      path: filePath,
      fileId: fileRecord?.id,
    };
  } catch (error) {
    console.error('❌ Unexpected upload error:', error);
    return {
      url: '',
      path: '',
      error: 'Ett oväntat fel uppstod vid uppladdning.',
    };
  }
}

export function generateOrderId(): string {
  return `temp_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
}
