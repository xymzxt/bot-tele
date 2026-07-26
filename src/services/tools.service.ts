import crypto from 'node:crypto';
import dns from 'node:dns/promises';
import tls from 'node:tls';
import axios from 'axios';
import QRCode from 'qrcode';
import type { DevToolMode } from '../types/session';
import { escapeHtml } from '../utils/format';
import { urlSchema } from '../utils/validation';

export class ToolsService {
  async run(mode: DevToolMode, input: string): Promise<{ kind: 'text'; text: string } | { kind: 'image'; buffer: Buffer; caption: string }> {
    switch (mode) {
      case 'qr_generate': {
        const buffer = await QRCode.toBuffer(input, { errorCorrectionLevel: 'M', width: 600, margin: 2 });
        return { kind: 'image', buffer, caption: '✅ QR Code berhasil dibuat.' };
      }
      case 'base64_encode':
        return { kind: 'text', text: `<code>${Buffer.from(input, 'utf8').toString('base64')}</code>` };
      case 'base64_decode': {
        const decoded = Buffer.from(input, 'base64').toString('utf8');
        return { kind: 'text', text: `<pre>${escapeHtml(decoded)}</pre>` };
      }
      case 'jwt_decode':
        return { kind: 'text', text: this.decodeJwt(input) };
      case 'json_format':
        return { kind: 'text', text: `<pre>${escapeHtml(JSON.stringify(JSON.parse(input), null, 2))}</pre>` };
      case 'password_generate':
        return { kind: 'text', text: `<code>${crypto.randomBytes(18).toString('base64url')}</code>` };
      case 'hash_generate':
        return {
          kind: 'text',
          text: [
            '🔐 <b>Hash Result</b>',
            `MD5    : <code>${crypto.createHash('md5').update(input).digest('hex')}</code>`,
            `SHA1   : <code>${crypto.createHash('sha1').update(input).digest('hex')}</code>`,
            `SHA256 : <code>${crypto.createHash('sha256').update(input).digest('hex')}</code>`,
          ].join('\n'),
        };
      case 'markdown_preview':
        return { kind: 'text', text: `<b>Markdown Preview</b>\n\n<pre>${escapeHtml(input)}</pre>` };
      case 'url_shortener':
        return { kind: 'text', text: `🔗 URL Shortener belum dikonfigurasi. URL diterima: <code>${escapeHtml(input)}</code>` };
      case 'website_ping':
        return { kind: 'text', text: await this.pingWebsite(input) };
      case 'website_headers':
        return { kind: 'text', text: await this.httpHeaders(input) };
      case 'dns_lookup':
        return { kind: 'text', text: await this.dnsLookup(input) };
      case 'ssl_checker':
        return { kind: 'text', text: await this.sslCheck(input) };
      default:
        return { kind: 'text', text: 'Tool belum tersedia.' };
    }
  }

  private decodeJwt(token: string): string {
    const parts = token.trim().split('.');
    if (parts.length < 2) throw new Error('JWT tidak valid');

    const decode = (value: string) => JSON.parse(Buffer.from(value, 'base64url').toString('utf8')) as unknown;
    return [
      '🧩 <b>JWT Decoder</b>',
      '',
      '<b>Header</b>',
      `<pre>${escapeHtml(JSON.stringify(decode(parts[0]!), null, 2))}</pre>`,
      '<b>Payload</b>',
      `<pre>${escapeHtml(JSON.stringify(decode(parts[1]!), null, 2))}</pre>`,
      '',
      '⚠️ Signature tidak diverifikasi.',
    ].join('\n');
  }

  private async pingWebsite(rawUrl: string): Promise<string> {
    const url = urlSchema.parse(rawUrl);
    const started = Date.now();
    const response = await axios.get(url, { timeout: 15_000, validateStatus: () => true });
    return [
      '🌐 <b>Website Ping</b>',
      `URL : <code>${escapeHtml(url)}</code>`,
      `Status : <b>${response.status}</b>`,
      `Response Time : <b>${Date.now() - started} ms</b>`,
    ].join('\n');
  }

  private async httpHeaders(rawUrl: string): Promise<string> {
    const url = urlSchema.parse(rawUrl);
    const response = await axios.head(url, { timeout: 15_000, validateStatus: () => true });
    const headers = Object.entries(response.headers)
      .slice(0, 25)
      .map(([key, value]) => `${key}: ${String(value)}`)
      .join('\n');

    return ['🧾 <b>HTTP Headers</b>', `<code>${escapeHtml(url)}</code>`, '', `<pre>${escapeHtml(headers)}</pre>`].join('\n');
  }

  private async dnsLookup(domainInput: string): Promise<string> {
    const domain = domainInput.replace(/^https?:\/\//, '').split('/')[0]?.trim();
    if (!domain) throw new Error('Domain tidak valid');
    const [a, mx, txt] = await Promise.allSettled([
      dns.resolve4(domain),
      dns.resolveMx(domain),
      dns.resolveTxt(domain),
    ]);

    return [
      '🧭 <b>DNS Lookup</b>',
      `Domain : <code>${escapeHtml(domain)}</code>`,
      '',
      `<b>A</b>\n<pre>${escapeHtml(a.status === 'fulfilled' ? a.value.join('\n') : a.reason)}</pre>`,
      `<b>MX</b>\n<pre>${escapeHtml(mx.status === 'fulfilled' ? JSON.stringify(mx.value, null, 2) : mx.reason)}</pre>`,
      `<b>TXT</b>\n<pre>${escapeHtml(txt.status === 'fulfilled' ? JSON.stringify(txt.value, null, 2) : txt.reason)}</pre>`,
    ].join('\n');
  }

  private async sslCheck(domainInput: string): Promise<string> {
    const hostname = domainInput.replace(/^https?:\/\//, '').split('/')[0]?.trim();
    if (!hostname) throw new Error('Hostname tidak valid');

    return new Promise((resolve, reject) => {
      const socket = tls.connect(443, hostname, { servername: hostname, timeout: 10_000 }, () => {
        const cert = socket.getPeerCertificate();
        socket.end();
        resolve(
          [
            '🔒 <b>SSL Checker</b>',
            `Host : <code>${escapeHtml(hostname)}</code>`,
            `Issuer : <b>${escapeHtml(cert.issuer?.O ?? cert.issuer?.CN ?? '-')}</b>`,
            `Valid From : <b>${escapeHtml(cert.valid_from)}</b>`,
            `Valid To : <b>${escapeHtml(cert.valid_to)}</b>`,
          ].join('\n'),
        );
      });
      socket.on('error', reject);
      socket.on('timeout', () => {
        socket.destroy();
        reject(new Error('SSL check timeout'));
      });
    });
  }
}
