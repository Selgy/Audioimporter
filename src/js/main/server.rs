use tokio::net::{TcpListener, TcpStream};
use tokio_tungstenite::tungstenite::Message;
use futures_util::{SinkExt, StreamExt};
use device_query::{DeviceQuery, DeviceState, Keycode};
use std::collections::HashSet;
use std::sync::Arc;
use tokio::sync::{Mutex};
use std::env;
use std::fs;
use std::path::PathBuf;
use serde_json::Value;

#[tokio::main]
async fn main() {
    let addr = "127.0.0.1:7878";
    let listener = TcpListener::bind(&addr).await.expect("Can't listen");
    println!("Listening on: {}", addr);

    while let Ok((stream, _)) = listener.accept().await {
        tokio::spawn(accept_connection(stream));
    }
}

fn get_config_path() -> PathBuf {
    let appdata_dir = env::var("APPDATA").expect("Failed to get APPDATA environment variable");
    let config_path = PathBuf::from(appdata_dir).join("MyApp").join("config.json");

    // Ensure the directory exists
    fs::create_dir_all(config_path.parent().unwrap()).expect("Failed to create config directory");

    config_path
}

fn load_config() -> Value {
    let config_path = get_config_path();
    let config_data = fs::read_to_string(config_path).unwrap_or_else(|_| "{}".to_string());

    serde_json::from_str(&config_data).expect("Failed to parse config JSON")
}

fn save_config(config: &Value) {
    let config_path = get_config_path();
    let config_data = serde_json::to_string_pretty(config).expect("Failed to serialize config JSON");

    fs::write(config_path, config_data).expect("Failed to write config file");
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
        "ControlLeft" => "LCtrl".to_string(),
        "ControlRight" => "RCtrl".to_string(),
        "AltLeft" => "LAlt".to_string(),
        "AltRight" => "RAlt".to_string(),
        "ShiftLeft" => "LShift".to_string(),
        "ShiftRight" => "RShift".to_string(),
        "MetaLeft" => "LCommand".to_string(),
        "MetaRight" => "RCommand".to_string(),
        _ => format!("{:?}", key),
    }
}

async fn accept_connection(stream: TcpStream) {
    let addr = stream.peer_addr().expect("Connected streams should have a peer address");
    println!("New WebSocket connection: {}", addr);

    let ws_stream = tokio_tungstenite::accept_async(stream)
        .await
        .expect("Error during the websocket handshake occurred");

    let (write, mut read) = ws_stream.split();
    let write = Arc::new(Mutex::new(write));  // Wrap `write` in `Arc<Mutex<_>>`
    let device_state = Arc::new(DeviceState::new());
    let last_keys = Arc::new(Mutex::new(HashSet::new())) as Arc<Mutex<HashSet<Keycode>>>;

    let config = Arc::new(Mutex::new(load_config()));

    let write_clone = Arc::clone(&write);
    let config_clone = Arc::clone(&config);

    tokio::spawn(async move {
        while let Some(message) = read.next().await {
            let message = message.expect("Failed to read message");

            if let Message::Text(text) = message {
                if text.starts_with("SAVE_CONFIG:") {
                    let config_str = text.replace("SAVE_CONFIG:", "");
                    let new_config: Value = serde_json::from_str(&config_str).expect("Failed to parse config");

                    let mut config_guard = config_clone.lock().await;
                    *config_guard = new_config;
                    save_config(&config_guard);
                } else if text == "LOAD_CONFIG" {
                    let config_guard = config_clone.lock().await;
                    let config_str = serde_json::to_string(&*config_guard).expect("Failed to serialize config");

                    let mut write_guard = write_clone.lock().await;
                    write_guard.send(Message::Text(format!("CONFIG:{}", config_str))).await.expect("Failed to send config");
                }
            }
        }
    });

    loop {
        let keys: HashSet<Keycode> = device_state.get_keys().into_iter().collect();
        let mut last_keys_guard = last_keys.lock().await;
    
        if !keys.is_empty() {
            for key in &keys {
                println!("Key detected: {:?}", key);
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
                println!("Combo detected: {}", combo);
    
                let mut write_guard = write.lock().await;
                match write_guard.send(Message::Text(format!("COMBO:{}", combo))).await {
                    Ok(_) => println!("Successfully sent combo: {}", combo),
                    Err(e) => println!("Failed to send combo: {}. Error: {:?}", combo, e),
                }
    
                last_keys_guard.clear();
                println!("Cleared last_keys_guard after processing combo.");
                tokio::time::sleep(tokio::time::Duration::from_millis(200)).await;
            }
        }
    
        tokio::time::sleep(tokio::time::Duration::from_millis(50)).await;
    }
}