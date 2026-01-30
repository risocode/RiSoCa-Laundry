/**
 * Email Queue and Rate Limiter
 * 
 * Manages email sending with:
 * - Rate limiting (2 requests/second max)
 * - Daily limit tracking (100 emails/day)
 * - Monthly limit tracking (3000 emails/month)
 * - Queue system for when rate limit is hit
 */

interface QueuedEmail {
  id: string;
  type: 'password_reset' | 'email_confirmation' | 'other';
  recipient: string;
  sendFn: () => Promise<any>;
  timestamp: number;
  retries: number;
}

interface EmailUsage {
  daily: { count: number; date: string };
  monthly: { count: number; month: string };
}

const RATE_LIMIT_MS = 500; // 500ms = 2 req/s max
const MAX_DAILY_EMAILS = 100;
const MAX_MONTHLY_EMAILS = 3000;
const MAX_RETRIES = 3;
const QUEUE_CHECK_INTERVAL = 100; // Check queue every 100ms

class EmailQueueManager {
  private queue: QueuedEmail[] = [];
  private lastEmailTime: number = 0;
  private isProcessing: boolean = false;
  private processingInterval: NodeJS.Timeout | null = null;

  /**
   * Get current email usage from localStorage
   */
  private getEmailUsage(): EmailUsage {
    if (typeof window === 'undefined') {
      return {
        daily: { count: 0, date: new Date().toISOString().split('T')[0] },
        monthly: { count: 0, month: new Date().toISOString().slice(0, 7) }
      };
    }

    try {
      const stored = localStorage.getItem('email_usage');
      if (!stored) {
        return {
          daily: { count: 0, date: new Date().toISOString().split('T')[0] },
          monthly: { count: 0, month: new Date().toISOString().slice(0, 7) }
        };
      }

      const usage: EmailUsage = JSON.parse(stored);
      const today = new Date().toISOString().split('T')[0];
      const thisMonth = new Date().toISOString().slice(0, 7);

      // Reset daily count if it's a new day
      if (usage.daily.date !== today) {
        usage.daily = { count: 0, date: today };
      }

      // Reset monthly count if it's a new month
      if (usage.monthly.month !== thisMonth) {
        usage.monthly = { count: 0, month: thisMonth };
      }

      return usage;
    } catch {
      return {
        daily: { count: 0, date: new Date().toISOString().split('T')[0] },
        monthly: { count: 0, month: new Date().toISOString().slice(0, 7) }
      };
    }
  }

  /**
   * Save email usage to localStorage
   */
  private saveEmailUsage(usage: EmailUsage): void {
    if (typeof window === 'undefined') return;

    try {
      localStorage.setItem('email_usage', JSON.stringify(usage));
    } catch {
      // Ignore localStorage errors
    }
  }

  /**
   * Increment email usage counters
   */
  private incrementUsage(): void {
    const usage = this.getEmailUsage();
    usage.daily.count += 1;
    usage.monthly.count += 1;
    this.saveEmailUsage(usage);
  }

  /**
   * Check if we can send an email (within limits)
   */
  canSendEmail(): { canSend: boolean; reason?: string; dailyRemaining?: number; monthlyRemaining?: number } {
    const usage = this.getEmailUsage();

    if (usage.daily.count >= MAX_DAILY_EMAILS) {
      return {
        canSend: false,
        reason: `Daily email limit reached (${MAX_DAILY_EMAILS}/day). Please try again tomorrow.`,
        dailyRemaining: 0,
        monthlyRemaining: MAX_MONTHLY_EMAILS - usage.monthly.count
      };
    }

    if (usage.monthly.count >= MAX_MONTHLY_EMAILS) {
      return {
        canSend: false,
        reason: `Monthly email limit reached (${MAX_MONTHLY_EMAILS}/month). Please upgrade your plan or wait until next month.`,
        dailyRemaining: MAX_DAILY_EMAILS - usage.daily.count,
        monthlyRemaining: 0
      };
    }

    return {
      canSend: true,
      dailyRemaining: MAX_DAILY_EMAILS - usage.daily.count,
      monthlyRemaining: MAX_MONTHLY_EMAILS - usage.monthly.count
    };
  }

  /**
   * Get current usage stats
   */
  getUsageStats(): {
    daily: { used: number; limit: number; remaining: number; percentage: number };
    monthly: { used: number; limit: number; remaining: number; percentage: number };
  } {
    const usage = this.getEmailUsage();

    return {
      daily: {
        used: usage.daily.count,
        limit: MAX_DAILY_EMAILS,
        remaining: MAX_DAILY_EMAILS - usage.daily.count,
        percentage: Math.round((usage.daily.count / MAX_DAILY_EMAILS) * 100)
      },
      monthly: {
        used: usage.monthly.count,
        limit: MAX_MONTHLY_EMAILS,
        remaining: MAX_MONTHLY_EMAILS - usage.monthly.count,
        percentage: Math.round((usage.monthly.count / MAX_MONTHLY_EMAILS) * 100)
      }
    };
  }

  /**
   * Process the email queue
   */
  private async processQueue(): Promise<void> {
    if (this.isProcessing || this.queue.length === 0) {
      return;
    }

    this.isProcessing = true;

    while (this.queue.length > 0) {
      const canSend = this.canSendEmail();
      if (!canSend.canSend) {
        // Remove emails from queue if we've hit limits
        this.queue = [];
        console.warn('Email queue cleared - limits reached:', canSend.reason);
        break;
      }

      // Check rate limit (2 req/s = 500ms between emails)
      const now = Date.now();
      const timeSinceLastEmail = now - this.lastEmailTime;

      if (timeSinceLastEmail < RATE_LIMIT_MS) {
        // Wait until we can send the next email
        await new Promise(resolve => 
          setTimeout(resolve, RATE_LIMIT_MS - timeSinceLastEmail)
        );
      }

      const email = this.queue.shift();
      if (!email) break;

      try {
        // Send the email (Supabase handles the actual sending)
        const result = await email.sendFn();
        this.lastEmailTime = Date.now();
        
        // Only increment usage if email was successfully queued/sent
        // Supabase returns error if email fails, so check for that
        if (result && !result.error) {
          this.incrementUsage();
        } else if (result?.error) {
          // If Supabase returned an error, throw it so we can handle it
          throw result.error;
        }
      } catch (error: any) {
        console.error(`Failed to send email ${email.id}:`, error);
        
        // Check if it's a rate limit error (429) or limit error
        if (error?.status === 429 || error?.message?.includes('limit')) {
          // Don't retry rate limit errors - clear queue
          this.queue = [];
          console.warn('Email queue cleared due to rate limit');
          break;
        }
        
        // Retry if we haven't exceeded max retries
        if (email.retries < MAX_RETRIES) {
          email.retries += 1;
          email.timestamp = Date.now();
          this.queue.push(email); // Add back to queue
        } else {
          console.error(`Email ${email.id} failed after ${MAX_RETRIES} retries`);
        }
      }
    }

    this.isProcessing = false;
  }

  /**
   * Start processing the queue
   */
  private startProcessing(): void {
    if (this.processingInterval) return;

    this.processingInterval = setInterval(() => {
      this.processQueue();
    }, QUEUE_CHECK_INTERVAL);
  }

  /**
   * Stop processing the queue
   */
  private stopProcessing(): void {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = null;
    }
  }

  /**
   * Queue an email to be sent
   */
  async queueEmail(
    type: QueuedEmail['type'],
    recipient: string,
    sendFn: () => Promise<any>
  ): Promise<{ queued: boolean; error?: string; position?: number }> {
    // Check if we can send
    const canSend = this.canSendEmail();
    if (!canSend.canSend) {
      return {
        queued: false,
        error: canSend.reason
      };
    }

    const email: QueuedEmail = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      recipient,
      sendFn,
      timestamp: Date.now(),
      retries: 0
    };

    this.queue.push(email);
    this.startProcessing();

    return {
      queued: true,
      position: this.queue.length
    };
  }

  /**
   * Get queue status
   */
  getQueueStatus(): { length: number; isProcessing: boolean } {
    return {
      length: this.queue.length,
      isProcessing: this.isProcessing
    };
  }

  /**
   * Clear the queue
   */
  clearQueue(): void {
    this.queue = [];
  }

  /**
   * Reset usage (for testing or manual reset)
   */
  resetUsage(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem('email_usage');
  }
}

// Singleton instance
export const emailQueue = new EmailQueueManager();

