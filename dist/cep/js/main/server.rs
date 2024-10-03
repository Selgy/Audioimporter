use tokio::net::{TcpListener, TcpStream};
use tokio_tungstenite::tungstenite::Message;
use futures_util::{SinkExt, StreamExt};
use device_query::{DeviceQuery, DeviceState, Keycode};
use std::collections::{HashMap, HashSet};
use std::sync::Arc;
use tokio::sync::{Mutex, broadcast};
use std::env;
use std::fs;
use std::path::PathBuf;
use serde_json::Value;

type WebSocketTx = futures_util::stream::SplitSink<
    tokio_tungstenite::WebSocketStream<tokio::net::TcpStream>,
    Message,
>;
type WebSocketRx = futures_util::stream::SplitStream<
    tokio_tungstenite::WebSocketStream<tokio::net::TcpStream>,
>;

#[tokio::main]
async fn main() {
    let addr = "127.0.0.1:7878";
    let listener = TcpListener::bind(&addr).await.expect("Can't listen");
    println!("Listening on: {}", addr);

    let config = Arc::new(Mutex::new(load_config()));
    let (tx, _rx) = broadcast::channel(100);

    while let Ok((stream, _)) = listener.accept().await {
        let config_clone = Arc::clone(&config);
        let tx_clone = tx.clone();
        tokio::spawn(accept_connection(stream, config_clone, tx_clone));
    }
}

async fn accept_connection(
    stream: TcpStream,
    config_clone: Arc<Mutex<Value>>,
    tx: broadcast::Sender<String>,
) {
    let addr = stream.peer_addr().expect("Connected streams should have a peer address");
    println!("New WebSocket connection: {}", addr);

    let ws_stream = tokio_tungstenite::accept_async(stream)
        .await
        .expect("Error during the websocket handshake occurred");

    let (write, read) = ws_stream.split();
    let write = Arc::new(Mutex::new(write));
    let device_state = Arc::new(DeviceState::new());
    let last_keys = Arc::new(Mutex::new(HashSet::new()));

    let write_clone = Arc::clone(&write);

    // Clone `config_clone` when passing to functions
    tokio::spawn(handle_incoming_messages(
        read,
        config_clone.clone(),
        write_clone.clone(),
        tx.clone(),
    ));

    tokio::spawn(handle_key_events(
        device_state,
        last_keys,
        write_clone,
        tx,
        config_clone.clone(),
    ));
}


async fn handle_delete_profile(
    profile_name: String,
    config: Arc<Mutex<Value>>,
    write: Arc<Mutex<WebSocketTx>>
) {
    // Lock the config to modify it
    let mut config_guard = config.lock().await;

    // Check if the profile exists in the configuration
    if config_guard["profiles"].get(&profile_name).is_some() {
        // Remove the profile from the configuration
        config_guard["profiles"].as_object_mut().unwrap().remove(&profile_name);

        // If the deleted profile was the current profile, reset currentProfile
        if config_guard["currentProfile"].as_str() == Some(&profile_name) {
            config_guard["currentProfile"] = Value::Null;
        }

        // Save the updated configuration
        save_config(&config_guard);

        // Send a message back to the client indicating the profile was deleted
        let mut write_guard = write.lock().await;
        let _ = write_guard
            .send(Message::Text(format!("PROFILE_DELETED:{}", profile_name)))
            .await;
    } else {
        // If the profile does not exist, send an error message back to the client
        let mut write_guard = write.lock().await;
        let _ = write_guard
            .send(Message::Text(format!("ERROR:Profile '{}' does not exist", profile_name)))
            .await;
    }
}



async fn handle_incoming_messages(
    mut read: WebSocketRx,
    config: Arc<Mutex<Value>>,
    write: Arc<Mutex<WebSocketTx>>,
    tx: broadcast::Sender<String>,
) {
    while let Some(message) = read.next().await {
        let message = message.expect("Failed to read message");

        if let Message::Text(text) = message {
            if text.starts_with("SAVE_CONFIG:") {
                let config_str = text.replace("SAVE_CONFIG:", "");
                let parsed_message: serde_json::Value =
                    serde_json::from_str(&config_str).expect("Failed to parse config");

                let profile_name = parsed_message["profile"]
                    .as_str()
                    .expect("Profile name is missing")
                    .to_string();
                let new_keybindings = &parsed_message["config"];

                let mut config_guard = config.lock().await;

                if !config_guard["profiles"].is_object() {
                    config_guard["profiles"] = serde_json::json!({});
                }

                config_guard["profiles"][profile_name.clone()] = new_keybindings.clone();

                if !config_guard["currentProfile"].is_string() {
                    config_guard["currentProfile"] = serde_json::Value::String(profile_name.clone());
                }

                save_config(&config_guard);
            } 
            // Handle profile deletion
            else if text.starts_with("DELETE_PROFILE:") {
                // Extract profile name from the message
                let profile_name = text.replace("DELETE_PROFILE:", "");
                
                // Call the `handle_delete_profile` function to delete the profile
                handle_delete_profile(profile_name, Arc::clone(&config), Arc::clone(&write)).await;
            }
            // Handle loading the configuration
            else if text.starts_with("LOAD_CONFIG:") {
                let profile_name = text.replace("LOAD_CONFIG:", "");
                let config_guard = config.lock().await;
                if let Some(keybindings) = config_guard["profiles"].get(&profile_name) {
                    let config_str = serde_json::to_string(keybindings).expect("Failed to serialize config");
                    let mut write_guard = write.lock().await;
                    let _ = write_guard
                        .send(Message::Text(format!("CONFIG:{}", config_str)))
                        .await;
                } else {
                    let mut write_guard = write.lock().await;
                    let _ = write_guard
                        .send(Message::Text(format!(
                            "ERROR:Profile '{}' does not exist or has no configuration",
                            profile_name
                        )))
                        .await;
                }
            }
            // Handle saving the last selected profile
            else if text.starts_with("SAVE_LAST_SELECTED_PROFILE:") {
                let profile_name = text.replace("SAVE_LAST_SELECTED_PROFILE:", "");
                let mut config_guard = config.lock().await;
                
                // Save the last selected profile
                config_guard["lastSelectedProfile"] = serde_json::Value::String(profile_name.clone());
                
                // Also update currentProfile if it exists
                if config_guard["profiles"][&profile_name].is_object() {
                    config_guard["currentProfile"] = serde_json::Value::String(profile_name.clone());
                }
                
                save_config(&config_guard);
            }

            // Handle requesting the last selected profile
            else if text == "GET_LAST_SELECTED_PROFILE" {
                let config_guard = config.lock().await;
                if let Some(last_profile) = config_guard["lastSelectedProfile"].as_str() {
                    let mut write_guard = write.lock().await;
                    let _ = write_guard
                        .send(Message::Text(format!("LAST_SELECTED_PROFILE:{}", last_profile)))
                        .await;
                } else {
                    let mut write_guard = write.lock().await;
                    let _ = write_guard
                        .send(Message::Text("LAST_SELECTED_PROFILE:None".to_string()))
                        .await;
                }
            } 
            // Handle getting profiles
            else if text == "GET_PROFILES" {
                let config_guard = config.lock().await;
                let profiles = config_guard["profiles"]
                    .as_object()
                    .unwrap_or(&serde_json::Map::new())
                    .keys()
                    .cloned()
                    .collect::<Vec<_>>();
                let profiles_str =
                    serde_json::to_string(&profiles).expect("Failed to serialize profiles");

                let mut write_guard = write.lock().await;
                let _ = write_guard
                    .send(Message::Text(format!("PROFILES:{}", profiles_str)))
                    .await;
            }
            else if text.starts_with("SWITCH_PROFILE:") {
                let profile_name = text.replace("SWITCH_PROFILE:", "");
                let mut config_guard = config.lock().await;
            
                if config_guard["profiles"][&profile_name].is_object() {
                    config_guard["currentProfile"] = serde_json::Value::String(profile_name.clone());
            
                    save_config(&config_guard);
            
                    let mut write_guard = write.lock().await;
                    
                    // Send PROFILE_SWITCHED message first
                    let _ = write_guard
                        .send(Message::Text(format!("PROFILE_SWITCHED:{}", profile_name)))
                        .await;
            
                    // Then send the CONFIG message
                    let keybindings = config_guard["profiles"][&profile_name].clone();
                    let config_str = serde_json::to_string(&keybindings).expect("Failed to serialize config");
                    let _ = write_guard
                        .send(Message::Text(format!("CONFIG:{}", config_str)))
                        .await;
                } else {
                    let mut write_guard = write.lock().await;
                    let _ = write_guard
                        .send(Message::Text(format!(
                            "ERROR:Profile '{}' does not exist",
                            profile_name
                        )))
                        .await;
                }
            }
        }
    }
}


async fn handle_key_events(
    device_state: Arc<DeviceState>,
    last_keys: Arc<Mutex<HashSet<Keycode>>>,
    write: Arc<Mutex<WebSocketTx>>,
    tx: broadcast::Sender<String>,
    _config: Arc<Mutex<Value>>, // Config is not needed here for now
) {
    loop {
        let keys: HashSet<Keycode> = device_state.get_keys().into_iter().collect();
        let mut last_keys_guard = last_keys.lock().await;

        if !keys.is_empty() {
            for key in &keys {
                last_keys_guard.insert(key.clone());
            }
        }

        if keys.is_empty() && !last_keys_guard.is_empty() {
            let combo = last_keys_guard
                .iter()
                .map(|k| map_keycode(k))
                .collect::<Vec<String>>()
                .join("+");

            if !combo.is_empty() {
                let normalized_combo = normalize_key_combination(&combo);

                println!("Detected key combination: {}", normalized_combo);

                // Always send the combo to the client
                let _ = tx.send(format!("COMBO:{}", normalized_combo));

                let mut write_guard = write.lock().await;
                let _ = write_guard
                    .send(Message::Text(format!("COMBO:{}", normalized_combo)))
                    .await;
            }

            last_keys_guard.clear();
            tokio::time::sleep(tokio::time::Duration::from_millis(200)).await;
        }

        tokio::time::sleep(tokio::time::Duration::from_millis(50)).await;
    }
}

fn get_config_path() -> PathBuf {
    let appdata_dir = env::var("APPDATA").expect("Failed to get APPDATA environment variable");
    let config_path = PathBuf::from(appdata_dir).join("AudioImporter").join("config.json");

    // Ensure the directory exists
    fs::create_dir_all(config_path.parent().unwrap()).expect("Failed to create config directory");

    config_path
}

fn load_config() -> Value {
    let config_path = get_config_path();
    let config_data = fs::read_to_string(&config_path).unwrap_or_else(|_| "{}".to_string());

    let mut config: Value =
        serde_json::from_str(&config_data).expect("Failed to parse config JSON");

    // Ensure the config has profiles and currentProfile
    if !config["profiles"].is_object() {
        config["profiles"] = serde_json::json!({}); // Initialize as empty object
    }
    if !config["currentProfile"].is_string() {
        config["currentProfile"] = Value::Null; // Set to null
    }

    config
}

fn save_config(config: &Value) {
    let config_path = get_config_path();
    let config_data =
        serde_json::to_string_pretty(config).expect("Failed to serialize config JSON");

    fs::write(config_path, config_data).expect("Failed to write config file");
}

fn normalize_key_combination(key_combination: &str) -> String {
    let key_map = HashMap::from([
        ("LAlt", "Alt"),
        ("RAlt", "Alt"),
        ("LControl", "Ctrl"),
        ("RControl", "Ctrl"),
        ("ControlLeft", "Ctrl"),
        ("ControlRight", "Ctrl"),
        ("Numpad1", "1"),
        ("Numpad2", "2"),
        ("Numpad3", "3"),
        ("Numpad4", "4"),
        ("Numpad5", "5"),
        ("Numpad6", "6"),
        ("Numpad7", "7"),
        ("Numpad8", "8"),
        ("Numpad9", "9"),
        ("Numpad0", "0"),
        // Add more key mappings as needed
    ]);

    let priority = vec!["ctrl", "shift", "alt"];

    let mut mapped_keys: Vec<String> = key_combination
        .split('+')
        .map(|key| key_map.get(key).unwrap_or(&key).to_lowercase())
        .collect();

    mapped_keys.sort_by(|a, b| {
        let a_index = priority.iter().position(|x| x == a).unwrap_or(usize::MAX);
        let b_index = priority.iter().position(|x| x == b).unwrap_or(usize::MAX);

        if a_index == b_index {
            a.cmp(b)
        } else {
            a_index.cmp(&b_index)
        }
    });

    mapped_keys.join("+")
}

fn map_keycode(key: &Keycode) -> String {
    match format!("{:?}", key).as_str() {
        "Key1" => "1".to_string(),
        "Key2" => "2".to_string(),
        "Key3" => "3".to_string(),
        "Key4" => "4".to_string(),
        "Key5" => "5".to_string(),
        "Key6" => "6".to_string(),
        "Key7" => "7".to_string(),
        "Key8" => "8".to_string(),
        "Key9" => "9".to_string(),
        "Key0" => "0".to_string(),
        "Numpad0" => "Numpad0".to_string(),
        "Numpad1" => "Numpad1".to_string(),
        "Numpad2" => "Numpad2".to_string(),
        "Numpad3" => "Numpad3".to_string(),
        "Numpad4" => "Numpad4".to_string(),
        "Numpad5" => "Numpad5".to_string(),
        "Numpad6" => "Numpad6".to_string(),
        "Numpad7" => "Numpad7".to_string(),
        "Numpad8" => "Numpad8".to_string(),
        "Numpad9" => "Numpad9".to_string(),
        "F1" => "F1".to_string(),
        "F2" => "F2".to_string(),
        "F3" => "F3".to_string(),
        "F4" => "F4".to_string(),
        "F5" => "F5".to_string(),
        "F6" => "F6".to_string(),
        "F7" => "F7".to_string(),
        "F8" => "F8".to_string(),
        "F9" => "F9".to_string(),
        "F10" => "F10".to_string(),
        "F11" => "F11".to_string(),
        "F12" => "F12".to_string(),
        "NumpadSlash" => "NumpadDivide".to_string(),
        "NumpadAsterisk" => "NumpadMultiply".to_string(),
        "NumpadMinus" => "NumpadSubtract".to_string(),
        "NumpadPlus" => "NumpadAdd".to_string(),
        "NumpadEnter" => "NumpadEnter".to_string(),
        "NumpadDot" => "NumpadDecimal".to_string(),
        "ControlLeft" => "LControl".to_string(),
        "ControlRight" => "RControl".to_string(),
        "AltLeft" => "LAlt".to_string(),
        "AltRight" => "RAlt".to_string(),
        "ShiftLeft" => "LShift".to_string(),
        "ShiftRight" => "RShift".to_string(),
        "MetaLeft" => "LCommand".to_string(),
        "MetaRight" => "RCommand".to_string(),
        _ => format!("{:?}", key),
    }
}
