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
    const [pressedKeys, setPressedKeys] = useState<Set<string>>(new Set());
    const fileInputRef = useRef<HTMLInputElement>(null);
    const socketRef = useRef<WebSocket | null>(null);
    const [isListening, setIsListening] = useState(false);
    
    useEffect(() => {
        console.log('useEffect hook is running');
        loadConfig();
    
        return () => {
            if (socketRef.current) {
                socketRef.current.close();
            }
        };
    }, []);

    const appendToDebugLog = (message: string) => {
        console.log('Debug log:', message);
        setDebugLog(prevLog => [...prevLog, message]);
    };

    const loadConfig = () => {
        console.log('Loading config');
        try {
            const storedConfig = JSON.parse(localStorage.getItem('config') || '{}') as Config;
            setConfig(storedConfig);
            appendToDebugLog('Config loaded successfully');
            console.log('Loaded config:', storedConfig);
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
            localStorage.setItem('config', JSON.stringify(newConfig));
            setConfig(newConfig);
            appendToDebugLog('Config saved successfully');
        } catch (error: unknown) {
            if (error instanceof Error) {
                appendToDebugLog(`Error saving config: ${error.message}`);
            } else {
                appendToDebugLog(`Unexpected error saving config.`);
            }
        }
    };

    const startKeyListener = useCallback(() => {
        if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
          appendToDebugLog("WebSocket already connected");
          return;
        }
      
        appendToDebugLog("Establishing WebSocket connection...");
        socketRef.current = new WebSocket('ws://localhost:7878');
      
        socketRef.current.onopen = () => {
          appendToDebugLog("Connected to Rust server");
          setIsListeningForKey(true);
        };
      
        socketRef.current.onmessage = (event) => {
          const data = event.data;
          appendToDebugLog(`Received message: ${data}`);
          if (typeof data === 'string' && data.startsWith("COMBO:")) {
            const combo = data.split(":")[1];
            const sortedCombo = combo.split('+').sort().join('+');
            addNewKeyBind(sortedCombo);
            stopListening(); // Stop listening after adding a key bind
          }
        };
      
        socketRef.current.onerror = (error: Event) => {
          if (error instanceof ErrorEvent) {
            appendToDebugLog(`WebSocket Error: ${error.message}`);
          } else {
            appendToDebugLog(`WebSocket Error: Unknown error`);
          }
          stopListening();
        };
      
        socketRef.current.onclose = (event: CloseEvent) => {
          appendToDebugLog(`Disconnected from Rust server: ${event.reason}`);
          stopListening();
        };
      }, []);
      
      const stopListening = () => {
        if (socketRef.current) {
          socketRef.current.close();
        }
        setIsListeningForKey(false);
        setIsAddingBinding(false);
      };

      const addNewKeyBind = (keyCombination: string) => {
        const sortedCombination = keyCombination.split('+').sort().join('+');
        setConfig((prevConfig: Config) => {
          if (!prevConfig[sortedCombination]) {
            const newConfig = { ...prevConfig, [sortedCombination]: { volume: 0, pitch: 0, track: 'A1', path: '' } };
            saveConfig(newConfig);
            appendToDebugLog(`New key binding added: ${sortedCombination}`);
            stopListening(); // Stop listening after successfully adding a new key bind
            return newConfig;
          } else {
            appendToDebugLog(`Key combination already exists: ${sortedCombination}`);
            stopListening(); // Also stop listening if the combination already exists
            return prevConfig;
          }
        });
      };

    
    const addBinding = () => {
        if (!isListeningForKey) {
            setIsAddingBinding(true);
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
            saveConfig(newConfig);
            appendToDebugLog(`Binding updated for ${key}`);
            return newConfig;
        });
    };

    const deleteBinding = (key: string) => {
        setConfig((prevConfig: Config) => {
            const { [key]: _, ...newConfig } = prevConfig;
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
                <button onClick={() => console.log('Open Dev Tools clicked')} style={{ width: '150px', padding: '6px', backgroundColor: '#4e52ff', color: '#ffffff', borderRadius: '2px', border: 'none' }}>Open Dev Tools</button>
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