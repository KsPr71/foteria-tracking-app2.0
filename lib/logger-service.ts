import * as FileSystem from 'expo-file-system';

const LOG_FILE_URI = (FileSystem.documentDirectory || FileSystem.cacheDirectory) + 'debug_logs.txt';
const MAX_LOG_SIZE = 1024 * 1024; // 1MB

export class LoggerService {
    private static instance: LoggerService;

    private constructor() { }

    static getInstance(): LoggerService {
        if (!LoggerService.instance) {
            LoggerService.instance = new LoggerService();
        }
        return LoggerService.instance;
    }

    /**
     * Appends a log message to the file with a timestamp.
     */
    async log(message: string, data?: any): Promise<void> {
        try {
            const timestamp = new Date().toISOString();
            let logEntry = `[${timestamp}] ${message}`;

            if (data) {
                try {
                    const dataStr = typeof data === 'object' ? JSON.stringify(data) : String(data);
                    logEntry += ` - ${dataStr}`;
                } catch (e) {
                    logEntry += ` - [Data serialization error]`;
                }
            }

            logEntry += '\n';

            // Check file existence and size
            const fileInfo = await FileSystem.getInfoAsync(LOG_FILE_URI);

            if (fileInfo.exists) {
                // If file is too big, trim it (keep last 50%)
                if (fileInfo.size > MAX_LOG_SIZE) {
                    const content = await FileSystem.readAsStringAsync(LOG_FILE_URI);
                    const lines = content.split('\n');
                    const halfLines = lines.slice(Math.floor(lines.length / 2));
                    await FileSystem.writeAsStringAsync(LOG_FILE_URI, halfLines.join('\n') + logEntry);
                    return;
                }

                // Append to existing file
                // Note: Expo FileSystem doesn't have a direct "append" for text files in all versions,
                // but read+write is safe enough for low volume logs. 
                // For better performance we could use appendAsStringAsync if available in this SDK version.
                // Checking documentation: appendAsStringAsync is available.
                await FileSystem.writeAsStringAsync(LOG_FILE_URI, logEntry, { encoding: FileSystem.EncodingType.UTF8, append: true });
            } else {
                // Create new file
                await FileSystem.writeAsStringAsync(LOG_FILE_URI, logEntry);
            }

            // Also log to console for development
            console.log(logEntry.trim());

        } catch (error) {
            console.error("Failed to write log:", error);
        }
    }

    /**
     * Reads the entire log file.
     */
    async getLogs(): Promise<string> {
        try {
            const fileInfo = await FileSystem.getInfoAsync(LOG_FILE_URI);
            if (!fileInfo.exists) {
                return "No logs found.";
            }
            return await FileSystem.readAsStringAsync(LOG_FILE_URI);
        } catch (error) {
            console.error("Failed to read logs:", error);
            return `Error reading logs: ${error}`;
        }
    }

    /**
     * Clears the log file.
     */
    async clearLogs(): Promise<void> {
        try {
            await FileSystem.deleteAsync(LOG_FILE_URI, { idempotent: true });
        } catch (error) {
            console.error("Failed to clear logs:", error);
        }
    }
}
