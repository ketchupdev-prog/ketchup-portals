/**
 * GET /api/v1/auth/buffr/callback
 *
 * Purpose: Handle Buffr OAuth callback and return normalized status payload
 * for portal session bridging.
 *
 * Location: src/app/api/v1/auth/buffr/callback/route.ts
 */

import { NextRequest, NextResponse } from 'next/server';
import { getPortalSession } from '@/lib/portal-auth';
import { exchangeCodeWithProvider } from '@/lib/open-banking-client';
import { createAuditLogFromRequest } from '@/lib/services/audit-log-service';
import { consumeOAuthState, persistLinkedToken } from '@/lib/integrations/buffr/persistence';

export async function GET(request: NextRequest) {
  try {
    const session = getPortalSession(request);
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'unauthorized', message: 'Active portal session required' },
        { status: 401 }
      );
    }

    const url = new URL(request.url);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');
    const error = url.searchParams.get('error');

    if (error) {
      return NextResponse.json(
        { success: false, error, message: 'OAuth callback returned an error' },
        { status: 400 }
      );
    }

    if (!code || !state) {
      return NextResponse.json(
        { success: false, error: 'missing_parameters', message: 'code and state are required' },
        { status: 400 }
      );
    }

    const persistedState = await consumeOAuthState(state);
    if (!persistedState) {
      return NextResponse.json(
        { success: false, error: 'invalid_or_consumed_state', message: 'OAuth state is invalid or already used' },
        { status: 400 }
      );
    }

    const tokens = await exchangeCodeWithProvider({
      bankId: persistedState.bankId,
      code,
      redirectUri: persistedState.redirectUri,
      codeVerifier: persistedState.codeVerifier ?? undefined,
    });

    await persistLinkedToken({
      userId: session.userId,
      state,
      bankId: persistedState.bankId,
      tokenType: tokens.token_type,
      expiresIn: tokens.expires_in,
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
    });

    await createAuditLogFromRequest(request, session, {
      action: 'bank.token_exchanged',
      resourceType: 'bank_consent',
      resourceId: state,
      metadata: {
        bankId: persistedState.bankId,
        expiresIn: tokens.expires_in,
        hasRefreshToken: !!tokens.refresh_token,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        state,
        bankId: persistedState.bankId,
        linked: true,
        status: 'linked',
      },
    });
  } catch (e) {
    console.error('[Buffr callback] failed', e);
    return NextResponse.json(
      { success: false, error: 'callback_processing_failed' },
      { status: 500 }
    );
  }
}
