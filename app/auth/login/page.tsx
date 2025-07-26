// app/auth/login/page.tsx
"use client";

import React, { useState, useRef, useEffect } from "react"; // Import useEffect
import Link from "next/link";
import { motion, Transition, HTMLMotionProps, useMotionValue, useTransform } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, Lock, Sparkles, Github } from "lucide-react";
import { cn } from "@/lib/utils";
import { FcGoogle } from "react-icons/fc";
import { TypewriterEffect } from "@/components/ui/typewriter-effect";
import { Lora } from "next/font/google";
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';

const lora = Lora({
  subsets: ["latin"],
  weight: ["400", "700"],
});

// Helper components from SignupFormDemo
const BottomGradient = () => {
  return (
    <>
      <span className="absolute inset-x-0 -bottom-px block h-px w-full bg-gradient-to-r from-transparent via-cyan-500 to-transparent opacity-0 transition duration-500 group-hover/btn:opacity-100" />
      <span className="absolute inset-x-10 -bottom-px mx-auto block h-px w-1/2 bg-gradient-to-r from-transparent via-indigo-500 to-transparent opacity-0 blur-sm transition duration-500 group-hover/btn:opacity-100" />
    </>
  );
};

// LabelInputContainer is a motion.div
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

// New DraggableOverlayCard component
interface DraggableOverlayCardProps {
  title: string;
  image: string;
  initialX: number;
  initialY: number;
  initialRotate: number;
  onDragComplete: () => void;
  isRevealed: boolean; // This prop will now correctly reflect the card's revealed state
}

const DraggableOverlayCard: React.FC<DraggableOverlayCardProps> = ({
  title,
  image,
  initialX,
  initialY,
  initialRotate,
  onDragComplete,
  isRevealed,
}) => {
  const x = useMotionValue(initialX); // Initialize motion values with initial positions
  const y = useMotionValue(initialY);
  const rotate = useMotionValue(initialRotate);

  // Define a threshold for dragging off-screen
  const dragThreshold = 200; // pixels

  // Opacity and scale based on drag distance (for the "pull away" effect)
  // const dragOpacity = useTransform(
  //   [x, y],
  //   (latestX, latestY) => {
  //     const distance = Math.sqrt(latestX * latestX + latestY * latestY);
  //     // Only apply drag-based opacity if the card is NOT yet revealed
  //     return isRevealed ? 0 : Math.max(0, 1 - distance / (dragThreshold * 2));
  //   }
  // );
  // const dragScale = useTransform(
  //   [x, y],
  //   (latestX, latestY) => {
  //     const distance = Math.sqrt(latestX * latestX + latestY * latestY);
  //     // Only apply drag-based scale if the card is NOT yet revealed
  //     return isRevealed ? 0.8 : Math.max(0.5, 1 - distance / (dragThreshold * 3));
  //   }
  // );

  return (
    <motion.div
      className="absolute cursor-grab rounded-lg overflow-hidden shadow-xl border border-neutral-700 bg-neutral-900/80 flex flex-col items-center justify-center p-4"
      style={{
        x, // Bind motion value x
        y, // Bind motion value y
        rotate,
        // opacity: dragOpacity, // Use drag-based opacity
        // scale: dragScale, // Use drag-based scale
        width: 300, // Fixed width for cards
        height: 380, // Fixed height for cards
        pointerEvents: isRevealed ? 'none' : 'auto', // Disable pointer events when revealed
      }}
      drag
      dragConstraints={{ left: -500, right: 500, top: -500, bottom: 500 }} // Allow dragging anywhere
      onDragEnd={(event, info) => {
        const distanceDragged = Math.sqrt(info.offset.x * info.offset.x + info.offset.y * info.offset.y);
        if (distanceDragged > dragThreshold) {
          onDragComplete(); // Call the parent's handler to mark this card as revealed
        } else {
          // Snap back if not dragged far enough
          x.set(initialX); // Snap back to initial position
          y.set(initialY); // Snap back to initial position
          rotate.set(initialRotate); // Reset rotation as well
        }
      }}
      transition={{ type: "spring", stiffness: 200, damping: 20 }}
      whileTap={{ cursor: "grabbing", scale: 1.05 }}
      // Animate based on isRevealed prop
      animate={{
        opacity: isRevealed ? 0 : 1, // Explicitly animate opacity to 0 when revealed
        scale: isRevealed ? 0.8 : 1, // Explicitly animate scale when revealed
        x: isRevealed ? x.get() + (x.get() > 0 ? 1000 : -1000) : initialX, // Animate off-screen
        y: isRevealed ? y.get() + (y.get() > 0 ? 1000 : -1000) : initialY, // Animate off-screen
        transition: { duration: 0.5, ease: "easeOut" }
      }}
      initial={{ opacity: 0, scale: 0.5 }} // Initial entry animation for cards
    >
      <img
        src={image}
        alt={title}
        className="pointer-events-none relative z-10 h-75 w-65 object-cover rounded-md"
      />
      <h3 className="mt-4 text-center text-lg font-bold text-white">
        {title}
      </h3>
    </motion.div>
  );
};


export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginStatus, setLoginStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null); // State to display backend errors
  // Use a Set to track revealed card indices for efficient lookup
  const [revealedCardIndices, setRevealedCardIndices] = useState<Set<number>>(new Set());

  const router = useRouter();

  // Refs for inputs to dynamically change type
  const emailInputRef = useRef<HTMLInputElement>(null);
  const passwordInputRef = useRef<HTMLInputElement>(null);

  // Effect to change input types after a short delay
  useEffect(() => {
    const timer = setTimeout(() => {
      if (emailInputRef.current) {
        emailInputRef.current.type = "email";
      }
      if (passwordInputRef.current) {
        passwordInputRef.current.type = "password";
      }
    }, 100); // Small delay

    return () => clearTimeout(timer);
  }, []); // Run once on mount


  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoginStatus("loading");
    setErrorMessage(null); // Clear any previous error messages

    console.log("Attempting login with NextAuth signIn:", { email, password });

    // --- REPLACE DUMMY LOGIC WITH ACTUAL NEXTAUTH signIn ---
    const result = await signIn('credentials', { // 'credentials' matches your provider ID in authOptions
      email,
      password,
      redirect: false, // Important! Prevents NextAuth from redirecting automatically on error.
                         // We handle success/error redirection ourselves.
    });
    // --- END NEXTAUTH signIn INTEGRATION ---

    if (result?.ok) {
      setLoginStatus("success");
      console.log("Login successful!", result);
      setErrorMessage(null); // Clear error message on success
      // In a real app, redirect here:
      router.push('/dashboard'); // Or wherever your protected route is
    } else {
      setLoginStatus("error");
      // NextAuth provides an error message in result.error
      const nextAuthErrorMessage = result?.error || "An unknown login error occurred.";
      console.error("Login failed:", nextAuthErrorMessage);
      setErrorMessage(nextAuthErrorMessage); // Set the error message to display to the user
    }
  };

  // Define direct animation props for the main form container
  const mainFormInitial = { opacity: 0, y: 100, scale: 0.8 };
  const mainFormAnimate =
    loginStatus === "error"
      ? { x: [0, -10, 10, -10, 10, 0], transition: { duration: 0.4, ease: "easeInOut" } as Transition }
      : loginStatus === "success"
      ? { scale: 1.05, opacity: 0, y: -50, transition: { duration: 0.5, ease: "easeOut" } as Transition }
      : {
          opacity: 1,
          y: 0,
          scale: 1,
          transition: {
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

  // Items for the draggable cards (copied from DraggableCardDemo)
  const draggableItems = [
    {
      title: "Tyler Durden",
      image:
        "https://images.unsplash.com/photo-1732310216648-603c0255c000?q=80&w=3540&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      initialX: -400, initialY: -100, initialRotate: -5,
    },
    {
      title: "The Narrator",
      image:
        "https://images.unsplash.com/photo-1697909623564-3dae17f6c20b?q=80&w=2667&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      initialX: 150, initialY: 130, initialRotate: 7,
    },
    {
      title: "Iceland",
      image:
        "https://images.unsplash.com/photo-1501854140801-50d01698950b?q=80&w=2600&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      initialX: -180, initialY: 150, initialRotate: -5,
    },
    {
      title: "Japan",
      image:
        "https://images.unsplash.com/photo-1518173946687-a4c8892bbd9f?q=80&w=3648&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      initialX: 150, initialY: -80, initialRotate: 10,
    },
    {
      title: "New Zealand",
      image:
        "https://images.unsplash.com/photo-1505142468610-359e7d316be0?q=80&w=3070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      initialX: 350, initialY: -30, initialRotate: -3,
    },
    {
      title: "Norway",
      image:
        "https://images.unsplash.com/photo-1421789665209-c9b2a435e3dc?q=80&w=3542&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      initialX: -20, initialY: -150, initialRotate: -2,
    },
    {
      title: "Canada",
      image:
        "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?q=80&w=2560&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      initialX: -250, initialY: -10, initialRotate: 4,
    },
  ];

  const totalCards = draggableItems.length;
  // Form is revealed if all cards have been dragged away
  const isFormRevealed = revealedCardIndices.size >= totalCards;

  // Function to mark a specific card as revealed
  const handleCardDragComplete = (index: number) => {
    setRevealedCardIndices((prev) => new Set(prev).add(index));
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-black overflow-hidden p-4">
      {/* Draggable Cards Container - positioned ABOVE the form */}
      {/* Only show cards if the form is not yet fully revealed */}
      {!isFormRevealed && (
        <div className="absolute inset-0 z-30 flex items-center justify-center overflow-clip">
          {/* Heading to instruct user */}
          {/* Heading to instruct user */}
          <TypewriterEffect
            text="I have cities, but no houses. I have mountains, but no trees. I have water, but no fish. What am I?"
            className={`absolute top-1/4 mx-auto max-w-sm text-center text-cyan-200 text-3xl md:text-5xl z-40 pointer-events-none ${lora.className}`}
          />

          {/* New instruction text */}
          <motion.p
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="absolute bottom-1/4 mx-auto text-center text-lg text-pink-300 md:text-xl z-40 pointer-events-none"
          >
            **Drag a card to find the answer.**
          </motion.p>

          {draggableItems.map((item, index) => (
            <DraggableOverlayCard
              key={index}
              title={item.title}
              image={item.image}
              initialX={item.initialX}
              initialY={item.initialY}
              initialRotate={item.initialRotate}
              onDragComplete={() => handleCardDragComplete(index)} // Pass the index of the completed card
              isRevealed={revealedCardIndices.has(index)} // Pass the individual revealed state
            />
          ))}
        </div>
      )}


      {/* Overlay for subtle darkening and texture - between cards and form */}
      {/* This overlay should only be visible if the form is NOT revealed */}
      {!isFormRevealed && (
        <div className="absolute inset-0 z-25 bg-black/50 pointer-events-none" />
      )}


      {/* Login Form Container - positioned BELOW the cards */}
      <motion.div
        initial={mainFormInitial}
        // Animate form entry only when it's revealed
        animate={isFormRevealed ? mainFormAnimate : { opacity: 0, y: 100, scale: 0.8 }}
        key={loginStatus}
        className="shadow-input mx-auto w-full max-w-md rounded-none bg-black p-4 md:rounded-2xl md:p-8 relative z-20" // Added relative z-20 for layering
      >
        {loginStatus === "success" ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 } as Transition}
            className="flex flex-col items-center justify-center h-full py-16 text-center"
          >
            <Sparkles className="text-green-400 mb-6" size={64} />
            <h2 className="text-4xl font-bold text-white mb-4">Login Successful!</h2>
            <p className="text-neutral-300 text-lg">Redirecting to your dashboard...</p>
          </motion.div>
        ) : (
          <>
            <motion.h2
              initial={itemInitial}
              animate={itemAnimate}
              transition={{ ...itemTransition, delay: 0.6 }}
              className="text-xl font-bold text-neutral-200 text-center mb-2"
            >
              Welcome to Aceternity
            </motion.h2>
            <motion.p
              initial={itemInitial}
              animate={itemAnimate}
              transition={{ ...itemTransition, delay: 0.7 }}
              className="mt-2 max-w-sm text-sm text-neutral-300 text-center mb-8"
            >
              Login to Aceternity if you can because we don&apos;t have a login flow yet
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
                  ref={emailInputRef} // Attach ref
                  id="email"
                  placeholder="projectmayhem@fc.com"
                  type="text" // Initial type is text
                  className="w-full rounded-md border-none relative block bg-zinc-800 px-4 py-2 text-white placeholder-neutral-500 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-neutral-500 transition-all duration-200"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="off"
                  disabled={loginStatus === "loading"}
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
                  ref={passwordInputRef} // Attach ref
                  id="password"
                  placeholder="••••••••"
                  type="text" // Initial type is text
                  className="w-full rounded-md border-none relative block bg-zinc-800 px-4 py-2 text-white placeholder-neutral-500 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-neutral-500 transition-all duration-200"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="off"
                  disabled={loginStatus === "loading"}
                />
              </LabelInputContainer>

              {/* Forgot Password Link */}
              <motion.div
                initial={itemInitial}
                animate={itemAnimate}
                transition={{ ...itemTransition, delay: 1.0 }}
                className="text-right pb-0.1"
              >
                <Link href="/auth/forgot-password">
                  <motion.p
                    className="text-sm text-blue-400 hover:text-blue-300 transition-colors pb-4"
                    whileHover={{ x: 2 }}
                  >
                    Forgot Password?
                  </motion.p>
                </Link>
              </motion.div>

              {/* Login Button */}
              <motion.button
                className="group/btn relative block h-10 w-full rounded-md bg-gradient-to-br from-black to-neutral-600 font-medium text-white shadow-[0px_1px_0px_0px_#ffffff40_inset,0px_-1px_0px_0px_#ffffff40_inset] dark:bg-zinc-800 dark:from-zinc-900 dark:to-zinc-900 dark:shadow-[0px_1px_0px_0px_#27272a_inset,0px_-1px_0px_0px_#27272a_inset]"
                type="submit"
                whileHover={submitButtonHover}
                whileTap={submitButtonTap}
                animate={loginStatus === "loading" ? submitButtonLoadingAnimate : {}}
                disabled={loginStatus === "loading"}
              >
                {loginStatus === "loading" ? (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    Authenticating...
                  </motion.span>
                ) : (
                  "Sign in &rarr;"
                )}
                <BottomGradient />
              </motion.button>

                {loginStatus === "error" && errorMessage && ( // Add errorMessage check
                  <motion.p
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 } as Transition}
                    className="text-red-500 text-center text-sm mt-4"
                  >
                    {errorMessage} {/* <--- Display the dynamic errorMessage */}
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

            {/* Register Link */}
            <motion.p
              initial={itemInitial}
              animate={itemAnimate}
              transition={{ ...itemTransition, delay: 1.1 }}
              className="mt-8 text-center text-neutral-400"
            >
              Don't have an account?{" "}
              <Link href="/auth/register">
                <motion.span
                  className="font-medium text-blue-500 hover:text-blue-400 transition-colors"
                  whileHover={{ scale: 1.05 }}
                >
                  Sign Up
                </motion.span>
              </Link>
            </motion.p>
          </>
        )}
      </motion.div>
    </div>
  );
}
