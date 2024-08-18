import { useEffect, useRef, useState, useCallback } from 'react';
import { Config, AudioBinding } from './types';

console.log('main.tsx is being executed');


declare global {
    interface Window {
        electron: {
            ipcRenderer: {
                send: (channel: string, data: any) => void;
                on: (channel: string, func: (...args: any[]) => void) => void;
                removeListener: (channel: string, func: (...args: any[]) => void) => void;
            };
        };
        __adobe_cep__: {
            evalScript: (script: string, callback?: (result: string) => void) => void;
        };
    }
}

const Settings: React.FC = () => {
    const socketRef = useRef<WebSocket | null>(null);
    const configRef = useRef<any>({});
    const [config, setConfig] = useState<Config>({});
    const [debugLog, setDebugLog] = useState<string[]>([]);
    const [isListeningForKey, setIsListeningForKey] = useState(false);
    const isListeningForKeyRef = useRef(isListeningForKey);
    const fileInputRef = useRef<HTMLInputElement>(null);

    
    useEffect(() => {
        console.log('useEffect hook is running');
        startWebSocketConnection();
        
        return () => {
            if (socketRef.current) {
                socketRef.current.close();
            }
        };
    }, []);


    useEffect(() => {
        if (socketRef.current) {
            socketRef.current.onmessage = (event) => {
                const data = event.data;
                appendToDebugLog(`Received message: ${data}`);
                
                if (typeof data === 'string') {
                    if (data.startsWith("CONFIG:")) {
                        const configData = JSON.parse(data.replace("CONFIG:", ""));
                        setConfig(configData);
                        appendToDebugLog('Config loaded successfully from server');
                    } else if (data.startsWith("COMBO:")) {
                        const combo = data.replace("COMBO:", "");
                        appendToDebugLog(`Combo received: ${combo}`);
                    }
                }
            };
        }
    }, [config]);
    
    const startWebSocketConnection = useCallback(() => {
        console.log("Attempting to establish WebSocket connection...");
        if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
            console.log("WebSocket is already connected");
            return;
        }
    
        try {
            socketRef.current = new WebSocket('ws://localhost:7878');
            console.log("WebSocket connection object created");
    
            socketRef.current.onopen = () => {
                console.log("WebSocket connected to Rust server");
                appendToDebugLog("Connected to Rust server");
                loadConfig(); // Load config after connection is established
            };
    
            socketRef.current.onmessage = (event) => {
                const data = event.data;
                console.log(`WebSocket received message: ${data}`);
                appendToDebugLog(`Received message: ${data}`);
            };
    
            socketRef.current.onerror = (error: Event) => {
                console.error('WebSocket error encountered:', error);
                appendToDebugLog(`WebSocket error: ${error instanceof ErrorEvent ? error.message : 'Unknown error'}`);
            };
    
            socketRef.current.onclose = (event: CloseEvent) => {
                console.log(`WebSocket closed: ${event.reason}`);
                appendToDebugLog(`WebSocket closed: ${event.reason}`);
                setTimeout(startWebSocketConnection, 5000); // Retry connection
            };
        } catch (error) {
            console.error("WebSocket connection failed:", error);
            appendToDebugLog("WebSocket connection failed: " + (error as Error).message);
        }
    }, []);
    
    
    const appendToDebugLog = (message: string) => {
        console.log('Debug log:', message);
        setDebugLog(prevLog => [...prevLog, message]);
    };

    const loadConfig = () => {
        try {
            socketRef.current?.send('LOAD_CONFIG');
        } catch (error: unknown) {
            console.error('Error loading config:', error);
            sendLogToPanel(`Error loading config: ${error}`);
        }
    };




    const sendLogToPanel = (message: string) => {
        if (window.electron && window.electron.ipcRenderer) {
            window.electron.ipcRenderer.send('background-log', message);
        }
    };

    return null;
};

export default Settings;
