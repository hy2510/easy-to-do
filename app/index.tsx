import { Redirect } from "expo-router";
import { useEffect, useState } from "react";
import { Platform, Text, View } from "react-native";

export default function Index() {
  const [isClient, setIsClient] = useState(false);
  const [redirectPath, setRedirectPath] = useState<string>("/login");

  useEffect(() => {
    // 클라이언트 사이드임을 표시
    setIsClient(true);

    // 웹에서만 URL 파라미터 확인
    if (Platform.OS === "web" && typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      const redirect = urlParams.get("redirect");

      if (redirect) {
        // 알려진 경로들만 허용
        const validPaths = ["/login", "/register", "/(app)/main"];
        const targetPath = redirect.startsWith("/") ? redirect : `/${redirect}`;

        if (validPaths.includes(targetPath)) {
          setRedirectPath(targetPath);
        } else {
          // 알 수 없는 경로는 로그인으로 리다이렉트
          setRedirectPath("/login");
        }
      }
    }
  }, []);

  // 클라이언트가 준비되지 않았으면 로딩 화면 표시
  if (!isClient) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#f5f5f5",
        }}
      >
        <Text style={{ fontSize: 16, color: "#666" }}>Loading...</Text>
      </View>
    );
  }

  return <Redirect href={redirectPath as any} />;
}
