"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { HouseIcon } from "@phosphor-icons/react";

import { Button } from "@components/ui/button";

export default function NotFound() {
    const router = useRouter();

    const handleReturnHome = () => {
        router.push("/");
    };

    return (
        <div className="flex flex-col flex- h-screen items-center justify-center w-full">
            <Image
                src="/page-not-found.svg"
                alt="Page not found"
                width={1200}
                height={550}
                className="w-120 h-auto"
                priority
            />
            <Button variant="outline" onClick={handleReturnHome}>
                <HouseIcon className="h-4 w-4" />
                Return Home
            </Button>
        </div>
    );
}
