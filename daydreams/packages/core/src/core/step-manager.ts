import type { Step, StepType } from "./types";

/**
 * Manages a collection of steps with unique IDs.
 * Provides methods to add, retrieve, update, and remove steps.
 */
class StepManager {
    /** Array of steps managed by this instance */
    private steps: Step[] = [];
    /** Set of step IDs for quick lookup and uniqueness validation */
    private stepIds: Set<string> = new Set();

    /**
     * Creates a new StepManager instance with empty steps collection
     */
    constructor() {
        this.steps = [];
        this.stepIds = new Set();
    }

    /**
     * Adds a new step to the collection
     * @param step The step to add
     * @returns The added step
     * @throws Error if a step with the same ID already exists
     */
    public addStep(step: Step): Step {
        if (this.stepIds.has(step.id)) {
            throw new Error(`Step with ID ${step.id} already exists`);
        }

        this.steps.push(step);
        this.stepIds.add(step.id);
        return step;
    }

    /**
     * Gets all steps in the collection
     * @returns Array of all steps
     */
    public getSteps(): Step[] {
        return this.steps;
    }

    /**
     * Finds a step by its ID
     * @param id The ID of the step to find
     * @returns The matching step or undefined if not found
     */
    public getStepById(id: string): Step | undefined {
        return this.steps.find((s) => s.id === id);
    }

    /**
     * Updates an existing step with new properties
     * @param id The ID of the step to update
     * @param updates Partial step object containing properties to update
     * @throws Error if step with given ID is not found
     */
    public updateStep(id: string, updates: Partial<Step>): void {
        const index = this.steps.findIndex((s) => s.id === id);
        if (index === -1) {
            throw new Error(`Step with ID ${id} not found`);
        }

        const currentStep = this.steps[index];
        const updatedStep = {
            ...currentStep,
            ...updates,
            type: currentStep.type, // Preserve the original step type
            timestamp: Date.now(), // Update timestamp on changes
        } as Step;

        this.steps[index] = updatedStep;
    }

    /**
     * Removes a step from the collection
     * @param id The ID of the step to remove
     * @throws Error if step with given ID is not found
     */
    public removeStep(id: string): void {
        const index = this.steps.findIndex((s) => s.id === id);
        if (index === -1) {
            throw new Error(`Step with ID ${id} not found`);
        }

        this.steps.splice(index, 1);
        this.stepIds.delete(id);
    }

    /**
     * Removes all steps from the collection
     */
    public clear(): void {
        this.steps = [];
        this.stepIds.clear();
    }
}

export { StepManager, type Step, type StepType };
