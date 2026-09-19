import crypto from "crypto";

const ADJECTIVES = [
  "Silent", "Curious", "Neon", "Happy", "Midnight", "Swift", "Calm", "Pixel",
  "Cosmic", "Lunar", "Solar", "Quantum", "Cyber", "Electric", "Hidden", "Clever",
  "Brave", "Ghost", "Shadow", "Crimson", "Azure", "Golden", "Silver", "Crystal"
];

const ANIMALS = [
  { name: "Panda", emoji: "🐼" },
  { name: "Fox", emoji: "🦊" },
  { name: "Tiger", emoji: "🐯" },
  { name: "Owl", emoji: "🦉" },
  { name: "Penguin", emoji: "🐧" },
  { name: "Wolf", emoji: "🐺" },
  { name: "Koala", emoji: "🐨" },
  { name: "Bear", emoji: "🐻" },
  { name: "Cat", emoji: "🐱" },
  { name: "Falcon", emoji: "🦅" },
  { name: "Dragon", emoji: "🐉" },
  { name: "Unicorn", emoji: "🦄" },
  { name: "Monkey", emoji: "🐒" },
  { name: "Frog", emoji: "🐸" },
  { name: "Octopus", emoji: "🐙" }
];

/**
 * Generates a random anonymous identity
 * @returns {{ displayName: string, avatar: string, participantId: string }}
 */
export function generateAnonymousIdentity() {
  const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const animal = ANIMALS[Math.floor(Math.random() * ANIMALS.length)];
  
  const participantId = `participant_${crypto.randomUUID()}`;
  
  // Random suffix for uniqueness, e.g. "Neon Fox 42" or just "Neon Fox"
  // To avoid collisions in large rooms, append 3 random digits if desired.
  // We'll keep it simple for now, and if they collide, the suffix handles it.
  const suffix = Math.floor(Math.random() * 999).toString().padStart(3, "0");
  const displayName = `${adj} ${animal.name} ${suffix}`;

  return {
    participantId,
    displayName,
    avatar: animal.emoji,
  };
}
