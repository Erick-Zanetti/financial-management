import { NextFunction, Request, Response } from 'express';
import { collectDefaultMetrics, Histogram, Registry } from 'prom-client';
import { logger } from '../config/logger.config';

// Prometheus metrics: a request-duration histogram and GET /metrics.
// The `route` label is the matched route template (mount + path), never the raw URL, and
// `unmatched` when nothing matched, so scanners cannot inflate label cardinality. `method`
// is limited to standard verbs. /metrics and /health are not recorded. A failure inside
// the collector is logged and never changes the response.
// Assumes static router mounts: a mount path with params would put the concrete value
// into req.baseUrl.

const METRICS_PATH = '/metrics';
const UNMATCHED = 'unmatched';
const EXCLUDED_ROUTES = new Set([METRICS_PATH, '/health']);
const KNOWN_METHODS = new Set(['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS']);

const registry = new Registry();
collectDefaultMetrics({ register: registry });

const histogram = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'HTTP request duration in seconds.',
  labelNames: ['method', 'route', 'status'],
  buckets: [0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
  registers: [registry],
});

const routeOf = (req: Request): string => {
  if (!req.route) return UNMATCHED;
  const full = `${req.baseUrl}${String(req.route.path)}`;
  return full.length > 1 ? full.replace(/\/+$/, '') || '/' : full;
};

const record = (req: Request, res: Response, startedAt: bigint): void => {
  try {
    const route = routeOf(req);
    if (EXCLUDED_ROUTES.has(route)) return;
    const method = KNOWN_METHODS.has(req.method) ? req.method : 'OTHER';
    const seconds = Number(process.hrtime.bigint() - startedAt) / 1e9;
    histogram.labels(method, route, String(res.statusCode)).observe(seconds);
  } catch (err) {
    logger.error('could not record request metrics', { error: (err as Error).message });
  }
};

export const metricsMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  if (req.method === 'GET' && req.path === METRICS_PATH) {
    registry
      .metrics()
      .then((body) => res.set('Content-Type', registry.contentType).send(body))
      .catch((err: Error) => {
        logger.error('could not render metrics', { error: err.message });
        res.status(500).end();
      });
    return;
  }
  const startedAt = process.hrtime.bigint();
  res.on('finish', () => record(req, res, startedAt));
  next();
};
