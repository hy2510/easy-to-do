import { Redirect } from "expo-router";
import { useEffect, useState } from "react";
import { Platform, Text, View } from "react-native";
import { supabase } from "./lib/supabase";

export default function Index() {
  const [isClient, setIsClient] = useState(false);
  const [redirectPath, setRedirectPath] = useState<string>("/login");
  const [isProcessingAuth, setIsProcessingAuth] = useState(false);

  useEffect(() => {
    setIsClient(true);

    if (Platform.OS === "web" && typeof window !== "undefined") {
      const processRouting = async () => {
        const hashParams = new URLSearchParams(
          window.location.hash.substring(1)
        );
        const accessToken = hashParams.get("access_token");
        const refreshToken = hashParams.get("refresh_token");
        const tokenType = hashParams.get("type");

        // 이메일 인증 토큰 처리
        if (
          accessToken &&
          refreshToken &&
          (tokenType === "signup" || tokenType === "recovery")
        ) {
          console.log("Index - Processing email verification tokens...");
          setIsProcessingAuth(true);

          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (error) {
            console.error("Index - Session setting error:", error);
            setRedirectPath("/login");
          } else {
            console.log(
              "Index - Email verification successful, redirecting to main"
            );
            setRedirectPath("/(app)/main");
          }
          setIsProcessingAuth(false);

          // URL에서 토큰 제거 (상대 경로로)
          if (window.history.replaceState) {
            window.history.replaceState(
              {},
              document.title,
              window.location.pathname
            );
          }
          return;
        }

        // 세션 스토리지에서 리다이렉트 정보 확인
        let sessionPathQuery = "";
        let sessionHash = "";
        try {
          sessionPathQuery =
            sessionStorage.getItem("redirect-path-query") || "";
          sessionHash = sessionStorage.getItem("redirect-hash") || "";
          if (sessionPathQuery) {
            sessionStorage.removeItem("redirect-path-query");
            sessionStorage.removeItem("redirect-hash");
            console.log(
              "Index - Session redirect path+query:",
              sessionPathQuery
            );
            console.log("Index - Session redirect hash:", sessionHash);
          }
        } catch (e) {
          console.warn("Index - SessionStorage not available:", e);
        }

        if (sessionPathQuery) {
          // sessionPathQuery에서 baseUrl 부분 제거하여 앱 내부 경로로 변환
          let appPath = sessionPathQuery;
          if (appPath.startsWith("/easy-to-do/")) {
            appPath = appPath.substring("/easy-to-do".length);
          }
          if (!appPath.startsWith("/")) {
            appPath = "/" + appPath;
          }

          console.log("Index - Redirecting from session to app path:", appPath);
          setRedirectPath(appPath + sessionHash);
          return;
        }

        // 기본값: 로그인 페이지
        console.log("Index - Using default login page");
        setRedirectPath("/login");
      };

      processRouting();
    }
  }, []);

  // 클라이언트가 준비되지 않았거나 인증 처리 중이면 로딩 화면 표시
  if (!isClient || isProcessingAuth) {
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
          {isProcessingAuth ? "이메일 인증 처리 중..." : "페이지 로딩 중..."}
        </Text>
      </View>
    );
  }

  console.log("Index - Final redirect path:", redirectPath);
  return <Redirect href={redirectPath as any} />;
}
