// React Native에서 ws 패키지를 차단하기 위한 빈 polyfill
// Supabase realtime은 React Native에서 자동으로 비활성화됩니다.

class WebSocketPolyfill {
  constructor() {
    console.warn(
      "WebSocket polyfill: ws 패키지는 React Native에서 사용할 수 없습니다."
    );
  }
}

module.exports = WebSocketPolyfill;
module.exports.WebSocket = WebSocketPolyfill;
module.exports.default = WebSocketPolyfill;
