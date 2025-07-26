// app/auth/register/page.tsx
"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion, Transition, HTMLMotionProps } from "framer-motion";
import { Input } from "@/components/ui/input"; // Assuming shadcn/ui Input
import { Label } from "@/components/ui/label"; // Assuming shadcn/ui Label
import { Button } from "@/components/ui/button"; // Assuming shadcn/ui Button
import { Mail, Lock, Sparkles, Github } from "lucide-react"; // Sparkles re-added for success state
import { cn } from "@/lib/utils"; // Assuming you have a cn utility
import { FcGoogle } from "react-icons/fc"; // Imported FcGoogle for Google icon
// import { motion } from "motion/react";
import { AuroraBackground } from "@/components/ui/aurora-background";
import { useRouter } from "next/navigation";

// Helper components (copied from LoginPage for consistency)
const BottomGradient = () => {
  return (
    <>
      <span className="absolute inset-x-0 -bottom-px block h-px w-full bg-gradient-to-r from-transparent via-cyan-500 to-transparent opacity-0 transition duration-500 group-hover/btn:opacity-100" />
      <span className="absolute inset-x-10 -bottom-px mx-auto block h-px w-1/2 bg-gradient-to-r from-transparent via-indigo-500 to-transparent opacity-0 blur-sm transition duration-500 group-hover/btn:opacity-100" />
    </>
  );
};

const LabelInputContainer = ({
  children,
  className,
  ...rest
}: {
  children: React.ReactNode;
  className?: string;
} & HTMLMotionProps<"div">) => {
  return (
    <motion.div
      className={cn("flex w-full flex-col space-y-2", className)}
      {...rest}
    >
      {children}
    </motion.div>
  );
};

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [registerStatus, setRegisterStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setRegisterStatus("loading");
    setErrorMessage(null); // Clear previous errors

    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match.");
      setRegisterStatus("error");
      return;
    }

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      console.log(data)
      if (response.ok) {
        setRegisterStatus("success");
        console.log("Registration successful!", data);
        // In a real app, you might redirect to login or dashboard
        // router.push('/auth/login');
      } else {
        setErrorMessage(data.error || "Registration failed.");
        setRegisterStatus("error");
        console.error("Registration failed:", data.error);
        router.push("/login");
      }
    } catch (error) {
      setErrorMessage("An unexpected error occurred.");
      setRegisterStatus("error");
      console.error("Registration error:", error);
    }
  };

  // Define direct animation props for the main form container
  const mainFormInitial = { opacity: 0, y: 100, scale: 0.8 };
  const mainFormAnimate =
    registerStatus === "error"
      ? { x: [0, -10, 10, -10, 10, 0], transition: { duration: 0.4, ease: "easeInOut" } as Transition }
      : registerStatus === "success"
      ? { scale: 1.05, opacity: 0, y: -50, transition: { duration: 0.5, ease: "easeOut" } as Transition }
      : {
          opacity: 1,
          y: 0,
          scale: 1,
          transition: {
            type: "spring",
            stiffness: 100,
            damping: 15,
            delay: 0.5,
          } as Transition,
        };

  // Define direct animation props for individual form items
  const itemInitial = { opacity: 0, y: 20 };
  const itemAnimate = { opacity: 1, y: 0 };
  const itemTransition = {
    stiffness: 100,
    damping: 10
  } as Transition;

  // Define direct animation props for the main submit button
  const submitButtonHover = {
    scale: 1.005,
    boxShadow: "0px 0px 8px rgba(59, 130, 246, 0.4)",
    transition: { duration: 0.2, ease: "easeOut" } as Transition,
  };
  const submitButtonTap = { scale: 0.99 };
  const submitButtonLoadingAnimate = {
    scale: [1, 1.01, 1],
    rotate: [0, 1, -1, 0],
    transition: { repeat: Infinity, duration: 0.6, ease: "linear" } as Transition,
  };

  return (
    <AuroraBackground>
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden p-4">
      {/* No draggable cards on register page, just a solid black background */}
      <div className="absolute inset-0 z-10  pointer-events-none" />

      {/* Register Form Container */}
      <motion.div
        initial={mainFormInitial}
        animate={mainFormAnimate}
        key={registerStatus}
        className="shadow-input mx-auto w-full max-w-md rounded-none bg-black p-4 md:rounded-2xl md:p-8 relative z-20"
      >
        {registerStatus === "success" ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 } as Transition}
            className="flex flex-col items-center justify-center h-full py-16 text-center"
          >
            <Sparkles className="text-green-400 mb-6" size={64} />
            <h2 className="text-4xl font-bold text-white mb-4">Registration Successful!</h2>
            <p className="text-neutral-300 text-lg">You can now log in.</p>
            <Link href="/auth/login">
              <Button className="mt-6 bg-blue-600 hover:bg-blue-700">Go to Login</Button>
            </Link>
          </motion.div>
        ) : (
          <>
            <motion.h2
              initial={itemInitial}
              animate={itemAnimate}
              transition={{ ...itemTransition, delay: 0.6 }}
              className="text-xl font-bold text-neutral-200 text-center mb-2"
            >
              Register Your New Identity
            </motion.h2>
            <motion.p
              initial={itemInitial}
              animate={itemAnimate}
              transition={{ ...itemTransition, delay: 0.7 }}
              className="mt-2 max-w-sm text-sm text-neutral-300 text-center mb-8"
            >
              Create an account to delve deeper into the system.
            </motion.p>

            <form onSubmit={handleSubmit} className="my-8">
              {/* Email Field */}
              <LabelInputContainer
                initial={itemInitial}
                animate={itemAnimate}
                transition={{ ...itemTransition, delay: 0.8 }}
                className="mb-4"
              >
                <Label htmlFor="email" className="text-neutral-300">Email Address</Label>
                <Input
                  id="email"
                  placeholder="your.new.identity@matrix.com"
                  type="email"
                  className="w-full rounded-md border-none relative block bg-zinc-800 px-4 py-2 text-white placeholder-neutral-500 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-neutral-500 transition-all duration-200"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="new-email" // Suggest new email for autofill
                  disabled={registerStatus === "loading"}
                />
              </LabelInputContainer>

              {/* Password Field */}
              <LabelInputContainer
                initial={itemInitial}
                animate={itemAnimate}
                transition={{ ...itemTransition, delay: 0.9 }}
                className="mb-4"
              >
                <Label htmlFor="password" className="text-neutral-300">Password</Label>
                <Input
                  id="password"
                  placeholder="••••••••••••"
                  type="password"
                  className="w-full rounded-md border-none relative block bg-zinc-800 px-4 py-2 text-white placeholder-neutral-500 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-neutral-500 transition-all duration-200"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password" // Suggest new password for autofill
                  disabled={registerStatus === "loading"}
                />
              </LabelInputContainer>

              {/* Confirm Password Field */}
              <motion.div
                initial={itemInitial}
                animate={itemAnimate}
                transition={{ ...itemTransition, delay: 1.0 }}
                className="mb-8"
              >
                <Label htmlFor="confirmPassword" className="text-neutral-300">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  placeholder="••••••••••••"
                  type="password"
                  className="w-full rounded-md border-none relative block bg-zinc-800 px-4 py-2 text-white placeholder-neutral-500 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-neutral-500 transition-all duration-200"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  autoComplete="new-password" // Suggest new password for autofill
                  disabled={registerStatus === "loading"}
                />
              </motion.div>

              {/* Register Button */}
              <motion.button
                className="group/btn relative block h-10 w-full rounded-md bg-gradient-to-br from-black to-neutral-600 font-medium text-white shadow-[0px_1px_0px_0px_#ffffff40_inset,0px_-1px_0px_0px_#ffffff40_inset] dark:bg-zinc-800 dark:from-zinc-900 dark:to-zinc-900 dark:shadow-[0px_1px_0px_0px_#27272a_inset,0px_-1px_0px_0px_#27272a_inset]"
                type="submit"
                whileHover={submitButtonHover}
                whileTap={submitButtonTap}
                animate={registerStatus === "loading" ? submitButtonLoadingAnimate : {}}
                disabled={registerStatus === "loading"}
              >
                {registerStatus === "loading" ? (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    Registering...
                  </motion.span>
                ) : (
                  "Register &rarr;"
                )}
                <BottomGradient />
              </motion.button>

              {errorMessage && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 } as Transition}
                  className="text-red-500 text-center text-sm mt-4"
                >
                  {errorMessage}
                </motion.p>
              )}

              <div className="my-8 h-[1px] w-full bg-gradient-to-r from-transparent via-neutral-700 to-transparent" />

              <div className="flex flex-row space-x-5">
                {/* Social Login Buttons */}
                <motion.button
                  className="group/btn shadow-input relative flex h-10 w-full items-center justify-center space-x-2 rounded-md bg-zinc-900 px-4 font-medium text-white dark:shadow-[0px_0px_1px_1px_#262626]"
                  type="button"
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                >
                  <Github className="h-4 w-4 text-neutral-300" />
                  <span className="text-sm text-neutral-300">
                    GitHub
                  </span>
                  <BottomGradient />
                </motion.button>
                <motion.button
                  className="group/btn shadow-input relative flex h-10 w-full items-center justify-center space-x-2 rounded-md bg-zinc-900 px-4 font-medium text-white dark:shadow-[0px_0px_1px_1px_#262626]"
                  type="button"
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                >
                  <FcGoogle className="h-4 w-4 text-neutral-300" />
                  <span className="text-sm text-neutral-300">
                    Google
                  </span>
                  <BottomGradient />
                </motion.button>
              </div>
            </form>

            {/* Login Link */}
            <motion.p
              initial={itemInitial}
              animate={itemAnimate}
              transition={{ ...itemTransition, delay: 1.1 }}
              className="mt-8 text-center text-neutral-400"
            >
              Already have an account?{" "}
              <Link href="/auth/login">
                <motion.span
                  className="font-medium text-blue-500 hover:text-blue-400 transition-colors"
                  whileHover={{ scale: 1.05 }}
                >
                  Sign In
                </motion.span>
              </Link>
            </motion.p>
          </>
        )}
      </motion.div>
    </div>
    </AuroraBackground>
  );
}
