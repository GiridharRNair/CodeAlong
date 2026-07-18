import { NextResponse } from "next/server";
import type { ExecuteRequestBody } from "@models/execute_request_body";
import type { ExecuteResponse } from "@models/execute_response";
import type { ExecuteValidationError } from "@models/execute_validation_error";
import type { ApiErrorResponse } from "@models/api_error_response";

const RUNLET_API_URL = "https://runlet.codealong.live";
const EXECUTE_TIMEOUT_MS = 30_000;

const SUPPORTED_LANGUAGES = ["python", "javascript", "cpp", "java"];

const formatValidationErrorMessage = (error: ExecuteValidationError): string =>
    error.detail
        .map((detail) => {
            const field = detail.loc
                .filter((segment) => segment !== "body")
                .join(".");
            return field ? `${field}: ${detail.msg}` : detail.msg;
        })
        .join("; ");

export async function POST(request: Request) {
    let body: ExecuteRequestBody;
    try {
        body = (await request.json()) as ExecuteRequestBody;
    } catch {
        return NextResponse.json<ApiErrorResponse>(
            { error: "Invalid request body" },
            { status: 400 },
        );
    }

    const { code, language, stdin = "" } = body;

    if (!SUPPORTED_LANGUAGES.includes(language)) {
        return NextResponse.json<ApiErrorResponse>(
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
            if (response.status === 429) {
                return NextResponse.json<ApiErrorResponse>(
                    { error: "Rate limit reached, please try again shortly" },
                    { status: 429 },
                );
            }

            const rawBody = await response.text();

            if (response.status === 422) {
                try {
                    const error = JSON.parse(rawBody) as ExecuteValidationError;
                    return NextResponse.json<ApiErrorResponse>(
                        { error: formatValidationErrorMessage(error) },
                        { status: 400 },
                    );
                } catch {
                    return NextResponse.json<ApiErrorResponse>(
                        {
                            error: `Code execution failed (upstream status ${String(response.status)}, response could not be parsed)`,
                        },
                        { status: 400 },
                    );
                }
            }

            try {
                const error = JSON.parse(rawBody) as { detail?: string };
                return NextResponse.json<ApiErrorResponse>(
                    { error: error.detail ?? "Code execution failed" },
                    { status: response.status },
                );
            } catch {
                return NextResponse.json<ApiErrorResponse>(
                    {
                        error: `Code execution failed (upstream status ${String(response.status)}, response could not be parsed)`,
                    },
                    { status: response.status },
                );
            }
        }

        const data = (await response.json()) as ExecuteResponse;
        return NextResponse.json(data);
    } catch (err) {
        if (err instanceof Error && err.name === "AbortError") {
            return NextResponse.json<ApiErrorResponse>(
                { error: "Code execution timed out" },
                { status: 504 },
            );
        }
        return NextResponse.json<ApiErrorResponse>(
            { error: "Failed to reach the compiler service" },
            { status: 502 },
        );
    } finally {
        clearTimeout(timeout);
    }
}
