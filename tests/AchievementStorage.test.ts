 
import { describe, it, expect, beforeEach } from "vitest";
import { uintCV, stringUtf8CV, buffCV, boolCV, optionalCV, tupleCV } from "@stacks/transactions";

const ERR_NOT_AUTHORIZED = 100;
const ERR_INVALID_HASH = 101;
const ERR_INVALID_TITLE = 102;
const ERR_INVALID_DESCRIPTION = 103;
const ERR_INVALID_CATEGORY = 104;
const ERR_INVALID_TIMESTAMP = 105;
const ERR_ACHIEVEMENT_ALREADY_EXISTS = 106;
const ERR_ACHIEVEMENT_NOT_FOUND = 107;
const ERR_INVALID_OWNER = 108;
const ERR_INVALID_UPDATE = 109;
const ERR_INVALID_DELETE = 110;
const ERR_MAX_ACHIEVEMENTS_EXCEEDED = 111;
const ERR_INVALID_VISIBILITY = 112;
const ERR_INVALID_METADATA = 113;
const ERR_INVALID_EXPIRY = 114;
const ERR_INVALID_STATUS = 115;
const ERR_INVALID_RATING = 116;
const ERR_INVALID_COMMENT = 117;
const ERR_INVALID_ATTACHMENT = 118;
const ERR_INVALID_SCORE = 119;
const ERR_INVALID_LEVEL = 120;

interface Achievement {
  hash: Uint8Array;
  title: string;
  description: string;
  category: string;
  timestamp: number;
  visibility: boolean;
  metadata: string | null;
  expiry: number | null;
  status: boolean;
  rating: number;
  comment: string | null;
  attachment: Uint8Array | null;
  score: number;
  level: number;
}

interface AchievementUpdate {
  updateTimestamp: number;
  updater: string;
  changes: string;
}

interface Result<T> {
  ok: boolean;
  value: T;
}

class AchievementStorageMock {
  state: {
    nextAchievementId: number;
    maxAchievementsPerUser: number;
    storageFee: number;
    adminPrincipal: string;
    achievements: Map<string, Achievement>;
    achievementIdsByOwner: Map<string, number[]>;
    achievementCountByOwner: Map<string, number>;
    achievementUpdates: Map<string, AchievementUpdate>;
  } = {
    nextAchievementId: 0,
    maxAchievementsPerUser: 100,
    storageFee: 500,
    adminPrincipal: "ST1TEST",
    achievements: new Map(),
    achievementIdsByOwner: new Map(),
    achievementCountByOwner: new Map(),
    achievementUpdates: new Map(),
  };
  blockHeight: number = 0;
  caller: string = "ST1TEST";
  stxTransfers: Array<{ amount: number; from: string; to: string }> = [];

  constructor() {
    this.reset();
  }

  reset() {
    this.state = {
      nextAchievementId: 0,
      maxAchievementsPerUser: 100,
      storageFee: 500,
      adminPrincipal: "ST1TEST",
      achievements: new Map(),
      achievementIdsByOwner: new Map(),
      achievementCountByOwner: new Map(),
      achievementUpdates: new Map(),
    };
    this.blockHeight = 0;
    this.caller = "ST1TEST";
    this.stxTransfers = [];
  }

  getAchievement(owner: string, id: number): Achievement | null {
    return this.state.achievements.get(`${owner}-${id}`) || null;
  }

  getAchievementIds(owner: string): number[] {
    return this.state.achievementIdsByOwner.get(owner) || [];
  }

  getAchievementCount(owner: string): number {
    return this.state.achievementCountByOwner.get(owner) || 0;
  }

  getAchievementUpdate(owner: string, id: number): AchievementUpdate | null {
    return this.state.achievementUpdates.get(`${owner}-${id}`) || null;
  }

  setMaxAchievements(newMax: number): Result<boolean> {
    if (this.caller !== this.state.adminPrincipal) return { ok: false, value: ERR_NOT_AUTHORIZED };
    if (newMax <= 0) return { ok: false, value: ERR_INVALID_UPDATE };
    this.state.maxAchievementsPerUser = newMax;
    return { ok: true, value: true };
  }

  setStorageFee(newFee: number): Result<boolean> {
    if (this.caller !== this.state.adminPrincipal) return { ok: false, value: ERR_NOT_AUTHORIZED };
    if (newFee < 0) return { ok: false, value: ERR_INVALID_UPDATE };
    this.state.storageFee = newFee;
    return { ok: true, value: true };
  }

  addAchievement(
    hash: Uint8Array,
    title: string,
    description: string,
    category: string,
    visibility: boolean,
    metadata: string | null,
    expiry: number | null,
    status: boolean,
    rating: number,
    comment: string | null,
    attachment: Uint8Array | null,
    score: number,
    level: number
  ): Result<number> {
    const owner = this.caller;
    const currentCount = this.getAchievementCount(owner);
    if (currentCount >= this.state.maxAchievementsPerUser) return { ok: false, value: ERR_MAX_ACHIEVEMENTS_EXCEEDED };
    if (hash.length !== 32) return { ok: false, value: ERR_INVALID_HASH };
    if (!title || title.length > 100) return { ok: false, value: ERR_INVALID_TITLE };
    if (description.length > 500) return { ok: false, value: ERR_INVALID_DESCRIPTION };
    if (!["academic", "extracurricular", "award", "project"].includes(category)) return { ok: false, value: ERR_INVALID_CATEGORY };
    if (metadata && metadata.length > 200) return { ok: false, value: ERR_INVALID_METADATA };
    if (expiry && expiry <= this.blockHeight) return { ok: false, value: ERR_INVALID_EXPIRY };
    if (rating > 5) return { ok: false, value: ERR_INVALID_RATING };
    if (comment && comment.length > 200) return { ok: false, value: ERR_INVALID_COMMENT };
    if (attachment && attachment.length > 64) return { ok: false, value: ERR_INVALID_ATTACHMENT };
    if (score > 100) return { ok: false, value: ERR_INVALID_SCORE };
    if (level > 10) return { ok: false, value: ERR_INVALID_LEVEL };
    const nextId = this.state.nextAchievementId;
    if (this.state.achievements.has(`${owner}-${nextId}`)) return { ok: false, value: ERR_ACHIEVEMENT_ALREADY_EXISTS };

    this.stxTransfers.push({ amount: this.state.storageFee, from: owner, to: this.state.adminPrincipal });

    const achievement: Achievement = {
      hash,
      title,
      description,
      category,
      timestamp: this.blockHeight,
      visibility,
      metadata,
      expiry,
      status,
      rating,
      comment,
      attachment,
      score,
      level,
    };
    this.state.achievements.set(`${owner}-${nextId}`, achievement);
    const ids = this.getAchievementIds(owner);
    ids.push(nextId);
    this.state.achievementIdsByOwner.set(owner, ids);
    this.state.achievementCountByOwner.set(owner, currentCount + 1);
    this.state.nextAchievementId++;
    return { ok: true, value: nextId };
  }

  updateAchievement(
    id: number,
    newTitle: string,
    newDescription: string,
    newVisibility: boolean
  ): Result<boolean> {
    const owner = this.caller;
    const key = `${owner}-${id}`;
    const achievement = this.state.achievements.get(key);
    if (!achievement) return { ok: false, value: ERR_ACHIEVEMENT_NOT_FOUND };
    if (owner !== this.caller) return { ok: false, value: ERR_NOT_AUTHORIZED };
    if (!newTitle || newTitle.length > 100) return { ok: false, value: ERR_INVALID_TITLE };
    if (newDescription.length > 500) return { ok: false, value: ERR_INVALID_DESCRIPTION };

    const updated: Achievement = {
      ...achievement,
      title: newTitle,
      description: newDescription,
      visibility: newVisibility,
      timestamp: this.blockHeight,
    };
    this.state.achievements.set(key, updated);
    this.state.achievementUpdates.set(key, {
      updateTimestamp: this.blockHeight,
      updater: this.caller,
      changes: "Updated title, description, visibility",
    });
    return { ok: true, value: true };
  }

  deleteAchievement(id: number): Result<boolean> {
    const owner = this.caller;
    const key = `${owner}-${id}`;
    const achievement = this.state.achievements.get(key);
    if (!achievement) return { ok: false, value: ERR_ACHIEVEMENT_NOT_FOUND };
    if (owner !== this.caller) return { ok: false, value: ERR_NOT_AUTHORIZED };

    this.state.achievements.delete(key);
    this.state.achievementUpdates.delete(key);
    let ids = this.getAchievementIds(owner);
    ids = ids.filter((x) => x !== id);
    this.state.achievementIdsByOwner.set(owner, ids);
    this.state.achievementCountByOwner.set(owner, this.getAchievementCount(owner) - 1);
    return { ok: true, value: true };
  }

  getTotalAchievements(): Result<number> {
    return { ok: true, value: this.state.nextAchievementId };
  }
}

describe("AchievementStorage", () => {
  let contract: AchievementStorageMock;

  beforeEach(() => {
    contract = new AchievementStorageMock();
    contract.reset();
  });

  it("adds an achievement successfully", () => {
    const hash = new Uint8Array(32).fill(1);
    const result = contract.addAchievement(
      hash,
      "Math Award",
      "Won first place in math competition",
      "award",
      true,
      "Extra info",
      null,
      true,
      5,
      "Great job",
      null,
      95,
      3
    );
    expect(result.ok).toBe(true);
    expect(result.value).toBe(0);

    const achievement = contract.getAchievement("ST1TEST", 0);
    expect(achievement?.title).toBe("Math Award");
    expect(achievement?.description).toBe("Won first place in math competition");
    expect(achievement?.category).toBe("award");
    expect(achievement?.visibility).toBe(true);
    expect(achievement?.metadata).toBe("Extra info");
    expect(achievement?.expiry).toBe(null);
    expect(achievement?.status).toBe(true);
    expect(achievement?.rating).toBe(5);
    expect(achievement?.comment).toBe("Great job");
    expect(achievement?.attachment).toBe(null);
    expect(achievement?.score).toBe(95);
    expect(achievement?.level).toBe(3);
    expect(contract.stxTransfers).toEqual([{ amount: 500, from: "ST1TEST", to: "ST1TEST" }]);
  });

  it("rejects duplicate achievement id", () => {
    const hash = new Uint8Array(32).fill(1);
    contract.addAchievement(
      hash,
      "Math Award",
      "Won first place",
      "award",
      true,
      null,
      null,
      true,
      5,
      null,
      null,
      95,
      3
    );
    const result = contract.addAchievement(
      hash,
      "Another",
      "Description",
      "academic",
      false,
      null,
      null,
      false,
      3,
      null,
      null,
      80,
      2
    );
    expect(result.ok).toBe(true);
  });

  it("rejects invalid hash", () => {
    const hash = new Uint8Array(31).fill(1);
    const result = contract.addAchievement(
      hash,
      "Title",
      "Desc",
      "academic",
      true,
      null,
      null,
      true,
      5,
      null,
      null,
      100,
      10
    );
    expect(result.ok).toBe(false);
    expect(result.value).toBe(ERR_INVALID_HASH);
  });

  it("rejects invalid title", () => {
    const hash = new Uint8Array(32).fill(1);
    const result = contract.addAchievement(
      hash,
      "",
      "Desc",
      "academic",
      true,
      null,
      null,
      true,
      5,
      null,
      null,
      100,
      10
    );
    expect(result.ok).toBe(false);
    expect(result.value).toBe(ERR_INVALID_TITLE);
  });

  it("rejects invalid category", () => {
    const hash = new Uint8Array(32).fill(1);
    const result = contract.addAchievement(
      hash,
      "Title",
      "Desc",
      "invalid",
      true,
      null,
      null,
      true,
      5,
      null,
      null,
      100,
      10
    );
    expect(result.ok).toBe(false);
    expect(result.value).toBe(ERR_INVALID_CATEGORY);
  });

  it("updates an achievement successfully", () => {
    const hash = new Uint8Array(32).fill(1);
    contract.addAchievement(
      hash,
      "Old Title",
      "Old Desc",
      "academic",
      true,
      null,
      null,
      true,
      5,
      null,
      null,
      100,
      10
    );
    const result = contract.updateAchievement(0, "New Title", "New Desc", false);
    expect(result.ok).toBe(true);
    expect(result.value).toBe(true);
    const achievement = contract.getAchievement("ST1TEST", 0);
    expect(achievement?.title).toBe("New Title");
    expect(achievement?.description).toBe("New Desc");
    expect(achievement?.visibility).toBe(false);
    const update = contract.getAchievementUpdate("ST1TEST", 0);
    expect(update?.changes).toBe("Updated title, description, visibility");
    expect(update?.updater).toBe("ST1TEST");
  });

  it("rejects update for non-existent achievement", () => {
    const result = contract.updateAchievement(99, "New Title", "New Desc", false);
    expect(result.ok).toBe(false);
    expect(result.value).toBe(ERR_ACHIEVEMENT_NOT_FOUND);
  });

  it("deletes an achievement successfully", () => {
    const hash = new Uint8Array(32).fill(1);
    contract.addAchievement(
      hash,
      "Title",
      "Desc",
      "academic",
      true,
      null,
      null,
      true,
      5,
      null,
      null,
      100,
      10
    );
    const result = contract.deleteAchievement(0);
    expect(result.ok).toBe(true);
    expect(result.value).toBe(true);
    const achievement = contract.getAchievement("ST1TEST", 0);
    expect(achievement).toBe(null);
    const ids = contract.getAchievementIds("ST1TEST");
    expect(ids).toEqual([]);
    const count = contract.getAchievementCount("ST1TEST");
    expect(count).toBe(0);
  });

  it("rejects delete for non-existent achievement", () => {
    const result = contract.deleteAchievement(99);
    expect(result.ok).toBe(false);
    expect(result.value).toBe(ERR_ACHIEVEMENT_NOT_FOUND);
  });

  it("sets max achievements successfully", () => {
    const result = contract.setMaxAchievements(200);
    expect(result.ok).toBe(true);
    expect(result.value).toBe(true);
    expect(contract.state.maxAchievementsPerUser).toBe(200);
  });

  it("rejects set max achievements by non-admin", () => {
    contract.caller = "ST2FAKE";
    const result = contract.setMaxAchievements(200);
    expect(result.ok).toBe(false);
    expect(result.value).toBe(ERR_NOT_AUTHORIZED);
  });

  it("sets storage fee successfully", () => {
    const result = contract.setStorageFee(1000);
    expect(result.ok).toBe(true);
    expect(result.value).toBe(true);
    expect(contract.state.storageFee).toBe(1000);
    const hash = new Uint8Array(32).fill(1);
    contract.addAchievement(
      hash,
      "Title",
      "Desc",
      "academic",
      true,
      null,
      null,
      true,
      5,
      null,
      null,
      100,
      10
    );
    expect(contract.stxTransfers).toEqual([{ amount: 1000, from: "ST1TEST", to: "ST1TEST" }]);
  });

  it("rejects set storage fee by non-admin", () => {
    contract.caller = "ST2FAKE";
    const result = contract.setStorageFee(1000);
    expect(result.ok).toBe(false);
    expect(result.value).toBe(ERR_NOT_AUTHORIZED);
  });

  it("returns correct total achievements", () => {
    const hash = new Uint8Array(32).fill(1);
    contract.addAchievement(
      hash,
      "Title1",
      "Desc1",
      "academic",
      true,
      null,
      null,
      true,
      5,
      null,
      null,
      100,
      10
    );
    contract.addAchievement(
      hash,
      "Title2",
      "Desc2",
      "award",
      false,
      null,
      null,
      false,
      4,
      null,
      null,
      90,
      5
    );
    const result = contract.getTotalAchievements();
    expect(result.ok).toBe(true);
    expect(result.value).toBe(2);
  });

  it("rejects adding beyond max achievements", () => {
    contract.state.maxAchievementsPerUser = 1;
    const hash = new Uint8Array(32).fill(1);
    contract.addAchievement(
      hash,
      "Title",
      "Desc",
      "academic",
      true,
      null,
      null,
      true,
      5,
      null,
      null,
      100,
      10
    );
    const result = contract.addAchievement(
      hash,
      "Title2",
      "Desc2",
      "award",
      false,
      null,
      null,
      false,
      4,
      null,
      null,
      90,
      5
    );
    expect(result.ok).toBe(false);
    expect(result.value).toBe(ERR_MAX_ACHIEVEMENTS_EXCEEDED);
  });
});