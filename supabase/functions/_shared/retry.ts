
// Retry mechanism for operations that might fail
export interface RetryOptions {
  maxRetries: number;
  initialDelay: number;
  maxDelay: number;
  exponentialBackoff: boolean;
  retryCondition?: (error: any) => boolean;
}

export const DEFAULT_RETRY_OPTIONS: RetryOptions = {
  maxRetries: 3,
  initialDelay: 1000,
  maxDelay: 10000,
  exponentialBackoff: true
};

export async function withRetry<T>(
  operation: () => Promise<T>,
  options: Partial<RetryOptions> = {}
): Promise<T> {
  const config = { ...DEFAULT_RETRY_OPTIONS, ...options };
  let lastError: any;
  
  for (let attempt = 0; attempt < config.maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      
      // Check if we should retry based on the error
      if (config.retryCondition && !config.retryCondition(error)) {
        throw error;
      }
      
      // Last attempt, don't delay, just throw
      if (attempt === config.maxRetries - 1) {
        throw error;
      }
      
      // Calculate delay for next retry
      let delay = config.initialDelay;
      if (config.exponentialBackoff) {
        delay = Math.min(delay * Math.pow(2, attempt), config.maxDelay);
      }
      
      // Add some jitter
      delay = delay + (Math.random() * delay * 0.1);
      
      console.log(`Retry attempt ${attempt + 1}/${config.maxRetries} after ${delay}ms`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  // This should never happen, but TypeScript needs it
  throw lastError;
}
