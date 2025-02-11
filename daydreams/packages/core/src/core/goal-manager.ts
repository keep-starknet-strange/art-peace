import type { Goal, GoalStatus, HorizonType } from "./types";
/**
 * Manages a collection of goals, their relationships, and their lifecycle states.
 * Provides methods for creating, updating, and querying goals and their hierarchies.
 */
export class GoalManager {
    /** Internal map storing all goals indexed by their IDs */
    goals: Map<string, Goal> = new Map();

    /**
     * Creates a new goal and adds it to the goal collection.
     * If the goal is a subgoal, updates the parent goal's subgoals array.
     * @param goal The goal to add (without an ID)
     * @returns The newly created goal with generated ID
     */
    public addGoal(goal: Omit<Goal, "id">): Goal {
        const id = `goal-${Math.random().toString(36).substring(2, 15)}`;
        const newGoal = { ...goal, id, progress: 0 };
        this.goals.set(id, newGoal);

        // If this is a subgoal, update the parent's subgoals array
        if (goal.parentGoal) {
            const parent = this.goals.get(goal.parentGoal);
            if (parent) {
                parent.subgoals = parent.subgoals || [];
                parent.subgoals.push(id);
            }
        }

        return newGoal;
    }

    /**
     * Handles the failure of a goal by updating its status and notifying relevant systems.
     *
     * This method:
     * 1. Updates the failed goal's status
     * 2. If the goal has a parent, marks the parent as blocked
     * 3. Emits a goal:failed event
     *
     * @param goal - The goal that failed
     * @param error - The error that caused the failure
     * @internal
     */
    public async processGoalFailure(goal: Goal): Promise<void> {
        this.updateGoalStatus(goal.id, "failed");

        // If this was a sub-goal, mark parent as blocked
        if (goal.parentGoal) {
            this.updateGoalStatus(goal.parentGoal, "blocked");
        }
    }

    /**
     * Gets a prioritized list of goals that are ready to be worked on.
     * Goals are sorted first by horizon (short-term > medium-term > long-term)
     * and then by their individual priority values.
     *
     * @returns An array of Goal objects sorted by priority
     * @internal
     */
    public getReadyGoalsByPriority(): Goal[] {
        const readyGoals = this.getReadyGoals();
        const horizonPriority: Record<string, number> = {
            short: 3,
            medium: 2,
            long: 1,
        };

        return readyGoals.sort((a, b) => {
            const horizonDiff =
                horizonPriority[a.horizon] - horizonPriority[b.horizon];
            if (horizonDiff !== 0) {
                return -horizonDiff;
            }
            return (b.priority ?? 0) - (a.priority ?? 0);
        });
    }

    /**
     * Updates an existing goal with new dependencies.
     * Used to map generated thought IDs to goal IDs.
     * @param goalId The ID of the goal to update
     * @param dependencies The new array of dependency IDs
     */
    public updateGoalDependencies(
        goalId: string,
        dependencies: string[]
    ): void {
        const goal = this.goals.get(goalId);
        if (goal) {
            goal.dependencies = dependencies;
        }
    }

    /**
     * Updates the status of a goal. When marking as "completed",
     * sets completed_at timestamp, progress to 100%, and updates related goals.
     * @param id The ID of the goal to update
     * @param status The new status to set
     */
    public updateGoalStatus(id: string, status: GoalStatus): void {
        const goal = this.goals.get(id);
        if (!goal) return;

        goal.status = status;

        if (status === "completed") {
            goal.completed_at = Date.now();
            goal.progress = 100;
            this.updateParentProgress(goal);
            this.checkAndUpdateDependentGoals(id);
        }
    }

    /**
     * Updates the progress of a parent goal based on its completed subgoals.
     * @param goal The goal whose parent needs updating
     */
    private updateParentProgress(goal: Goal): void {
        if (!goal.parentGoal) return;

        const parent = this.goals.get(goal.parentGoal);
        if (!parent || !parent.subgoals) return;

        // Calculate parent progress based on completed subgoals
        const completedSubgoals = parent.subgoals.filter(
            (subId) => this.goals.get(subId)?.status === "completed"
        ).length;

        parent.progress = Math.round(
            (completedSubgoals / parent.subgoals.length) * 100
        );

        // If all subgoals are complete, mark parent as ready
        if (parent.progress === 100) {
            parent.status = "ready";
        }
    }

    /**
     * Checks and updates goals that depend on a completed goal.
     * @param completedGoalId ID of the goal that was just completed
     */
    private checkAndUpdateDependentGoals(completedGoalId: string): void {
        Array.from(this.goals.values()).forEach((goal) => {
            if (goal.dependencies?.includes(completedGoalId)) {
                // Check if all dependencies are now completed
                const allDependenciesMet = goal.dependencies.every(
                    (depId) => this.goals.get(depId)?.status === "completed"
                );

                if (allDependenciesMet) {
                    goal.status = "ready";
                }
            }
        });
    }

    /**
     * Retrieves all goals for a specific time horizon, sorted by priority.
     * @param horizon The time horizon to filter by
     * @returns Array of matching goals
     */
    public getGoalsByHorizon(horizon: HorizonType): Goal[] {
        return Array.from(this.goals.values())
            .filter((g) => g.horizon === horizon)
            .sort((a, b) => b.priority - a.priority);
    }

    /**
     * Returns goals that are ready to be worked on.
     * A goal is ready if its status is "ready" or all its dependencies are completed.
     * @param horizon Optional horizon to filter by
     * @returns Array of ready goals, sorted by priority
     */
    public getReadyGoals(horizon?: HorizonType): Goal[] {
        return Array.from(this.goals.values())
            .filter((goal) => {
                const horizonMatch = !horizon || goal.horizon === horizon;
                // Only consider goals that are explicitly in "ready" status
                const isReady = goal.status === "ready";
                const dependenciesMet =
                    !goal.dependencies?.length ||
                    goal.dependencies.every(
                        (depId) => this.goals.get(depId)?.status === "completed"
                    );
                // A goal is only ready if it's explicitly in ready status AND dependencies are met
                return horizonMatch && isReady && dependenciesMet;
            })
            .sort((a, b) => b.priority - a.priority);
    }

    /**
     * Gets a goal and all its subgoals as a flattened array.
     * @param goalId ID of the root goal
     * @returns Array containing the goal and all its subgoals
     */
    public getGoalHierarchy(goalId: string): Goal[] {
        const goal = this.goals.get(goalId);
        if (!goal) return [];

        const hierarchy: Goal[] = [goal];

        // Get all subgoals recursively
        if (goal.subgoals) {
            goal.subgoals.forEach((subId) => {
                hierarchy.push(...this.getGoalHierarchy(subId));
            });
        }
        return hierarchy;
    }

    /**
     * Gets all incomplete goals that are blocking a given goal.
     * @param goalId ID of the goal to check
     * @returns Array of blocking goals
     */
    public getBlockingGoals(goalId: string): Goal[] {
        const goal = this.goals.get(goalId);
        if (!goal || !goal.dependencies) return [];

        return goal.dependencies
            .map((depId) => this.goals.get(depId))
            .filter(
                (dep): dep is Goal =>
                    dep !== undefined && dep.status !== "completed"
            );
    }

    /**
     * Retrieves a goal by its ID.
     * @param id The goal ID
     * @returns The goal or undefined if not found
     */
    public getGoalById(id: string): Goal | undefined {
        return this.goals.get(id);
    }

    /**
     * Gets all direct child goals of a parent goal.
     * @param parentId ID of the parent goal
     * @returns Array of child goals
     */
    public getChildGoals(parentId: string): Goal[] {
        const parent = this.goals.get(parentId);
        if (!parent || !parent.subgoals) return [];

        return parent.subgoals
            .map((id) => this.goals.get(id))
            .filter((goal): goal is Goal => goal !== undefined);
    }

    /**
     * Gets all goals that depend on a given goal.
     * @param goalId ID of the dependency goal
     * @returns Array of dependent goals
     */
    public getDependentGoals(goalId: string): Goal[] {
        return Array.from(this.goals.values()).filter((goal) =>
            goal.dependencies?.includes(goalId)
        );
    }

    /**
     * Checks if all prerequisites for a goal are met.
     * @param goalId ID of the goal to check
     * @returns True if all dependencies are completed
     */
    public arePrerequisitesMet(goalId: string): boolean {
        const goal = this.goals.get(goalId);
        if (!goal || !goal.dependencies) return true;

        return goal.dependencies.every((depId) => {
            const dep = this.goals.get(depId);
            return dep?.status === "completed";
        });
    }

    /**
     * Updates the progress percentage of a goal.
     * @param id ID of the goal
     * @param progress New progress value (0-100)
     */
    public updateGoalProgress(id: string, progress: number): void {
        const goal = this.goals.get(id);
        if (!goal) return;

        goal.progress = Math.min(100, Math.max(0, progress));

        if (goal.progress === 100 && goal.status !== "completed") {
            goal.status = "ready";
        }

        if (goal.parentGoal) {
            this.updateParentProgress(this.goals.get(goal.parentGoal)!);
        }
    }

    /**
     * Gets all goals with a specific status.
     * @param status Status to filter by
     * @returns Array of matching goals, sorted by priority
     */
    public getGoalsByStatus(status: GoalStatus): Goal[] {
        return Array.from(this.goals.values())
            .filter((goal) => goal.status === status)
            .sort((a, b) => b.priority - a.priority);
    }

    /**
     * Checks if a goal can be refined into subgoals.
     * @param goalId ID of the goal to check
     * @returns True if the goal can be refined
     */
    public canBeRefined(goalId: string): boolean {
        const goal = this.goals.get(goalId);
        if (!goal) return false;

        return (
            goal.horizon !== "short" &&
            (!goal.subgoals || goal.subgoals.length === 0) &&
            !["completed", "failed"].includes(goal.status)
        );
    }

    /**
     * Blocks a goal and all its subgoals recursively.
     * @param goalId ID of the root goal to block
     * @param reason Reason for blocking
     */
    public blockGoalHierarchy(goalId: string, reason: string): void {
        const goal = this.goals.get(goalId);
        if (!goal) return;

        goal.status = "blocked";
        goal.meta = { ...goal.meta, blockReason: reason };

        if (goal.subgoals) {
            goal.subgoals.forEach((subId) => {
                this.blockGoalHierarchy(
                    subId,
                    `Parent goal ${goalId} is blocked: ${reason}`
                );
            });
        }
    }

    /**
     * Gets the full path from root goal to specified goal.
     * @param goalId ID of the goal
     * @returns Array of goals representing the path
     */
    public getGoalPath(goalId: string): Goal[] {
        const path: Goal[] = [];
        let currentGoal = this.goals.get(goalId);

        while (currentGoal) {
            path.unshift(currentGoal);
            if (!currentGoal.parentGoal) break;
            currentGoal = this.goals.get(currentGoal.parentGoal);
        }
        return path;
    }

    /**
     * Estimates completion time based on horizon and dependencies.
     * @param goalId ID of the goal
     * @returns Estimated time units to complete
     */
    public estimateCompletionTime(goalId: string): number {
        const goal = this.goals.get(goalId);
        if (!goal) return 0;

        const baseTime =
            {
                short: 1,
                medium: 3,
                long: 8,
            }[goal.horizon] || 1;

        const dependencyTime = (goal.dependencies || [])
            .map((depId) => {
                const dep = this.goals.get(depId);
                return dep && dep.status !== "completed"
                    ? this.estimateCompletionTime(depId)
                    : 0;
            })
            .reduce((sum, time) => sum + time, 0);

        const subgoalTime = (goal.subgoals || [])
            .map((subId) => {
                const sub = this.goals.get(subId);
                return sub && sub.status !== "completed"
                    ? this.estimateCompletionTime(subId)
                    : 0;
            })
            .reduce((sum, time) => sum + time, 0);

        return baseTime + Math.max(dependencyTime, subgoalTime);
    }

    /**
     * Records an outcome score and optional comment for a completed goal.
     * @param goalId ID of the goal
     * @param outcomeScore Numeric score indicating success/failure
     * @param comment Optional comment about the outcome
     */
    public recordGoalOutcome(
        goalId: string,
        outcomeScore: number,
        comment?: string
    ): void {
        const goal = this.goals.get(goalId);
        if (!goal) return;

        if (goal.status !== "completed" && goal.status !== "failed") {
            this.updateGoalStatus(goalId, "completed");
        }

        goal.outcomeScore = outcomeScore;
        goal.scoreHistory = goal.scoreHistory || [];
        goal.scoreHistory.push({
            timestamp: Date.now(),
            score: outcomeScore,
            comment,
        });
    }

    /**
     * Records a goal failure with reason and score.
     * @param goalId ID of the failed goal
     * @param reason Reason for failure
     * @param outcomeScore Optional failure score (defaults to 0)
     */
    public recordGoalFailure(
        goalId: string,
        reason: string,
        outcomeScore: number = 0
    ): void {
        const goal = this.goals.get(goalId);
        if (!goal) return;

        goal.status = "failed";
        goal.completed_at = Date.now();
        goal.progress = 100;
        goal.meta = { ...goal.meta, failReason: reason };
        goal.outcomeScore = outcomeScore;
        goal.scoreHistory = goal.scoreHistory || [];
        goal.scoreHistory.push({
            timestamp: Date.now(),
            score: outcomeScore,
            comment: `Failed: ${reason}`,
        });
    }

    /**
     * Gets all goals sorted by their outcome scores.
     * @returns Array of goals with outcome scores, sorted highest to lowest
     */
    public getGoalsByScore(): Goal[] {
        return Array.from(this.goals.values())
            .filter((g) => g.outcomeScore !== undefined)
            .sort((a, b) => (b.outcomeScore || 0) - (a.outcomeScore || 0));
    }
}
