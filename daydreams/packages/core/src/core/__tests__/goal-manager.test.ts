import { describe, it, expect, beforeEach } from "vitest";
import { GoalManager } from "../goal-manager";
import type { Goal, GoalStatus } from "../types";

describe("GoalManager", () => {
    let manager: GoalManager;
    const now = Date.now();

    // Helper function to create a valid base goal
    const createBaseGoal = (status: GoalStatus = "pending") => ({
        description: "Test Goal",
        horizon: "short" as const,
        status: status as GoalStatus,
        priority: 1,
        success_criteria: ["Goal completed successfully"],
        created_at: now,
    });

    beforeEach(() => {
        manager = new GoalManager();
    });

    describe("addGoal", () => {
        it("should create a goal with generated ID", () => {
            const goal = manager.addGoal(createBaseGoal());

            expect(goal.id).toBeDefined();
            expect(goal.description).toBe("Test Goal");
            expect(goal.progress).toBe(0);
        });

        it("should handle subgoal relationships", () => {
            const parent = manager.addGoal({
                ...createBaseGoal(),
                description: "Parent Goal",
                horizon: "medium",
            });

            const child = manager.addGoal({
                ...createBaseGoal(),
                description: "Child Goal",
                parentGoal: parent.id,
            });

            const parentFromStore = manager.getGoalById(parent.id);
            expect(parentFromStore?.subgoals).toContain(child.id);
        });
    });

    describe("goal status management", () => {
        it("should update goal status correctly", () => {
            const goal = manager.addGoal(createBaseGoal());

            manager.updateGoalStatus(goal.id, "completed");
            const updated = manager.getGoalById(goal.id);

            expect(updated?.status).toBe("completed");
            expect(updated?.progress).toBe(100);
            expect(updated?.completed_at).toBeDefined();
        });

        it("should handle goal failure", async () => {
            const goal = manager.addGoal(createBaseGoal());

            await manager.processGoalFailure(goal);
            const failed = manager.getGoalById(goal.id);

            expect(failed?.status).toBe("failed");
        });
    });

    describe("goal dependencies", () => {
        it("should check prerequisites correctly", () => {
            const dep = manager.addGoal({
                ...createBaseGoal(),
                description: "Dependency",
            });

            const goal = manager.addGoal({
                ...createBaseGoal(),
                description: "Main Goal",
                dependencies: [dep.id],
            });

            expect(manager.arePrerequisitesMet(goal.id)).toBe(false);

            manager.updateGoalStatus(dep.id, "completed");
            expect(manager.arePrerequisitesMet(goal.id)).toBe(true);
        });

        it("should update dependent goals when dependency is completed", () => {
            const dep = manager.addGoal({
                ...createBaseGoal(),
                description: "Dependency",
            });

            const goal = manager.addGoal({
                ...createBaseGoal(),
                description: "Main Goal",
                status: "pending",
                dependencies: [dep.id],
            });

            manager.updateGoalStatus(dep.id, "completed");
            const updated = manager.getGoalById(goal.id);
            expect(updated?.status).toBe("ready");
        });
    });

    describe("goal hierarchy", () => {
        it("should get goal hierarchy correctly", () => {
            const parent = manager.addGoal({
                ...createBaseGoal(),
                description: "Parent",
                horizon: "medium",
            });

            const child1 = manager.addGoal({
                ...createBaseGoal(),
                description: "Child 1",
                parentGoal: parent.id,
            });

            const child2 = manager.addGoal({
                ...createBaseGoal(),
                description: "Child 2",
                parentGoal: parent.id,
            });

            const hierarchy = manager.getGoalHierarchy(parent.id);
            expect(hierarchy).toHaveLength(3);
            expect(hierarchy.map((g) => g.id)).toContain(child1.id);
            expect(hierarchy.map((g) => g.id)).toContain(child2.id);
        });

        it("should update parent progress when child is completed", () => {
            const parent = manager.addGoal({
                ...createBaseGoal(),
                description: "Parent",
                horizon: "medium",
            });

            const child1 = manager.addGoal({
                ...createBaseGoal(),
                description: "Child 1",
                parentGoal: parent.id,
            });

            const child2 = manager.addGoal({
                ...createBaseGoal(),
                description: "Child 2",
                parentGoal: parent.id,
            });

            manager.updateGoalStatus(child1.id, "completed");
            expect(manager.getGoalById(parent.id)?.progress).toBe(50);

            manager.updateGoalStatus(child2.id, "completed");
            const updatedParent = manager.getGoalById(parent.id);
            expect(updatedParent?.progress).toBe(100);
            expect(updatedParent?.status).toBe("ready");
        });
    });

    describe("goal filtering and sorting", () => {
        it("should get goals by horizon", () => {
            manager.addGoal({
                ...createBaseGoal(),
                description: "Short 1",
                priority: 2,
            });

            manager.addGoal({
                ...createBaseGoal(),
                description: "Short 2",
                priority: 1,
            });

            manager.addGoal({
                ...createBaseGoal(),
                description: "Medium",
                horizon: "medium",
            });

            const shortGoals = manager.getGoalsByHorizon("short");
            expect(shortGoals).toHaveLength(2);
            expect(shortGoals[0].priority).toBe(2); // Check priority sorting
        });

        it("should get ready goals correctly", () => {
            // Create a ready goal
            const readyGoal = manager.addGoal({
                ...createBaseGoal("ready"),
                description: "Ready Goal",
            });

            // Create a blocked goal
            const blockedGoal = manager.addGoal(createBaseGoal("pending"));
            manager.updateGoalStatus(blockedGoal.id, "blocked");

            const readyGoals = manager.getReadyGoals();
            expect(readyGoals).toHaveLength(1);
            expect(readyGoals[0].description).toBe("Ready Goal");
        });
    });

    describe("goal outcomes", () => {
        it("should record goal outcomes correctly", () => {
            const goal = manager.addGoal(createBaseGoal());

            manager.recordGoalOutcome(goal.id, 0.8, "Good performance");
            const updated = manager.getGoalById(goal.id);

            expect(updated?.outcomeScore).toBe(0.8);
            expect(updated?.scoreHistory).toHaveLength(1);
            expect(updated?.status).toBe("completed");
        });

        it("should record goal failures correctly", () => {
            const goal = manager.addGoal(createBaseGoal());

            manager.recordGoalFailure(goal.id, "Resource unavailable");
            const failed = manager.getGoalById(goal.id);

            expect(failed?.status).toBe("failed");
            expect(failed?.meta?.failReason).toBe("Resource unavailable");
            expect(failed?.scoreHistory).toHaveLength(1);
        });
    });

    describe("additional goal management", () => {
        it("should update goal dependencies", () => {
            const goal = manager.addGoal(createBaseGoal());
            const dep = manager.addGoal(createBaseGoal());

            manager.updateGoalDependencies(goal.id, [dep.id]);
            const updated = manager.getGoalById(goal.id);

            expect(updated?.dependencies).toContain(dep.id);
        });

        it("should get child goals", () => {
            const parent = manager.addGoal(createBaseGoal());
            const child1 = manager.addGoal({
                ...createBaseGoal(),
                parentGoal: parent.id,
            });
            const child2 = manager.addGoal({
                ...createBaseGoal(),
                parentGoal: parent.id,
            });

            const children = manager.getChildGoals(parent.id);
            expect(children).toHaveLength(2);
            expect(children.map((g) => g.id)).toContain(child1.id);
            expect(children.map((g) => g.id)).toContain(child2.id);
        });

        it("should get dependent goals", () => {
            const dep = manager.addGoal(createBaseGoal());
            const goal1 = manager.addGoal({
                ...createBaseGoal(),
                dependencies: [dep.id],
            });
            const goal2 = manager.addGoal({
                ...createBaseGoal(),
                dependencies: [dep.id],
            });

            const dependents = manager.getDependentGoals(dep.id);
            expect(dependents).toHaveLength(2);
            expect(dependents.map((g) => g.id)).toContain(goal1.id);
            expect(dependents.map((g) => g.id)).toContain(goal2.id);
        });

        it("should update goal progress", () => {
            const goal = manager.addGoal(createBaseGoal());
            manager.updateGoalProgress(goal.id, 75);

            const updated = manager.getGoalById(goal.id);
            expect(updated?.progress).toBe(75);
        });

        it("should get goals by status", () => {
            const goal1 = manager.addGoal({
                ...createBaseGoal(),
                status: "completed",
            });
            const goal2 = manager.addGoal({
                ...createBaseGoal(),
                status: "completed",
            });

            const completed = manager.getGoalsByStatus("completed");
            expect(completed).toHaveLength(2);
            expect(completed.map((g) => g.id)).toContain(goal1.id);
            expect(completed.map((g) => g.id)).toContain(goal2.id);
        });

        it("should check if goal can be refined", () => {
            const shortGoal = manager.addGoal({
                ...createBaseGoal(),
                horizon: "short",
            });
            const mediumGoal = manager.addGoal({
                ...createBaseGoal(),
                horizon: "medium",
            });

            expect(manager.canBeRefined(shortGoal.id)).toBe(false);
            expect(manager.canBeRefined(mediumGoal.id)).toBe(true);
        });

        it("should block goal hierarchy", () => {
            const parent = manager.addGoal(createBaseGoal());
            const child = manager.addGoal({
                ...createBaseGoal(),
                parentGoal: parent.id,
            });

            manager.blockGoalHierarchy(parent.id, "Resource unavailable");

            const blockedParent = manager.getGoalById(parent.id);
            const blockedChild = manager.getGoalById(child.id);

            expect(blockedParent?.status).toBe("blocked");
            expect(blockedChild?.status).toBe("blocked");
        });

        it("should get goal path", () => {
            const root = manager.addGoal(createBaseGoal());
            const mid = manager.addGoal({
                ...createBaseGoal(),
                parentGoal: root.id,
            });
            const leaf = manager.addGoal({
                ...createBaseGoal(),
                parentGoal: mid.id,
            });

            const path = manager.getGoalPath(leaf.id);
            expect(path).toHaveLength(3);
            expect(path[0].id).toBe(root.id);
            expect(path[1].id).toBe(mid.id);
            expect(path[2].id).toBe(leaf.id);
        });

        it("should estimate completion time", () => {
            const goal = manager.addGoal({
                ...createBaseGoal(),
                horizon: "medium",
            });
            const dep = manager.addGoal({
                ...createBaseGoal(),
                horizon: "short",
            });
            manager.updateGoalDependencies(goal.id, [dep.id]);

            const estimate = manager.estimateCompletionTime(goal.id);
            expect(estimate).toBeGreaterThan(0);
        });

        it("should get goals by score", () => {
            const goal1 = manager.addGoal(createBaseGoal());
            const goal2 = manager.addGoal(createBaseGoal());

            manager.recordGoalOutcome(goal1.id, 0.8);
            manager.recordGoalOutcome(goal2.id, 0.9);

            const scored = manager.getGoalsByScore();
            expect(scored).toHaveLength(2);
            expect(scored[0].outcomeScore).toBeGreaterThan(
                scored[1].outcomeScore as number
            );
        });
    });
});
