import { SignJWT, jwtVerify } from 'jose';

export async function POST(request) {
  const formData = await request.formData();
  const password = formData.get('password');
  
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminPassword || password !== adminPassword) {
    // Incorrect password or missing env var
    return new Response(null, {
      status: 303,
      headers: { Location: '/admin/login?error=1' },
    });
  }

  // Create JWT session
  const secret = new TextEncoder().encode(adminPassword);
  const jwt = await new SignJWT({ admin: true })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('14d')
    .sign(secret);

  // Set cookie
  const response = new Response(null, {
    status: 303,
    headers: { Location: '/admin' },
  });

  response.headers.append(
    'Set-Cookie',
    `admin_session=${jwt}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${14 * 24 * 60 * 60}`
  );

  return response;
}
