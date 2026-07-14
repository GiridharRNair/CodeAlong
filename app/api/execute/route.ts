import { NextResponse } from "next/server";

const RUNLET_API_URL = "https://runlet.codealong.live";
const EXECUTE_TIMEOUT_MS = 30_000;

const SUPPORTED_LANGUAGES = ["python", "javascript", "cpp", "java"];

interface ExecuteRequestBody {
    code: string;
    language: string;
    stdin?: string;
}

export async function POST(request: Request) {
    let body: ExecuteRequestBody;
    try {
        body = (await request.json()) as ExecuteRequestBody;
    } catch {
        return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    const { code, language, stdin = "" } = body;

    if (!SUPPORTED_LANGUAGES.includes(language)) {
        return NextResponse.json(
            { error: `Unsupported language: ${language ?? "unknown"}` },
            { status: 400 },
        );
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => {
        controller.abort();
    }, EXECUTE_TIMEOUT_MS);

    try {
        const response = await fetch(`${RUNLET_API_URL}/execute`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ language, code, stdin }),
            signal: controller.signal,
        });

        if (!response.ok) {
            let message = "Code execution failed";
            try {
                const error = (await response.json()) as { detail?: string };
                message = error.detail ?? message;
            } catch {
                // Ignore JSON parsing errors
            }

            if (response.status === 429) {
                message = "Rate limit reached, please try again shortly";
            }

            return NextResponse.json(
                { error: message },
                { status: response.status === 422 ? 400 : response.status },
            );
        }

        const data = (await response.json()) as unknown;
        return NextResponse.json(data);
    } catch (err) {
        if (err instanceof Error && err.name === "AbortError") {
            return NextResponse.json(
                { error: "Code execution timed out" },
                { status: 504 },
            );
        }
        return NextResponse.json(
            { error: "Failed to reach the compiler service" },
            { status: 502 },
        );
    } finally {
        clearTimeout(timeout);
    }
}
