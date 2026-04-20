"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PI_DIGITS } from "@/lib/pi-digits";

const CHUNK_OPTIONS = [3, 4, 5, 10] as const;
const CHUNK_START_OPTIONS = [
  { label: "3.", value: "3.", prefix: "3." },
  { label: "3.14", value: "3.14", prefix: "3.14" },
  { label: "3", value: "3", prefix: "" },
] as const;
const STORAGE_KEY = "pi-guesser-chunk-size";
const STORAGE_KEY_CHUNK_START = "pi-guesser-chunk-start";
const STORAGE_KEY_SPEED = "pi-guesser-sim-speed";

const SPEED_OPTIONS = [
  { label: "Slow", ms: 100 },
  { label: "Fast", ms: 20 },
  { label: "Turbo", ms: 5 },
  { label: "Max", ms: 1 },
] as const;

export function PiGuesser() {
  // Position in PI_DIGITS (0 = first digit after decimal, which is '1')
  // We start showing "3.14" so position starts at 2 (after '1' and '4')
  const [position, setPosition] = useState(2);
  const [wrongGuess, setWrongGuess] = useState<number | null>(null);
  const [gameOver, setGameOver] = useState(false);
  const [shake, setShake] = useState(false);
  const [chunkSize, setChunkSize] = useState(5);
  const [chunkStart, setChunkStart] = useState<"3." | "3.14" | "3">("3.");
  const [simulating, setSimulating] = useState(false);
  const [simSpeed, setSimSpeed] = useState(20);
  const [wrongCount, setWrongCount] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const simulationRef = useRef<NodeJS.Timeout | null>(null);

  // Load chunk size and chunk start from localStorage on mount
  useEffect(() => {
    const savedSize = localStorage.getItem(STORAGE_KEY);
    if (savedSize) {
      const parsed = parseInt(savedSize);
      if (parsed >= 1 && parsed <= 100) {
        setChunkSize(parsed);
      }
    }
    const savedStart = localStorage.getItem(STORAGE_KEY_CHUNK_START);
    if (savedStart && ["3.", "3.14", "3"].includes(savedStart)) {
      setChunkStart(savedStart as "3." | "3.14" | "3");
    }
    const savedSpeed = localStorage.getItem(STORAGE_KEY_SPEED);
    if (savedSpeed) {
      const parsed = parseInt(savedSpeed);
      if (SPEED_OPTIONS.some((o) => o.ms === parsed)) {
        setSimSpeed(parsed);
      }
    }
  }, []);

  // Save chunk size to localStorage when it changes
  const handleChunkSizeChange = (size: number) => {
    setChunkSize(size);
    localStorage.setItem(STORAGE_KEY, size.toString());
  };

  // Save chunk start to localStorage when it changes
  const handleChunkStartChange = (start: "3." | "3.14" | "3") => {
    setChunkStart(start);
    localStorage.setItem(STORAGE_KEY_CHUNK_START, start);
  };

  // Save sim speed to localStorage when it changes
  const handleSimSpeedChange = (speed: number) => {
    setSimSpeed(speed);
    localStorage.setItem(STORAGE_KEY_SPEED, speed.toString());
  };

  // Get the prefix and offset based on chunk start option
  const getChunkStartConfig = () => {
    const option = CHUNK_START_OPTIONS.find((o) => o.value === chunkStart);
    if (!option) return { prefix: "3.", offset: 0 };
    
    // offset is how many digits are included in the prefix (after "3.")
    // "3." = 0 digits in prefix, "3.14" = 2 digits in prefix, "3" = includes 3 so -1 conceptually
    switch (chunkStart) {
      case "3.14":
        return { prefix: "3.14", offset: 2 };
      case "3":
        return { prefix: "", offset: -1 }; // -1 means include "3" in the chunked digits
      default:
        return { prefix: "3.", offset: 0 };
    }
  };

  const { prefix, offset } = getChunkStartConfig();

  // Get the digits we've revealed so far
  const revealedDigits = PI_DIGITS.slice(0, position);

  // Format digits into groups for readability, considering the chunk start offset
  const formatDigits = useCallback((digits: string, startOffset: number) => {
    // startOffset: number of digits already shown in the prefix
    // If offset is -1 (for "3" mode), we prepend "3" to the digits
    let digitsToFormat = digits;
    if (startOffset === -1) {
      digitsToFormat = "3" + digits;
    } else if (startOffset > 0) {
      // Skip the first 'offset' digits as they're in the prefix
      digitsToFormat = digits.slice(startOffset);
    }
    
    const groups: string[] = [];
    for (let i = 0; i < digitsToFormat.length; i += chunkSize) {
      groups.push(digitsToFormat.slice(i, i + chunkSize));
    }
    return groups;
  }, [chunkSize]);

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
        setWrongCount((c) => c + 1);
        setGameOver(true);
        setShake(true);
        setTimeout(() => setShake(false), 500);
      }
    },
    [position, gameOver]
  );

  const handleContinue = useCallback(() => {
    // Move past the wrong digit and continue
    setPosition((p) => p + 1);
    setWrongGuess(null);
    setGameOver(false);
  }, []);

  const handleReset = useCallback(() => {
    setPosition(2);
    setWrongGuess(null);
    setGameOver(false);
    setShake(false);
    setWrongCount(0);
    stopSimulation();
  }, []);

  const stopSimulation = useCallback(() => {
    if (simulationRef.current) {
      clearInterval(simulationRef.current);
      simulationRef.current = null;
    }
    setSimulating(false);
  }, []);

  const startSimulation = useCallback(() => {
    if (gameOver) {
      handleReset();
    }
    setSimulating(true);
  }, [gameOver, handleReset]);

  // Simulation effect
  useEffect(() => {
    if (simulating && !gameOver) {
      simulationRef.current = setInterval(() => {
        setPosition((p) => {
          if (p >= PI_DIGITS.length - 1) {
            stopSimulation();
            return p;
          }
          return p + 1;
        });
      }, simSpeed);
    }

    return () => {
      if (simulationRef.current) {
        clearInterval(simulationRef.current);
      }
    };
  }, [simulating, gameOver, simSpeed, stopSimulation]);

  // Keyboard support
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key >= "0" && e.key <= "9") {
        handleGuess(parseInt(e.key));
      } else if (e.key === "Enter" && gameOver) {
        handleContinue();
      } else if (e.key === "Escape" && gameOver) {
        handleReset();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleGuess, handleReset, handleContinue, gameOver]);

  const formattedGroups = formatDigits(revealedDigits, offset);

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
        <div className="h-12 w-px bg-border" />
        <div>
          <div className="text-2xl font-bold text-destructive sm:text-3xl">
            {wrongCount}
          </div>
          <div className="text-sm text-muted-foreground">Wrong Guesses</div>
        </div>
      </div>

      {/* Chunk settings */}
      <div className="flex flex-wrap items-center justify-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Group by:</span>
          <div className="flex gap-1">
            {CHUNK_OPTIONS.map((size) => (
              <Button
                key={size}
                variant={chunkSize === size ? "default" : "outline"}
                size="sm"
                className="h-8 w-10 text-sm"
                onClick={() => handleChunkSizeChange(size)}
              >
                {size}
              </Button>
            ))}
          </div>
          <Input
            type="number"
            min={1}
            max={100}
            value={chunkSize}
            onChange={(e) => {
              const val = parseInt(e.target.value);
              if (val >= 1 && val <= 100) {
                handleChunkSizeChange(val);
              }
            }}
            className="h-8 w-16 rounded-md border-dashed border-2 bg-muted/50 text-center text-sm font-mono focus:border-solid focus:border-primary"
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Start after:</span>
          <div className="flex gap-1">
            {CHUNK_START_OPTIONS.map((option) => (
              <Button
                key={option.value}
                variant={chunkStart === option.value ? "default" : "outline"}
                size="sm"
                className="h-8 px-3 text-sm font-mono"
                onClick={() => handleChunkStartChange(option.value)}
              >
                {option.label}
              </Button>
            ))}
          </div>
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
          {prefix && <span className="text-foreground">{prefix}</span>}
          {offset <= 0 && prefix === "" && <span className="text-muted-foreground">π = </span>}
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
            className="h-14 w-14 text-xl font-semibold sm:h-16 sm:w-16 sm:text-2xl"
            onClick={() => handleGuess(digit)}
            disabled={gameOver}
          >
            {digit}
          </Button>
        ))}
      </div>

      {/* Continue and Reset buttons */}
      {gameOver && (
        <div className="flex gap-3">
          <Button onClick={handleContinue} size="lg" variant="default">
            Continue
          </Button>
          <Button onClick={handleReset} size="lg" variant="outline">
            Reset
          </Button>
        </div>
      )}

      {/* Simulation controls */}
      <div className="flex flex-col items-center gap-3 rounded-lg border bg-card p-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Speed:</span>
          <div className="flex gap-1">
            {SPEED_OPTIONS.map((option) => (
              <Button
                key={option.label}
                variant={simSpeed === option.ms ? "default" : "outline"}
                size="sm"
                className="h-8 px-3 text-sm"
                onClick={() => handleSimSpeedChange(option.ms)}
              >
                {option.label}
              </Button>
            ))}
          </div>
        </div>
        <div className="flex gap-2">
          {!simulating ? (
            <Button
              onClick={startSimulation}
              variant="default"
              size="lg"
              className="bg-green-600 hover:bg-green-700"
            >
              Start Simulation
            </Button>
          ) : (
            <Button
              onClick={stopSimulation}
              variant="destructive"
              size="lg"
            >
              Stop Simulation
            </Button>
          )}
        </div>
      </div>

      {/* Keyboard hint */}
      <p className="text-sm text-muted-foreground">
        Tip: Use keyboard 0-9 to guess, Enter to continue, Escape to reset
      </p>
    </div>
  );
}
