import { Redirect } from "expo-router";
import { useEffect, useState } from "react";
import { Platform, Text, View } from "react-native";
import { supabase } from "./lib/supabase";

export default function Index() {
  const [isClient, setIsClient] = useState(false);
  const [redirectPath, setRedirectPath] = useState<string>("/login");
  const [isProcessingAuth, setIsProcessingAuth] = useState(false);
  const [baseUrl, setBaseUrl] = useState<string>("");

  useEffect(() => {
    // 클라이언트 사이드임을 표시
    setIsClient(true);

    // 웹에서만 URL 파라미터 및 경로 확인
    if (Platform.OS === "web" && typeof window !== "undefined") {
      const currentPath = window.location.pathname;
      const searchParams = new URLSearchParams(window.location.search);
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const redirectParam = searchParams.get("redirect");

      // GitHub Pages 기본 URL 설정
      const isGitHubPages = currentPath.includes("/easy-to-do/");
      setBaseUrl(isGitHubPages ? "/easy-to-do" : "");

      console.log("Index - Current path:", currentPath);
      console.log("Index - Redirect param:", redirectParam);
      console.log("Index - Hash params:", window.location.hash);
      console.log("Index - Base URL:", isGitHubPages ? "/easy-to-do" : "");

      // 세션 스토리지에서 리다이렉트 정보 확인
      let sessionRedirectPath = "";
      let sessionSearch = "";
      let sessionHash = "";

      try {
        sessionRedirectPath = sessionStorage.getItem("redirect-path") || "";
        sessionSearch = sessionStorage.getItem("redirect-search") || "";
        sessionHash = sessionStorage.getItem("redirect-hash") || "";

        // 사용한 후 제거
        if (sessionRedirectPath) {
          sessionStorage.removeItem("redirect-path");
          sessionStorage.removeItem("redirect-search");
          sessionStorage.removeItem("redirect-hash");
          console.log("Index - Session redirect path:", sessionRedirectPath);
        }
      } catch (e) {
        console.warn("SessionStorage not available:", e);
      }

      // 이메일 인증 토큰 처리
      const accessToken = hashParams.get("access_token");
      const refreshToken = hashParams.get("refresh_token");
      const tokenType = hashParams.get("type");

      if (
        accessToken &&
        refreshToken &&
        (tokenType === "signup" || tokenType === "recovery")
      ) {
        console.log("Index - Processing email verification tokens...");
        setIsProcessingAuth(true);

        // Supabase 세션 설정
        supabase.auth
          .setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          })
          .then(({ data, error }) => {
            if (error) {
              console.error("Session setting error:", error);
              setRedirectPath("/login");
            } else {
              console.log("Email verification successful, redirecting to main");
              setRedirectPath("/(app)/main");
            }
            setIsProcessingAuth(false);

            // URL에서 토큰 제거
            window.history.replaceState(
              {},
              document.title,
              baseUrl + window.location.pathname
            );
          });
        return;
      }

      // 세션 스토리지에서 리다이렉트 정보가 있는 경우 우선 처리
      if (sessionRedirectPath) {
        const path = sessionRedirectPath.replace(baseUrl, "");
        console.log("Index - Using session redirect path:", path);
        setRedirectPath(path);
        return;
      }

      // 리다이렉트 파라미터 처리
      if (redirectParam) {
        const path = redirectParam.replace(baseUrl, "");
        console.log("Index - Using redirect param:", path);
        setRedirectPath(path);
        return;
      }

      // 기본값: 로그인 페이지
      setRedirectPath("/login");
    }
  }, [baseUrl]);

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
          {isProcessingAuth ? "이메일 인증 처리 중..." : "Loading..."}
        </Text>
      </View>
    );
  }

  console.log("Index - Redirecting to:", redirectPath);
  return <Redirect href={redirectPath as any} />;
}
