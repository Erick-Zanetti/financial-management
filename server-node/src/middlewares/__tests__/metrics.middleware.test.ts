import express, { NextFunction, Request, Response, Router } from 'express';
import cors from 'cors';
import type { AddressInfo } from 'node:net';
import type { Server } from 'node:http';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { metricsMiddleware } from '../metrics.middleware';

let server: Server;
let base: string;

const category = Router();
category.get('/', (_req, res) => {
  res.json({ ok: true });
});
category.get('/:id', (req, res) => {
  res.json({ id: req.params.id });
});

beforeAll(async () => {
  const app = express();
  app.use(metricsMiddleware);
  app.use(cors({ origin: true, credentials: true }));
  app.use(express.json());
  app.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
  });
  app.get('/items/:id', (req, res) => {
    res.json({ id: req.params.id });
  });
  app.use('/category', category);
  app.get('/boom', () => {
    throw new Error('kaboom');
  });
  app.post('/echo', (req, res) => {
    res.json(req.body);
  });
  app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    res.status(500).json({ message: 'Internal server error' });
  });
  await new Promise<void>((resolve) => {
    server = app.listen(0, resolve);
  });
  base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});

afterAll(async () => {
  await new Promise((resolve) => server.close(resolve));
});

const scrape = async (): Promise<string> => (await fetch(`${base}/metrics`)).text();

// finish listeners run right after the response is sent; poll briefly for the series.
const scrapeUntil = async (needle: string): Promise<string> => {
  for (let i = 0; i < 20; i++) {
    const text = await scrape();
    if (text.includes(needle)) return text;
    await new Promise((r) => setTimeout(r, 10));
  }
  return scrape();
};

const routesIn = (text: string): Set<string> =>
  new Set(
    [...text.matchAll(/^http_request_duration_seconds_count\{[^}]*route="([^"]*)"/gm)].map(
      (m) => m[1],
    ),
  );

describe('metricsMiddleware', () => {
  it('metrics_returns_prometheus_text', async () => {
    await fetch(`${base}/items/1`);
    const res = await fetch(`${base}/metrics`);
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toMatch(/^text\/plain;.*version=0\.0\.4/);
    const text = await scrapeUntil('http_request_duration_seconds_bucket');
    expect(text).toContain('http_request_duration_seconds_bucket');
    expect(text).toContain('process_cpu_user_seconds_total');
  });

  it('uses_route_template', async () => {
    await fetch(`${base}/items/12345`);
    const text = await scrapeUntil('route="/items/:id"');
    expect(text).toContain('route="/items/:id"');
    expect(text).not.toContain('12345');
  });

  it('normalizes_mounted_route', async () => {
    await fetch(`${base}/category`);
    await fetch(`${base}/category/`);
    await fetch(`${base}/category/abc999`);
    const text = await scrapeUntil('route="/category/:id"');
    expect(text).toContain('method="GET",route="/category",status="200"');
    expect(text).toContain('route="/category/:id"');
    expect(text).not.toContain('route="/category/"');
    expect(text).not.toContain('abc999');
  });

  it('unknown_paths_collapse_to_unmatched', async () => {
    const before = routesIn(await scrape());
    for (const p of ['/wp-admin', '/.env', '/id/998877']) await fetch(`${base}${p}`);
    const text = await scrapeUntil('route="unmatched"');
    const added = [...routesIn(text)].filter((r) => !before.has(r));
    expect(added).toEqual(['unmatched']);
    expect(text).not.toContain('wp-admin');
    expect(text).not.toContain('998877');
  });

  it('handler_error_keeps_response_and_counts_500', async () => {
    const res = await fetch(`${base}/boom`);
    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ message: 'Internal server error' });
    const text = await scrapeUntil('route="/boom",status="500"');
    expect(text).toContain('method="GET",route="/boom",status="500"');
  });

  it('body_parser_rejection_is_measured_as_unmatched', async () => {
    const res = await fetch(`${base}/echo`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: '{bad json',
    });
    expect(res.status).toBe(500);
    const text = await scrapeUntil('method="POST",route="unmatched",status="500"');
    expect(text).toContain('method="POST",route="unmatched",status="500"');
    expect(text).not.toContain('route="/echo"');
  });

  it('unknown_methods_collapse_to_other', async () => {
    await fetch(`${base}/items/1`, { method: 'PROPFIND' });
    const text = await scrapeUntil('method="OTHER"');
    expect(text).toContain('method="OTHER"');
    expect(text).not.toContain('PROPFIND');
  });

  it('excludes_metrics_and_health', async () => {
    await fetch(`${base}/health`);
    await scrape();
    const text = await scrape();
    expect(text).toContain('http_request_duration_seconds_bucket');
    expect(text).not.toContain('route="/metrics"');
    expect(text).not.toContain('route="/health"');
  });
});
