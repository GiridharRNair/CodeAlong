import type { SupabasePersistenceOptions } from "@supabase-labs/y-supabase";
import { Awareness } from "y-protocols/awareness";

interface UseConnectOnMountOptions {
    name: string;
    channel: string;
    persistence?: boolean | SupabasePersistenceOptions;
    awareness?: boolean | Awareness;
}

export type { UseConnectOnMountOptions };
