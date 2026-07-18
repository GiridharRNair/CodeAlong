"use client";

import {
    uniqueNamesGenerator,
    adjectives,
    animals,
} from "unique-names-generator";
import type { Config } from "unique-names-generator";
import { useParams, redirect, useRouter } from "next/navigation";
import { validate as uuidValidate } from "uuid";
import { useState } from "react";

import { RealtimeMonaco } from "@components/realtime-monaco";
import { useConnectOnMount } from "@hooks/use-connect-on-mount";

import { Button } from "@components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@components/ui/select";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@components/ui/sheet";
import { ScrollArea } from "@components/ui/scroll-area";
import { Textarea } from "@components/ui/textarea";
import {
    UsersIcon,
    PlayIcon,
    CopyIcon,
    CheckIcon,
    CaretRightIcon,
    CaretDownIcon,
    LinkIcon,
    HashIcon,
    TerminalIcon,
    CircleNotchIcon,
    SignOutIcon,
} from "@phosphor-icons/react";
import { toast } from "sonner";

import type { ExecuteRequestBody } from "@models/execute_request_body";
import type { ExecuteResponse } from "@models/execute_response";
import type { ApiErrorResponse } from "@models/api_error_response";

const config: Config = {
    dictionaries: [adjectives, animals],
    separator: " ",
};

const SUPPORTED_LANGUAGES = [
    { label: "Python (3.13.14)", value: "python" },
    { label: "JavaScript (Node.js 20.19.2)", value: "javascript" },
    { label: "C++ (GCC 14.2.0)", value: "cpp" },
    { label: "Java (OpenJDK 21.0.11)", value: "java" },
];

const STATS_LABELS: Record<string, string> = {
    TLE: "Time limit exceeded",
    MLE: "Memory limit exceeded",
    RE: "Runtime error",
    CE: "Compile error",
    OLE: "Output limit exceeded",
};

export default function Room() {
    const router = useRouter();
    const { roomId } = useParams<{ roomId: string }>();
    const [name] = useState(() => uniqueNamesGenerator(config));
    const [stdin, setStdin] = useState("");
    const [output, setOutput] = useState("");
    const [isRunning, setIsRunning] = useState(false);
    const [copied, setCopied] = useState(false);
    const [code, setCode] = useState("");

    const { connectOnMount, users, language, setLanguage } = useConnectOnMount({
        channel: roomId ?? "",
        name,
    });

    if (!roomId || !uuidValidate(roomId)) {
        redirect("/");
    }

    const handleRun = async () => {
        setIsRunning(true);
        setOutput("");
        try {
            if (!code.trim()) {
                toast.error("Code editor is empty");
                return;
            }

            const requestBody: ExecuteRequestBody = {
                code,
                language,
                stdin,
            };

            const response = await fetch("/api/execute", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(requestBody),
            });

            if (!response.ok) {
                const errorData = (await response.json()) as ApiErrorResponse;
                throw new Error(errorData.error || "Failed to execute code");
            }

            const data = (await response.json()) as ExecuteResponse;

            const parts: string[] = [];
            if (data.status && data.status !== "OK") {
                parts.push(`[${STATS_LABELS[data.status]}]`);
            }
            if (data.stdout) parts.push(data.stdout);
            if (data.stderr) parts.push(data.stderr);
            if (data.time) parts.push(`[Execution time: ${data.time}s]`);
            if (data.memory) parts.push(`[Memory used: ${data.memory}KB]`);

            setOutput(
                parts.length > 0
                    ? parts.join("\n")
                    : "No output or error received from compiler",
            );
        } catch (err) {
            setOutput(
                err instanceof Error ? err.message : "An error occurred.",
            );
        } finally {
            setIsRunning(false);
        }
    };

    const handleCopyInvite = async (type: "link" | "code") => {
        await navigator.clipboard.writeText(
            type === "link" ? window.location.href : roomId,
        );
        setCopied(true);
        setTimeout(() => {
            setCopied(false);
        }, 2000);
    };

    const leaveRoom = () => {
        router.push("/");
    };

    return (
        <div className="flex flex-col h-screen p-3 gap-3">
            {/* Toolbar */}
            <div className="flex items-center gap-2 flex-wrap">
                {/* Left cluster */}
                <Sheet>
                    <SheetTrigger
                        render={
                            <Button variant="outline" className="gap-2">
                                <UsersIcon className="h-4 w-4" />
                                <span>Show Members</span>
                            </Button>
                        }
                    />
                    <SheetContent side="left" className="w-64 pt-12">
                        <ScrollArea className="h-full">
                            <div className="flex flex-col gap-1.5 px-4">
                                {users.map((user) => (
                                    <div
                                        key={user.clientId}
                                        className="flex items-center gap-2.5 px-3 py-2 border"
                                    >
                                        <span
                                            className="h-6 w-6 rounded-full flex items-center justify-center text-xs font-medium text-white shrink-0"
                                            style={{
                                                backgroundColor: user.color,
                                            }}
                                        >
                                            {user.name[0]}
                                        </span>
                                        <span className="text-sm truncate">
                                            {user.name === name
                                                ? `${user.name} (You)`
                                                : user.name}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>
                    </SheetContent>
                </Sheet>

                <Select
                    value={language}
                    onValueChange={(val) => {
                        if (val) setLanguage(val);
                    }}
                >
                    <SelectTrigger className="w-36 h-9">
                        <SelectValue placeholder="Language">
                            {
                                SUPPORTED_LANGUAGES.find(
                                    (lang) => lang.value === language,
                                )?.label
                            }
                        </SelectValue>
                    </SelectTrigger>
                    <SelectContent className="w-63">
                        {SUPPORTED_LANGUAGES.map((lang) => (
                            <SelectItem key={lang.value} value={lang.value}>
                                {lang.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <Button
                    onClick={() => void handleRun()}
                    disabled={isRunning}
                    className="gap-1.5"
                >
                    {isRunning ? (
                        <CircleNotchIcon className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                        <>
                            <PlayIcon className="h-3.5 w-3.5" />
                            Run
                        </>
                    )}
                </Button>

                {/* Right: invite and leave */}
                <div className="sm:ml-auto gap-2 flex items-center">
                    <DropdownMenu>
                        <DropdownMenuTrigger
                            render={
                                <Button
                                    variant="outline"
                                    className="gap-2 w-33"
                                >
                                    {copied ? (
                                        <CheckIcon className="h-4 w-4" />
                                    ) : (
                                        <CopyIcon className="h-4 w-4" />
                                    )}
                                    {copied ? "Copied!" : "Invite"}
                                    <CaretDownIcon className="h-3.5 w-3.5" />
                                </Button>
                            }
                        />
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem
                                onClick={() => void handleCopyInvite("link")}
                                className="gap-2"
                            >
                                <LinkIcon className="h-4 w-4" />
                                Copy Invite Link
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={() => void handleCopyInvite("code")}
                                className="gap-2"
                            >
                                <HashIcon className="h-4 w-4" />
                                Copy Room Code
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    <Button
                        variant="destructive"
                        onClick={leaveRoom}
                        className="gap-2 w-24"
                    >
                        <SignOutIcon className="h-4 w-4" />
                        Leave
                    </Button>
                </div>
            </div>

            {/* Main content */}
            <div className="flex flex-1 min-h-0 gap-3 flex-col md:flex-row">
                {/* Editor */}
                <div className="flex-1 overflow-hidden min-h-[40vh] md:min-h-0">
                    <RealtimeMonaco
                        connectOnMount={connectOnMount}
                        language={language}
                        height="100%"
                        theme="dark"
                        onChange={setCode}
                    />
                </div>

                {/* Input / Output */}
                <div className="flex flex-col gap-3 w-full md:w-2/5 shrink-0">
                    {/* stdin */}
                    <div className="flex flex-col border overflow-hidden">
                        <div className="flex items-center gap-1 px-2 py-2 border-b bg-muted text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                            <CaretRightIcon className="h-3.5 w-3.5" />
                            Input
                        </div>
                        <Textarea
                            value={stdin}
                            onChange={(e) => {
                                setStdin(e.target.value);
                            }}
                            placeholder="stdin…"
                            className="resize-none rounded-none border-0 text-xs font-mono focus-visible:ring-0 focus-visible:ring-offset-0 min-h-24"
                        />
                    </div>

                    {/* stdout */}
                    <div className="flex flex-col flex-1 border overflow-hidden min-h-32">
                        <div className="flex items-center px-3 py-2 border-b bg-muted">
                            <span className="flex items-center gap-1 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                                <TerminalIcon className="h-3.5 w-3.5" />
                                Output
                            </span>
                            {output && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                        setOutput("");
                                    }}
                                    className="ml-auto h-3 px-2 text-xs"
                                >
                                    Clear
                                </Button>
                            )}
                        </div>
                        <ScrollArea className="flex-1 min-h-0">
                            <pre className="p-3 font-mono whitespace-pre-wrap wrap-break-word text-sm">
                                {output || (
                                    <span className="text-muted-foreground">
                                        Output will appear here…
                                    </span>
                                )}
                            </pre>
                        </ScrollArea>
                    </div>
                </div>
            </div>
        </div>
    );
}
