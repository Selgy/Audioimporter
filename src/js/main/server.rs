use tokio::net::{TcpListener, TcpStream};
use tokio_tungstenite::tungstenite::Message;
use futures_util::{SinkExt, StreamExt};
use device_query::{DeviceQuery, DeviceState, Keycode};
use std::collections::HashSet;
use std::sync::Arc;
use tokio::sync::Mutex;

#[tokio::main]
async fn main() {
    let addr = "127.0.0.1:7878";
    let listener = TcpListener::bind(&addr).await.expect("Can't listen");
    println!("Listening on: {}", addr);

    while let Ok((stream, _)) = listener.accept().await {
        tokio::spawn(accept_connection(stream));
    }
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

    let (mut write, _read) = ws_stream.split();
    let device_state = Arc::new(DeviceState::new());
    let last_keys = Arc::new(Mutex::new(HashSet::new())) as Arc<Mutex<HashSet<Keycode>>>;

    loop {
        let keys: HashSet<Keycode> = device_state.get_keys().into_iter().collect();
        let mut last_keys_guard = last_keys.lock().await;

        // Aggregate key presses over time
        if !keys.is_empty() {
            for key in &keys {
                last_keys_guard.insert(key.clone());
            }
        }

        // Process the combo after a short delay
        if keys.is_empty() && !last_keys_guard.is_empty() {
            tokio::time::sleep(tokio::time::Duration::from_millis(20)).await;

            let combo = last_keys_guard
                .iter()
                .map(|k| map_keycode(k))
                .collect::<Vec<String>>()
                .join("+");

            if !combo.is_empty() {
                let message = format!("COMBO:{}", combo);
                write.send(Message::Text(message.clone())).await.unwrap();
                println!("Sent combo: {}", combo);
            }

            last_keys_guard.clear();
        }

        
    
        tokio::time::sleep(tokio::time::Duration::from_millis(200)).await;

    }
    
}
