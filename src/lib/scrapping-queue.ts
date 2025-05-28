// src/lib/scraping-queue.ts - NEW FILE
import { createClient } from './supabase'

interface QueuedJob {
  id: string
  website_id: string
  url: string
  priority: 'low' | 'normal' | 'high'
  attempts: number
  max_attempts: number
  status: 'pending' | 'processing' | 'completed' | 'failed'
  created_at: string
  updated_at: string
  next_retry_at?: string
  error_message?: string
}

class ScrapingQueue {
  private supabase = createClient()
  private isProcessing = false
  private intervalId: NodeJS.Timeout | null = null

  constructor() {
    this.startProcessing()
  }

  /**
   * Add a website to the scraping queue
   */
  async enqueue(websiteId: string, url: string, priority: 'low' | 'normal' | 'high' = 'normal') {
    try {
      const { data, error } = await this.supabase
        .from('scraping_queue')
        .insert({
          website_id: websiteId,
          url: url,
          priority: priority,
          status: 'pending',
          attempts: 0,
          max_attempts: 3
        })
        .select()
        .single()

      if (error) throw error

      console.log(`✅ Added website ${websiteId} to scraping queue`)
      return data

    } catch (error) {
      console.error('❌ Failed to enqueue scraping job:', error)
      throw error
    }
  }

  /**
   * Process pending jobs in the queue
   */
  private async processQueue() {
    if (this.isProcessing) return

    this.isProcessing = true

    try {
      // Get the next pending job with highest priority
      const { data: jobs, error } = await this.supabase
        .from('scraping_queue')
        .select('*')
        .eq('status', 'pending')
        .lte('next_retry_at', new Date().toISOString())
        .order('priority', { ascending: false })
        .order('created_at', { ascending: true })
        .limit(1)

      if (error) throw error

      if (jobs && jobs.length > 0) {
        const job = jobs[0]
        await this.processJob(job)
      }

    } catch (error) {
      console.error('❌ Error processing queue:', error)
    } finally {
      this.isProcessing = false
    }
  }

  /**
   * Process a single scraping job
   */
  private async processJob(job: QueuedJob) {
    console.log(`🔄 Processing scraping job for website ${job.website_id}`)

    try {
      // Mark job as processing
      await this.updateJobStatus(job.id, 'processing')

      // Update website status to scraping
      await this.supabase
        .from('websites')
        .update({ status: 'scraping', updated_at: new Date().toISOString() })
        .eq('id', job.website_id)

      // Import scraping service dynamically to avoid circular dependencies
      const { scrapingService } = await import('./scraping-service')

      // Execute the scraping workflow
      const result = await scrapingService.scrapeWebsite({
        websiteId: job.website_id,
        url: job.url,
        onStatusUpdate: (status) => {
          console.log(`📊 Scraping status for ${job.website_id}: ${status}`)
        }
      })

      if (result.success) {
        // Mark job as completed
        await this.updateJobStatus(job.id, 'completed')
        console.log(`✅ Scraping completed for website ${job.website_id}`)
      } else {
        throw new Error(result.error || 'Scraping failed')
      }

    } catch (error: any) {
      console.error(`❌ Scraping failed for website ${job.website_id}:`, error)

      // Increment attempt count
      const newAttempts = job.attempts + 1

      if (newAttempts >= job.max_attempts) {
        // Mark as failed permanently
        await this.updateJobStatus(job.id, 'failed', error.message)
        
        // Update website status to error
        await this.supabase
          .from('websites')
          .update({ status: 'error', updated_at: new Date().toISOString() })
          .eq('id', job.website_id)

        console.log(`❌ Scraping job permanently failed for website ${job.website_id}`)
      } else {
        // Schedule retry with exponential backoff
        const retryDelay = Math.pow(2, newAttempts) * 60 * 1000 // 2^attempts minutes
        const nextRetryAt = new Date(Date.now() + retryDelay)

        await this.supabase
          .from('scraping_queue')
          .update({
            status: 'pending',
            attempts: newAttempts,
            next_retry_at: nextRetryAt.toISOString(),
            error_message: error.message,
            updated_at: new Date().toISOString()
          })
          .eq('id', job.id)

        console.log(`🔄 Scheduled retry for website ${job.website_id} at ${nextRetryAt.toISOString()}`)
      }
    }
  }

  /**
   * Update job status in the database
   */
  private async updateJobStatus(jobId: string, status: QueuedJob['status'], errorMessage?: string) {
    await this.supabase
      .from('scraping_queue')
      .update({
        status,
        error_message: errorMessage || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', jobId)
  }

  /**
   * Start the queue processor
   */
  private startProcessing() {
    // Process queue every 30 seconds
    this.intervalId = setInterval(() => {
      this.processQueue()
    }, 30000)

    // Process immediately
    this.processQueue()
  }

  /**
   * Stop the queue processor
   */
  stopProcessing() {
    if (this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = null
    }
  }

  /**
   * Get queue statistics
   */
  async getQueueStats() {
    const { data, error } = await this.supabase
      .from('scraping_queue')
      .select('status')

    if (error) throw error

    const stats = data.reduce((acc, job) => {
      acc[job.status] = (acc[job.status] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    return {
      pending: stats.pending || 0,
      processing: stats.processing || 0,
      completed: stats.completed || 0,
      failed: stats.failed || 0,
      total: data.length
    }
  }

  /**
   * Clear completed and failed jobs older than specified days
   */
  async cleanupOldJobs(olderThanDays: number = 7) {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays)

    const { error } = await this.supabase
      .from('scraping_queue')
      .delete()
      .in('status', ['completed', 'failed'])
      .lt('updated_at', cutoffDate.toISOString())

    if (error) throw error

    console.log(`🧹 Cleaned up old scraping jobs older than ${olderThanDays} days`)
  }

  /**
   * Retry a failed job
   */
  async retryJob(jobId: string) {
    await this.supabase
      .from('scraping_queue')
      .update({
        status: 'pending',
        attempts: 0,
        next_retry_at: new Date().toISOString(),
        error_message: null,
        updated_at: new Date().toISOString()
      })
      .eq('id', jobId)

    console.log(`🔄 Manually retrying job ${jobId}`)
  }
}

// Export singleton instance
export const scrapingQueue = new ScrapingQueue()

// ============================================================================
// src/app/api/websites/route.ts - UPDATED VERSION
// ============================================================================



// ============================================================================
// src/app/api/scraping-queue/route.ts - NEW FILE
// ============================================================================



// ============================================================================
// SQL: Database table for the scraping queue
// ============================================================================

/*
-- Add this table to your Supabase database

CREATE TABLE IF NOT EXISTS scraping_queue (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  website_id UUID NOT NULL REFERENCES websites(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  attempts INTEGER NOT NULL DEFAULT 0,
  max_attempts INTEGER NOT NULL DEFAULT 3,
  error_message TEXT,
  next_retry_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_scraping_queue_status ON scraping_queue(status);
CREATE INDEX IF NOT EXISTS idx_scraping_queue_priority ON scraping_queue(priority);
CREATE INDEX IF NOT EXISTS idx_scraping_queue_next_retry ON scraping_queue(next_retry_at);
CREATE INDEX IF NOT EXISTS idx_scraping_queue_website_id ON scraping_queue(website_id);

-- Add RLS policies
ALTER TABLE scraping_queue ENABLE ROW LEVEL SECURITY;

-- Only allow users to see jobs for their own websites
CREATE POLICY "Users can view their own scraping jobs" ON scraping_queue
FOR SELECT USING (
  website_id IN (
    SELECT id FROM websites WHERE user_id = auth.uid()
  )
);

-- Only allow service role to insert/update/delete
CREATE POLICY "Service role can manage scraping jobs" ON scraping_queue
FOR ALL USING (auth.role() = 'service_role');
*/