// https://supabase.com/ui/docs/react/realtime-monaco

"use client";

import type { editor as MonacoEditor } from "monaco-editor";
import type { ConnectedUser } from "@models/connected_user";
import type { MonacoBinding } from "y-monaco";
import type { UseConnectOnMountOptions } from "@models/use_connect_on_mount_options";

import { useCallback, useEffect, useRef, useState } from "react";
import { Awareness } from "y-protocols/awareness";
import * as Y from "yjs";
import { toast } from "sonner";
import { SupabaseProvider } from "@supabase-labs/y-supabase";
import { createClient } from "@lib/supabase/client";

interface AwarenessUserState {
    user?: {
        color?: string;
        name?: string;
    };
}

const escapeCssString = (str: string): string =>
    str
        .replace(/\\/g, "\\\\")
        .replace(/"/g, '\\"')
        .replace(/[\r\n]/g, " ");

const generateRandomColor = () =>
    `hsl(${String(Math.floor(Math.random() * 360))}, 80%, 60%)`;

const SUPPORTED_LANGUAGES = [
    { value: "python", label: "Python" },
    { value: "java", label: "Java" },
    { value: "cpp", label: "C++" },
    { value: "javascript", label: "JavaScript" },
];

const BASE_CURSOR_PRESENCE_CSS = `
.yRemoteSelection {
    background-color: var(--y-remote-selection-color, rgba(0, 0, 0, 0.2));
    opacity: 0.2;
}
.yRemoteSelectionHead {
    border-left: 2px solid var(--y-remote-selection-color, rgba(0, 0, 0, 0.7));
    margin-left: -1px;
    box-sizing: border-box;
    position: relative;
}
.yRemoteSelectionHead::after {
    position: absolute;
    top: -1.4em;
    left: -2px;
    background-color: var(--y-remote-selection-color, rgba(0, 0, 0, 0.7));
    color: white;
    padding: 2px 6px;
    border-radius: 3px 3px 3px 0;
    font-size: 12px;
    font-family: sans-serif;
    white-space: nowrap;
    pointer-events: none;
    line-height: 1.2;
    font-weight: 500;
    opacity: 0;
    transition: opacity 0.15s ease;
}
.yRemoteSelectionHead:hover::after {
    opacity: 1;
}
`;

export function useConnectOnMount({
    name,
    channel,
    persistence,
    awareness = true,
}: UseConnectOnMountOptions) {
    const docRef = useRef<Y.Doc | null>(null);
    const providerRef = useRef<SupabaseProvider | null>(null);
    const bindingRef = useRef<MonacoBinding | null>(null);
    const userRef = useRef<{ color: string; name: string } | null>(null);
    const styleRef = useRef<HTMLStyleElement | null>(null);
    const providerAwarenessRef = useRef<Awareness | null>(null);
    const yMetaRef = useRef<Y.Map<string> | null>(null);
    const [users, setUsers] = useState<ConnectedUser[]>([]);
    const [languageState, setLanguageState] = useState<string>("python");

    const broadcastLanguageChange = useCallback((lang: string) => {
        if (yMetaRef.current) {
            yMetaRef.current.set("language", lang);
        }
    }, []);

    const syncLanguageChange = useCallback(() => {
        if (!yMetaRef.current) return;

        const lang = yMetaRef.current.get("language");
        if (lang && lang !== languageState) {
            setLanguageState(lang);
            const language =
                SUPPORTED_LANGUAGES.find((l) => l.value === lang)?.label ??
                lang;
            toast.info(`Language changed to ${language}`);
        }
    }, []);

    const fetchConnectedUsers = useCallback(() => {
        if (!providerAwarenessRef.current) return;

        const connectedUsers = Array.from(
            providerAwarenessRef.current.getStates().entries(),
        ).map(([clientId, state]) => {
            const userState = state as AwarenessUserState;
            return {
                clientId,
                color: userState.user?.color,
                name: userState.user?.name ?? "",
            };
        });

        setUsers(connectedUsers);
    }, []);

    const applyAwarenessStyles = useCallback(() => {
        if (!styleRef.current) {
            styleRef.current = document.createElement("style");
            styleRef.current.setAttribute("data-monaco-y-cursors", "true");
            document.head.appendChild(styleRef.current);
        }

        if (!providerAwarenessRef.current) return;

        let cssContent = BASE_CURSOR_PRESENCE_CSS;
        providerAwarenessRef.current.getStates().forEach((state, clientId) => {
            const userState = state as AwarenessUserState;

            const color = userState.user?.color;
            if (!color) return;
            const isValidHsl = /^hsl\(\d{1,3},\s*\d{1,3}%,\s*\d{1,3}%\)$/.test(
                color,
            );
            if (!isValidHsl) return;

            const userName = userState.user?.name;
            const safeUserName = escapeCssString(userName ?? "");

            const id = String(clientId);

            cssContent += `
              .yRemoteSelection-${id}, .yRemoteSelectionHead-${id} {
                --y-remote-selection-color: ${color};
              }
              .yRemoteSelectionHead-${id}::after {
                content: "${safeUserName}";
              }
            `;
        });

        styleRef.current.textContent = cssContent;
    }, []);

    const connectOnMount = useCallback(
        async (editor: MonacoEditor.IStandaloneCodeEditor) => {
            if (bindingRef.current) return;

            const model = editor.getModel();
            if (!model) return;

            const { MonacoBinding } = await import("y-monaco");

            const doc = new Y.Doc();
            const yText = doc.getText("monaco");
            const yMeta = doc.getMap<string>("metadata");
            yMetaRef.current = yMeta;
            yMeta.observe(syncLanguageChange);

            const supabase = createClient();
            const provider = new SupabaseProvider(channel, doc, supabase, {
                awareness,
                persistence,
            });

            const providerAwareness = provider.getAwareness();
            providerAwarenessRef.current = providerAwareness;

            if (providerAwareness) {
                fetchConnectedUsers();
                providerAwareness.on("change", fetchConnectedUsers);

                applyAwarenessStyles();
                providerAwareness.on("change", applyAwarenessStyles);

                userRef.current ??= {
                    color: generateRandomColor(),
                    name: name,
                };
                providerAwareness.setLocalStateField("user", userRef.current);
            }

            docRef.current = doc;
            providerRef.current = provider;
            bindingRef.current = new MonacoBinding(
                yText,
                model,
                new Set([editor]),
                providerAwareness,
            );
        },
        [
            channel,
            awareness,
            persistence,
            name,
            syncLanguageChange,
            fetchConnectedUsers,
            applyAwarenessStyles,
        ],
    );

    useEffect(() => {
        return () => {
            providerAwarenessRef.current?.off("change", applyAwarenessStyles);
            providerAwarenessRef.current?.off("change", fetchConnectedUsers);
            providerAwarenessRef.current?.setLocalStateField("user", null);
            providerAwarenessRef.current = null;
            yMetaRef.current?.unobserve(syncLanguageChange);
            yMetaRef.current = null;
            styleRef.current?.remove();
            styleRef.current = null;
            bindingRef.current?.destroy();
            bindingRef.current = null;
            providerRef.current?.destroy();
            providerRef.current = null;
            docRef.current?.destroy();
            docRef.current = null;
        };
    }, [applyAwarenessStyles, fetchConnectedUsers, syncLanguageChange]);

    return {
        connectOnMount,
        users,
        language: languageState,
        setLanguage: broadcastLanguageChange,
    };
}
