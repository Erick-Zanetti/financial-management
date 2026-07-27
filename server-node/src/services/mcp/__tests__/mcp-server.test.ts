import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../financial-release.service', () => ({
  financialReleaseService: {
    findByTypeAndMonthAndYear: vi.fn(),
    findById: vi.fn(),
    searchByName: vi.fn(),
    getDashboardSummarySegmented: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));
vi.mock('../../category.service', () => ({
  categoryService: { findAll: vi.fn().mockResolvedValue([]) },
}));

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { createMcpServer } from '../mcp-server';

async function connectedClient() {
  const [clientTransport, serverTransport] =
    InMemoryTransport.createLinkedPair();
  const server = createMcpServer();
  const client = new Client({ name: 'test', version: '1.0.0' });
  await Promise.all([
    server.connect(serverTransport),
    client.connect(clientTransport),
  ]);
  return client;
}

beforeEach(() => vi.clearAllMocks());

describe('MCP server', () => {
  it('lista as 8 tools com schemas', async () => {
    const client = await connectedClient();
    const { tools } = await client.listTools();
    expect(tools).toHaveLength(8);
    const names = tools.map((t) => t.name);
    expect(names).toContain('create_release');
    expect(
      tools.find((t) => t.name === 'list_releases')?.inputSchema,
    ).toMatchObject({ type: 'object' });
  });

  it('executa uma tool e retorna JSON', async () => {
    const client = await connectedClient();
    const result = await client.callTool({
      name: 'list_categories',
      arguments: {},
    });
    expect(result.isError).toBeFalsy();
  });

  it('input inválido vira isError sem lançar', async () => {
    const client = await connectedClient();
    const result = await client.callTool({
      name: 'get_release',
      arguments: { id: 'não-é-objectid' },
    });
    expect(result.isError).toBe(true);
  });
});
