type ExecuteResponse = {
    status: "OK" | "TLE" | "MLE" | "RE" | "CE";
    stdout: string;
    stderr: string;
    time: string;
    memory: string;
};

export type { ExecuteResponse };
