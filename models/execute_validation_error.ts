type ValidationErrorDetail = {
    loc: (string | number)[];
    msg: string;
    type: string;
    input?: unknown;
    ctx?: Record<string, unknown>;
};

type ExecuteValidationError = {
    detail: ValidationErrorDetail[];
};

export type { ValidationErrorDetail, ExecuteValidationError };
