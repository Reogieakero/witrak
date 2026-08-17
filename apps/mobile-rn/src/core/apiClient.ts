import { AppConfig } from '../config';

export class ApiException extends Error {
  statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
  }

  get unauthorized(): boolean {
    return this.statusCode === 401;
  }

  get forbidden(): boolean {
    return this.statusCode === 403;
  }
}

const TIMEOUT_MS = 12000;

class ApiClient {
  private _token: string | null = null;

  get baseUrl(): string {
    return AppConfig.apiBaseUrl;
  }

  get currentToken(): string | null {
    return this._token;
  }

  updateToken(token: string | null): void {
    this._token = token;
  }

  private headers(): Record<string, string> {
    const h: Record<string, string> = { 'Content-Type': 'application/json' };
    if (this._token != null) h.Authorization = `Bearer ${this._token}`;
    return h;
  }

  private async request(
    method: 'GET' | 'POST',
    path: string,
    body?: Record<string, unknown>,
  ): Promise<Record<string, unknown>> {
    const uri = `${this.baseUrl}${path}`;
    console.log(`[api] ${method} ${uri}`);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    try {
      const res = await fetch(uri, {
        method,
        headers: this.headers(),
        body: body == null ? undefined : JSON.stringify(body),
        signal: controller.signal,
      });
      console.log(`[api] ${method} ${uri} -> ${res.status}`);
      return await this.decode(res);
    } catch (e: any) {
      if (e?.name === 'AbortError') {
        throw new ApiException(
          0,
          'Could not reach the server. Check your connection or the API address.',
        );
      }
      throw new ApiException(
        0,
        'Could not reach the server. Check your connection or the API address.',
      );
    } finally {
      clearTimeout(timer);
    }
  }

  private async decode(res: Response): Promise<Record<string, unknown>> {
    let json: Record<string, unknown> | null = null;
    try {
      json = (await res.json()) as Record<string, unknown>;
    } catch {
      json = null;
    }
    if (res.status >= 200 && res.status < 300) {
      return json ?? {};
    }
    console.log(`[api] ERROR ${res.status}: ${res.statusText}`);
    const message = json?.['error']
      ? String(json['error'])
      : `Something went wrong (${res.status}).`;
    throw new ApiException(res.status, message);
  }

  async get(path: string): Promise<Record<string, unknown>> {
    return this.request('GET', path);
  }

  async post(
    path: string,
    body?: Record<string, unknown>,
  ): Promise<Record<string, unknown>> {
    return this.request('POST', path, body);
  }
}

export const api = new ApiClient();