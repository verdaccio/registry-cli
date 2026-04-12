interface PingResult {
  ok: boolean;
  registry: string;
  responseTime: number;
  serverInfo?: Record<string, any>;
}

export async function ping(registry: string): Promise<PingResult> {
  const registryUrl = registry.replace(/\/$/, '');
  const start = Date.now();

  try {
    const response = await fetch(`${registryUrl}/-/ping`, {
      headers: {Accept: 'application/json'},
    });
    const responseTime = Date.now() - start;

    let serverInfo: Record<string, any> | undefined;
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
      console.log(`Registry: ${registryUrl}`);
      console.log(`Status:   OK`);
      console.log(`Time:     ${responseTime}ms`);
    } else {
      console.error(`Registry: ${registryUrl}`);
      console.error(`Status:   FAIL (${response.status})`);
      console.error(`Time:     ${responseTime}ms`);
    }

    return result;
  } catch (err: any) {
    const responseTime = Date.now() - start;
    console.error(`Registry: ${registryUrl}`);
    console.error(`Status:   UNREACHABLE`);
    console.error(`Error:    ${err.message}`);
    console.error(`Time:     ${responseTime}ms`);

    return {
      ok: false,
      registry: registryUrl,
      responseTime,
    };
  }
}
