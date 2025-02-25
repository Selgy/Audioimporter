import React, { useState, useEffect, useRef, useCallback } from 'react';
import { FaVolumeUp, FaWaveSquare } from 'react-icons/fa';
import { v4 as uuidv4 } from 'uuid';
import './styles.css';
import Modal from './Modal'; // Make sure to import the Modal component
const path = window.electron ? require('path') : null;

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
  const [lastSelectedProfile, setLastSelectedProfile] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const path = window.electron ? require('path') : null;
  const os = require('os');
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isCreateProfileModalOpen, setIsCreateProfileModalOpen] = useState(false);
  // Instead of using Node's `os` module, use `navigator` to determine the platform
  const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
  const isWindows = navigator.platform.toUpperCase().indexOf('WIN') >= 0;
  
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

  useEffect(() => {
    appendToDebugLog(`Current profile changed to: ${currentProfile}`);
  }, [currentProfile]);


  // Function to append messages to the debug log
  const appendToDebugLog = (message: string) => {
    console.log('Debug log:', message);
    setDebugLog((prevLog) => [...prevLog, message]);
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

  const loadConfig = useCallback((profileName?: string) => {
    const profile = profileName || currentProfile;
    if (!profile) {
      appendToDebugLog('No profile specified or selected. Cannot load config.');
      return;
    }
    appendToDebugLog(`Attempting to load config for profile: ${profile}`);
    
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      appendToDebugLog(`WebSocket is open. Sending LOAD_CONFIG request for profile: ${profile}`);
      setLoading(true); // Set loading to true before starting config load
      socketRef.current.send(`LOAD_CONFIG:${profile}`);
    } else {
      appendToDebugLog('Cannot load config: WebSocket is not open.');
    }
  }, [currentProfile]);


  const switchProfile = useCallback((profileName: string) => {
    appendToDebugLog(`Switching profile to: ${profileName}`);
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentProfile(profileName);
        lastProfileRef.current = profileName;
        setConfigArray([]);
        
        socketRef.current?.send(`SAVE_LAST_SELECTED_PROFILE:${profileName}`);
        socketRef.current?.send(`SWITCH_PROFILE:${profileName}`);
        
        // End the transition after the content has updated
        setTimeout(() => {
          setIsTransitioning(false);
        }, 50);
      }, 300);
    } else {
      appendToDebugLog('WebSocket is not initialized or ready.');
    }
  }, [appendToDebugLog, setCurrentProfile, setConfigArray]);


  
  const saveConfig = (newConfigArray: KeyBinding[]) => {
    const activeProfile = currentProfile || lastProfileRef.current;
  
    if (!activeProfile) {
      appendToDebugLog('Cannot save config: No current profile selected.');
      return;
    }
  
    if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) {
      appendToDebugLog('WebSocket is not initialized or not ready.');
      return;
    }
  
    const configObject = newConfigArray.reduce((obj, keyBinding) => {
      obj[keyBinding.key] = keyBinding.binding;
      return obj;
    }, {} as { [key: string]: AudioBinding });
  
    try {
      const message = JSON.stringify({
        profile: activeProfile,
        config: configObject,
      });
      appendToDebugLog(`Sending updated config to server: ${message}`);
      socketRef.current.send(`SAVE_CONFIG:${message}`);
      appendToDebugLog('Config sent successfully');
      setConfigArray(newConfigArray);
    } catch (error: unknown) {
      if (error instanceof Error) {
        appendToDebugLog(`Error saving config: ${error.message}`);
      } else {
        appendToDebugLog('Unexpected error saving config.');
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

  const editKeyBind = (id: string, newCombo: string) => {
    appendToDebugLog(`Editing key binding with id ${id} to ${newCombo}`);
  
    // Use currentProfile or fallback to lastProfileRef.current
    const activeProfile = currentProfile || lastProfileRef.current;
    
    if (!activeProfile) {
      appendToDebugLog('Cannot edit binding: No current profile selected.');
      stopListening();  // Stop listening if profile is missing
      return;
    }
  
    const normalizedNewCombo = normalizeKeyCombination(newCombo);
  
    setConfigArray((prevConfig) => {
      if (prevConfig.some((kb) => kb.key === normalizedNewCombo && kb.id !== id)) {
        appendToDebugLog(`Key combination ${normalizedNewCombo} already exists in config.`);
        stopListening();  // Stop listening if the combo already exists
        return prevConfig;
      }
  
      const index = prevConfig.findIndex((kb) => kb.id === id);
      if (index === -1) {
        appendToDebugLog(`Keybinding with id ${id} not found in config.`);
        stopListening();  // Stop listening if no binding is found
        return prevConfig;
      }
  
      const newConfig = [...prevConfig];
      newConfig[index] = { ...newConfig[index], key: normalizedNewCombo };
  
      appendToDebugLog(`Config after editing: ${JSON.stringify(newConfig)}`);
  
      saveConfig(newConfig);  // Save the new configuration
      stopListening();  // Stop the listener after editing
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

  const addNewKeyBind = useCallback(
    (keyCombination: string) => {
      appendToDebugLog(`Attempting to add new key bind: ${keyCombination}`);
      const normalizedCombination = normalizeKeyCombination(keyCombination);
      appendToDebugLog(`Normalized key combination: ${normalizedCombination}`);
  
      // Log the current state of profiles and currentProfile
      appendToDebugLog(`Current profiles: ${JSON.stringify(profiles)}`);
      appendToDebugLog(`Current profile: ${currentProfile}`);
      appendToDebugLog(`Last profile ref: ${lastProfileRef.current}`);
  
      const activeProfile = currentProfile || lastProfileRef.current;
  
      if (!activeProfile) {
        appendToDebugLog('Cannot add new binding: No current profile selected.');
        return;
      }
  
  
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
        saveConfig(newConfig); // Save the new config
        appendToDebugLog(`Key binding ${normalizedCombination} added to config.`);
  
        stopListening(); // Stop listening after adding the binding
        return newConfig;
      });
    },
    [appendToDebugLog, saveConfig, stopListening, currentProfile]
  );
  

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


useEffect(() => {
  if (profiles.length > 0 && !currentProfile) {
    const savedCurrentProfile = profiles.find(profile => profile === "123"); // Or however you want to determine the default profile
    if (savedCurrentProfile) {
      setCurrentProfile(savedCurrentProfile);
      lastProfileRef.current = savedCurrentProfile;
      appendToDebugLog(`Set current profile to saved profile: ${savedCurrentProfile}`);
    } else {
      setCurrentProfile(profiles[0]);
      lastProfileRef.current = profiles[0];
      appendToDebugLog(`Set current profile to first available profile: ${profiles[0]}`);
    }
  }
}, [profiles, currentProfile]);


function startWebSocketConnection() {
  if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      appendToDebugLog('WebSocket already connected');
      return;
  }

  appendToDebugLog('Establishing WebSocket connection...');
  socketRef.current = new WebSocket('ws://localhost:7878');  // Use the correct address

  socketRef.current.onopen = () => {
      appendToDebugLog('Connected to server');
      setIsWebSocketReady(true);
      loadProfiles();
      socketRef.current?.send('GET_LAST_SELECTED_PROFILE');
  };

  socketRef.current.onerror = (error) => {
    appendToDebugLog(`WebSocket Error: ${error}`);
  };

  socketRef.current.onclose = (event) => {
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

    if (data.startsWith('PROFILE_SWITCHED:')) {
      const profileName = data.replace('PROFILE_SWITCHED:', '');
      setCurrentProfile(profileName);  // Update the state
      lastProfileRef.current = profileName;  // Also update the ref for fallback
      appendToDebugLog(`Profile switched to: ${profileName}`);
  }
  
    // Handle configuration message
    if (data.startsWith('CONFIG:')) {
        try {
            // Parse the config data
            const configData = JSON.parse(data.replace('CONFIG:', ''));

            appendToDebugLog(`Parsed config data: ${JSON.stringify(configData)}`);

            // Ensure that `binding` is typed as `AudioBinding`
            const configArray: KeyBinding[] = Object.entries(configData).map(([key, binding]) => ({
                id: uuidv4(),
                key: normalizeKeyCombination(key),
                binding: binding as AudioBinding, // Explicitly cast `binding` to `AudioBinding`
            }));

            appendToDebugLog(`Converted config array: ${JSON.stringify(configArray)}`);

            setConfigArray(configArray); // This should now work correctly
            appendToDebugLog('Config loaded and converted to array successfully');
        } catch (error) {
            appendToDebugLog(`Error parsing CONFIG message: ${error}`);
        }
    }

  // Handle profiles list message
  if (data.startsWith('PROFILES:')) {
    const profilesData = JSON.parse(data.replace('PROFILES:', ''));
    setProfiles(profilesData);
    setIsProfilesLoaded(true);
    appendToDebugLog(`Profiles loaded: ${JSON.stringify(profilesData)}`);
    
    // If there's only one profile, set it as current
    if (profilesData.length === 1 && !currentProfile) {
      setCurrentProfile(profilesData[0]);
      lastProfileRef.current = profilesData[0];
      appendToDebugLog(`Automatically set current profile to: ${profilesData[0]}`);
    }
  }

  // Handle current profile message
  if (data.startsWith('CURRENT_PROFILE:')) {
    const currentProfileName = data.replace('CURRENT_PROFILE:', '').trim();
    if (currentProfileName && currentProfileName !== 'None') {
      setCurrentProfile(currentProfileName);
      lastProfileRef.current = currentProfileName;
      appendToDebugLog(`Current profile set to: ${currentProfileName}`);
    }
  }


    // Handle last selected profile message
    if (data.startsWith('LAST_SELECTED_PROFILE:')) {
      const lastProfile = data.replace('LAST_SELECTED_PROFILE:', '').trim();
      if (lastProfile && lastProfile !== 'None') {
        setCurrentProfile(lastProfile);  // Update state
        lastProfileRef.current = lastProfile;  // Also update the ref for fallback
        appendToDebugLog(`Restored last selected profile: ${lastProfile}`);
        socketRef.current?.send(`SWITCH_PROFILE:${lastProfile}`);  // Switch to the last selected profile
      } else {
        appendToDebugLog('No last selected profile found');
      }
    }

    if (data.startsWith('COMBO:')) {
      const combo = data.replace('COMBO:', '');
      appendToDebugLog(`Processed combo: ${combo}`);
    
      // Ensure correct profile is being used
      const activeProfile = currentProfile || lastProfileRef.current;
    
      if (!activeProfile) {
        appendToDebugLog('Cannot process combo: No current profile selected.');
        stopListening();
        return;
      }
    
      // If listening for a key combo, handle the key binding edit or addition
      if (isListeningForKeyRef.current) {
        if (isEditingRef.current && idBeingEditedRef.current) {
          editKeyBind(idBeingEditedRef.current, combo);  // Use edit logic
        } else {
          addNewKeyBind(combo);  // Use add logic
        }
        stopListening();  // Stop listening after handling the combo
      } else {
        handleCombo(combo);  // Handle the combo if not in key listening mode
      }
    }
    

    if (data.startsWith('PROFILE_CREATED:')) {
      const profileName = data.replace('PROFILE_CREATED:', '');
      setProfiles((prev) => [...prev, profileName]);
      setCurrentProfile(profileName);
      lastProfileRef.current = profileName; // Update the ref as well
      setConfigArray([]); // Clear the bindings for the newly created profile
      appendToDebugLog(`Profile created and switched to: ${profileName}`);
      socketRef.current?.send(`SWITCH_PROFILE:${profileName}`);
      loadConfig(profileName);
    }
    // Handle profile deletion
    if (data.startsWith('PROFILE_DELETED:')) {
        const profileName = data.replace('PROFILE_DELETED:', '');
        setProfiles((prev) => prev.filter((p) => p !== profileName));

        // Automatically switch to another profile if available
        if (currentProfile === profileName) {
            const newProfile = profiles.find((p) => p !== profileName) || null;
            setCurrentProfile(newProfile);

            if (newProfile) {
                socketRef.current?.send(`SWITCH_PROFILE:${newProfile}`);
                setConfigArray([]); // Clear configArray before loading new profile's config
                loadConfig(newProfile); // Pass new profile as argument
            } else {
                setConfigArray([]); // Clear configArray if no profiles left
            }
        }
        appendToDebugLog(`Profile deleted: ${profileName}`);
    }

    // Handle errors
    if (data.startsWith('ERROR:')) {
        const errorMessage = data.replace('ERROR:', '');
        appendToDebugLog(`Error: ${errorMessage}`);
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

  const selectAudioFile = (id: string) => {
    appendToDebugLog(`Attempting to select audio file for id: ${id}`);
    
    if (fileInputRef.current) {
      appendToDebugLog('File input reference is available.');
      
      // Simulate a click on the file input to open the file picker dialog
      fileInputRef.current.click();
  
      // Handle file selection
      fileInputRef.current.onchange = (event) => {
        appendToDebugLog('File input change event triggered.');
        
        const file = (event.target as HTMLInputElement).files?.[0];
        
        if (file) {
          appendToDebugLog(`File selected: ${file.name}`);
  
          // Get the full path to the file using Electron's file.path
          const filePath = (file as any).path;  // Full path of the file in Electron
  
          appendToDebugLog(`File path resolved to: ${filePath}`);
  
          // Update the key binding with the full path
          const keyBinding = configArray.find((kb) => kb.id === id);
          if (keyBinding) {
            // Update the key binding with the full file path
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

  useEffect(() => {
    if (currentProfile && isWebSocketReady) {
      appendToDebugLog(`Loading config for profile: ${currentProfile}`);
  
      const loadConfig = (profileName?: string) => {
        const profile = profileName || currentProfile;
        if (!profile) {
          appendToDebugLog('No profile specified or selected. Cannot load config.');
          return;
        }
        appendToDebugLog(`Attempting to load config for profile: ${profile}`);
        
        if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
          appendToDebugLog(`WebSocket is open. Sending LOAD_CONFIG request for profile: ${profile}`);
          setLoading(true); // Set loading to true before starting config load
          socketRef.current.send(`LOAD_CONFIG:${profile}`);
        } else {
          appendToDebugLog('Cannot load config: WebSocket is not open.');
        }
      };
  
      loadConfig(currentProfile);
    }
  }, [currentProfile, isWebSocketReady]);
  



  const extractFileName = (filePath: string): string => {
    if (!filePath) return '';
    const parts = filePath.split(/[/\\]/); // Split by forward or backslashes
    return parts[parts.length - 1]; // Return the last part
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



  const loadProfiles = () => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      try {
        socketRef.current.send('GET_PROFILES');
        socketRef.current.send('GET_CURRENT_PROFILE'); // Add this line to request the current profile
      } catch (error) {
        appendToDebugLog(`Error loading profiles: ${error}`);
      }
    } else {
      appendToDebugLog('Cannot load profiles: WebSocket is not open.');
    }
  };



  const createProfile = () => {
    setIsCreateProfileModalOpen(true);
  };

  
  const handleCreateProfile = (profileName: string) => {
    if (profileName.trim()) {
      try {
        appendToDebugLog(`Attempting to create profile: ${profileName}`);
        
        socketRef.current?.send(`CREATE_PROFILE:${profileName}`);
        setProfiles((prevProfiles) => [...prevProfiles, profileName]);
        setCurrentProfile(profileName);
        lastProfileRef.current = profileName; // Update the ref as well
        setConfigArray([]); // Initialize with an empty config
        appendToDebugLog(`New profile created: ${profileName}`);
        
        // Ensure the server knows about the new profile
        socketRef.current?.send(`SWITCH_PROFILE:${profileName}`);
        appendToDebugLog(`Switched to new profile: ${profileName}`);
        
        // Initialize with an empty config on the server
        const defaultConfig = {};
        socketRef.current?.send(
          `SAVE_CONFIG:${JSON.stringify({
            profile: profileName,
            config: defaultConfig,
          })}`
        );
        appendToDebugLog(`Saved empty config for new profile: ${profileName}`);
  
        // Force a reload of the config to ensure everything is synchronized
        loadConfig(profileName);
        appendToDebugLog(`Triggered config reload for new profile: ${profileName}`);
  
      } catch (error) {
        console.error("Error creating profile:", error);
        appendToDebugLog(`Error creating profile: ${error}`);
      }
    } else {
      appendToDebugLog("Attempted to create profile with empty name");
    }
  
    // Close the modal regardless of success or error
    setIsCreateProfileModalOpen(false);
  };

  const deleteProfile = () => {
    setIsDeleteModalOpen(true);
  };

  const handleDeleteProfile = () => {
    if (currentProfile) {
      socketRef.current?.send(`DELETE_PROFILE:${currentProfile}`);
      setProfiles((prevProfiles) => prevProfiles.filter((p) => p !== currentProfile));
      
      const newProfile = profiles.find((p) => p !== currentProfile) || null;
      if (newProfile) {
        setCurrentProfile(newProfile);
        setConfigArray([]);
        socketRef.current?.send(`SWITCH_PROFILE:${newProfile}`);
        loadConfig(newProfile);
      } else {
        setCurrentProfile(null);
        setConfigArray([]);
      }
      appendToDebugLog(`Profile '${currentProfile}' deleted successfully`);
    }
    setIsDeleteModalOpen(false);
  };

  const LoadingScreen = () => (
    <div className="loading-screen">
      <div className="loading-content">
        <div className="spinner"></div>
        <p className="loading-message">Loading profiles, please wait...</p>
      </div>
    </div>
  );
// Ensure that WebSocket is ready and profiles are loaded before rendering
  // Ensure that WebSocket is ready and profiles are loaded before rendering
  if (!isWebSocketReady || !isProfilesLoaded) {
    return <LoadingScreen />;
  }



  if (profiles.length === 0) {
    return (
      <div className="main-container">
        <div className="profile-section">
          <div>
            <p>No profiles available. Please create a new profile.</p>
            <button
              className="button"
              onClick={() => setIsCreateProfileModalOpen(true)} // Set modal open state here
            >
              Create Profile
            </button>
          </div>
        </div>

        {/* Render the Modal component */}
        <Modal
        isOpen={isCreateProfileModalOpen}
        onClose={() => setIsCreateProfileModalOpen(false)}
        onSubmit={handleCreateProfile}
        title="Create New Profile"
        submitText="Create"
        cancelText="Cancel"
        inputPlaceholder="Enter profile name"
        showInput={true}
      />
      </div>
    );
  }

  return (
    <div className="main-container">
      {!isWebSocketReady || !isProfilesLoaded ? (
        <div className="spinner-container">
          <div className="spinner-message">Loading profiles, please wait...</div>
          <div className="spinner">🔄</div>
        </div>
      ) : (
        <>
          {!currentProfile ? (
            <div className="profile-section">
              <div>
                <p>No profiles available. Please create a new profile.</p>
                <button className="button" onClick={() => setIsCreateModalOpen(true)}>
                  Create Profile
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="profile-section">
                <div className="profile-select-wrapper">
                  <div>
                    <label htmlFor="profile-select" style={{ marginRight: '10px' }}>
                      Profile:
                    </label>
                    <select
                      id="profile-select"
                      value={currentProfile}
                      onChange={(e) => switchProfile(e.target.value)}
                      className="profile-select"
                    >
                      {profiles.map((profile) => (
                        <option key={profile} value={profile}>
                          {profile}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="profile-buttons">
                    <button className="button" onClick={() => setIsCreateModalOpen(true)}>
                      New Profile
                    </button>
                    <button className="button delete-profile" onClick={() => setIsDeleteModalOpen(true)}>
                      Delete Profile
                    </button>
                  </div>
                </div>
              </div>

          <div className="add-binding-container">
                <button
                  className="button"
                  onClick={addBinding}
                  disabled={isListeningForKey || isEditing}
                >
                  {isListeningForKey ? 'Listening...' : 'Add Binding'}
                </button>
              </div>

              <input
                type="file"
                ref={fileInputRef}
                className="file-input"
                accept="audio/*"
              />

              <div className={`binding-list-fade ${isTransitioning ? 'fade-out' : ''}`}>
                {configArray.map((keyBinding) => (
                  <div key={keyBinding.id} className="binding-card">
                    <button
                      className="delete-button"
                      onClick={() => deleteBinding(keyBinding.id)}
                    >
                      ✖
                    </button>
                    <input
                      type="text"
                      readOnly
                      value={keyBinding.key}
                      className="key-binding-input"
                    />
                    <button
                      className="button"
                      onClick={() => editBinding(keyBinding.id, keyBinding.key)}
                      disabled={isListeningForKey || isEditing}
                    >
                      Edit
                    </button>
                    <select
                      value={keyBinding.binding.track}
                      onChange={(e) =>
                        updateBinding(keyBinding.id, { ...keyBinding.binding, track: e.target.value })
                      }
                      className="track-select"
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
                      value={extractFileName(keyBinding.binding.path)}  // Display the file name only
                      className="key-binding-input"
                    />
                    <button
                      className="button"
                      onClick={() => selectAudioFile(keyBinding.id)}
                    >
                      Audio...
                    </button>

                    <div className="input-wrapper">
                      <span className="volume-icon"><FaVolumeUp /></span>
                      <input
                        type="number"
                        value={keyBinding.binding.volume}
                        onChange={(e) => handleNumberInput(keyBinding.id, 'volume', e.target.value)}
                        className="number-input"
                      />
                      <span className="input-label">dB</span>
                    </div>

                    <div className="input-wrapper">
                      <span className="wave-square-icon"><FaWaveSquare /></span>
                      <input
                        type="number"
                        value={keyBinding.binding.pitch}
                        onChange={(e) => handleNumberInput(keyBinding.id, 'pitch', e.target.value)}
                        min="-12"
                        max="12"
                        step="1"
                        className="number-input"
                      />
                      <span className="input-label">st</span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </>
      )}

      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateProfile}
        title="Create New Profile"
        submitText="Create"
        cancelText="Cancel"
        inputPlaceholder="Enter profile name"
        showInput={true}
      />

      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onSubmit={handleDeleteProfile}
        title={`Delete Profile "${currentProfile}"`}
        submitText="Delete"
        cancelText="Cancel"
        showInput={false}
      />
      <Modal
        isOpen={isCreateProfileModalOpen}
        onClose={() => setIsCreateProfileModalOpen(false)}
        onSubmit={handleCreateProfile}
        title="Create New Profile"
        submitText="Create"
        cancelText="Cancel"
        inputPlaceholder="Enter profile name"
        showInput={true}
      />
    </div>
  );
};



export default Main;