interface PingResult {
  ok: boolean;
  registry: string;
  responseTime: number;
  serverInfo?: Record<string, unknown>;
}

export async function ping(registry: string): Promise<PingResult> {
  const registryUrl = registry.replace(/\/$/, '');
  const start = Date.now();

  try {
    const response = await fetch(`${registryUrl}/-/ping`, {
      headers: {Accept: 'application/json'},
    });
    const responseTime = Date.now() - start;

    let serverInfo: Record<string, unknown> | undefined;
    try {
      const body = await response.text();
      if (body) {
        serverInfo = JSON.parse(body);
      }
    } catch {
      // not JSON — that's fine
    }

    const result: PingResult = {
      ok: response.ok,
      registry: registryUrl,
      responseTime,
      serverInfo,
    };

    if (response.ok) {
      process.stdout.write(`Registry: ${registryUrl}\n`);
      process.stdout.write(`Status:   OK\n`);
      process.stdout.write(`Time:     ${responseTime}ms\n`);
    } else {
      console.error(`Registry: ${registryUrl}`);
      console.error(`Status:   FAIL (${response.status})`);
      console.error(`Time:     ${responseTime}ms`);
    }

    return result;
  } catch (err: unknown) {
    const responseTime = Date.now() - start;
    console.error(`Registry: ${registryUrl}`);
    console.error(`Status:   UNREACHABLE`);
    console.error(`Error:    ${err instanceof Error ? err.message : String(err)}`);
    console.error(`Time:     ${responseTime}ms`);

    return {
      ok: false,
      registry: registryUrl,
      responseTime,
    };
  }
}
