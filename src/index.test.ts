import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('./mcp/handlers.js', () => ({
  createAndStartServer: vi.fn()
}));

describe('index', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should start server successfully', async () => {
    const mockCreateAndStartServer = await import('./mcp/handlers.js');
    vi.mocked(mockCreateAndStartServer.createAndStartServer).mockResolvedValue();

    await import('./index.js');

    expect(mockCreateAndStartServer.createAndStartServer).toHaveBeenCalled();
  });
});