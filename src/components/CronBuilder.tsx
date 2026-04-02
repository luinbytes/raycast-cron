import React, { useState, useEffect } from "react";
import { Form, Action, ActionPanel, showToast, Toast, Icon } from "@raycast/api";
import { nlpParser, ParseResult } from "../lib/nlp-parser";
import { openclawCronApi } from "../lib/openclaw-api";

interface CronParts {
  minute: string;
  hour: string;
  dayOfMonth: string;
  month: string;
  dayOfWeek: string;
}

interface CronBuilderProps {
  onBuild: (expression: string, description: string) => Promise<void>;
}

export default function CronBuilder({ onBuild }: CronBuilderProps) {
  const [cronParts, setCronParts] = useState<CronParts>({
    minute: "*",
    hour: "*",
    dayOfMonth: "*",
    month: "*",
    dayOfWeek: "*"
  });

  const [humanReadable, setHumanReadable] = useState("Every minute");
  
  // NLP parsing state
  const [nlpInput, setNlpInput] = useState("");
  const [nlpResult, setNlpResult] = useState<ParseResult | null>(null);
  const [isParsing, setIsParsing] = useState(false);

  // Preset configurations
  const presets = [
    { label: "Every Minute", value: { minute: "*", hour: "*", dayOfMonth: "*", month: "*", dayOfWeek: "*" } },
    { label: "Every Hour", value: { minute: "0", hour: "*", dayOfMonth: "*", month: "*", dayOfWeek: "*" } },
    { label: "Daily at Midnight", value: { minute: "0", hour: "0", dayOfMonth: "*", month: "*", dayOfWeek: "*" } },
    { label: "Daily at Noon", value: { minute: "0", hour: "12", dayOfMonth: "*", month: "*", dayOfWeek: "*" } },
    { label: "Weekdays at 9 AM", value: { minute: "0", hour: "9", dayOfMonth: "*", month: "*", dayOfWeek: "1-5" } },
    { label: "Weekends at Noon", value: { minute: "0", hour: "12", dayOfMonth: "*", month: "*", dayOfWeek: "0,6" } },
    { label: "Every Monday at 9 AM", value: { minute: "0", hour: "9", dayOfMonth: "*", month: "*", dayOfWeek: "1" } },
    { label: "First Day of Month", value: { minute: "0", hour: "0", dayOfMonth: "1", month: "*", dayOfWeek: "*" } },
  ];

  const generateHumanReadable = (parts: CronParts): string => {
    const { minute, hour, dayOfMonth, month, dayOfWeek } = parts;
    
    if (minute === "*" && hour === "*" && dayOfMonth === "*" && month === "*" && dayOfWeek === "*") {
      return "Every minute";
    }
    
    if (minute === "0" && hour === "*" && dayOfMonth === "*" && month === "*" && dayOfWeek === "*") {
      return "Every hour";
    }
    
    if (minute === "0" && hour === "0" && dayOfMonth === "*" && month === "*" && dayOfWeek === "*") {
      return "Daily at midnight";
    }
    
    if (minute === "0" && hour === "12" && dayOfMonth === "*" && month === "*" && dayOfWeek === "*") {
      return "Daily at noon";
    }
    
    if (minute === "0" && hour === "9" && dayOfMonth === "*" && month === "*" && dayOfWeek === "1-5") {
      return "Weekdays at 9 AM";
    }
    
    if (minute === "0" && hour === "12" && dayOfMonth === "*" && month === "*" && dayOfWeek === "0,6") {
      return "Weekends at noon";
    }
    
    if (minute === "0" && hour === "9" && dayOfMonth === "*" && month === "*" && dayOfWeek === "1") {
      return "Every Monday at 9 AM";
    }
    
    if (minute === "0" && hour === "0" && dayOfMonth === "1" && month === "*" && dayOfWeek === "*") {
      return "First day of every month at midnight";
    }
    
    // Fallback for custom expressions
    const customParts: string[] = [];
    if (minute !== "*") customParts.push(`minute ${minute}`);
    if (hour !== "*") customParts.push(`hour ${hour}`);
    if (dayOfMonth !== "*") customParts.push(`day ${dayOfMonth}`);
    if (month !== "*") customParts.push(`month ${month}`);
    if (dayOfWeek !== "*") customParts.push(`weekday ${dayOfWeek}`);
    
    return customParts.length > 0 ? `Custom: ${customParts.join(", ")}` : "Custom cron expression";
  };

  useEffect(() => {
    setHumanReadable(generateHumanReadable(cronParts));
  }, [cronParts]);

  const handlePresetSelect = (preset: string) => {
    const selectedPreset = presets.find(p => p.label === preset);
    if (selectedPreset) {
      setCronParts(selectedPreset.value);
      setNlpInput("");
      setNlpResult(null);
    }
  };

  // Handle NLP parsing
  const handleNlpInput = (text: string) => {
    setNlpInput(text);
    
    if (text.trim()) {
      setIsParsing(true);
      const result = nlpParser.parse(text);
      setNlpResult(result);
      setIsParsing(false);
      
      if (result) {
        // Parse the cron expression back to parts
        const expressionParts = result.expression.split(" ");
        if (expressionParts.length === 5) {
          setCronParts({
            minute: expressionParts[0],
            hour: expressionParts[1],
            dayOfMonth: expressionParts[2],
            month: expressionParts[3],
            dayOfWeek: expressionParts[4],
          });
        }
      }
    } else {
      setNlpResult(null);
    }
  };

  // Get example phrases for NLP
  const examplePhrases = nlpParser.getExamplePhrases();

  const buildCronExpression = async () => {
    const expression = `${cronParts.minute} ${cronParts.hour} ${cronParts.dayOfMonth} ${cronParts.month} ${cronParts.dayOfWeek}`;
    
    try {
      await openclawCronApi.createJob({
        name: `Cron Job - ${humanReadable}`,
        cron: expression,
        description: humanReadable,
        enabled: true
      });
      
      await showToast({
        style: Toast.Style.Success,
        title: "Cron Job Created",
        message: `Created: ${humanReadable}`,
      });
      
      onBuild(expression, humanReadable);
    } catch (error) {
      await showToast({
        style: Toast.Style.Failure,
        title: "Failed to Create Job",
        message: error instanceof Error ? error.message : "Could not create cron job",
      });
    }
  };

  const getCronExpression = () => {
    return `${cronParts.minute} ${cronParts.hour} ${cronParts.dayOfMonth} ${cronParts.month} ${cronParts.dayOfWeek}`;
  };

  return (
    <Form
      actions={
        <ActionPanel>
          <Action
            title="Build Cron Expression"
            icon={Icon.Check}
            onAction={buildCronExpression}
          />
        </ActionPanel>
      }
    >
      <Form.TextField
        id="nlp-input"
        title="Natural Language (Optional)"
        placeholder="e.g., 'every monday at 9am', 'daily at midnight', 'every 2 hours'"
        value={nlpInput}
        onChange={handleNlpInput}
      />
      
      {isParsing && (
        <Form.Description
          title="Parsing..."
          text="Analyzing your natural language phrase"
        />
      )}
      
      {nlpResult && (
        <Form.Description
          title="NLP Result"
          text={`Expression: ${nlpResult.expression} (Confidence: ${Math.round(nlpResult.confidence * 100)}%)`}
        />
      )}
      
      {!nlpResult && nlpInput && (
        <Form.Description
          title="No Match Found"
          text="Try using one of the example phrases below"
        />
      )}
      
      <Form.Description
        title="Natural Language Examples"
        text={examplePhrases.slice(0, 3).join(" • ")}
      />
      
      <Form.Dropdown
        id="preset"
        title="Quick Preset"
        placeholder="Select a preset"
        onChange={handlePresetSelect}
      >
        <Form.Dropdown.Item title="Every Minute" value="Every Minute" />
        <Form.Dropdown.Item title="Every Hour" value="Every Hour" />
        <Form.Dropdown.Item title="Daily at Midnight" value="Daily at Midnight" />
        <Form.Dropdown.Item title="Daily at Noon" value="Daily at Noon" />
        <Form.Dropdown.Item title="Weekdays at 9 AM" value="Weekdays at 9 AM" />
        <Form.Dropdown.Item title="Weekends at Noon" value="Weekends at Noon" />
        <Form.Dropdown.Item title="Every Monday at 9 AM" value="Every Monday at 9 AM" />
        <Form.Dropdown.Item title="First Day of Month" value="First Day of Month" />
      </Form.Dropdown>

      <Form.TextField
        id="minute"
        title="Minute (0-59)"
        placeholder="* for every minute, 0 for first minute"
        value={cronParts.minute}
        onChange={(value) => setCronParts({ ...cronParts, minute: value })}
      />

      <Form.TextField
        id="hour"
        title="Hour (0-23)"
        placeholder="* for every hour, 0 for midnight"
        value={cronParts.hour}
        onChange={(value) => setCronParts({ ...cronParts, hour: value })}
      />

      <Form.TextField
        id="dayOfMonth"
        title="Day of Month (1-31)"
        placeholder="* for every day, 1 for first day"
        value={cronParts.dayOfMonth}
        onChange={(value) => setCronParts({ ...cronParts, dayOfMonth: value })}
      />

      <Form.TextField
        id="month"
        title="Month (1-12)"
        placeholder="* for every month, 1 for January"
        value={cronParts.month}
        onChange={(value) => setCronParts({ ...cronParts, month: value })}
      />

      <Form.TextField
        id="dayOfWeek"
        title="Day of Week (0-7, 0 or 7 is Sunday)"
        placeholder="* for every day, 1 for Monday"
        value={cronParts.dayOfWeek}
        onChange={(value) => setCronParts({ ...cronParts, dayOfWeek: value })}
      />

      <Form.Description
        title="Human Readable"
        text={humanReadable}
      />

      <Form.Description
        title="Cron Expression"
        text={getCronExpression()}
      />
    </Form>
  );
}