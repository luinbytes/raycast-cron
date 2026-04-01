/**
 * Natural Language Cron Parser
 * 
 * Converts natural language phrases into cron expressions using
 * pattern matching and keyword analysis.
 */

export interface ParseResult {
  expression: string;
  confidence: number;
  matchedPattern: string;
}

export class NlpParser {
  // Define patterns and their corresponding cron expressions
  private patterns = [
    // Time of day patterns
    {
      pattern: /every\s+day\s+at\s+midnight/i,
      cron: "0 0 * * *",
      keywords: ["every day", "midnight"]
    },
    {
      pattern: /daily\s+at\s+midnight/i,
      cron: "0 0 * * *",
      keywords: ["daily", "midnight"]
    },
    {
      pattern: /every\s+day\s+at\s+noon/i,
      cron: "0 12 * * *",
      keywords: ["every day", "noon"]
    },
    {
      pattern: /daily\s+at\s+noon/i,
      cron: "0 12 * * *",
      keywords: ["daily", "noon"]
    },
    {
      pattern: /every\s+day\s+at\s+(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i,
      cron: (match: RegExpMatchArray) => {
        let hour = parseInt(match[1]);
        const minute = match[2] || "0";
        const period = match[3]?.toLowerCase();
        
        if (period === "pm" && hour !== 12) {
          hour += 12;
        } else if (period === "am" && hour === 12) {
          hour = 0;
        }
        
        return `${minute} ${hour} * * *`;
      },
      keywords: ["every day", "daily"]
    },
    
    // Day of week patterns
    {
      pattern: /every\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\s+at\s+(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i,
      cron: (match: RegExpMatchArray) => {
        const dayMap: Record<string, string> = {
          "monday": "1", "tuesday": "2", "wednesday": "3", "thursday": "4",
          "friday": "5", "saturday": "6", "sunday": "0"
        };
        
        let hour = parseInt(match[2]);
        const minute = match[3] || "0";
        const period = match[4]?.toLowerCase();
        const day = dayMap[match[1].toLowerCase()];
        
        if (period === "pm" && hour !== 12) {
          hour += 12;
        } else if (period === "am" && hour === 12) {
          hour = 0;
        }
        
        return `${minute} ${hour} * * ${day}`;
      },
      keywords: ["every", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]
    },
    
    // Recurring interval patterns
    {
      pattern: /every\s+(\d+)\s+(minutes?|hours?|days?)/i,
      cron: (match: RegExpMatchArray) => {
        const value = parseInt(match[1]);
        const unit = match[2].toLowerCase();
        
        if (unit.includes("minute")) {
          return `*/${value} * * * *`;
        } else if (unit.includes("hour")) {
          return `0 */${value} * * *`;
        } else if (unit.includes("day")) {
          return `0 0 */${value} * *`;
        }
        
        return "* * * * *"; // fallback
      },
      keywords: ["every", "minutes", "hours", "days"]
    },
    
    // Weekday patterns
    {
      pattern: /weekdays?\s+at\s+(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i,
      cron: (match: RegExpMatchArray) => {
        let hour = parseInt(match[1]);
        const minute = match[2] || "0";
        const period = match[3]?.toLowerCase();
        
        if (period === "pm" && hour !== 12) {
          hour += 12;
        } else if (period === "am" && hour === 12) {
          hour = 0;
        }
        
        return `${minute} ${hour} * * 1-5`;
      },
      keywords: ["weekdays", "at"]
    },
    
    // Weekend patterns  
    {
      pattern: /weekends?\s+at\s+(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i,
      cron: (match: RegExpMatchArray) => {
        let hour = parseInt(match[1]);
        const minute = match[2] || "0";
        const period = match[3]?.toLowerCase();
        
        if (period === "pm" && hour !== 12) {
          hour += 12;
        } else if (period === "am" && hour === 12) {
          hour = 0;
        }
        
        return `${minute} ${hour} * * 0,6`;
      },
      keywords: ["weekends", "at"]
    },
    
    // Monthly patterns
    {
      pattern: /first\s+day\s+of\s+every\s+month\s+at\s+(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i,
      cron: (match: RegExpMatchArray) => {
        let hour = parseInt(match[1]);
        const minute = match[2] || "0";
        const period = match[3]?.toLowerCase();
        
        if (period === "pm" && hour !== 12) {
          hour += 12;
        } else if (period === "am" && hour === 12) {
          hour = 0;
        }
        
        return `${minute} ${hour} 1 * *`;
      },
      keywords: ["first day", "every month"]
    },
    
    {
      pattern: /last\s+day\s+of\s+every\s+month\s+at\s+(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i,
      cron: (match: RegExpMatchArray) => {
        let hour = parseInt(match[1]);
        const minute = match[2] || "0";
        const period = match[3]?.toLowerCase();
        
        if (period === "pm" && hour !== 12) {
          hour += 12;
        } else if (period === "am" && hour === 12) {
          hour = 0;
        }
        
        return `${minute} ${hour} L * *`;
      },
      keywords: ["last day", "every month"]
    }
  ];

  /**
   * Parse a natural language phrase into a cron expression
   */
  public parse(phrase: string): ParseResult | null {
    if (!phrase || typeof phrase !== "string") {
      return null;
    }

    const normalizedPhrase = phrase.trim().toLowerCase();

    // Try each pattern
    for (const patternDef of this.patterns) {
      const match = normalizedPhrase.match(patternDef.pattern);
      
      if (match) {
        let cronExpression: string;
        
        if (typeof patternDef.cron === "string") {
          cronExpression = patternDef.cron;
        } else {
          // Handle functions that generate cron expressions
          cronExpression = patternDef.cron(match);
        }
        
        // Calculate confidence based on keyword match strength
        const confidence = this.calculateConfidence(normalizedPhrase, patternDef.keywords);
        
        return {
          expression: cronExpression,
          confidence,
          matchedPattern: patternDef.pattern.toString()
        };
      }
    }

    // No pattern matched
    return null;
  }

  /**
   * Calculate confidence score based on keyword matches
   */
  private calculateConfidence(phrase: string, keywords: string[]): number {
    let score = 0;
    const keywordMatches = keywords.filter(keyword => 
      phrase.includes(keyword.toLowerCase())
    );
    
    // Base score from keyword matches
    score += (keywordMatches.length / keywords.length) * 0.7;
    
    // Bonus for exact pattern match (handled by regex above)
    score += 0.3;
    
    return Math.min(score, 1.0);
  }

  /**
   * Get a list of example phrases that can be parsed
   */
  public getExamplePhrases(): string[] {
    return [
      "every day at midnight",
      "daily at midnight",
      "every day at noon", 
      "daily at noon",
      "every monday at 9am",
      "every tuesday at 3pm",
      "every friday at 5:30pm",
      "every 2 hours",
      "every 30 minutes",
      "every day",
      "weekdays at 9am",
      "weekends at noon",
      "first day of every month at midnight",
      "last day of every month at 11:59pm"
    ];
  }
}

// Export singleton instance
export const nlpParser = new NlpParser();