import { useEffect, useRef, useState, useCallback } from 'react';
import { Config, AudioBinding } from './types';


declare global {
    interface Window {
        __adobe_cep__: {
            evalScript: (script: string, callback: (result: any) => void) => void;
        };
    }
}

const Settings: React.FC = () => {
    const socketRef = useRef<WebSocket | null>(null);
    const configRef = useRef<Config>({});
    const [config, setConfig] = useState<Config>({});
    const [debugLog, setDebugLog] = useState<string[]>([]);
    

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
                        configRef.current = configData;
                        appendToDebugLog('Config loaded successfully from server');
                        appendToDebugLog(`Updated config: ${JSON.stringify(configData, null, 2)}`);
                    } else if (data.startsWith("COMBO:")) {
                        const combo = data.replace("COMBO:", "");
                        appendToDebugLog(`Combo received: ${combo}`);
                        handleCombo(combo).catch(error => {
                            appendToDebugLog(`Error in handleCombo: ${error}`);
                        });
                    }
                }
            };
        }
    }, []);

    useEffect(() => {
        const intervalId = setInterval(reconnectWebSocket, 5000);
        return () => clearInterval(intervalId);
    }, []);

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
                loadConfig();
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
                setTimeout(startWebSocketConnection, 5000);
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


    const reconnectWebSocket = () => {
        if (socketRef.current?.readyState === WebSocket.CLOSED) {
            appendToDebugLog("WebSocket disconnected. Attempting to reconnect...");
            startWebSocketConnection();
        }
    };


    const fetchLatestConfig = (): Promise<Config> => {
        return new Promise((resolve, reject) => {
            if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
                const messageHandler = (event: MessageEvent) => {
                    const data = event.data;
                    if (typeof data === 'string' && data.startsWith("CONFIG:")) {
                        const configData = JSON.parse(data.replace("CONFIG:", ""));
                        socketRef.current?.removeEventListener('message', messageHandler);
                        configRef.current = configData; // Update the configRef
                        setConfig(configData); // Update the state
                        resolve(configData);
                    }
                };
                socketRef.current.addEventListener('message', messageHandler);
                socketRef.current.send('LOAD_CONFIG');
            } else {
                reject(new Error("WebSocket is not connected"));
            }
        });
    };

    const handleCombo = async (combo: string) => {
        appendToDebugLog(`Handling combo: ${combo}`);
        
        try {
            // Fetch the latest config from the server
            const latestConfig = await fetchLatestConfig();
            appendToDebugLog(`Fetched latest config: ${JSON.stringify(latestConfig, null, 2)}`);
            
            if (Object.keys(latestConfig).length === 0) {
                appendToDebugLog(`Config is empty, no bindings to process`);
                return;
            }
    
            const normalizedCombo = combo.split('+').map(key => key.toLowerCase()).sort().join('+');
            appendToDebugLog(`Normalized combo: ${normalizedCombo}`);
        
            const normalizedConfig: Config = Object.fromEntries(
                Object.entries(latestConfig).map(([key, value]) => [
                    key.split('+').map(k => k.toLowerCase()).sort().join('+'),
                    value
                ])
            );
        
            appendToDebugLog(`Normalized config: ${JSON.stringify(normalizedConfig, null, 2)}`);
        
            if (normalizedConfig[normalizedCombo]) {
                const binding: AudioBinding = normalizedConfig[normalizedCombo];
                appendToDebugLog(`Found binding for combo: ${normalizedCombo}`);
        
                if (binding.path) {
                    appendToDebugLog(`Executing script for path: ${binding.path} and track: ${binding.track}`);
                    executePremiereProScript(binding.path, parseInt(binding.track.replace('A', ''), 10));
                } else {
                    appendToDebugLog(`No path specified for combo: ${normalizedCombo}`);
                }
            } else {
                appendToDebugLog(`Combo ${normalizedCombo} not found in config. Skipping execution.`);
            }
        } catch (error) {
            appendToDebugLog(`Error handling combo: ${error}`);
        }
    };


    const executePremiereProScript = (filePath: string, track: number): void => {
        appendToDebugLog(`Executing Premiere Pro script with file: ${filePath} and track: ${track}`);
        if (!filePath || isNaN(track)) {
            appendToDebugLog("Invalid file path or track number.");
            return;
        }
    
        // Use the correct absolute path to your JSX file
        const jsxFilePath = 'E:/DEV/AudioImporter/src/jsx/importAudio.jsx';  // Using forward slashes
    
        const script = `
            try {
                $.writeln("Attempting to load file from: " + "${jsxFilePath}");
                $.evalFile("${jsxFilePath}");
                var result = importAudioToTrack("${filePath.replace(/\\/g, '\\\\')}", ${track});
                $.writeln('Success: ' + result);
                result; // Ensure result is returned
            } catch(e) {
                $.writeln('Error: ' + e.toString() + ' | Full path attempted: ' + "${jsxFilePath}");
                e.toString(); // Return error message
            }
        `;
    
        appendToDebugLog(`Evaluating script: ${script}`);
        if (window.__adobe_cep__ && window.__adobe_cep__.evalScript) {
            window.__adobe_cep__.evalScript(script, (result: string) => {
                appendToDebugLog(`Script execution result: ${result}`);
            });
        } else {
            appendToDebugLog("window.__adobe_cep__.evalScript is not available");
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
