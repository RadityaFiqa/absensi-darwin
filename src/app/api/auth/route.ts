import { NextResponse } from 'next/server';
import axios from 'axios';
import { query } from '@/lib/db';
import { validateAndSyncUser } from '@/lib/auth-server';
import { logActivity, getClientDetails } from '@/lib/logger';
import { CookieJar } from 'tough-cookie';
import { wrapper } from 'axios-cookiejar-support';

// @ts-ignore
import QrCodeReader from 'qrcode-reader';
import { Jimp } from 'jimp';

async function decodeQrCode(base64Data: string): Promise<string> {
  return new Promise(async (resolve, reject) => {
    try {
      const base64Str = base64Data.split('base64,')[1] || base64Data;
      const buffer = Buffer.from(base64Str, 'base64');
      
      const image = await Jimp.read(buffer);
      
      // Preprocess image: convert transparent pixels to white, high contrast binarization
      const data = image.bitmap.data;
      for (let i = 0; i < data.length; i += 4) {
        const alpha = data[i + 3];
        if (alpha < 128) {
          // Transparent -> White
          data[i] = 255;
          data[i + 1] = 255;
          data[i + 2] = 255;
          data[i + 3] = 255;
        } else {
          // Opaque -> threshold luminance to solid black or white
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          const luminance = (r + g + b) / 3;
          if (luminance < 128) {
            data[i] = 0;
            data[i + 1] = 0;
            data[i + 2] = 0;
          } else {
            data[i] = 255;
            data[i + 1] = 255;
            data[i + 2] = 255;
          }
          data[i + 3] = 255;
        }
      }
      
      const qr = new QrCodeReader();
      qr.callback = function(err: any, value: any) {
        if (err) {
          reject(err);
        } else if (!value || !value.result) {
          reject(new Error('QR reader completed but returned no value'));
        } else {
          resolve(value.result);
        }
      };
      
      qr.decode(image.bitmap);
    } catch (error) {
      reject(error);
    }
  });
}

async function performSsoLoginAndGetToken(username: string, password: string): Promise<{ token: string | null; userDetails: any | null; error: string | null }> {
  const jar = new CookieJar();
  const client = wrapper(axios.create({
    jar,
    withCredentials: true,
    maxRedirects: 0,
    validateStatus: (status) => status >= 200 && status < 400,
  }));

  try {
    const loginUrl = 'https://insantangguh-bulog.darwinbox.com/user/login';
    const response = await client.get(loginUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36',
      }
    });

    const adfsPostUrl = 'https://insantangguh-bulog.darwinbox.com/user/adfs/login';
    const adfsResponse = await client.post(adfsPostUrl, 
      new URLSearchParams({
        'UserLogin[SSOpage]': 'a6971d9fd10ec9498386847',
        'UserLogin[SSOtype]': 'saml'
      }).toString(),
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36',
          'Content-Type': 'application/x-www-form-urlencoded',
          'Referer': loginUrl,
        }
      }
    );

    let redirectUrl = adfsResponse.headers.location;
    if (!redirectUrl) {
      return { token: null, userDetails: null, error: 'Failed to follow SSO redirection URL' };
    }

    let ssoResponse = await client.get(redirectUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36',
        'Referer': loginUrl,
      }
    });

    while (ssoResponse.status === 302 || ssoResponse.status === 303 || ssoResponse.status === 307 || ssoResponse.status === 301) {
      const nextRedir = ssoResponse.headers.location;
      if (!nextRedir) break;
      redirectUrl = nextRedir;
      ssoResponse = await client.get(redirectUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36',
          'Referer': redirectUrl,
        }
      });
    }

    const ssoUrl = ssoResponse.config.url || redirectUrl;
    let html = ssoResponse.data;
    const authStateMatch = html.match(/name="AuthState"\s+value="([^"]+)"/);
    if (!authStateMatch) {
      return { token: null, userDetails: null, error: 'Could not find AuthState value in SSO page. Check credentials or site status.' };
    }
    const authState = authStateMatch[1].replace(/&amp;/g, '&');
    const formActionMatch = html.match(/<form[^>]+action="([^"]+)"/);
    const formActionUrl = formActionMatch ? formActionMatch[1].replace(/&amp;/g, '&') : ssoUrl;

    const ssoPostResponse = await client.post(formActionUrl,
      new URLSearchParams({
        'AuthState': authState,
        'username': username,
        'password': password
      }).toString(),
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36',
          'Content-Type': 'application/x-www-form-urlencoded',
          'Referer': ssoUrl,
        }
      }
    );

    const ssoPostHtml = ssoPostResponse.data;
    if (ssoPostHtml.includes('Username atau password salah') || ssoPostHtml.includes('salah') || ssoPostHtml.includes('invalid') || ssoPostHtml.includes('Password salah')) {
      return { token: null, userDetails: null, error: 'Username atau password SSO Bulog salah.' };
    }

    const samlResponseMatch = ssoPostHtml.match(/name="SAMLResponse"\s+value="([^"]+)"/);
    if (!samlResponseMatch) {
      return { token: null, userDetails: null, error: 'Gagal login: Username/Password SSO salah atau akun terkunci.' };
    }
    const samlResponse = samlResponseMatch[1];
    const relayStateMatch = ssoPostHtml.match(/name="RelayState"\s+value="([^"]+)"/);
    const relayState = relayStateMatch ? relayStateMatch[1] : '';

    const acsFormActionMatch = ssoPostHtml.match(/<form[^>]+action="([^"]+)"/);
    if (!acsFormActionMatch) {
      return { token: null, userDetails: null, error: 'Could not find ACS action endpoint in SAML response form.' };
    }
    const acsUrl = acsFormActionMatch[1].replace(/&amp;/g, '&');

    const acsPayload: Record<string, string> = { SAMLResponse: samlResponse };
    if (relayState) {
      acsPayload.RelayState = relayState;
    }

    const acsResponse = await client.post(acsUrl,
      new URLSearchParams(acsPayload).toString(),
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36',
          'Content-Type': 'application/x-www-form-urlencoded',
          'Referer': ssoUrl,
        }
      }
    );

    let nextUrl = acsResponse.headers.location;
    if (nextUrl) {
      if (nextUrl.startsWith('/')) {
        nextUrl = 'https://insantangguh-bulog.darwinbox.com' + nextUrl;
      }
      let nextResponse = await client.get(nextUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36',
          'Referer': acsUrl,
        }
      });

      const redirectHtml = nextResponse.data;
      const formMatch = redirectHtml.match(/<form[^>]+action="([^"]+)"/);
      if (formMatch) {
        const postRedirAction = formMatch[1].replace(/&amp;/g, '&');
        const inputMatches = redirectHtml.matchAll(/<input\s+type="hidden"\s+name="([^"]+)"\s+value="([^"]*)"/g);
        const redirParams = new URLSearchParams();
        for (const inputMatch of inputMatches) {
          redirParams.append(inputMatch[1], inputMatch[2].replace(/&amp;/g, '&'));
        }

        const finalRedirRes = await client.post(postRedirAction, redirParams.toString(), {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36',
            'Content-Type': 'application/x-www-form-urlencoded',
            'Referer': nextUrl,
          }
        });

        if (finalRedirRes.headers.location) {
          let target = finalRedirRes.headers.location;
          if (target.startsWith('/')) {
            target = 'https://insantangguh-bulog.darwinbox.com' + target;
          }
          await client.get(target, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36',
            }
          });
        }
      }
    }

    const qrResponse = await client.get('https://insantangguh-bulog.darwinbox.com/dashboard/mobileqrcode', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
      }
    });

    const qrHtml = qrResponse.data;
    console.log('[SSO FLOW] fetched QR Code Page, HTML length:', qrHtml ? qrHtml.length : 0);
    
    let base64Data = null;
    const splitParts = qrHtml.split('data:image/png;base64,');
    if (splitParts.length > 1) {
      base64Data = splitParts[1].split(/[>\s'"]/)[0];
    }

    console.log('[SSO FLOW] Parsed base64Data found:', !!base64Data, base64Data ? `Length: ${base64Data.length}, Prefix: ${base64Data.substring(0, 30)}` : '');

    if (!base64Data) {
      return { token: null, userDetails: null, error: 'Failed to find QR code on Darwinbox dashboard.' };
    }

    console.log('[SSO FLOW] Decoding QR Code...');
    const decodedValue = await decodeQrCode(base64Data);
    console.log('[SSO FLOW] Decoded QR Code value:', decodedValue);

    const authResponse = await axios.post('https://insantangguh-bulog.darwinbox.com/Mobileapi/auth', 
      { qrcode: decodedValue },
      {
        headers: { 
          'Content-Type': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36',
        },
        timeout: 30000
      }
    );

    const authData = authResponse.data;
    let token = authData.token;
    if (!token && authData.message) {
      if (typeof authData.message === 'string') {
        token = authData.message;
      } else if (typeof authData.message === 'object' && 'token' in authData.message) {
        token = authData.message.token;
      }
    }

    if (authData.status === 1 && token) {
      return { token, userDetails: authData.user_details, error: null };
    } else {
      return { token: null, userDetails: null, error: authData.message || 'Mobile access is not enabled or authentication rejected by Darwinbox.' };
    }

  } catch (err: any) {
    console.error('performSsoLoginAndGetToken Error:', err);
    const errMsg = (err && typeof err === 'object') ? (err.message || JSON.stringify(err)) : String(err);
    return { token: null, userDetails: null, error: errMsg || 'Network error authenticating with SSO Bulog.' };
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { qrcode, username, password } = body;
    const udid = request.headers.get('x-udid') || '';

    const { ip, userAgent } = getClientDetails(request);

    // Flow 1: SSO credentials provided
    if (username && password) {
      const loginResult = await performSsoLoginAndGetToken(username, password);

      if (loginResult.error || !loginResult.token || !loginResult.userDetails) {
        return NextResponse.json({ status: 0, error: loginResult.error || 'Gagal login via SSO' }, { status: 400 });
      }

      const { token, userDetails } = loginResult;

      // Upsert the user profile in the database and save credentials + session + udid
      const dbRes = await query(
        `INSERT INTO users (employee_no, name, email, department, designation, username, password, token, udid, is_active, role)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, true, 'EMPLOYEE')
         ON CONFLICT (employee_no) 
         DO UPDATE SET 
           name = EXCLUDED.name,
           email = EXCLUDED.email,
           department = EXCLUDED.department,
           designation = EXCLUDED.designation,
           username = EXCLUDED.username,
           password = EXCLUDED.password,
           token = EXCLUDED.token,
           udid = EXCLUDED.udid,
           updated_at = CURRENT_TIMESTAMP
         RETURNING id, employee_no, name, email, department, designation, role, is_active`,
        [
          userDetails.employee_no,
          userDetails.name,
          userDetails.email,
          userDetails.department || '',
          userDetails.designation || '',
          username,
          password,
          token,
          udid
        ]
      );

      const localUser = dbRes.rows[0];

      // Record successful LOGIN activity
      await logActivity(localUser.employee_no, 'LOGIN', 'Logged in via SSO Credentials', ip, userAgent);

      return NextResponse.json({
        status: 1,
        message: 'Login Success',
        token,
        user: localUser
      });
    }

    // Flow 2: QR code provided
    if (qrcode) {
      const base = process.env.NEXT_PUBLIC_API_BASE || 'https://insantangguh-bulog.darwinbox.com';
      const targetUrl = `${base}/Mobileapi/auth`;

      const response = await axios.post(
        targetUrl,
        { qrcode },
        {
          headers: { 'Content-Type': 'application/json' },
          timeout: 30000,
        }
      );

      const data = response.data;
      
      let token = data.token;
      if (!token && data.message) {
        if (typeof data.message === 'string') {
          token = data.message;
        } else if (typeof data.message === 'object' && 'token' in data.message) {
          token = data.message.token;
        }
      }

      if (data.status === 1 && token) {
        const localUser = await validateAndSyncUser(token, udid);

        // Save token and udid to database for QR-authenticated user
        await query(
          'UPDATE users SET token = $1, udid = $2, updated_at = CURRENT_TIMESTAMP WHERE employee_no = $3',
          [token, udid, localUser.employee_no]
        );

        await logActivity(localUser.employee_no, 'LOGIN', 'Logged in via QR Code', ip, userAgent);

        return NextResponse.json({
          ...data,
          user: localUser,
        });
      }

      return NextResponse.json(data);
    }

    return NextResponse.json({ status: 0, error: 'Invalid request parameters' }, { status: 400 });

  } catch (error: any) {
    console.error('API Auth Proxy Error:', error);

    if (error.statusCode === 403 && error.employee_no) {
      try {
        const { ip, userAgent } = getClientDetails(request);
        await logActivity(error.employee_no, 'LOGIN', 'Gagal login: User tidak terdaftar atau tidak aktif', ip, userAgent);
      } catch (logErr) {
        console.error('Failed to log failed login attempt:', logErr);
      }
    }

    const status = error.statusCode || error.response?.status || 500;
    const errorData = error.response?.data || { success: false, message: error.message || 'Terjadi kesalahan pada server proxy' };
    return NextResponse.json(errorData, { status });
  }
}
