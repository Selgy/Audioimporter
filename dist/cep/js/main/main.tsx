import React, { useState, useEffect, useRef, useCallback } from 'react';
import { FaVolumeUp, FaWaveSquare } from 'react-icons/fa';
import { v4 as uuidv4 } from 'uuid';

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
  const [isWebSocketReady, setIsWebSocketReady] = useState(false);
  const [isProfilesLoaded, setIsProfilesLoaded] = useState(false);
  
  const [loading, setLoading] = useState(false);

  // Profile management state variables
  const [profiles, setProfiles] = useState<string[]>([]);
  const [currentProfile, setCurrentProfile] = useState<string | null>(null);

  // Ref to hold the last selected profile
  const lastProfileRef = useRef<string | null>(null);

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
      LAlt: 'Alt',
      RAlt: 'Alt',
      LControl: 'Ctrl',
      RControl: 'Ctrl',
      ControlLeft: 'Ctrl',
      ControlRight: 'Ctrl',
      Numpad1: '1',
      Numpad2: '2',
      Numpad3: '3',
      Numpad4: '4',
      Numpad5: '5',
      Numpad6: '6',
      Numpad7: '7',
      Numpad8: '8',
      Numpad9: '9',
      Numpad0: '0',
      // Add more key mappings as needed
    };

    const priority = ['ctrl', 'shift', 'alt'];

    const mappedKeys = keyCombination
      .split('+')
      .map((key) => keyMap[key] || key)
      .map((key) => key.toLowerCase());

    const sortedKeys = mappedKeys.sort((a, b) => {
      const aIndex = priority.indexOf(a.charAt(0).toLowerCase() + a.slice(1));
      const bIndex = priority.indexOf(b.charAt(0).toLowerCase() + b.slice(1));

      if (aIndex === -1 && bIndex === -1) return a.localeCompare(b);
      if (aIndex === -1) return 1;
      if (bIndex === -1) return -1;
      return aIndex - bIndex;
    });

    return sortedKeys.join('+');
  };

  const loadConfig = useCallback(() => {
    if (!currentProfile) {
      appendToDebugLog('No current profile selected. Please create a profile.');
      return;
    }

    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      console.log('Loading config for profile:', currentProfile);
      setLoading(true); // Set loading to true before starting config load
      try {
        socketRef.current.send(`LOAD_CONFIG:${currentProfile}`);
      } catch (error: unknown) {
        setLoading(false); // Stop loading in case of error
        if (error instanceof Error) {
          appendToDebugLog(`Error loading config: ${error.message}`);
        } else {
          appendToDebugLog(`Unexpected error loading config.`);
        }
        console.error('Error loading config:', error);
      }
    } else {
      appendToDebugLog('Cannot load config: WebSocket is not open.');
    }
  }, [currentProfile, appendToDebugLog]);


if (socketRef.current) {
  socketRef.current.onmessage = (event) => {
    console.log('Received message from server:', event.data);
    const data = event.data;
    appendToDebugLog(`Received message: ${data}`);

    if (typeof data === 'string') {
      if (data.startsWith('CONFIG:')) {
        if (!currentProfile) {
          appendToDebugLog('No current profile selected.');
          return;
        }
        const configData = JSON.parse(data.replace('CONFIG:', '')) as {
          [key: string]: AudioBinding;
        };
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

        // If we're listening for a key combo, either edit or add a new keybind
        if (isListeningForKeyRef.current) {
          if (isEditingRef.current && idBeingEditedRef.current) {
            editKeyBind(idBeingEditedRef.current, combo);
          } else {
            addNewKeyBind(combo);
          }
        } else {
          handleCombo(combo); // Handle the combo if we're not in key listening mode
        }
      } else if (data.startsWith('PROFILES:')) {
        const profilesData = JSON.parse(data.replace('PROFILES:', '')) as string[];
        setProfiles(profilesData);

        // If profiles are loaded, set the flag to true
        setIsProfilesLoaded(true);
        appendToDebugLog('Profiles loaded');

        // Automatically select the first profile if none is selected
        if (!currentProfile && profilesData.length > 0) {
          const firstProfile = profilesData[0];
          setCurrentProfile(firstProfile);
          appendToDebugLog(`Automatically selected profile: ${firstProfile}`);
          socketRef.current?.send(`SWITCH_PROFILE:${firstProfile}`);
          loadConfig(); // Load config for the selected profile
        }
      } else if (data.startsWith('PROFILE_SWITCHED:')) {
        const profileName = data.replace('PROFILE_SWITCHED:', '');
        setCurrentProfile(profileName);
        loadConfig(); // Load config for the new profile
      } else if (data.startsWith('PROFILE_CREATED:')) {
        const profileName = data.replace('PROFILE_CREATED:', '');
        setProfiles((prev) => [...prev, profileName]);
        setCurrentProfile(profileName);
        setConfigArray([]); // Clear the bindings for the newly created profile
        appendToDebugLog(`Profile created and switched to: ${profileName}`);
      } else if (data.startsWith('PROFILE_DELETED:')) {
        const profileName = data.replace('PROFILE_DELETED:', '');
        setProfiles((prev) => prev.filter((p) => p !== profileName));

        // Automatically switch to another profile if available
        if (currentProfile === profileName) {
          const newProfile = profiles.find((p) => p !== profileName) || null;
          setCurrentProfile(newProfile);

          if (newProfile) {
            socketRef.current?.send(`SWITCH_PROFILE:${newProfile}`);
            setConfigArray([]); // Clear the current configArray before loading the new profile's config
            loadConfig(); // Load the new profile's configuration
          } else {
            setConfigArray([]); // If no profiles left, clear the configArray
          }
        }
        appendToDebugLog(`Profile deleted: ${profileName}`);
      } else if (data.startsWith('ERROR:')) {
        const errorMessage = data.replace('ERROR:', '');
        appendToDebugLog(`Error: ${errorMessage}`);
      }
    }
  };
}




const switchProfile = (profileName: string) => {
  // Check if socketRef.current is not null and WebSocket is open
  if (socketRef.current !== null && socketRef.current.readyState === WebSocket.OPEN) {
    setCurrentProfile(profileName);
    setConfigArray([]);  // Clear the bindings UI before loading the new profile's bindings

    // Update the last selected profile in ref
    lastProfileRef.current = profileName;

    // Send the new profile selection to the server
    socketRef.current.send(`SAVE_LAST_SELECTED_PROFILE:${profileName}`);
    socketRef.current.send(`SWITCH_PROFILE:${profileName}`);

    // Load the configuration for the selected profile
    loadConfig();
  } else {
    appendToDebugLog('WebSocket is not initialized or ready.');
  }
};




// Function to save configuration specific to the current profile
const saveConfig = (newConfigArray: KeyBinding[]) => {
  if (!currentProfile) {
    appendToDebugLog('Cannot save config: No current profile selected.');
    return;
  }

  if (!socketRef.current) {
    appendToDebugLog('WebSocket is not initialized.');
    return;
  }

  const configObject = newConfigArray.reduce((obj, keyBinding) => {
    obj[keyBinding.key] = keyBinding.binding;
    return obj;
  }, {} as { [key: string]: AudioBinding });

  try {
    appendToDebugLog(`Sending config to server for profile ${currentProfile}: ${JSON.stringify(configObject)}`);
    const message = JSON.stringify({
      profile: currentProfile,  // Ensure the correct profile is included
      config: configObject,
    });
    socketRef.current.send(`SAVE_CONFIG:${message}`);
    appendToDebugLog('Config sent successfully');
    setConfigArray(newConfigArray);  // Update the local state
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

// Function to edit an existing key binding
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

function startWebSocketConnection(): void {
  if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
    appendToDebugLog('WebSocket already connected');
    return;
  }

  appendToDebugLog('Establishing WebSocket connection...');
  socketRef.current = new WebSocket('ws://localhost:7878');  // Use the correct address

  socketRef.current.onopen = () => {
    appendToDebugLog('Connected to server');
    setIsWebSocketReady(true);  // WebSocket is ready, update the state
    
    // Request the last selected profile
    socketRef.current?.send('GET_LAST_SELECTED_PROFILE');
    socketRef.current?.send('GET_PROFILES');
  };

  socketRef.current.onerror = (error: Event) => {
    appendToDebugLog(`WebSocket Error: ${error instanceof ErrorEvent ? error.message : 'Unknown error'}`);
  };

  socketRef.current.onclose = (event: CloseEvent) => {
    appendToDebugLog(`Disconnected from server: ${event.reason}`);
    setIsWebSocketReady(false);  // WebSocket is no longer ready

    // Try reconnecting after 5 seconds
    setTimeout(() => {
      appendToDebugLog('Attempting to reconnect...');
      startWebSocketConnection();
    }, 5000);
  };

  socketRef.current.onmessage = (event) => {
    const data = event.data;
    appendToDebugLog(`Received message: ${data}`);
  
    if (typeof data === 'string') {
      if (data.startsWith('LAST_SELECTED_PROFILE:')) {
        const lastProfile = data.replace('LAST_SELECTED_PROFILE:', '').trim();
        if (lastProfile && lastProfile !== 'None') {
          // Set the last selected profile in the ref and state
          lastProfileRef.current = lastProfile;
          setCurrentProfile(lastProfile);
          appendToDebugLog(`Restored last selected profile: ${lastProfile}`);
          socketRef.current?.send(`SWITCH_PROFILE:${lastProfile}`);
          loadConfig();  // Load config for the last selected profile
        } else {
          appendToDebugLog('No last selected profile found');
        }
      } else if (data.startsWith('PROFILES:')) {
        const profilesData = JSON.parse(data.replace('PROFILES:', '')) as string[];
        setProfiles(profilesData);
  
        if (profilesData.length === 0) {
          appendToDebugLog('No profiles available.');
        } else {
          appendToDebugLog(`Profiles loaded: ${profilesData.join(', ')}`);
  
          // Only switch to the first profile if no last selected profile is found
          if (!lastProfileRef.current && profilesData.length > 0) {
            const firstProfile = profilesData[0];
            setCurrentProfile(firstProfile);
            appendToDebugLog(`Automatically selected profile: ${firstProfile}`);
            socketRef.current?.send(`SWITCH_PROFILE:${firstProfile}`);
            loadConfig();  // Load config for the first profile
          }
        }
      } else if (data.startsWith('PROFILE_SWITCHED:')) {
        const profileName = data.replace('PROFILE_SWITCHED:', '');
        setCurrentProfile(profileName);
        loadConfig();  // Load config for the new profile
      } else if (data.startsWith('PROFILE_CREATED:')) {
        const profileName = data.replace('PROFILE_CREATED:', '');
        setProfiles((prev) => [...prev, profileName]);
        setCurrentProfile(profileName);
        setConfigArray([]);  // Clear the bindings for the newly created profile
        appendToDebugLog(`Profile created and switched to: ${profileName}`);
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

  // Function to load profiles from the server
  const loadProfiles = () => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      try {
        socketRef.current.send('GET_PROFILES');
      } catch (error) {
        appendToDebugLog(`Error loading profiles: ${error}`);
      }
    } else {
      appendToDebugLog('Cannot load profiles: WebSocket is not open.');
    }
  };

  


  const createProfile = () => {
    const profileName = prompt('Enter new profile name:');
    if (profileName) {
      // Send WebSocket request to create the profile on the server
      socketRef.current?.send(`CREATE_PROFILE:${profileName}`);
      
      // Optimistically update the profiles state to show it in the list immediately
      setProfiles((prevProfiles) => [...prevProfiles, profileName]);
  
      // Set the new profile as the current profile
      setCurrentProfile(profileName);
  
      // Clear the bindings for the newly created profile
      setConfigArray([]);
      appendToDebugLog(`New profile created and switched to: ${profileName}`);
  
      // Save an empty or default configuration for the newly created profile
      const defaultConfig = {};
      socketRef.current?.send(`SAVE_CONFIG:${JSON.stringify({
        profile: profileName,
        config: defaultConfig,
      })}`);
      appendToDebugLog(`New profile configuration saved for ${profileName}`);
    }
  };
  
  

  const deleteProfile = () => {
    if (currentProfile && confirm(`Are you sure you want to delete profile '${currentProfile}'?`)) {
      // Send a message to the server to delete the profile and its configuration
      socketRef.current?.send(`DELETE_PROFILE:${currentProfile}`);
  
      // Optimistically remove the profile from the state
      setProfiles((prevProfiles) => prevProfiles.filter((p) => p !== currentProfile));
      
      const newProfile = profiles.find((p) => p !== currentProfile) || null;
  
      // Switch to a new profile if one exists, otherwise clear the UI
      if (newProfile) {
        setCurrentProfile(newProfile);
        setConfigArray([]); // Clear the current bindings UI
        socketRef.current?.send(`SWITCH_PROFILE:${newProfile}`);
        loadConfig(); // Ensure the config is loaded after switching
      } else {
        // If no profiles are left, clear everything
        setCurrentProfile(null);
        setConfigArray([]); // Clear config array if no profiles are left
      }
  
      appendToDebugLog(`Profile '${currentProfile}' deleted successfully`);
    }
  };
  


useEffect(() => {
  console.log('useEffect hook is running');

  // Start WebSocket connection and wait for it to open
  startWebSocketConnection();

  return () => {
    if (socketRef.current) {
      socketRef.current.close(); // Clean up WebSocket on component unmount
    }
  };
}, []);


// Ensure that WebSocket is ready and profiles are loaded before rendering
if (!isWebSocketReady || !isProfilesLoaded) {
  return (
    <div
      style={{
        fontFamily: 'Roboto, sans-serif',
        backgroundColor: '#1e2057',
        color: '#ffffff',
        padding: '10px',
        textAlign: 'center',
      }}
    >
      <div>Loading profiles, please wait...</div>
    </div>
  );
}



  // If no current profile is selected, prompt the user to create one
  if (!currentProfile) {
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
          <p>No profiles available. Please create a new profile.</p>
          <button
            onClick={createProfile}
            style={{
              padding: '10px',
              backgroundColor: '#4e52ff',
              color: '#ffffff',
              borderRadius: '2px',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            Create Profile
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        fontFamily: 'Roboto, sans-serif',
        backgroundColor: '#1e2057',
        color: '#ffffff',
        padding: '10px',
      }}
    >
      {/* Loading Spinner or Profiles */}
      {!isWebSocketReady || !isProfilesLoaded ? (
        <div
          style={{
            textAlign: 'center',
            padding: '20px',
          }}
        >
          <div
            style={{
              fontSize: '20px',
              marginBottom: '10px',
            }}
          >
            Loading profiles, please wait...
          </div>
          <div className="spinner" style={{ fontSize: '30px' }}>🔄</div> {/* Spinner Icon */}
        </div>
      ) : (
        <>
          {/* If no current profile is selected, prompt the user to create one */}
          {!currentProfile ? (
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
                <p>No profiles available. Please create a new profile.</p>
                <button
                  onClick={createProfile}
                  style={{
                    padding: '10px',
                    backgroundColor: '#4e52ff',
                    color: '#ffffff',
                    borderRadius: '2px',
                    border: 'none',
                    cursor: 'pointer',
                  }}
                >
                  Create Profile
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Profile Management UI */}
              <div
                style={{
                  marginBottom: '15px',
                  padding: '10px',
                  backgroundColor: '#2e2f77',
                  borderRadius: '5px',
                }}
              >
                {profiles.length > 0 && currentProfile ? (
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <div>
                      <label htmlFor="profile-select" style={{ marginRight: '10px' }}>
                        Profile:
                      </label>
                      <select
                        id="profile-select"
                        value={currentProfile}
                        onChange={(e) => switchProfile(e.target.value)}
                        style={{
                          padding: '6px',
                          backgroundColor: '#3e41a8',
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: '2px',
                          marginRight: '10px',
                        }}
                      >
                        {profiles.map((profile) => (
                          <option key={profile} value={profile}>
                            {profile}
                          </option>
                        ))}
                      </select>
                      <button
                        onClick={createProfile}
                        style={{
                          padding: '6px',
                          backgroundColor: '#4e52ff',
                          color: '#ffffff',
                          borderRadius: '2px',
                          border: 'none',
                          marginRight: '10px',
                        }}
                      >
                        New Profile
                      </button>
                      <button
                        onClick={deleteProfile}
                        style={{
                          padding: '6px',
                          backgroundColor: '#ff5b3b',
                          color: '#ffffff',
                          borderRadius: '2px',
                          border: 'none',
                          cursor: 'pointer',
                        }}
                      >
                        Delete Profile
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <p>No profiles available. Please create a new profile.</p>
                    <button
                      onClick={createProfile}
                      style={{
                        padding: '10px',
                        backgroundColor: '#4e52ff',
                        color: '#ffffff',
                        borderRadius: '2px',
                        border: 'none',
                        cursor: 'pointer',
                      }}
                    >
                      Create Profile
                    </button>
                  </div>
                )}
              </div>
  
              {/* Add Binding Section */}
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
            </>
          )}
        </>
      )}
    </div>
  );
  
  
};

console.log('Exporting Main component');
export default Main;
