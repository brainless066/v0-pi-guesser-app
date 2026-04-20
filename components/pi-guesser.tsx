"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { PI_DIGITS } from "@/lib/pi-digits";

export function PiGuesser() {
  // Position in PI_DIGITS (0 = first digit after decimal, which is '1')
  // We start showing "3.14" so position starts at 2 (after '1' and '4')
  const [position, setPosition] = useState(2);
  const [wrongGuess, setWrongGuess] = useState<number | null>(null);
  const [gameOver, setGameOver] = useState(false);
  const [shake, setShake] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Get the digits we've revealed so far
  const revealedDigits = PI_DIGITS.slice(0, position);

  // Format digits into groups of 5 for readability
  const formatDigits = useCallback((digits: string) => {
    const groups: string[] = [];
    for (let i = 0; i < digits.length; i += 5) {
      groups.push(digits.slice(i, i + 5));
    }
    return groups;
  }, []);

  // Auto-scroll to bottom when new digits are added
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [position]);

  const handleGuess = useCallback(
    (digit: number) => {
      if (gameOver) return;

      const correctDigit = parseInt(PI_DIGITS[position]);

      if (digit === correctDigit) {
        setPosition((p) => p + 1);
        setWrongGuess(null);
      } else {
        setWrongGuess(digit);
        setGameOver(true);
        setShake(true);
        setTimeout(() => setShake(false), 500);
      }
    },
    [position, gameOver]
  );

  const handleReset = useCallback(() => {
    setPosition(2);
    setWrongGuess(null);
    setGameOver(false);
    setShake(false);
  }, []);

  // Keyboard support
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key >= "0" && e.key <= "9") {
        handleGuess(parseInt(e.key));
      } else if (e.key === "Enter" && gameOver) {
        handleReset();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleGuess, handleReset, gameOver]);

  const formattedGroups = formatDigits(revealedDigits);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 p-4">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-foreground sm:text-4xl">
          π Digit Guesser
        </h1>
        <p className="mt-2 text-muted-foreground">
          Guess the next digit of Pi!
        </p>
      </div>

      {/* Stats */}
      <div className="flex gap-6 text-center">
        <div>
          <div className="text-2xl font-bold text-foreground sm:text-3xl">
            {position + 1}
          </div>
          <div className="text-sm text-muted-foreground">Digits Correct</div>
        </div>
        <div className="h-12 w-px bg-border" />
        <div>
          <div className="text-2xl font-bold text-foreground sm:text-3xl">
            {position - 1}
          </div>
          <div className="text-sm text-muted-foreground">After Decimal</div>
        </div>
      </div>

      {/* Pi display */}
      <div
        className={`w-full max-w-2xl rounded-lg border bg-card p-4 shadow-sm ${shake ? "animate-shake" : ""}`}
      >
        <div
          ref={scrollRef}
          className="max-h-64 overflow-y-auto font-mono text-lg sm:text-xl"
        >
          <span className="text-foreground">3.</span>
          <span className="text-foreground">
            {formattedGroups.map((group, i) => (
              <span key={i}>
                {group}
                {i < formattedGroups.length - 1 && (
                  <span className="text-muted-foreground/30">{" "}</span>
                )}
              </span>
            ))}
          </span>
          {!gameOver && (
            <span className="inline-block w-3 animate-pulse bg-primary/20 text-center">
              _
            </span>
          )}
          {gameOver && wrongGuess !== null && (
            <span className="text-destructive">{wrongGuess}</span>
          )}
        </div>
      </div>

      {/* Wrong guess feedback */}
      {gameOver && wrongGuess !== null && (
        <div className="text-center">
          <p className="text-lg text-destructive">
            Wrong! The correct digit was{" "}
            <span className="font-bold">{PI_DIGITS[position]}</span>
          </p>
          <p className="mt-1 text-muted-foreground">
            You memorized {position + 1} digits of Pi!
          </p>
        </div>
      )}

      {/* Number pad */}
      <div className="grid grid-cols-5 gap-2 sm:gap-3">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map((digit) => (
          <Button
            key={digit}
            variant={gameOver ? "secondary" : "outline"}
            size="lg"
            className={`h-14 w-14 text-xl font-semibold sm:h-16 sm:w-16 sm:text-2xl ${
              digit === 0 ? "col-start-3" : ""
            }`}
            onClick={() => handleGuess(digit)}
            disabled={gameOver}
          >
            {digit}
          </Button>
        ))}
      </div>

      {/* Reset button */}
      {gameOver && (
        <Button onClick={handleReset} size="lg" className="mt-2">
          Try Again
        </Button>
      )}

      {/* Keyboard hint */}
      <p className="text-sm text-muted-foreground">
        Tip: Use your keyboard number keys to guess faster!
      </p>
    </div>
  );
}
