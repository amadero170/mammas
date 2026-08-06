import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const next = requestUrl.searchParams.get('next')
  const errorParam = requestUrl.searchParams.get('error')
  const errorDescription = requestUrl.searchParams.get('error_description')

  console.log('[AUTH_CALLBACK] Received request:', {
    fullUrl: request.url,
    code: code ? 'PRESENT' : 'MISSING',
    next,
    errorParam,
    errorDescription,
  })

  if (errorParam || errorDescription) {
    console.error('[AUTH_CALLBACK] Supabase returned error in URL:', {
      errorParam,
      errorDescription,
    })
    return NextResponse.redirect(
      `${requestUrl.origin}/login?error=Invalid_Token`
    )
  }

  if (code) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (error) {
      console.error(
        '[AUTH_CALLBACK] exchangeCodeForSession error:',
        error.message
      )
      return NextResponse.redirect(
        `${requestUrl.origin}/login?error=Invalid_Token`
      )
    }

    console.log(
      '[AUTH_CALLBACK] Session exchange successful for user:',
      data.user?.id,
      'Email:',
      data.user?.email
    )

    if (next) {
      console.log('[AUTH_CALLBACK] Redirecting user to next path:', next)
      return NextResponse.redirect(`${requestUrl.origin}${next}`)
    }

    console.log('[AUTH_CALLBACK] No next param, redirecting to /')
    return NextResponse.redirect(`${requestUrl.origin}/`)
  }

  console.warn('[AUTH_CALLBACK] No code or error params in request URL')
  return NextResponse.redirect(
    `${requestUrl.origin}/login?error=Invalid_Token`
  )
}

