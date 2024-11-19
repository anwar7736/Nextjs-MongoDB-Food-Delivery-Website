import { NextResponse } from 'next/server';

export function middleware(request) {
  const token = request.cookies.get('restaurant_auth')?.value;
  
  const AuthTryToAccess = request.nextUrl.pathname == '/restaurant';
  if(AuthTryToAccess)
  {
    if(token)
    {
      return NextResponse.redirect(new URL('/restaurant/dashboard', request.url));
    }
  }
  else{
    if(!token)
      {
        return NextResponse.redirect(new URL('/restaurant', request.url));
      }
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: ['/restaurant', '/restaurant/dashboard'],
};
