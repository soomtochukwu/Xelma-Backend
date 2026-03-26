jest.mock("../services/soroban.service", () => ({
  __esModule: true,
  default: {
    resolveRound: jest.fn().mockResolvedValue(undefined),
    createRound: jest.fn().mockResolvedValue("mock-soroban-id"),
  },
}));

jest.mock("../services/websocket.service", () => ({
  __esModule: true,
  default: {
    emitRoundStarted: jest.fn(),
    emitRoundUpdated: jest.fn(),
    emitNotification: jest.fn(),
  },
}));

import { prisma } from "../lib/prisma";
import roundService from "../services/round.service";
import resolutionService from "../services/resolution.service";
import { GameMode } from "@prisma/client";

describe("Idempotency Tests", () => {
  beforeEach(async () => {
    // Clean up database before each test
    // Use a transaction or sequential deletes with error handling for robustness
    try {
      await prisma.prediction.deleteMany();
      await prisma.round.deleteMany();
    } catch (err) {
      // If deleteMany fails due to race conditions in parallel tests, 
      // we might need more aggressive cleanup or --runInBand
    }
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("should be idempotent when locking a round multiple times", async () => {
    // Create a round
    const round = await prisma.round.create({
      data: {
        mode: GameMode.UP_DOWN,
        status: "ACTIVE",
        startTime: new Date(),
        endTime: new Date(Date.now() + 60000),
        startPrice: 0.1234,
      },
    });

    // First lock
    const result1 = await roundService.lockRound(round.id);
    expect(result1.status).toBe("updated");

    // Second lock (idempotent)
    const result2 = await roundService.lockRound(round.id);
    expect(result2.status).toBe("already_locked");

    // Verify final status
    const updatedRound = await prisma.round.findUnique({
      where: { id: round.id },
    });
    expect(updatedRound?.status).toBe("LOCKED");
  });

  it("should be idempotent when resolving a round multiple times", async () => {
    // Create a round and lock it
    const round = await prisma.round.create({
      data: {
        mode: GameMode.UP_DOWN,
        status: "LOCKED",
        startTime: new Date(),
        endTime: new Date(Date.now() - 1000), // Expired
        startPrice: 0.1234,
        poolUp: 0,
        poolDown: 0,
      },
    });

    // First resolution
    const result1 = await resolutionService.resolveRound(round.id, 0.1235);
    if (result1.status === "error") {
      console.error("Resolution error:", result1.error);
    }
    expect(result1.status).toBe("updated");
    expect(result1.round.status).toBe("RESOLVED");

    // Second resolution (idempotent)
    const result2 = await resolutionService.resolveRound(round.id, 0.1235);
    expect(result2.status).toBe("already_resolved");
    expect(result2.round.status).toBe("RESOLVED");

    // Verify final status
    const finalRound = await prisma.round.findUnique({
      where: { id: round.id },
    });
    expect(finalRound?.status).toBe("RESOLVED");
    expect(Number(finalRound?.endPrice)).toBe(0.1235);
  });

  it("should not allow locking a resolved round", async () => {
    // Create a resolved round
    const round = await prisma.round.create({
      data: {
        mode: GameMode.UP_DOWN,
        status: "RESOLVED",
        startTime: new Date(),
        endTime: new Date(Date.now() - 1000),
        startPrice: 0.1234,
        endPrice: 0.1235,
        resolvedAt: new Date(),
      },
    });

    // Attempt to lock
    const result = await roundService.lockRound(round.id);
    expect(result.status).toBe("already_resolved");
  });
});
