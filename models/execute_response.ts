type ExecuteResponse = {
    status: "OK" | "TLE" | "MLE" | "RE" | "CE" | "OLE";
    stdout: string;
    stderr: string;
    time: string;
    memory: string;
};

export type { ExecuteResponse };
