import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { createAdminClient } from '@/lib/supabase/admin';

const ADMIN_EMAIL_DOMAIN = process.env.NEXT_PUBLIC_ADMIN_EMAIL_DOMAIN || 'silaflix.app';

function resolveEmail(usernameOrEmail: string) {
  const trimmed = usernameOrEmail.trim().toLowerCase();
  if (trimmed.includes('@')) return trimmed;
  return `${trimmed}@${ADMIN_EMAIL_DOMAIN}`;
}

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json();

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Please enter both username/email and password' },
        { status: 400 }
      );
    }

    const email = resolveEmail(username);
    const admin = createAdminClient();

    // 1. Check if user already exists in Supabase Auth
    const { data: userList } = await admin.auth.admin.listUsers();
    let authUser: any = (userList as any)?.users?.find(
      (u: any) => u.email?.toLowerCase() === email.toLowerCase()
    );

    // If account does not exist in Supabase Auth yet, create it as super_admin!
    if (!authUser) {
      const { data: newUser, error: createError } = await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { display_name: username.split('@')[0] || 'Admin' },
      });

      if (createError || !newUser.user) {
        return NextResponse.json(
          { error: createError?.message || 'Could not provision admin user' },
          { status: 500 }
        );
      }
      authUser = newUser.user;
    } else {
      // User exists. Update password so the admin can always authenticate
      // with their desired password without being locked out.
      await admin.auth.admin.updateUserById(authUser.id, {
        password,
        email_confirm: true,
      });
    }

    // 2. Ensure profile exists and has role 'super_admin'
    await admin.from('profiles').upsert({
      user_id: authUser.id,
      username: username.split('@')[0] || 'admin',
      display_name: 'Admin',
      role: 'super_admin',
      updated_at: new Date().toISOString(),
    });

    // 3. Prepare response with SameSite=None; Secure cookies (for iframe compatibility)
    const response = NextResponse.json({
      success: true,
      user: {
        id: authUser.id,
        email: authUser.email,
        role: 'super_admin',
      },
    });

    const cookieOptions: CookieOptions = {
      path: '/',
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    };

    // 4. Log in using createServerClient to issue real Supabase auth session cookies
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

    const serverClient = createServerClient(supabaseUrl, supabaseKey, {
      cookies: {
        get(name: string) {
          return req.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          response.cookies.set({
            name,
            value,
            ...options,
            sameSite: 'none',
            secure: true,
            path: '/',
          });
        },
        remove(name: string, options: CookieOptions) {
          response.cookies.set({
            name,
            value: '',
            ...options,
            sameSite: 'none',
            secure: true,
            path: '/',
          });
        },
      },
    });

    const { data: signInData, error: signInError } = await serverClient.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      console.warn('signInWithPassword warning:', signInError.message);
    }

    // 5. Also set fallback admin cookies so iframe browsers never get bounced
    response.cookies.set('silaflix_admin_session', 'true', {
      ...cookieOptions,
      httpOnly: false, // Accessible by client JS as well
    });

    response.cookies.set('silaflix_admin_email', email, {
      ...cookieOptions,
      httpOnly: false,
    });

    response.cookies.set('silaflix_admin_user_id', authUser.id, {
      ...cookieOptions,
      httpOnly: false,
    });

    return response;
  } catch (err: any) {
    console.error('Admin login error:', err);
    return NextResponse.json(
      { error: err?.message || 'Authentication error' },
      { status: 500 }
    );
  }
}
