import { createServerClient, type CookieOptions } from "@supabase/ssr"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// Custom function to safely handle base64 cookies
function safeHandleCookieValue(value: string | undefined): string | undefined {
  if (!value) return value;
  
  // If it's a base64 cookie, return it properly without parsing
  if (value && value.startsWith('base64-')) {
    try {
      // We return the raw value, proper decoding will be handled internally
      return value;
    } catch (error) {
      console.error('Error handling base64 cookie:', error);
      return undefined;
    }
  }
  
  return value;
}

export async function proxy(request: NextRequest) {
  try {
    let response = NextResponse.next({
      request: {
        headers: request.headers,
      },
    })

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            try {
              const value = request.cookies.get(name)?.value;
              return safeHandleCookieValue(value);
            } catch (error) {
              console.error(`Error getting cookie ${name}:`, error);
              return undefined;
            }
          },
          set(name: string, value: string, options: CookieOptions) {
            try {
              response.cookies.set(name, value, options);
            } catch (error) {
              console.error(`Error setting cookie ${name}:`, error);
            }
          },
          remove(name: string, options: CookieOptions) {
            try {
              response.cookies.delete(name);
            } catch (error) {
              console.error(`Error removing cookie ${name}:`, error);
            }
          },
        },
      }
    )

    try {
      const { data: { user } } = await supabase.auth.getUser();

      // Define public routes that don't require authentication
      const publicRoutes = [
        "/",
        "/login",
        "/auth",
        "/blogs",
        "/docs",
        "/privacy",
        "/terms",
        "/pricing"
      ];

      const isPublicRoute = publicRoutes.some(route => 
        request.nextUrl.pathname === route || 
        request.nextUrl.pathname.startsWith(`${route}/`)
      );

      // If user is not signed in and the current path is not a public route,
      // redirect the user to /login
      if (!user && !isPublicRoute) {
        const redirectUrl = request.nextUrl.clone()
        redirectUrl.pathname = "/login"
        redirectUrl.searchParams.set("redirectedFrom", request.nextUrl.pathname)
        return NextResponse.redirect(redirectUrl)
      }

      // If user is signed in and the current path is /login,
      // redirect the user to /dashboard
      if (user && request.nextUrl.pathname.startsWith("/login")) {
        return NextResponse.redirect(new URL("/dashboard", request.url))
      }
    } catch (error) {
      console.error("Auth error in middleware:", error);
      // On error, allow the request to proceed but don't perform redirects
    }

    return response;
  } catch (error) {
    console.error("Middleware error:", error);
    // If there's an error in the middleware itself, just proceed with the request
    return NextResponse.next();
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
}
