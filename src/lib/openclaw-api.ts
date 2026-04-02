/**
 * OpenClaw Cron API Integration
 * 
 * Provides functions to interact with OpenClaw cron jobs via CLI commands
 */

import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export interface CronJob {
  id: string;
  name: string;
  cron: string;
  description?: string;
  enabled: boolean;
  createdAt?: string;
  updatedAt?: string;
  runs?: CronRun[];
}

export interface CronRun {
  id: string;
  jobId: string;
  status: "success" | "failed" | "running";
  startTime: string;
  endTime?: string;
  error?: string;
}

export interface CreateCronJobOptions {
  name: string;
  cron: string;
  description?: string;
  enabled?: boolean;
  message?: string; // For agent jobs
  agentId?: string; // For agent jobs
  channel?: string;
  to?: string; // Destination for delivery
  announce?: boolean; // Announce to chat
}

export interface OpenClawConfig {
  url?: string;
  token?: string;
}

export class OpenClawCronApi {
  private config: OpenClawConfig;

  constructor(config: OpenClawConfig = {}) {
    this.config = config;
  }

  /**
   * List all cron jobs
   */
  public async listJobs(includeDisabled = false): Promise<CronJob[]> {
    const command = this.buildCommand("cron list", {
      json: true,
      all: includeDisabled,
      url: this.config.url,
      token: this.config.token
    });

    try {
      const { stdout } = await execAsync(command);
      const parsed = JSON.parse(stdout);
      const jobs = Array.isArray(parsed) ? parsed : [];
      return jobs.map((job: any) => ({
        ...job,
        enabled: job.enabled !== false,
        createdAt: job.created_at,
        updatedAt: job.updated_at
      }));
    } catch (error) {
      console.error("Failed to list cron jobs:", error);
      // Return empty array instead of crashing — lets the UI render gracefully
      return [];
    }
  }

  /**
   * Create a new cron job
   */
  public async createJob(options: CreateCronJobOptions): Promise<CronJob> {
    const command = this.buildCommand("cron add", {
      name: options.name,
      cron: options.cron,
      description: options.description,
      disabled: !options.enabled,
      ...(options.message && { message: options.message }),
      ...(options.agentId && { agent: options.agentId }),
      ...(options.channel && { channel: options.channel }),
      ...(options.to && { to: options.to }),
      ...(options.announce && { announce: true }),
      json: true,
      url: this.config.url,
      token: this.config.token
    });

    try {
      const { stdout } = await execAsync(command);
      const job = JSON.parse(stdout);
      return {
        ...job,
        enabled: job.enabled !== false,
        createdAt: job.created_at,
        updatedAt: job.updated_at
      };
    } catch (error) {
      console.error("Failed to create cron job:", error);
      throw new Error(`Failed to create cron job: ${error}`);
    }
  }

  /**
   * Enable a cron job
   */
  public async enableJob(jobId: string): Promise<void> {
    const command = this.buildCommand(`cron enable ${jobId}`, {
      url: this.config.url,
      token: this.config.token
    });

    try {
      await execAsync(command);
    } catch (error) {
      console.error("Failed to enable cron job:", error);
      throw new Error(`Failed to enable cron job: ${error}`);
    }
  }

  /**
   * Disable a cron job
   */
  public async disableJob(jobId: string): Promise<void> {
    const command = this.buildCommand(`cron disable ${jobId}`, {
      url: this.config.url,
      token: this.config.token
    });

    try {
      await execAsync(command);
    } catch (error) {
      console.error("Failed to disable cron job:", error);
      throw new Error(`Failed to disable cron job: ${error}`);
    }
  }

  /**
   * Delete a cron job
   */
  public async deleteJob(jobId: string): Promise<void> {
    const command = this.buildCommand(`cron rm ${jobId}`, {
      url: this.config.url,
      token: this.config.token
    });

    try {
      await execAsync(command);
    } catch (error) {
      console.error("Failed to delete cron job:", error);
      throw new Error(`Failed to delete cron job: ${error}`);
    }
  }

  /**
   * Get cron job history/runs
   */
  public async getJobRuns(jobId: string): Promise<CronRun[]> {
    const command = this.buildCommand(`cron runs ${jobId}`, {
      json: true,
      url: this.config.url,
      token: this.config.token
    });

    try {
      const { stdout } = await execAsync(command);
      const parsed = JSON.parse(stdout);
      const runs = Array.isArray(parsed) ? parsed : [];
      return runs.map((run: any) => ({
        ...run,
        startTime: run.start_time,
        endTime: run.end_time,
        status: run.status
      }));
    } catch (error) {
      console.error("Failed to get job runs:", error);
      // Return empty array instead of crashing
      return [];
    }
  }

  /**
   * Run a cron job immediately (for testing)
   */
  public async runJob(jobId: string): Promise<void> {
    const command = this.buildCommand(`cron run ${jobId}`, {
      url: this.config.url,
      token: this.config.token
    });

    try {
      await execAsync(command);
    } catch (error) {
      console.error("Failed to run cron job:", error);
      throw new Error(`Failed to run cron job: ${error}`);
    }
  }

  /**
   * Build openclaw command with options
   */
  private buildCommand(command: string, options: Record<string, any>): string {
    let fullCommand = "openclaw";

    // Add URL and token if provided
    if (this.config.url) {
      fullCommand += ` --url "${this.config.url}"`;
    }
    if (this.config.token) {
      fullCommand += ` --token "${this.config.token}"`;
    }

    // Add command
    fullCommand += ` ${command}`;

    // Add options
    Object.entries(options).forEach(([key, value]) => {
      if (value === true || value === false) {
        fullCommand += ` --${key}`;
      } else if (value !== undefined && value !== null) {
        fullCommand += ` --${key} "${value}"`;
      }
    });

    return fullCommand;
  }

  /**
   * Test connection to OpenClaw
   */
  public async testConnection(): Promise<boolean> {
    try {
      const command = this.buildCommand("cron status", {
        url: this.config.url,
        token: this.config.token
      });
      await execAsync(command);
      return true;
    } catch (error) {
      console.error("Connection test failed:", error);
      return false;
    }
  }

  /**
   * Get OpenClaw cron scheduler status
   */
  public async getStatus(): Promise<any> {
    const command = this.buildCommand("cron status", {
      json: true,
      url: this.config.url,
      token: this.config.token
    });

    try {
      const { stdout } = await execAsync(command);
      return JSON.parse(stdout);
    } catch (error) {
      console.error("Failed to get cron status:", error);
      throw new Error(`Failed to get cron status: ${error}`);
    }
  }
}

// Export singleton instance with default config
export const openclawCronApi = new OpenClawCronApi();