/**
 * Hermes Cron API Integration
 * 
 * Provides functions to interact with Hermes cron jobs via the Python API.
 * Uses direct Python invocation instead of CLI to get reliable JSON output.
 */

import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

const HERMES_PYTHON = "/home/discord/.hermes/hermes-agent/venv/bin/python3";
const HERMES_ROOT = "/home/discord/.hermes/hermes-agent";

export interface CronJob {
  id: string;
  name: string;
  schedule: string;
  scheduleDisplay?: string;
  description?: string;
  enabled: boolean;
  state?: string;
  createdAt?: string;
  nextRunAt?: string;
  lastRunAt?: string;
  lastStatus?: string;
  promptPreview?: string;
  skills?: string[];
  repeat?: string;
  deliver?: string;
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
  message?: string; // Prompt text for agent jobs
  deliver?: string;
  repeat?: number;
  skills?: string[];
}

/**
 * Execute a Hermes Python API call and return parsed JSON.
 */
async function hermesApiCall(code: string): Promise<any> {
  const fullCode = `
import sys, json
sys.path.insert(0, "${HERMES_ROOT}")
${code}
`;
  try {
    const { stdout } = await execAsync(
      `"${HERMES_PYTHON}" -c ${JSON.stringify(fullCode)}`,
      { timeout: 15000 }
    );
    return JSON.parse(stdout);
  } catch (error: any) {
    console.error("Hermes API call failed:", error);
    throw error;
  }
}

export class HermesCronApi {
  /**
   * List all cron jobs
   */
  public async listJobs(includeDisabled = false): Promise<CronJob[]> {
    try {
      const jobs = await hermesApiCall(`
from cron.jobs import list_jobs
jobs = list_jobs(include_disabled=${includeDisabled})
print(json.dumps(jobs))
`);

      return (Array.isArray(jobs) ? jobs : []).map((job: any) => ({
        id: job.id,
        name: job.name,
        schedule: job.schedule_display || job.schedule?.value || job.schedule || "",
        scheduleDisplay: job.schedule_display,
        enabled: job.enabled !== false,
        state: job.state,
        createdAt: job.created_at,
        nextRunAt: job.next_run_at,
        lastRunAt: job.last_run_at,
        lastStatus: job.last_status,
        promptPreview: job.prompt?.substring(0, 100),
        skills: job.skills || [],
        repeat: job.repeat?.times ? \`\${job.repeat.completed || 0}/\${job.repeat.times}\` : "∞",
        deliver: Array.isArray(job.deliver) ? job.deliver.join(", ") : job.deliver || "local",
      }));
    } catch (error) {
      console.error("Failed to list cron jobs:", error);
      return [];
    }
  }

  /**
   * Create a new cron job
   */
  public async createJob(options: CreateCronJobOptions): Promise<CronJob> {
    const skillsJson = options.skills ? JSON.stringify(options.skills) : "None";
    const prompt = options.message || options.description || `Run: ${options.name}`;

    const job = await hermesApiCall(`
from cron.jobs import create_job
job = create_job(
    prompt=${JSON.stringify(prompt)},
    schedule=${JSON.stringify(options.cron)},
    name=${JSON.stringify(options.name)},
    enabled=${options.enabled !== false},
    deliver=${options.deliver ? JSON.stringify(options.deliver) : "None"},
    repeat=${options.repeat != null ? options.repeat : "None"},
    skills=${skillsJson},
)
print(json.dumps(job))
`);

    return {
      id: job.id,
      name: job.name,
      schedule: job.schedule_display || options.cron,
      enabled: job.enabled !== false,
      state: job.state,
      createdAt: job.created_at,
      nextRunAt: job.next_run_at,
    };
  }

  /**
   * Enable (resume) a cron job
   */
  public async enableJob(jobId: string): Promise<void> {
    await hermesApiCall(`
from cron.jobs import resume_job
resume_job(${JSON.stringify(jobId)})
print("ok")
`);
  }

  /**
   * Disable (pause) a cron job
   */
  public async disableJob(jobId: string): Promise<void> {
    await hermesApiCall(`
from cron.jobs import pause_job
pause_job(${JSON.stringify(jobId)})
print("ok")
`);
  }

  /**
   * Delete a cron job
   */
  public async deleteJob(jobId: string): Promise<void> {
    await hermesApiCall(`
from cron.jobs import remove_job
remove_job(${JSON.stringify(jobId)})
print("ok")
`);
  }

  /**
   * Trigger a cron job to run on the next tick
   */
  public async runJob(jobId: string): Promise<void> {
    await hermesApiCall(`
from cron.jobs import trigger_job
trigger_job(${JSON.stringify(jobId)})
print("ok")
`);
  }

  /**
   * Test connection to Hermes (checks if gateway is running)
   */
  public async testConnection(): Promise<boolean> {
    try {
      const running = await hermesApiCall(`
from hermes_cli.gateway import find_gateway_pids
pids = find_gateway_pids()
print("true" if pids else "false")
`);
      return running === true || running === "true";
    } catch (error) {
      console.error("Connection test failed:", error);
      return false;
    }
  }
}

// Export singleton instance
export const hermesCronApi = new HermesCronApi();
