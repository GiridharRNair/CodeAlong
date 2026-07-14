"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { v4 as uuidv4, validate as uuidValidate } from "uuid";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
    Field,
    FieldDescription,
    FieldGroup,
    FieldSeparator,
    FieldSet,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";

export default function Home() {
    const router = useRouter();
    const [roomCode, setRoomCode] = useState("");

    const handleCreateRoom = () => {
        const roomId = uuidv4();
        router.push(`/room/${roomId}`);
    };

    const handleJoinRoom = () => {
        if (roomCode.trim() && uuidValidate(roomCode.trim())) {
            router.push(`/room/${roomCode.trim()}`);
        } else {
            toast.error("Please enter a valid room code");
        }
    };

    return (
        <div className="flex flex-col flex-1 h-screen items-center justify-center w-full">
            <Image
                src="/landing-page-visual.svg"
                alt="LandingPageVisual"
                width={1200}
                height={550}
                className="w-120 h-auto"
                priority
            />
            <form className="w-90">
                <FieldGroup>
                    <FieldSet>
                        <FieldGroup>
                            <Field>
                                <Input
                                    id="room-code-input"
                                    placeholder="Enter code"
                                    value={roomCode}
                                    onChange={(e) => {
                                        setRoomCode(e.target.value);
                                    }}
                                    required
                                />
                                <Button
                                    type="submit"
                                    className="w-full mt-2"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        handleJoinRoom();
                                    }}
                                >
                                    Join Room
                                </Button>
                            </Field>
                        </FieldGroup>
                    </FieldSet>

                    <FieldSeparator> or </FieldSeparator>

                    <FieldSet>
                        <FieldGroup>
                            <Field>
                                <Button
                                    type="button"
                                    onClick={handleCreateRoom}
                                    className="w-full"
                                >
                                    Create Room
                                </Button>
                                <FieldDescription className="text-center">
                                    No sign up. Free.{" "}
                                    <a
                                        href="https://github.com/GiridharRNair/CodeAlong"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                        Opensource
                                    </a>
                                    .
                                </FieldDescription>
                            </Field>
                        </FieldGroup>
                    </FieldSet>
                </FieldGroup>
            </form>
        </div>
    );
}
