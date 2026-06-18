import {
    uniqueNamesGenerator,
    adjectives,
    animals,
} from "unique-names-generator";
import type { Config } from "unique-names-generator";
import { useParams, Navigate, useNavigate } from "react-router";
import { validate as uuidValidate } from "uuid";
import { useState } from "react";

import { RealtimeMonaco } from "#components/realtime-monaco";
import { useConnectOnMount } from "#hooks/use-connect-on-mount";
import { compileCode } from "#services/compile-code";

import { Button } from "#components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "#components/ui/select";
import { Sheet, SheetContent, SheetTrigger } from "#components/ui/sheet";
import { ScrollArea } from "#components/ui/scroll-area";
import { Textarea } from "#components/ui/textarea";
import {
    Users,
    Play,
    Copy,
    Check,
    ChevronRight,
    Terminal,
    LoaderCircle,
    LogOut,
} from "lucide-react";
import { toast } from "sonner";

const config: Config = {
    dictionaries: [adjectives, animals],
    separator: " ",
    style: "capital",
};

const SUPPORTED_LANGUAGES = [
    { label: "Python 3.14.3", value: "python" },
    { label: "Java 26.0.2", value: "java" },
    { label: "C++ 17", value: "cpp" },
    { label: "TypeScript", value: "typescript" },
    { label: "Go 1.26.1", value: "go" },
    { label: "Rust", value: "rust" },
];

function Room() {
    const navigate = useNavigate();
    const { roomId } = useParams();
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
        return <Navigate to="/" replace />;
    }

    const handleRun = async () => {
        setIsRunning(true);
        setOutput("");
        try {
            if (!code.trim()) {
                toast.error("Code editor is empty");
                return;
            }

            const result = await compileCode(code, language, stdin);
            setOutput(result);
        } catch (err) {
            setOutput(
                err instanceof Error ? err.message : "An error occurred.",
            );
        } finally {
            setIsRunning(false);
        }
    };

    const handleCopyInvite = async () => {
        await navigator.clipboard.writeText(window.location.href);
        setCopied(true);
        setTimeout(() => {
            setCopied(false);
        }, 2000);
    };

    const leaveRoom = () => {
        void navigate("/");
    };

    return (
        <div className="flex flex-col h-screen p-3 gap-3">
            {/* Toolbar */}
            <div className="flex items-center gap-2 flex-wrap">
                {/* Left cluster */}
                <Sheet>
                    <SheetTrigger>
                        <Button variant="outline" className="gap-2">
                            <Users className="h-4 w-4" />
                            <span>Show Members</span>
                        </Button>
                    </SheetTrigger>
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
                    <SelectContent>
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
                        <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                        <>
                            <Play className="h-3.5 w-3.5" />
                            Run
                        </>
                    )}
                </Button>

                {/* Right: room ID and copy invite */}
                <div className="sm:ml-auto gap-2 flex items-center">
                    <div className="text-xs sm:text-sm font-mono text-muted-foreground">
                        {roomId}
                    </div>

                    <Button
                        variant="outline"
                        onClick={() => void handleCopyInvite()}
                        className="gap-2 w-33"
                    >
                        {copied ? (
                            <Check className="h-4 w-4" />
                        ) : (
                            <Copy className="h-4 w-4" />
                        )}
                        {copied ? "Copied!" : "Copy Invite"}
                    </Button>

                    <Button
                        variant="destructive"
                        onClick={leaveRoom}
                        className="gap-2 w-24"
                    >
                        <LogOut className="h-4 w-4" />
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
                            <ChevronRight className="h-3.5 w-3.5" />
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
                                <Terminal className="h-3.5 w-3.5" />
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

export default Room;
