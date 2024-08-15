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
        
        return () => {
            if (socketRef.current) {
                socketRef.current.close();
            }
        };
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
            
            if (typeof data === 'string' && data.startsWith("CONFIG:")) {
                const configData = JSON.parse(data.replace("CONFIG:", ""));
                setConfig(configData);
                appendToDebugLog('Config loaded successfully from server');
            }
        };
    
        socketRef.current.onerror = (error: Event) => {
            if (error instanceof ErrorEvent) {
                appendToDebugLog(`WebSocket Error: ${error.message}`);
            } else {
                appendToDebugLog(`WebSocket Error: Unknown error`);
            }
        };
    
        socketRef.current.onclose = (event: CloseEvent) => {
            appendToDebugLog(`Disconnected from Rust server: ${event.reason}`);
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
            setConfig(newConfig); // Update the UI
        } catch (error: unknown) {
            if (error instanceof Error) {
                appendToDebugLog(`Error saving config: ${error.message}`);
            } else {
                appendToDebugLog(`Unexpected error saving config.`);
            }
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
                        handleCombo(combo); // Handle the combo here
                    }
                }
            };
        }
    }, [config]);

    const handleCombo = (combo: string) => {
        appendToDebugLog(`Handling combo: ${combo}`);
        
        // Normalize the combo by sorting the keys
        const normalizedCombo = combo.split('+').sort().join('+');
        appendToDebugLog(`Normalized combo: ${normalizedCombo}`);
        
        if (config[normalizedCombo]) {
            const binding = config[normalizedCombo];
            if (binding.path) {
                executePremiereProScript(binding.path, parseInt(binding.track.replace('A', ''), 10));
            } else {
                appendToDebugLog(`No path specified for combo: ${normalizedCombo}`);
            }
        } else {
            appendToDebugLog(`Combo ${normalizedCombo} not found in config.`);
        }
    };
    
    
    
    
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
        setConfig((prevConfig: Config) => {
            const newConfig = { ...prevConfig, [key]: value };
            appendToDebugLog(`Updating config for key: ${key} with value: ${JSON.stringify(value)}`);
            saveConfig(newConfig);
            appendToDebugLog(`Binding updated for ${key}`);
            return newConfig;
        });
    };


    const executePremiereProScript = (filePath: string, track: number) => {
        if (!filePath || isNaN(track)) {
            alert("Invalid file path or track number.");
            return;
        }
    
        const script = `
            function importAudioToTrack(filePath, trackIndex) {
                app.project.rootItem;
                var activeSequence = app.project.activeSequence;
                var importResult = app.project.importFiles([filePath], 1, app.project.rootItem, false);
                var importedItem = app.project.rootItem.children[app.project.rootItem.children.numItems - 1];
                var audioTrack = activeSequence.audioTracks[trackIndex - 1];
                var time = activeSequence.getPlayerPosition();
                var newClip = audioTrack.insertClip(importedItem, time.seconds);
            }
            importAudioToTrack("${filePath.replace(/\\/g, '\\\\')}", ${track});
        `;
    
        window.__adobe_cep__.evalScript(script, (result: string) => {
        });
    };
    
    const deleteBinding = (key: string) => {
        setConfig((prevConfig: Config) => {
            const { [key]: _, ...newConfig } = prevConfig;
            appendToDebugLog(`Deleting binding for key: ${key}`);
            saveConfig(newConfig);
            appendToDebugLog(`Binding deleted for ${key}`);
            return newConfig;
        });
    };

    return (
        <div style={{ fontFamily: 'Roboto, sans-serif', backgroundColor: '#1e2057', color: '#ffffff', padding: '10px' }}>
            <h1 style={{ color: '#ff5b3b' }}>Premiere Pro Key Bindings</h1>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', backgroundColor: '#2e2f77', padding: '10px', borderRadius: '5px' }}>
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
            <input type="file" ref={fileInputRef} style={{ display: 'none' }} accept="audio/*" />
            <div>
                {Object.keys(config).map((key) => (
                    <div key={key} style={{ display: 'flex', alignItems: 'center', marginBottom: '10px', backgroundColor: '#2e2f77', padding: '10px', borderRadius: '5px' }}>
                        <input type="text" readOnly value={key} style={{ width: '100px', padding: '6px', backgroundColor: '#3e41a8', color: '#ffffff', border: 'none', borderRadius: '2px', marginRight: '10px' }} />
                        <button onClick={() => console.log(`Edit binding for ${key}`)} style={{ width: '50px', padding: '6px', backgroundColor: '#4e52ff', color: '#ffffff', borderRadius: '2px', border: 'none', marginRight: '10px' }}>Edit</button>
                        <button onClick={() => deleteBinding(key)} style={{ width: '50px', padding: '6px', backgroundColor: '#ff5b3b', color: '#ffffff', borderRadius: '2px', border: 'none', marginRight: '10px' }}>Delete</button>
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
                            value={config[key].path} 
                            style={{ width: '200px', padding: '6px', backgroundColor: '#3e41a8', color: '#ffffff', border: 'none', borderRadius: '2px', marginRight: '10px' }} 
                        />
                        <button 
                            onClick={() => selectAudioFile(key)} 
                            style={{ width: '100px', padding: '6px', backgroundColor: '#4e52ff', color: '#ffffff', borderRadius: '2px', border: 'none', marginRight: '10px' }}
                        >
                            Select audio...
                        </button>
                        <input 
                            type="number" 
                            value={config[key].volume} 
                            onChange={(e) => updateBinding(key, { ...config[key], volume: parseInt(e.target.value) })} 
                            style={{ width: '50px', padding: '6px', backgroundColor: '#3e41a8', color: '#ffffff', border: 'none', borderRadius: '2px', marginRight: '10px' }} 
                        />
                        <input 
                            type="number" 
                            value={config[key].pitch} 
                            onChange={(e) => updateBinding(key, { ...config[key], pitch: parseInt(e.target.value) })} 
                            style={{ width: '50px', padding: '6px', backgroundColor: '#3e41a8', color: '#ffffff', border: 'none', borderRadius: '2px', marginRight: '10px' }} 
                        />
                    </div>
                ))}
            </div>
            <div id="debug-log" style={{ backgroundColor: '#333', color: '#fff', padding: '10px', marginTop: '20px', maxHeight: '200px', overflowY: 'scroll' }}>
                <h2>Debug Log</h2>
                {debugLog.map((log, index) => (
                    <div key={index}>{log}</div>
                ))}
            </div>
        </div>
    );
};

console.log('Exporting Main component');
export default Main;
