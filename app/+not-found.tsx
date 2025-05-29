import { Redirect } from "expo-router";
import { useEffect, useState } from "react";
import { Platform, Text, View } from "react-native";

export default function NotFound() {
  const [isClient, setIsClient] = useState(false);
  const [redirectPath, setRedirectPath] = useState<string>("/login");
  const [shouldRedirect, setShouldRedirect] = useState(false);

  useEffect(() => {
    setIsClient(true);

    // 웹에서만 현재 경로 분석
    if (Platform.OS === "web" && typeof window !== "undefined") {
      const currentPath = window.location.pathname;
      console.log("NotFound - Current path:", currentPath);

      // GitHub Pages 서브패스 유지를 위해 전체 URL로 리디렉션
      const currentBaseUrl = currentPath.includes("/easy-to-do/")
        ? "/easy-to-do"
        : "";
      const loginUrl = window.location.origin + currentBaseUrl + "/login";

      console.log("NotFound - Redirecting to login (web):", loginUrl);
      window.location.href = loginUrl;
      return;
    } else {
      // 앱에서는 Expo Router 사용
      setShouldRedirect(true);
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

  // 웹에서는 window.location.href로 이미 처리되므로 로딩 화면 유지
  if (Platform.OS === "web") {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#f5f5f5",
        }}
      >
        <Text style={{ fontSize: 16, color: "#666" }}>
          페이지를 찾을 수 없습니다. 리디렉션 중...
        </Text>
      </View>
    );
  }

  // 앱에서만 Expo Router의 Redirect 사용
  if (shouldRedirect) {
    return <Redirect href={redirectPath as any} />;
  }

  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#f5f5f5",
      }}
    >
      <Text style={{ fontSize: 16, color: "#666" }}>
        페이지를 찾을 수 없습니다.
      </Text>
    </View>
  );
}
