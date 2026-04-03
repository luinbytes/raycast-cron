import React, { useState, useEffect } from "react";
import { List, Action, ActionPanel, showToast, Toast, confirmAlert, Alert } from "@raycast/api";
import CronBuilder from "./components/CronBuilder";
import { hermesCronApi, CronJob } from "./lib/hermes-api";



export default function ListCronJobs() {
  const [jobs, setJobs] = useState<CronJob[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showBuilder, setShowBuilder] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<string>("Checking...");

  const checkConnection = async () => {
    try {
      const isConnected = await hermesCronApi.testConnection();
      setConnectionStatus(isConnected ? "Connected" : "Disconnected");
    } catch (error) {
      setConnectionStatus("Error");
    }
  };

  const loadJobs = async () => {
    setIsLoading(true);
    try {
      const jobs = await hermesCronApi.listJobs(true); // Include disabled jobs
      setJobs(Array.isArray(jobs) ? jobs : []);
    } catch (error) {
      console.error("Failed to load cron jobs:", error);
      await showToast({
        style: Toast.Style.Failure,
        title: "Failed to Load Jobs",
        message: error instanceof Error ? error.message : "Could not fetch cron jobs from Hermes",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    const initialize = async () => {
      await checkConnection();
      await loadJobs();
    };
    initialize();
  }, []);

  const toggleJob = async (jobId: string, enabled: boolean) => {
    try {
      if (enabled) {
        await hermesCronApi.enableJob(jobId);
      } else {
        await hermesCronApi.disableJob(jobId);
      }
      
      // Reload jobs to get updated status
      await loadJobs();
      
      await showToast({
        style: Toast.Style.Success,
        title: `Job ${enabled ? "Enabled" : "Disabled"}`,
        message: `Successfully ${enabled ? "enabled" : "disabled"} job`,
      });
    } catch (error) {
      await showToast({
        style: Toast.Style.Failure,
        title: "Failed to Toggle Job",
        message: error instanceof Error ? error.message : "Could not update job status",
      });
    }
  };

  const deleteJob = async (jobId: string) => {
    const confirmed = await confirmAlert({
      title: "Delete Cron Job",
      message: "Are you sure you want to delete this cron job? This action cannot be undone.",
      primaryAction: {
        title: "Delete",
        style: Alert.ActionStyle.Destructive,
      },
    });

    if (!confirmed) return;

    try {
      await hermesCronApi.deleteJob(jobId);
      await loadJobs();
      
      await showToast({
        style: Toast.Style.Success,
        title: "Job Deleted",
        message: "Cron job has been deleted successfully",
      });
    } catch (error) {
      await showToast({
        style: Toast.Style.Failure,
        title: "Failed to Delete Job",
        message: error instanceof Error ? error.message : "Could not delete cron job",
      });
    }
  };

  const runJob = async (jobId: string) => {
    try {
      await hermesCronApi.runJob(jobId);
      
      await showToast({
        style: Toast.Style.Success,
        title: "Job Running",
        message: "Cron job has been triggered successfully",
      });
    } catch (error) {
      await showToast({
        style: Toast.Style.Failure,
        title: "Failed to Run Job",
        message: error instanceof Error ? error.message : "Could not run cron job",
      });
    }
  };

  if (showBuilder) {
    return (
      <CronBuilder
        onBuild={async (expression, description) => {
          await loadJobs(); // Refresh the job list
          setShowBuilder(false);
        }}
      />
    );
  }

  if (isLoading) {
    return <List isLoading={true} />;
  }

  return (
    <List
      searchBarPlaceholder="Search cron jobs..."
      onSearchTextChange={(text) => {
        // TODO: Implement search
      }}
    >
      <List.EmptyView
        title="No cron jobs found"
        description="Create a new cron job to get started"
      />
      
      {connectionStatus !== "Connected" && (
        <List.Item
          title="Connection Status"
          subtitle={`Hermes: ${connectionStatus}`}
          accessories={[
            {
              text: connectionStatus === "Connected" ? "✓" : "✗",
              icon: connectionStatus === "Connected" ? "checkmark" : "xmark"
            }
          ]}
        />
      )}
      
      <List.Section title="Quick Actions">
        <List.Item
          title="Create New Cron Job"
          subtitle="Build a new cron expression"
          actions={
            <ActionPanel>
              <Action
                title="Create New Cron Job"
                icon="plus"
                onAction={() => setShowBuilder(true)}
              />
            </ActionPanel>
          }
        />
      </List.Section>

      <List.Section title="Cron Jobs">
        {jobs.map((job) => (
          <List.Item
            key={job.id}
            title={job.name}
            subtitle={job.cron}
            accessories={[
              {
                text: job.enabled ? "Enabled" : "Disabled",
                icon: job.enabled ? "checkmark" : "xmark"
              }
            ]}
            actions={
              <ActionPanel>
                <Action
                  title={job.enabled ? "Disable" : "Enable"}
                  icon={job.enabled ? "disable" : "enable"}
                  onAction={() => toggleJob(job.id, !job.enabled)}
                />
                <Action
                  title="Edit"
                  icon="pencil"
                  onAction={() => {
                    // TODO: Implement edit functionality
                  }}
                />
                <Action
                  title="Run Now"
                  icon="play"
                  onAction={() => runJob(job.id)}
                />
                <Action
                  title="Delete"
                  icon="trash"
                  style={Action.Style.Destructive}
                  onAction={() => deleteJob(job.id)}
                />
              </ActionPanel>
            }
          />
        ))}
      </List.Section>
    </List>
  );
}