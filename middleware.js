import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

export async function middleware(request) {
  const { pathname } = request.nextUrl;
  
  if (pathname.startsWith('/admin') && !pathname.startsWith('/admin/login')) {
    const session = request.cookies.get('admin_session')?.value;
    
    if (!session) {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }
    
    try {
      const adminPassword = process.env.ADMIN_PASSWORD || '';
      const secret = new TextEncoder().encode(adminPassword);
      await jwtVerify(session, secret);
      return NextResponse.next();
    } catch (error) {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }
  }
  
  return NextResponse.next();
}
