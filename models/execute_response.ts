type ExecuteResponse = {
    status: "OK" | "TLE" | "MLE" | "RE" | "CE";
    stdout: string;
    stderr: string;
    error: string;
};

export type { ExecuteResponse };
