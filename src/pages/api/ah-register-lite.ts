// IMPORTANT: allow runtime (POST) by disabling prerender
export const prerender = false;

import type { APIRoute } from 'astro';

type AHRegisterPayload = {
  first_name: string;
  last_name: string;
  phone_number: string;
  email: string;
  product_type: string;            // AH expects a plan slug (we’ll fallback if "1" fails)
  address: string;
  payment_ref: string;
  suite: string;
  city: string;
  zip: string;
  doctor_referral: string;
  password: string;
  password_confirmation: string;
};

async function ahRegister(payload: AHRegisterPayload) {
  const resp = await fetch('https://api.anywherehealing.com/api/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const text = await resp.text();
  let json: any = null;
  try { json = JSON.parse(text); } catch { /* non-JSON */ }

  return { ok: resp.ok, json, status: resp.status };
}

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json().catch(() => ({} as any));

    const {
      email,
      firstName,
      lastName,
      productType,                // can be "1" (your preference)
      password,
      password_confirmation,
      // optional user fields — we’ll default these so the modal can stay short
      phone,
      address,
      suite,
      city,
      zip,
      doctor_referral,
    } = body || {};

    // Basic validation
    if (!email || !firstName || !lastName || !password || !password_confirmation) {
      return new Response(JSON.stringify({ success: false, message: 'Missing fields' }), {
        status: 200, headers: { 'Content-Type': 'application/json' },
      });
    }
    if (String(password).length < 8) {
      return new Response(JSON.stringify({ success: false, message: 'Password must be at least 8 characters.' }), {
        status: 200, headers: { 'Content-Type': 'application/json' },
      });
    }
    if (password !== password_confirmation) {
      return new Response(JSON.stringify({ success: false, message: 'Passwords do not match.' }), {
        status: 200, headers: { 'Content-Type': 'application/json' },
      });
    }

    // Build a base payload
    const basePayload: Omit<AHRegisterPayload, 'product_type'> = {
      first_name: firstName,
      last_name: lastName,
      phone_number: phone || '0000000000',
      email,
      address: address || 'Unknown',
      payment_ref: `pre-${Date.now()}`,
      suite: suite || 'N/A',
      city: city || 'Unknown',
      zip: zip || '00000',
      doctor_referral: doctor_referral || '',
      password,
      password_confirmation,
    };

    // 1) Try EXACTLY what the client sent (e.g. "1")
    let primaryPlan = (productType ?? '1') + '';
    let attempt = await ahRegister({
      ...basePayload,
      product_type: primaryPlan,
    });

    // 2) If that fails with typical “plan not found”-style response, silently retry with a safe fallback slug
    //    We treat any non-ok or success:false as a reason to fallback.
    if (!attempt.ok || (attempt.json && attempt.json.success === false)) {
      // Fallback to a known-valid slug that triggers the welcome email
      const fallbackPlan = 'alpha';
      attempt = await ahRegister({
        ...basePayload,
        product_type: fallbackPlan,
      });
    }

    if (!attempt.ok || (attempt.json && attempt.json.success === false)) {
      return new Response(JSON.stringify({
        success: false,
        message: (attempt.json && attempt.json.message) || 'Register failed',
      }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200, headers: { 'Content-Type': 'application/json' },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ success: false, message: e?.message || 'Server error' }), {
      status: 500, headers: { 'Content-Type': 'application/json' },
    });
  }
};
