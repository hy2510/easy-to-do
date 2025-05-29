import { Redirect } from "expo-router";
import { useEffect, useState } from "react";
import { Platform, Text, View } from "react-native";

export default function NotFound() {
  const [isClient, setIsClient] = useState(false);
  const [redirectPath, setRedirectPath] = useState<string>("/login");

  useEffect(() => {
    setIsClient(true);

    // 웹에서만 현재 경로 분석
    if (Platform.OS === "web" && typeof window !== "undefined") {
      const currentPath = window.location.pathname;
      console.log("NotFound - Current path:", currentPath);

      // 기본값: 로그인 페이지
      console.log("NotFound - Redirecting to default: /login");
      setRedirectPath("/login");
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
