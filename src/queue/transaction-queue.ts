import { EventEmitter } from "events";
import { TransactionService } from "../services/transaction.js"
import { idGenerator } from "../utils/utils.js";
import { logger } from '../utils/loggers.js'

interface TransactionJob {
  id: string;
  source: string;
  dest: string;
  amount: number;
  timestamp: number;
  requestId?: string;
  resolve: (value:any) => void;
  reject: (error:any) => void;
}

interface TransactionResult {
  jobId: string;
  requestId?: string;
  status: 'PROCESSING' | 'SUCCESS' | 'FAILED';
  data?: any;
  error?: string;
  timestamp?: number;
}

export class TransactionQueue extends EventEmitter {
  private queue: TransactionJob[] = [];
  private result = new Map<string, TransactionResult>();
  private processing = false;
  private concurrency: number;
  private activeWorker = 0;

  constructor(concurrency: number = 25){
    super();
    this.concurrency = concurrency;
  }

  addInQueue(job: Omit<TransactionJob, 'id' | 'timestamp' | 'resolve' | 'reject'>):string {
    const jobId = idGenerator('TXN');

    logger.info('Adding transaction in queue',{...job, jobId, queueSize: this.queue.length, activeWorker: this.activeWorker})

    this.queue.push({
      id: jobId,
      ...job,
      timestamp: Date.now(),
      resolve: (result) => {
        this.result.set(jobId,{
          jobId,
          requestId: job.requestId,
          status: 'SUCCESS',
          data: result,
          timestamp: Date.now()
        })
      },
      reject: (error) => {
        this.result.set(jobId,{
          jobId,
          requestId: job.requestId,
          status: 'FAILED',
          error: error.message,
          timestamp: Date.now()
        })
      },
    })
    
    logger.info('update transaction in queue to processing',{...job, jobId, queueSize: this.queue.length, activeWorker: this.activeWorker})
    
    this.result.set(jobId, {
      jobId,
      requestId: job.requestId,
      status: 'PROCESSING',
      timestamp: Date.now()
    });

    if(!this.processing){
      logger.debug('initiate queue transaction processing', {jobId})
      this.startProcessing();
    }

    return jobId;
  }

  private async startProcessing(){
    if(this.processing) return;

    this.processing = true;
    logger.info('queue processing started', {queueSize: this.queue.length, concurrency: this.concurrency })

    const worker: Promise<void>[] = []; // to track active worker promise
    while (this.queue.length > 0 || worker.length > 0) {
      while (this.queue.length>0 && worker.length <this.concurrency) { // spin up new job till available limit for concurrency
        const job = this.queue.shift()!;
        logger.debug('starting new worker for job',{
          jobId: job.id,
          activeWorker: worker.length +1,
          queueRemaining: this.queue.length
        })
        
        const workerPromise = this.processJob(job).finally(()=>{
          const index = worker.indexOf(workerPromise); // free up worker once transaction processed
          if (index > -1) {
            worker.splice(index,1);
          }
        });
        worker.push(workerPromise);
      }

      if(worker.length > 0){
        await Promise.race(worker);
      }
    }

    this.processing = false;
    logger.info('queue processing stopped',{ queueSize: this.queue.length});
  }

  private async processJob(job: TransactionJob) {
    this.activeWorker++;

    logger.debug('processing job from queue',{
      ...job, activeWorker: this.activeWorker, queueSize: this.queue.length
    })

    try {
      const result = await TransactionService.processTransaction(job.requestId || job.id ,job.source,job.dest,job.amount);

      logger.debug('Job Completed successfully', {
        ...job
      })

      job.resolve(result);
      this.emit('completed', job.id, result);
    } catch (error) {
      logger.error('Job Failed', {
        ...job, error
      })
      job.reject(error);
      this.emit('failed', job.id, error);  
    } finally {
      this.activeWorker--;
      logger.debug('worker released', {
        ...job, activeWorker: this.activeWorker, queueSize: this.queue.length
      })
    }
  }

  getTransactionStatus(jobId:string): TransactionResult | undefined {
    return this.result.get(jobId);
  }

  getQueueSize(): number{
    return this.queue.length;
  }
}

const maxConnections = Number(process.env.DB_MAX_CONNECTIONS) || 25;
export const transactionQueue = new TransactionQueue(maxConnections);