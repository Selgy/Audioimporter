import { useEffect, useRef, useState, useCallback } from 'react';
import { Config, AudioBinding, ProfileConfig } from './types';
import path from 'path';
declare global {
    interface Window {
        __adobe_cep__: {
            evalScript: (script: string, callback: (result: any) => void) => void;
        };
    }
}

const Settings: React.FC = () => {

    const [config, setConfig] = useState<Config>({
        currentProfile: '',
        lastSelectedProfile: '',
        profiles: {}
    });
    const [debugLog, setDebugLog] = useState<string[]>([]);
    const [lastSelectedProfile, setLastSelectedProfile] = useState<string | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const messageQueue: string[] = useRef([]).current;
    const socketRef = useRef<WebSocket | null>(null);
    const configRef = useRef<Config>({
        currentProfile: '',
        lastSelectedProfile: '',
        profiles: {}
    });

useEffect(() => {
    console.log('useEffect hook is running');
    setTimeout(() => {
        startWebSocketConnection();
    }, 2000); // 2 second delay
    
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
                    if (data.startsWith('CONFIG:')) {
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
                    } else if (data.startsWith("LAST_SELECTED_PROFILE:")) {
                        const profile = data.replace("LAST_SELECTED_PROFILE:", "");
                        setLastSelectedProfile(profile);
                        appendToDebugLog(`Last selected profile set to: ${profile}`);
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
                setIsConnected(true);
                loadConfig();
                
                // Send any queued messages
                while (messageQueue.length > 0) {
                    const message = messageQueue.shift();
                    if (message && socketRef.current) {
                        socketRef.current.send(message);
                    }
                }
            };
    
            socketRef.current.onmessage = (event) => {
                const data = event.data;
                appendToDebugLog(`Received message: ${data}`);
                
                if (typeof data === 'string') {
                    if (data.startsWith('CONFIG:')) {
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
                    } else if (data.startsWith("LAST_SELECTED_PROFILE:")) {
                        const profile = data.replace("LAST_SELECTED_PROFILE:", "");
                        setLastSelectedProfile(profile);
                        appendToDebugLog(`Last selected profile set to: ${profile}`);
                    }
                }
            };
    
            socketRef.current.onerror = (error: Event) => {
                console.error('WebSocket error encountered:', error);
                appendToDebugLog(`WebSocket error: ${error instanceof ErrorEvent ? error.message : 'Unknown error'}`);
                setIsConnected(false);
            };
    
            socketRef.current.onclose = (event: CloseEvent) => {
                console.log(`WebSocket closed: ${event.reason}`);
                appendToDebugLog(`WebSocket closed: ${event.reason}`);
                setIsConnected(false);
                retryConnection();
            };
        } catch (error) {
            console.error("WebSocket connection failed:", error);
            appendToDebugLog("WebSocket connection failed: " + (error as Error).message);
            setIsConnected(false);
            retryConnection();
        }
    }, []);
    
    const retryConnection = useCallback(() => {
        console.log("Attempting to reconnect...");
        appendToDebugLog("Attempting to reconnect...");
        setTimeout(() => {
            startWebSocketConnection();
        }, 5000); // Retry after 5 seconds
    }, [startWebSocketConnection]);
    
    const sendMessage = useCallback((message: string) => {
        if (isConnected && socketRef.current) {
            socketRef.current.send(message);
            appendToDebugLog(`Sent message: ${message}`);
        } else {
            messageQueue.push(message);
            appendToDebugLog(`Message queued: ${message}`);
        }
    }, [isConnected]);
    
    const loadConfig = useCallback(() => {
        appendToDebugLog("loadConfig called");
        sendMessage('LOAD_CONFIG');
        sendMessage('GET_LAST_SELECTED_PROFILE');
    }, [sendMessage]);

    const appendToDebugLog = (message: string) => {
        console.log('Debug log:', message);
        setDebugLog(prevLog => [...prevLog, message]);
    };



    const reconnectWebSocket = () => {
        if (socketRef.current?.readyState === WebSocket.CLOSED) {
            appendToDebugLog("WebSocket disconnected. Attempting to reconnect...");
            startWebSocketConnection();
        }
    };

    const fetchLatestConfig = (): Promise<[Config, string | null]> => {
        return new Promise((resolve, reject) => {
            if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
                let configData: Config | null = null;
                let lastProfile: string | null = null;
    
                const messageHandler = (event: MessageEvent) => {
                    const data = event.data;
                    if (typeof data === 'string') {
                        if (data.startsWith("CONFIG:")) {
                            configData = JSON.parse(data.replace("CONFIG:", ""));
                            appendToDebugLog(`Received CONFIG: ${JSON.stringify(configData, null, 2)}`);
                        } else if (data.startsWith("LAST_SELECTED_PROFILE:")) {
                            lastProfile = data.replace("LAST_SELECTED_PROFILE:", "").trim();
                            appendToDebugLog(`Received LAST_SELECTED_PROFILE: ${lastProfile}`);
                        }
    
                        if (configData !== null && lastProfile !== null) {
                            socketRef.current?.removeEventListener('message', messageHandler);
                            configRef.current = configData;
                            setConfig(configData);
                            setLastSelectedProfile(lastProfile);
                            resolve([configData, lastProfile]);
                        }
                    }
                };
    
                socketRef.current.addEventListener('message', messageHandler);
                socketRef.current.send('LOAD_CONFIG');
                appendToDebugLog("Sent LOAD_CONFIG message");
                socketRef.current.send('GET_LAST_SELECTED_PROFILE');
                appendToDebugLog("Sent GET_LAST_SELECTED_PROFILE message");
    
                // Add a timeout to reject the promise if we don't receive both messages
                setTimeout(() => {
                    socketRef.current?.removeEventListener('message', messageHandler);
                    appendToDebugLog("Timeout while fetching config and profile");
                    appendToDebugLog(`Config received: ${configData !== null}`);
                    appendToDebugLog(`Last profile received: ${lastProfile !== null}`);
                    reject(new Error("Timeout while fetching config and profile"));
                }, 5000); // 5 second timeout
            } else {
                reject(new Error("WebSocket is not connected"));
            }
        });
    };

    const normalizeKeyCombination = (keyCombination: string): string => {
        const keyMap: { [key: string]: string } = {
            'lalt': 'alt',
            'ralt': 'alt',
            'lcontrol': 'ctrl',
            'rcontrol': 'ctrl',
            'controlleft': 'ctrl',
            'controlright': 'ctrl',
            'shiftleft': 'shift',
            'shiftright': 'shift',
            'metaleft': navigator.platform.toUpperCase().indexOf('MAC') >= 0 ? 'cmd' : 'win',
            'metaright': navigator.platform.toUpperCase().indexOf('MAC') >= 0 ? 'cmd' : 'win',
            'numpad1': '1',
            'numpad2': '2',
            'numpad3': '3',
            'numpad4': '4',
            'numpad5': '5',
            'numpad6': '6',
            'numpad7': '7',
            'numpad8': '8',
            'numpad9': '9',
            'numpad0': '0',
        };
    
        const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
        const priority = isMac 
            ? ['cmd', 'ctrl', 'alt', 'shift']
            : ['ctrl', 'alt', 'shift', 'win'];
    
        const mappedKeys = keyCombination.toLowerCase().split('+')
            .map(key => keyMap[key] || key)
            .filter((key, index, self) => self.indexOf(key) === index); // Remove duplicates
    
        const sortedKeys = mappedKeys.sort((a, b) => {
            const aIndex = priority.indexOf(a);
            const bIndex = priority.indexOf(b);
            if (aIndex === -1 && bIndex === -1) return a.localeCompare(b);
            if (aIndex === -1) return 1;
            if (bIndex === -1) return -1;
            return aIndex - bIndex;
        });
    
        // Capitalize the first letter of each key for display
        return sortedKeys.map(key => key.charAt(0).toUpperCase() + key.slice(1)).join('+');
    };

    const handleCombo = async (combo: string) => {
        appendToDebugLog(`Handling combo: ${combo}`);
        
        let latestConfig: Config;
        let profile: string | null;
    
        try {
            [latestConfig, profile] = await fetchLatestConfig();
            appendToDebugLog(`Fetched latest config: ${JSON.stringify(latestConfig, null, 2)}`);
            appendToDebugLog(`Current profile: ${profile}`);
        } catch (error) {
            appendToDebugLog(`Error fetching latest config: ${error}. Using current state.`);
            latestConfig = configRef.current;
            profile = lastSelectedProfile;
            appendToDebugLog(`Using config: ${JSON.stringify(latestConfig, null, 2)}`);
            appendToDebugLog(`Using profile: ${profile}`);
        }
    
        if (!profile) {
            appendToDebugLog(`No profile selected, skipping combo execution`);
            return;
        }
    
        if (!latestConfig.profiles || !latestConfig.profiles[profile]) {
            appendToDebugLog(`Selected profile ${profile} not found in config, skipping combo execution`);
            return;
        }
    
        const profileConfig = latestConfig.profiles[profile];
    
        if (Object.keys(profileConfig).length === 0) {
            appendToDebugLog(`Config for profile ${profile} is empty, no bindings to process`);
            return;
        }
    
        // Normalize the incoming combo
        const normalizedCombo = normalizeKeyCombination(combo);
        appendToDebugLog(`Normalized combo: ${normalizedCombo}`);
    
        // Normalize the config keys
        const normalizedConfig: ProfileConfig = Object.fromEntries(
            Object.entries(profileConfig).map(([key, value]) => [
                normalizeKeyCombination(key),
                value
            ])
        );
    
        appendToDebugLog(`Normalized config for profile ${profile}: ${JSON.stringify(normalizedConfig, null, 2)}`);
    
        if (normalizedConfig[normalizedCombo]) {
            const binding: AudioBinding = normalizedConfig[normalizedCombo];
            appendToDebugLog(`Found binding for combo: ${normalizedCombo}`);
    
            if (binding.path) {
                appendToDebugLog(`Executing script for path: ${binding.path}, track: ${binding.track}, volume: ${binding.volume}dB, and pitch: ${binding.pitch} semitones`);
                executePremiereProScript(
                    binding.path, 
                    parseInt(binding.track.replace('A', ''), 10), 
                    binding.volume,
                    binding.pitch || 0 // Provide a default value of 0 if pitch is undefined
                );
            } else {
                appendToDebugLog(`No path specified for combo: ${normalizedCombo}`);
            }
        } else {
            appendToDebugLog(`Combo ${normalizedCombo} not found in config for profile ${profile}. Skipping execution.`);
        }
    };


    const executePremiereProScript = (filePath: string, track: number, volume: number, pitch: number) => {
        appendToDebugLog(`Executing script with parameters: filePath=${filePath}, track=${track}, volume=${volume}, pitch=${pitch}`);
        
        const jsxRelativePath = './jsx/importAudio.jsx';
        const jsxFullPath = path.resolve(__dirname, jsxRelativePath);
    
        // Handle Windows-specific backslashes in paths
        const formattedJsxPath = process.platform === 'win32' 
            ? jsxFullPath.replace(/\\/g, '\\\\') 
            : jsxFullPath;
    
        const formattedFilePath = process.platform === 'win32' 
            ? filePath.replace(/\\/g, '\\\\') 
            : filePath;
    
        const script = `
            try {
                var jsxFile = new File("${formattedJsxPath}");
                if (jsxFile.exists) {
                    $.evalFile(jsxFile);
                    var result = importAudioToTrack("${formattedFilePath}", ${track}, ${volume}, ${pitch}, true);
                    result; // Return the result from the function
                } else {
                    throw new Error("JSX file not found at: " + jsxFile.fsName);
                }
            } catch(e) {
                // Return the error as a JSON string
                JSON.stringify({
                    success: false,
                    message: e.toString(),
                    debugLog: "Error occurred while executing JSX script."
                });
            }
        `;
    
        appendToDebugLog(`Evaluating script:\n${script}`);
    
        if (window.__adobe_cep__ && window.__adobe_cep__.evalScript) {
            window.__adobe_cep__.evalScript(script, (result: string) => {
                appendToDebugLog(`Script execution result: ${result}`);
                try {
                    const parsedResult = JSON.parse(result);
                    if (parsedResult.success) {
                        appendToDebugLog(`JSX script executed successfully: ${parsedResult.message}`);
                    } else {
                        appendToDebugLog(`Error in JSX script: ${parsedResult.message}`);
                    }
                    appendToDebugLog(`Debug Log:\n${parsedResult.debugLog}`);
                } catch (parseError) {
                    appendToDebugLog(`Failed to parse result from JSX script: ${parseError}`);
                    appendToDebugLog(`Raw result: ${result}`);
                }
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
