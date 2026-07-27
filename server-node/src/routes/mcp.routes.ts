import { Router, Request, Response } from 'express';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { createMcpServer } from '../services/mcp/mcp-server';
import { asyncHandler } from '../utils/async-handler';

const router = Router();

router.post(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    // Stateless: fresh server+transport per request, no session tracking.
    const server = createMcpServer();
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
    });
    res.on('close', () => {
      void transport.close();
      void server.close();
    });
    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);
  }),
);

const methodNotAllowed = (_req: Request, res: Response): void => {
  res.status(405).json({
    jsonrpc: '2.0',
    error: { code: -32000, message: 'Method not allowed' },
    id: null,
  });
};

router.get('/', methodNotAllowed);
router.delete('/', methodNotAllowed);

export default router;
