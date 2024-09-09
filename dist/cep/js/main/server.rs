use tokio::net::{TcpListener, TcpStream};
use tokio_tungstenite::tungstenite::Message;
use futures_util::{SinkExt, StreamExt};
use device_query::{DeviceQuery, DeviceState, Keycode};
use std::collections::HashSet;
use std::sync::Arc;
use tokio::sync::{Mutex, broadcast};
use std::env;
use std::fs;
use std::path::PathBuf;
use serde_json::Value;

type WebSocketTx = futures_util::stream::SplitSink<tokio_tungstenite::WebSocketStream<tokio::net::TcpStream>, Message>;
type WebSocketRx = futures_util::stream::SplitStream<tokio_tungstenite::WebSocketStream<tokio::net::TcpStream>>;

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

async fn accept_connection(stream: TcpStream, config: Arc<Mutex<Value>>, tx: broadcast::Sender<String>) {
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
    let config_clone = Arc::clone(&config);

    tokio::spawn(handle_incoming_messages(read, config_clone, write_clone.clone(), tx.clone()));
    tokio::spawn(handle_key_events(device_state, last_keys, write_clone, tx));
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
                let new_config: Value = serde_json::from_str(&config_str).expect("Failed to parse config");

                let mut config_guard = config.lock().await;
                *config_guard = new_config.clone();
                save_config(&config_guard);
                
                // Broadcast the updated config to all clients
                let _ = tx.send(format!("CONFIG:{}", serde_json::to_string(&*config_guard).unwrap()));
            } else if text == "LOAD_CONFIG" {
                let config_guard = config.lock().await;
                let config_str = serde_json::to_string(&*config_guard).expect("Failed to serialize config");

                let mut write_guard = write.lock().await;
                let _ = write_guard.send(Message::Text(format!("CONFIG:{}", config_str))).await;
            }
        }
    }
}

async fn handle_key_events(
    device_state: Arc<DeviceState>,
    last_keys: Arc<Mutex<HashSet<Keycode>>>,
    write: Arc<Mutex<WebSocketTx>>,
    tx: broadcast::Sender<String>,
) {
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
    
                let _ = tx.send(format!("COMBO:{}", combo));

                let mut write_guard = write.lock().await;
                match write_guard.send(Message::Text(format!("COMBO:{}", combo))).await {
                    Ok(_) => println!("Successfully sent combo: {}", combo),
                    Err(e) => {
                        println!("Failed to send combo: {}. Error: {:?}", combo, e);
                        if e.to_string().contains("WebSocket connection is closed") {
                            println!("WebSocket is closed. Unable to send combo.");
                            // You might want to implement a reconnection mechanism here
                        }
                    }
                }
    
                last_keys_guard.clear();
                println!("Cleared last_keys_guard after processing combo.");
                tokio::time::sleep(tokio::time::Duration::from_millis(200)).await;
            }
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