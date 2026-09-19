"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";

export default function Home() {
  const router = useRouter();
  const { isSignedIn, isLoaded } = useUser();

  useEffect(() => {
    if (isLoaded) {
      router.replace(isSignedIn ? "/editor" : "/sign-in");
    }
  }, [isLoaded, isSignedIn, router]);

  return null;
}
