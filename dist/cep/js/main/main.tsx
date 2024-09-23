import React, { useState, useEffect, useRef, useCallback } from 'react';
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
    }
}


const Main: React.FC = () => {
    console.log('Main component is rendering');

    const [config, setConfig] = useState<Config>({});
    const [debugLog, setDebugLog] = useState<string[]>([]);
    const [isAddingBinding, setIsAddingBinding] = useState(false);
    const [isListeningForKey, setIsListeningForKey] = useState(false);
    const isListeningForKeyRef = useRef(isListeningForKey);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const socketRef = useRef<WebSocket | null>(null);

    useEffect(() => {
        console.log('useEffect hook is running');
        startWebSocketConnection();
        if (socketRef.current) {
            console.log(`WebSocket ready state: ${socketRef.current.readyState}`);
        }
        return () => {
            if (socketRef.current) {
                socketRef.current.close();
            }
        };
    }, []);
    

    useEffect(() => {
        if (socketRef.current) {
            socketRef.current.onmessage = (event) => {
                console.log('Received message from server:', event.data);
                const data = event.data;
                appendToDebugLog(`Received message: ${data}`);
                
                if (typeof data === 'string') {
                    if (data.startsWith("CONFIG:")) {
                        const configData = JSON.parse(data.replace("CONFIG:", ""));
                        setConfig(configData);
                        appendToDebugLog('Config loaded successfully from server');
                    } else if (data.startsWith("COMBO:")) {
                        const combo = data.replace("COMBO:", "");
                        appendToDebugLog(`Processed combo: ${combo}`);
                        handleCombo(combo);
                    }
                }
            };
        }
    }, []);

    
    
    const startWebSocketConnection = useCallback(() => {
        if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
            appendToDebugLog("WebSocket already connected");
            return;
        }
    
        appendToDebugLog("Establishing WebSocket connection...");
        socketRef.current = new WebSocket('ws://localhost:7878');
    
        socketRef.current.onopen = () => {
            appendToDebugLog("Connected to Rust server");
            loadConfig(); // Load config after connection is established
        };
    
        socketRef.current.onmessage = (event) => {
            const data = event.data;
            appendToDebugLog(`Received message: ${data}`);
        };
    
        socketRef.current.onerror = (error: Event) => {
            appendToDebugLog(`WebSocket Error: ${error instanceof ErrorEvent ? error.message : 'Unknown error'}`);
        };
    
        socketRef.current.onclose = (event: CloseEvent) => {
            appendToDebugLog(`Disconnected from Rust server: ${event.reason}`);
            setTimeout(() => {
                appendToDebugLog('Attempting to reconnect...');
                startWebSocketConnection();
            }, 5000);
        };
    }, []);
    

    const appendToDebugLog = (message: string) => {
        console.log('Debug log:', message);
        setDebugLog(prevLog => [...prevLog, message]);
    };

    const loadConfig = () => {
        console.log('Loading config');
        try {
            socketRef.current?.send('LOAD_CONFIG');
        } catch (error: unknown) {
            if (error instanceof Error) {
                appendToDebugLog(`Error loading config: ${error.message}`);
            } else {
                appendToDebugLog(`Unexpected error loading config.`);
            }
            console.error('Error loading config:', error);
        }
    };

    const saveConfig = (newConfig: Config) => {
        try {
            appendToDebugLog(`Sending config to server: ${JSON.stringify(newConfig)}`);
            socketRef.current?.send(`SAVE_CONFIG:${JSON.stringify(newConfig)}`);
            appendToDebugLog('Config sent successfully');
            setConfig(newConfig); // Update the local state
        } catch (error: unknown) {
            if (error instanceof Error) {
                appendToDebugLog(`Error saving config: ${error.message}`);
            } else {
                appendToDebugLog(`Unexpected error saving config.`);
            }
        }
    };
    

    const handleCombo = (combo: string) => {
        const sortedCombo = combo.split('+').sort().join('+');
        if (config[sortedCombo]) {
            // Process the combo (e.g., play audio, trigger action)
            appendToDebugLog(`Processing combo: ${sortedCombo}`);
            // Add your logic here to handle the combo
        } else {
            appendToDebugLog(`Combo ${sortedCombo} not found in config`);
        }
    };
    
    
    const stopListening = () => {
        appendToDebugLog("Stopping key listener...");
        setIsListeningForKey(false);
        isListeningForKeyRef.current = false;
        appendToDebugLog("isListeningForKey set to false");
        setIsAddingBinding(false);
        appendToDebugLog("isAddingBinding set to false");
    };
    
    const addNewKeyBind = useCallback((keyCombination: string) => {
        appendToDebugLog(`Detected key combination: ${keyCombination}`);
        const sortedCombination = keyCombination.split('+').sort().join('+');
        appendToDebugLog(`Sorted key combination: ${sortedCombination}`);
    
        setConfig((prevConfig) => {
            appendToDebugLog(`Current config: ${JSON.stringify(prevConfig)}`);
            if (!prevConfig[sortedCombination]) {
                const newConfig = {
                    ...prevConfig,
                    [sortedCombination]: { volume: 0, pitch: 0, track: 'A1', path: '' }
                };
                appendToDebugLog(`New config before saving: ${JSON.stringify(newConfig)}`);
                saveConfig(newConfig);
                reloadConfig(); // Reload the config after saving
                appendToDebugLog(`Key binding ${sortedCombination} added to config.`);
                stopListening(); // Stop listening after a keybind is successfully added
                // Clear the WebSocket message handler for combo
                if (socketRef.current) {
                    socketRef.current.onmessage = (event) => {
                        const data = event.data;
                        appendToDebugLog(`Received message: ${data}`);
                        
                        if (typeof data === 'string' && data.startsWith("CONFIG:")) {
                            const configData = JSON.parse(data.replace("CONFIG:", ""));
                            setConfig(configData);
                            appendToDebugLog('Config loaded successfully from server');
                        }
                    };
                }
                return newConfig;
            } else {
                appendToDebugLog(`Key combination ${sortedCombination} already exists in config.`);
                stopListening(); // Stop listening if the keybind already exists
                return prevConfig;
            }
        });
    }, [stopListening]);
    

    const startKeyListener = useCallback(() => {
        if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
            appendToDebugLog("WebSocket connection is open. Starting key listener...");
            setIsListeningForKey(true);
            isListeningForKeyRef.current = true;
            appendToDebugLog("isListeningForKey set to true");
    
            // Add the WebSocket onmessage handler for COMBO here
            socketRef.current.onmessage = (event) => {
                const data = event.data;
                appendToDebugLog(`Received message: ${data}`);
                
                if (typeof data === 'string' && data.startsWith("COMBO:")) {
                    const combo = data.replace("COMBO:", "");
                    appendToDebugLog(`Processed combo: ${combo}`);
                    addNewKeyBind(combo); // Process the received combo
                }
            };
        } else {
            appendToDebugLog("WebSocket connection is not open. Cannot start key listener.");
        }
    }, [addNewKeyBind]);

    

    
    
    
    const addBinding = () => {
        if (!isListeningForKey) {
            setIsAddingBinding(true);
            appendToDebugLog(`Add binding clicked. isListeningForKey set to true`);
            startKeyListener();
        }
    };

    const selectAudioFile = (key: string) => {
        appendToDebugLog(`Attempting to select audio file for key: ${key}`);
        if (fileInputRef.current) {
            appendToDebugLog(`File input reference is available.`);
            fileInputRef.current.click();
            fileInputRef.current.onchange = (event) => {
                appendToDebugLog(`File input change event triggered.`);
                const file = (event.target as HTMLInputElement).files?.[0];
                if (file) {
                    appendToDebugLog(`File selected: ${file.name}`);
                    const filePath = (file as any).path || file.name;
                    appendToDebugLog(`File path resolved to: ${filePath}`);
                    // Update the config with the selected file path
                    updateBinding(key, { ...config[key], path: filePath });
                    appendToDebugLog(`Selected audio file for ${key}: ${filePath}`);
                } else {
                    appendToDebugLog(`No file selected.`);
                }
            };
        } else {
            appendToDebugLog(`File input reference is not available.`);
        }
    };
    

    
    const updateBinding = (key: string, value: AudioBinding) => {
        console.log('Updating binding with value:', value); // Add this log to check the value
        setConfig((prevConfig: Config) => {
            const newConfig = { ...prevConfig, [key]: value };
            appendToDebugLog(`Updating config for key: ${key} with value: ${JSON.stringify(value)}`);
            
            saveConfig(newConfig); // Save the updated configuration to the server
            reloadConfig(); // Reload the config after saving
            return newConfig;
        });
    };
    
    
    const reloadConfig = () => {
        appendToDebugLog("Requesting latest config from server...");
        socketRef.current?.send('LOAD_CONFIG');
    };

    
    const deleteBinding = (key: string) => {
        setConfig((prevConfig: Config) => {
            const { [key]: _, ...newConfig } = prevConfig;
            appendToDebugLog(`Deleting binding for key: ${key}`);
            saveConfig(newConfig);
            reloadConfig(); // Reload the config after saving
            appendToDebugLog(`Binding deleted for ${key}`);
            return newConfig;
        });
    };

    const handleNumberInput = useCallback((key: string, field: 'volume' | 'pitch', value: string) => {
        const numValue = parseFloat(value);
        if (!isNaN(numValue)) {
            if (field === 'pitch' && (numValue < -12 || numValue > 12)) {
                return; // Pitch should be between -12 and 12
            }
            updateBinding(key, { ...config[key], [field]: numValue }); // Make sure pitch is updated here
        }
    }, [config, updateBinding]);
    
    


    const formatKeyCombination = (keyCombination: string): string => {
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
    
        const priority = ['Ctrl', 'Shift', 'Alt'];

        const sortedKeys = keyCombination
            .split('+')
            .map(key => keyMap[key] || key)
            .sort((a, b) => {
                const aIndex = priority.indexOf(a);
                const bIndex = priority.indexOf(b);
    
                if (aIndex === -1 && bIndex === -1) return a.localeCompare(b);
                if (aIndex === -1) return 1;
                if (bIndex === -1) return -1;
                return aIndex - bIndex;
            });
    
        return sortedKeys.join('+');
    };
    
    const extractFileName = (filePath: string): string => {
        return filePath.split('\\').pop()?.split('/').pop() || ''; // Handles both Windows and Unix-style paths
    };
    

    return (
        <div style={{ fontFamily: 'Roboto, sans-serif', backgroundColor: '#1e2057', color: '#ffffff', padding: '10px' }}>
            <div style={{ marginBottom: '15px', padding: '10px', backgroundColor: '#2e2f77', borderRadius: '5px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <input
                        type="text"
                        readOnly
                        value={isListeningForKey ? 'Press a key combination...' : 'Click Add Binding to start'}
                        style={{ width: '250px', padding: '6px', backgroundColor: '#3e41a8', color: '#ffffff', border: 'none', borderRadius: '2px' }}
                    />
                    <button 
                        onClick={addBinding}
                        disabled={isListeningForKey}
                        style={{ 
                            width: '150px', 
                            padding: '6px', 
                            backgroundColor: isListeningForKey ? '#2e3177' : '#4e52ff', 
                            color: '#ffffff', 
                            borderRadius: '2px', 
                            border: 'none',
                            cursor: isListeningForKey ? 'not-allowed' : 'pointer'
                        }}
                    >
                        {isListeningForKey ? 'Listening...' : 'Add Binding'}
                    </button>
                </div>
            </div>
    
            {/* Hidden file input for audio selection */}
            <input
                type="file"
                ref={fileInputRef}
                style={{ display: 'none' }}
                accept="audio/*"
            />
    
            {/* Keybind Rows */}
            <div>
                {Object.keys(config).map((key) => (
                    <div key={key} style={{ display: 'flex', alignItems: 'center', marginBottom: '10px', backgroundColor: '#2e2f77', padding: '10px', borderRadius: '5px' }}>
                        <button 
                            onClick={() => deleteBinding(key)} 
                            style={{ 
                                width: '30px', 
                                height: '30px', 
                                padding: '6px', 
                                backgroundColor: 'transparent', 
                                color: '#ff5b3b', 
                                borderRadius: '50%', 
                                border: 'none', 
                                cursor: 'pointer', 
                                fontSize: '16px', 
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'center', 
                                marginRight: '10px'
                            }}>
                            ✖
                        </button>
                        <input type="text" readOnly value={formatKeyCombination(key)} style={{ width: '70px', padding: '6px', backgroundColor: '#3e41a8', color: '#ffffff', border: 'none', borderRadius: '2px', marginRight: '10px', textAlign: 'center' }} />
                        <button onClick={() => console.log(`Edit binding for ${key}`)} style={{ width: '50px', padding: '6px', backgroundColor: '#4e52ff', color: '#ffffff', borderRadius: '2px', border: 'none', marginRight: '10px' }}>Edit</button>
                        <select 
                            value={config[key].track} 
                            onChange={(e) => updateBinding(key, { ...config[key], track: e.target.value })} 
                            style={{ width: '70px', padding: '6px', backgroundColor: '#3e41a8', color: '#ffffff', border: 'none', borderRadius: '2px', marginRight: '10px' }}
                        >
                            {Array.from({ length: 15 }, (_, i) => (
                                <option key={i} value={`A${i + 1}`}>A{i + 1}</option>
                            ))}
                        </select>
                        <input 
                            type="text" 
                            readOnly 
                            value={extractFileName(config[key].path)} 
                            style={{ width: '120px', padding: '7px', backgroundColor: '#3e41a8', color: '#ffffff', border: 'none', borderRadius: '2px', marginRight: '10px' }} 
                        />
                        <button 
                            onClick={() => selectAudioFile(key)} 
                            style={{ width: '120px', padding: '6px', backgroundColor: '#4e52ff', color: '#ffffff', borderRadius: '2px', border: 'none', marginRight: '10px' }}
                        >
                            Audio...
                        </button>
                        <input 
                            type="number" 
                            value={config[key].volume}
                            onChange={(e) => handleNumberInput(key, 'volume', e.target.value)} 
                            style={{ width: '60px', padding: '6px', backgroundColor: '#3e41a8', color: '#ffffff', border: 'none', borderRadius: '2px', marginRight: '5px' }} 
                        />
                        <span style={{ marginRight: '10px' }}>dB</span>
                        <input 
                            type="number" 
                            value={config[key].pitch}
                            onChange={(e) => handleNumberInput(key, 'pitch', e.target.value)} 
                            min="-12"
                            max="12"
                            step="1"
                            style={{ width: '60px', padding: '6px', backgroundColor: '#3e41a8', color: '#ffffff', border: 'none', borderRadius: '2px', marginRight: '5px' }} 
                        />
                        <span style={{ marginRight: '10px' }}>st</span>
                        <label style={{ display: 'flex', alignItems: 'center', marginLeft: '5px', justifyContent: 'center' }}>
                            <input 
                                type="checkbox" 
                                checked={config[key].importInMiddle || false} 
                                onChange={(e) => updateBinding(key, { ...config[key], importInMiddle: e.target.checked })} 
                                style={{ marginRight: '5px' }} 
                            />
                            Middle
                        </label>
                    </div>
                ))}
            </div>
        </div>
    );
    
    
};

console.log('Exporting Main component');
export default Main;
