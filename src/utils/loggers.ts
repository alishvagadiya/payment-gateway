import * as fs from 'fs';
import * as path from 'path';

export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  Error = 'ERROR'
}

interface LogContext {
  [key: string]: any;
}

export enum LogFileTimeInterval{
  M1 = 60 * 1000, // 1min
  M10 = 10 * 60 * 1000, // 10min
  H1 = 60 * 60 * 1000, // 1hour
  H6 = 6 * 60 * 60 * 1000, // 6hour
  H12 = 12 * 60 * 60 * 1000, // 12hour
  D1 = 24 * 60 * 60 * 1000, // 1Day
}

interface LoggerConfig{
  logToFile?: boolean;
  logDir?: string;
  logFileTimeInterval?: LogFileTimeInterval;
  serverEnv?: string;
}

class Logger{
  private logLevel: LogLevel;
  private config: LoggerConfig;
  private currentLogFile: string | null = null;

  constructor(config?: LoggerConfig){
    const envLevel = process.env.LOG_LEVEL?.toUpperCase() || 'INFO';
    this.logLevel = LogLevel[envLevel as keyof typeof LogLevel];

    this.config = {
      logToFile: config?.logToFile ?? (process.env.LOG_TO_FILE === 'true'),
      logDir: config?.logDir ?? process.env.LOG_DIR ?? './log',
      logFileTimeInterval: config?.logFileTimeInterval ??
        (process.env.LOG_FILE_TIME_INTERVAL
          ? LogFileTimeInterval[process.env.LOG_FILE_TIME_INTERVAL as keyof typeof LogFileTimeInterval] ?? LogFileTimeInterval.D1
          : LogFileTimeInterval.D1),
      serverEnv: process.env.ENV ?? 'dev'
    }

    if(this.config.logToFile && this.config.logDir){
      if(!fs.existsSync(this.config.logDir)){
        fs.mkdirSync(this.config.logDir,{ recursive: true});
      }
      this.currentLogFile = this.latestLogFile();
    }
  }

  private latestLogFile(): string | null {
    const logDir = this.config.logDir!;
    const interval = this.config.logFileTimeInterval ?? LogFileTimeInterval.D1;
    try {
      const files = fs.readdirSync(logDir)
        .filter(f => f.startsWith('app_') && f.endsWith('.log'))
        .sort()
        .reverse(); // most recent first

      for (const file of files) {
        const fullPath = path.join(logDir, file);
        const createdAt = this.extractTimeFromLogFile(fullPath);
        if (createdAt && (Date.now() - createdAt.getTime()) < interval) {
          return fullPath; // resume existing file
        }
      }
    } catch {
      // ignore, will create new file on first write
    }
    return null;
  }

  private extractTimeFromLogFile(filename: string): Date | null {
    try {
      const base = path.basename(filename, '.log').split('_')[1] || '';
      const isoLike = base.replace(/T(\d{2})-(\d{2})-(\d{2})/, 'T$1:$2:$3') + 'Z';
      const date = new Date(isoLike);
      return isNaN(date.getTime()) ? null : date;
    } catch {
      return null;
    }
  }

  private getLogFilePath(): string | null{
    if (!this.config.logToFile || !this.config.logDir) return null;

    const interval = this.config.logFileTimeInterval ?? LogFileTimeInterval.D1;

    if (this.currentLogFile) {
      const fileCreatedAt = this.extractTimeFromLogFile(this.currentLogFile);
      if (fileCreatedAt && (Date.now() - fileCreatedAt.getTime()) < interval) {
        return this.currentLogFile;  // still within interval, reuse
      }
    }

    const ts = new Date().toISOString().replace(/:/g, '-').replace(/\..+/, '');
    this.currentLogFile = path.join(this.config.logDir, `app_${ts}.log`);
    return this.currentLogFile;
  }

  private formateLogAndWrite(level: LogLevel, message: string, context?:LogContext):void {
    const logEntry = {
      timeStamp : new Date().toString(),
      level,
      message,
      ...context,
    }

    const logString = JSON.stringify(logEntry);
    try {
      const filePath = this.getLogFilePath();
      if(filePath){
        fs.appendFileSync(filePath, logString+'\n', 'utf8');
      } else {
        switch (level) {
          case LogLevel.Error:
            console.error(logString)
            break;
          case LogLevel.WARN:
            console.warn(logString)
            break;
          default:
            console.log(logString)
            break;
        }
      }
    } catch (error) {
      console.error('Failed to write to log file:', error)
    }
  }

  private shouldLog(level:LogLevel) {
    const levels = [LogLevel.DEBUG, LogLevel.INFO, LogLevel.WARN, LogLevel.Error];
    return levels.indexOf(level) >= levels.indexOf(this.logLevel);
  }

  debug(message:string, context?: LogContext):void{
    if(this.shouldLog(LogLevel.DEBUG)){
      this.formateLogAndWrite(LogLevel.DEBUG,message,context);
    }
  }
  info(message:string, context?: LogContext):void{
    if(this.shouldLog(LogLevel.INFO)){
      this.formateLogAndWrite(LogLevel.INFO,message,context);
    }
  }
  warn(message:string, context?: LogContext):void{
    if(this.shouldLog(LogLevel.WARN)){
      this.formateLogAndWrite(LogLevel.WARN,message,context);
    }
  }
  error(message:string, context?: LogContext):void{
    if(this.shouldLog(LogLevel.Error)){
      this.formateLogAndWrite(LogLevel.Error,message,context);
    }
  }
}

export const logger = new Logger();
