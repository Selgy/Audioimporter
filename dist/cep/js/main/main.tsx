import React, { useState, useEffect, useRef, useCallback } from 'react';
import { FaVolumeUp, FaWaveSquare } from 'react-icons/fa';
import { v4 as uuidv4 } from 'uuid'; // Import UUID library

// Define your types
interface AudioBinding {
  path: string;
  pitch: number;
  track: string;
  volume: number;
}

interface KeyBinding {
  id: string;
  key: string;
  binding: AudioBinding;
}

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

  // State variables
  const [configArray, setConfigArray] = useState<KeyBinding[]>([]);
  const [debugLog, setDebugLog] = useState<string[]>([]);
  const [isAddingBinding, setIsAddingBinding] = useState(false);
  const [isListeningForKey, setIsListeningForKey] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [keyBeingEdited, setKeyBeingEdited] = useState<string | null>(null);
  const [idBeingEdited, setIdBeingEdited] = useState<string | null>(null);

  // Refs
  const isListeningForKeyRef = useRef(isListeningForKey);
  const isEditingRef = useRef(isEditing);
  const keyBeingEditedRef = useRef(keyBeingEdited);
  const idBeingEditedRef = useRef(idBeingEdited);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const socketRef = useRef<WebSocket | null>(null);

  // Update refs when state changes
  useEffect(() => {
    isListeningForKeyRef.current = isListeningForKey;
  }, [isListeningForKey]);

  useEffect(() => {
    isEditingRef.current = isEditing;
  }, [isEditing]);

  useEffect(() => {
    keyBeingEditedRef.current = keyBeingEdited;
  }, [keyBeingEdited]);

  useEffect(() => {
    idBeingEditedRef.current = idBeingEdited;
  }, [idBeingEdited]);

  // Function to append messages to the debug log
  const appendToDebugLog = (message: string) => {
    console.log('Debug log:', message);
    setDebugLog((prevLog) => [...prevLog, message]);
  };

  // Function to normalize key combinations
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

    const priority = ['Ctrl', 'Shift', 'Alt'];

    const mappedKeys = keyCombination
      .split('+')
      .map((key) => keyMap[key] || key);

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

  // Function to load the config from the server
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

  // Function to save the config to the server
  const saveConfig = (newConfigArray: KeyBinding[]) => {
    const configObject = newConfigArray.reduce((obj, keyBinding) => {
      obj[keyBinding.key] = keyBinding.binding;
      return obj;
    }, {} as { [key: string]: AudioBinding });

    try {
      appendToDebugLog(`Sending config to server: ${JSON.stringify(configObject)}`);
      socketRef.current?.send(`SAVE_CONFIG:${JSON.stringify(configObject)}`);
      appendToDebugLog('Config sent successfully');
      setConfigArray(newConfigArray); // Update the local state
    } catch (error: unknown) {
      if (error instanceof Error) {
        appendToDebugLog(`Error saving config: ${error.message}`);
      } else {
        appendToDebugLog(`Unexpected error saving config.`);
      }
    }
  };

  // Function to update a binding
  const updateBinding = (id: string, value: AudioBinding) => {
    console.log('Updating binding with value:', value);
    setConfigArray((prevConfig) => {
      const index = prevConfig.findIndex((kb) => kb.id === id);
      if (index === -1) {
        appendToDebugLog(`Keybinding with id ${id} not found in config.`);
        return prevConfig;
      }

      const newConfig = [...prevConfig];
      newConfig[index] = { ...newConfig[index], binding: value };

      appendToDebugLog(`Updating config for id: ${id} with value: ${JSON.stringify(value)}`);
      saveConfig(newConfig);
      return newConfig;
    });
  };

  // Function to stop listening for key input
  const stopListening = () => {
    appendToDebugLog('Stopping key listener...');
    setIsListeningForKey(false);
    isListeningForKeyRef.current = false;
    appendToDebugLog('isListeningForKey set to false');
    setIsAddingBinding(false);
    appendToDebugLog('isAddingBinding set to false');
    if (isEditing) {
      setIsEditing(false);
      setKeyBeingEdited(null);
      setIdBeingEdited(null);
      appendToDebugLog('Editing state reset');
    }
  };

  // Function to handle editing a key binding
  const editKeyBind = (id: string, newCombo: string) => {
    appendToDebugLog(`Editing key binding with id ${id} to ${newCombo}`);
    const normalizedNewCombo = normalizeKeyCombination(newCombo);

    setConfigArray((prevConfig) => {
      if (prevConfig.some((kb) => kb.key === normalizedNewCombo)) {
        appendToDebugLog(`Key combination ${normalizedNewCombo} already exists in config.`);
        stopListening();
        return prevConfig;
      }

      const index = prevConfig.findIndex((kb) => kb.id === id);
      if (index === -1) {
        appendToDebugLog(`Keybinding with id ${id} not found in config.`);
        stopListening();
        return prevConfig;
      }

      const newConfig = [...prevConfig];
      newConfig[index] = { ...newConfig[index], key: normalizedNewCombo };

      appendToDebugLog(`Config after editing: ${JSON.stringify(newConfig)}`);
      saveConfig(newConfig);
      stopListening();
      setIsEditing(false);
      setKeyBeingEdited(null);
      setIdBeingEdited(null);
      return newConfig;
    });
  };

  // Function to handle incoming key combinations
  const handleCombo = (combo: string) => {
    const normalizedCombo = normalizeKeyCombination(combo);
    if (configArray.some((kb) => kb.key === normalizedCombo)) {
      appendToDebugLog(`Processing combo: ${normalizedCombo}`);
      // Add your logic here to handle the combo
    } else {
      appendToDebugLog(`Combo ${normalizedCombo} not found in config`);
    }
  };

  // Function to add a new key binding
  const addNewKeyBind = useCallback(
    (keyCombination: string) => {
      appendToDebugLog(`Detected key combination: ${keyCombination}`);
      const normalizedCombination = normalizeKeyCombination(keyCombination);
      appendToDebugLog(`Normalized key combination: ${normalizedCombination}`);

      setConfigArray((prevConfig) => {
        if (prevConfig.some((kb) => kb.key === normalizedCombination)) {
          appendToDebugLog(`Key combination ${normalizedCombination} already exists in config.`);
          stopListening();
          return prevConfig;
        }

        const newKeyBinding: KeyBinding = {
          id: uuidv4(),
          key: normalizedCombination,
          binding: { volume: 0, pitch: 0, track: 'A1', path: '' },
        };

        const newConfig = [...prevConfig, newKeyBinding];

        appendToDebugLog(`New config before saving: ${JSON.stringify(newConfig)}`);
        saveConfig(newConfig);
        appendToDebugLog(`Key binding ${normalizedCombination} added to config.`);
        stopListening();
        return newConfig;
      });
    },
    [appendToDebugLog, saveConfig, stopListening]
  );

  // Function to start the WebSocket connection
  function startWebSocketConnection(): void {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      appendToDebugLog('WebSocket already connected');
      return;
    }

    appendToDebugLog('Establishing WebSocket connection...');
    socketRef.current = new WebSocket('ws://localhost:7878');

    socketRef.current.onopen = () => {
      appendToDebugLog('Connected to Rust server');
      loadConfig();
    };

    socketRef.current.onerror = (error: Event) => {
      appendToDebugLog(
        `WebSocket Error: ${error instanceof ErrorEvent ? error.message : 'Unknown error'}`
      );
    };

    socketRef.current.onclose = (event: CloseEvent) => {
      appendToDebugLog(`Disconnected from Rust server: ${event.reason}`);
      setTimeout(() => {
        appendToDebugLog('Attempting to reconnect...');
        startWebSocketConnection();
      }, 5000);
    };

    socketRef.current.onmessage = (event) => {
      console.log('Received message from server:', event.data);
      const data = event.data;
      appendToDebugLog(`Received message: ${data}`);

      if (typeof data === 'string') {
        if (data.startsWith('CONFIG:')) {
          // Explicitly assert the type of configData
          const configData = JSON.parse(data.replace('CONFIG:', '')) as { [key: string]: AudioBinding };
          // Convert the object to an array
          const configArray: KeyBinding[] = Object.entries(configData).map(([key, binding]) => ({
            id: uuidv4(), // Generate a new ID for each keybinding
            key: normalizeKeyCombination(key),
            binding,
          }));
          setConfigArray(configArray);
          appendToDebugLog('Config loaded and converted to array successfully');
        } else if (data.startsWith('COMBO:')) {
          const combo = data.replace('COMBO:', '');
          appendToDebugLog(`Processed combo: ${combo}`);

          if (isListeningForKeyRef.current) {
            if (isEditingRef.current && idBeingEditedRef.current) {
              editKeyBind(idBeingEditedRef.current, combo);
            } else {
              addNewKeyBind(combo);
            }
          } else {
            handleCombo(combo);
          }
        }
      }
    };
  }

  // Function to start listening for key input
  const startKeyListener = useCallback(() => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      appendToDebugLog('WebSocket connection is open. Starting key listener...');
      setIsListeningForKey(true);
      isListeningForKeyRef.current = true;
      appendToDebugLog('isListeningForKey set to true');
    } else {
      appendToDebugLog('WebSocket connection is not open. Cannot start key listener.');
    }
  }, [appendToDebugLog]);

  // Function to initiate editing a key binding
  const editBinding = (id: string, key: string) => {
    if (!isListeningForKey && !isEditing) {
      setIsEditing(true);
      setKeyBeingEdited(key);
      setIdBeingEdited(id);
      appendToDebugLog(`Editing binding for key: ${key} with id: ${id}`);
      startKeyListener();
    }
  };

  // Function to initiate adding a new binding
  const addBinding = () => {
    if (!isListeningForKey && !isEditing) {
      setIsAddingBinding(true);
      appendToDebugLog('Add binding clicked. isListeningForKey set to true');
      startKeyListener();
    }
  };

  // Function to select an audio file
  const selectAudioFile = (id: string) => {
    appendToDebugLog(`Attempting to select audio file for id: ${id}`);
    if (fileInputRef.current) {
      appendToDebugLog('File input reference is available.');
      fileInputRef.current.click();
      fileInputRef.current.onchange = (event) => {
        appendToDebugLog('File input change event triggered.');
        const file = (event.target as HTMLInputElement).files?.[0];
        if (file) {
          appendToDebugLog(`File selected: ${file.name}`);
          const filePath = (file as any).path || file.name;
          appendToDebugLog(`File path resolved to: ${filePath}`);
          // Update the config with the selected file path
          const keyBinding = configArray.find((kb) => kb.id === id);
          if (keyBinding) {
            updateBinding(id, { ...keyBinding.binding, path: filePath });
            appendToDebugLog(`Selected audio file for id ${id}: ${filePath}`);
          }
        } else {
          appendToDebugLog('No file selected.');
        }
      };
    } else {
      appendToDebugLog('File input reference is not available.');
    }
  };

  // Function to delete a binding
  const deleteBinding = (id: string) => {
    setConfigArray((prevConfig) => {
      const index = prevConfig.findIndex((kb) => kb.id === id);
      if (index === -1) {
        appendToDebugLog(`Keybinding with id ${id} not found in config.`);
        return prevConfig;
      }

      const newConfig = [...prevConfig];
      newConfig.splice(index, 1);

      appendToDebugLog(`Deleting binding with id: ${id}`);
      saveConfig(newConfig);
      appendToDebugLog(`Binding deleted for id ${id}`);
      return newConfig;
    });
  };

  // Function to extract the file name from a path
  const extractFileName = (filePath: string): string => {
    return filePath?.split('\\').pop()?.split('/').pop() || ''; // Handles both Windows and Unix-style paths
  };

  // Function to handle number input changes
  const handleNumberInput = useCallback(
    (id: string, field: 'volume' | 'pitch', value: string) => {
      // Check if the value is a valid number or an allowed partial value
      if (value === '' || value === '-' || value === '-.' || /^-?\d*\.?\d*$/.test(value)) {
        // Allow updating the input with the temporary value
        const keyBinding = configArray.find((kb) => kb.id === id);
        if (keyBinding) {
          updateBinding(id, { ...keyBinding.binding, [field]: value });
        }
      }

      // Check if the value is a valid number within the acceptable range
      const numValue = parseFloat(value);
      if (!isNaN(numValue)) {
        // Apply limits only if the field is 'pitch'
        if (field === 'pitch' && (numValue < -12 || numValue > 12)) {
          return; // Pitch should be between -12 and 12
        }
        // Update binding with the valid numeric value
        const keyBinding = configArray.find((kb) => kb.id === id);
        if (keyBinding) {
          updateBinding(id, { ...keyBinding.binding, [field]: numValue });
        }
      }
    },
    [configArray, updateBinding]
  );

  // useEffect to start the WebSocket connection on component mount
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

  return (
    <div
      style={{
        fontFamily: 'Roboto, sans-serif',
        backgroundColor: '#1e2057',
        color: '#ffffff',
        padding: '10px',
      }}
    >
      <div
        style={{
          marginBottom: '15px',
          padding: '10px',
          backgroundColor: '#2e2f77',
          borderRadius: '5px',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <input
            type="text"
            readOnly
            value={
              isListeningForKey
                ? isEditing
                  ? `Editing ${keyBeingEdited || ''}: Press new key...`
                  : 'Press a key combination...'
                : 'Click Add Binding to start'
            }
            style={{
              width: '250px',
              padding: '6px',
              backgroundColor: '#3e41a8',
              color: '#ffffff',
              border: 'none',
              borderRadius: '2px',
            }}
          />
          <button
            onClick={addBinding}
            disabled={isListeningForKey || isEditing}
            style={{
              width: '150px',
              padding: '6px',
              backgroundColor: isListeningForKey || isEditing ? '#2e3177' : '#4e52ff',
              color: '#ffffff',
              borderRadius: '2px',
              border: 'none',
              cursor: isListeningForKey || isEditing ? 'not-allowed' : 'pointer',
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
        {configArray.map((keyBinding) => (
          <div
            key={keyBinding.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              marginBottom: '10px',
              backgroundColor: '#2e2f77',
              padding: '10px',
              borderRadius: '5px',
            }}
          >
            <button
              onClick={() => deleteBinding(keyBinding.id)}
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
                marginRight: '10px',
              }}
            >
              ✖
            </button>
            <input
              type="text"
              readOnly
              value={keyBinding.key}
              style={{
                width: '70px',
                padding: '6px',
                backgroundColor: '#3e41a8',
                color: '#ffffff',
                border: 'none',
                borderRadius: '2px',
                marginRight: '10px',
                textAlign: 'center',
              }}
            />
            <button
              onClick={() => editBinding(keyBinding.id, keyBinding.key)}
              disabled={isListeningForKey || isEditing}
              style={{
                width: '50px',
                padding: '6px',
                backgroundColor: isListeningForKey || isEditing ? '#2e3177' : '#4e52ff',
                color: '#ffffff',
                borderRadius: '2px',
                border: 'none',
                marginRight: '10px',
                cursor: isListeningForKey || isEditing ? 'not-allowed' : 'pointer',
              }}
            >
              Edit
            </button>
            <select
              value={keyBinding.binding.track}
              onChange={(e) =>
                updateBinding(keyBinding.id, { ...keyBinding.binding, track: e.target.value })
              }
              style={{
                width: '70px',
                padding: '6px',
                backgroundColor: '#3e41a8',
                color: '#ffffff',
                border: 'none',
                borderRadius: '2px',
                marginRight: '10px',
              }}
            >
              {Array.from({ length: 15 }, (_, i) => (
                <option key={i} value={`A${i + 1}`}>
                  A{i + 1}
                </option>
              ))}
            </select>
            <input
              type="text"
              readOnly
              value={extractFileName(keyBinding.binding.path)}
              style={{
                width: '120px',
                padding: '7px',
                backgroundColor: '#3e41a8',
                color: '#ffffff',
                border: 'none',
                borderRadius: '2px',
                marginRight: '10px',
              }}
            />
            <button
              onClick={() => selectAudioFile(keyBinding.id)}
              style={{
                width: '120px',
                padding: '6px',
                backgroundColor: '#4e52ff',
                color: '#ffffff',
                borderRadius: '2px',
                border: 'none',
                marginRight: '10px',
              }}
            >
              Audio...
            </button>

            {/* Volume Section */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                marginRight: '15px',
                position: 'relative',
              }}
            >
              <FaVolumeUp style={{ color: '#ffffff', marginRight: '10px' }} />
              <div style={{ position: 'relative' }}>
                <input
                  type="number"
                  value={keyBinding.binding.volume}
                  onChange={(e) => handleNumberInput(keyBinding.id, 'volume', e.target.value)}
                  style={{
                    width: '40px',
                    padding: '6px',
                    backgroundColor: '#3e41a8',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '2px',
                    textAlign: 'center',
                  }}
                />
                <span
                  style={{
                    position: 'absolute',
                    right: '6px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#ffffff',
                    fontSize: '12px',
                    pointerEvents: 'none',
                  }}
                >
                  dB
                </span>
              </div>
            </div>

            {/* Pitch Section */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                marginRight: '15px',
                position: 'relative',
              }}
            >
              <FaWaveSquare
                style={{
                  marginRight: '0px',
                  marginLeft: '-15px',
                  width: '40px',
                  padding: '0px',
                }}
              />
              <div style={{ position: 'relative' }}>
                <input
                  type="number"
                  value={keyBinding.binding.pitch}
                  onChange={(e) => handleNumberInput(keyBinding.id, 'pitch', e.target.value)}
                  min="-12"
                  max="12"
                  step="1"
                  style={{
                    width: '40px',
                    padding: '6px',
                    backgroundColor: '#3e41a8',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '2px',
                    textAlign: 'center',
                  }}
                />
                <span
                  style={{
                    position: 'absolute',
                    right: '6px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#ffffff',
                    fontSize: '12px',
                    pointerEvents: 'none',
                  }}
                >
                  st
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

console.log('Exporting Main component');
export default Main;
