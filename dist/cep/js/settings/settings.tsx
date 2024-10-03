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
    const socketRef = useRef<WebSocket | null>(null);
    const configRef = useRef<Config>({
        currentProfile: '',
        lastSelectedProfile: '',
        profiles: {}
    });
    const [config, setConfig] = useState<Config>({
        currentProfile: '',
        lastSelectedProfile: '',
        profiles: {}
    });
    const [debugLog, setDebugLog] = useState<string[]>([]);
    const [lastSelectedProfile, setLastSelectedProfile] = useState<string | null>(null);
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
                loadConfig();
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
        appendToDebugLog("loadConfig called");
        try {
            socketRef.current?.send('LOAD_CONFIG');
            appendToDebugLog("Sent LOAD_CONFIG message");
            socketRef.current?.send('GET_LAST_SELECTED_PROFILE');
            appendToDebugLog("Sent GET_LAST_SELECTED_PROFILE message");
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

    // Add the normalizeKeyCombination function
    const normalizeKeyCombination = (keyCombination: string): string => {
        const keyMap: { [key: string]: string } = {
            'LAlt': 'Alt',
            'RAlt': 'Alt',
            'LControl': 'Ctrl',
            'RControl': 'Ctrl',
            'ControlLeft': 'Ctrl',
            'ControlRight': 'Ctrl',
            'Numpad1': '1',
            'Numpad2': '2',
            'Numpad3': '3',
            'Numpad4': '4',
            'Numpad5': '5',
            'Numpad6': '6',
            'Numpad7': '7',
            'Numpad8': '8',
            'Numpad9': '9',
            'Numpad0': '0',
            // Add more key mappings as needed
        };

        const priority = ['ctrl', 'shift', 'alt'];

        const mappedKeys = keyCombination
            .split('+')
            .map((key) => keyMap[key] || key)
            .map((key) => key.toLowerCase());

        const sortedKeys = mappedKeys.sort((a, b) => {
            const aIndex = priority.indexOf(a);
            const bIndex = priority.indexOf(b);

            if (aIndex === -1 && bIndex === -1) return a.localeCompare(b);
            if (aIndex === -1) return 1;
            if (bIndex === -1) return -1;
            return aIndex - bIndex;
        });

        return sortedKeys.join('+');
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
