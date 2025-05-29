import { Redirect } from "expo-router";
import { useEffect, useState } from "react";
import { Platform, Text, View } from "react-native";
import { supabase } from "./lib/supabase";

export default function Index() {
  const [isClient, setIsClient] = useState(false);
  const [redirectPath, setRedirectPath] = useState<string>("/login");
  const [isProcessingAuth, setIsProcessingAuth] = useState(false);

  useEffect(() => {
    // 클라이언트 사이드임을 표시
    setIsClient(true);

    // 웹에서만 URL 파라미터 및 경로 확인
    if (Platform.OS === "web" && typeof window !== "undefined") {
      const currentPath = window.location.pathname;
      const searchParams = new URLSearchParams(window.location.search);
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const redirectParam = searchParams.get("redirect");

      console.log("Index - Current path:", currentPath);
      console.log("Index - Redirect param:", redirectParam);
      console.log("Index - Hash params:", window.location.hash);

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
              window.location.pathname
            );
          });
        return;
      }

      // 세션 스토리지에서 리다이렉트 정보가 있는 경우 우선 처리
      if (sessionRedirectPath && sessionRedirectPath !== "/") {
        const targetPath = sessionRedirectPath.startsWith("/")
          ? sessionRedirectPath
          : `/${sessionRedirectPath}`;
        const validPaths = ["/login", "/register", "/(app)/main"];

        if (validPaths.includes(targetPath)) {
          console.log(
            "Index - Redirecting from session storage to:",
            targetPath
          );
          setRedirectPath(targetPath);
          return;
        }
      }

      // GitHub Pages 서브패스 처리
      if (currentPath.includes("/easy-to-do/")) {
        const pathAfterBase = currentPath
          .replace("/easy-to-do/", "")
          .replace("/easy-to-do", "");
        console.log("Index - Path after base:", pathAfterBase);

        if (pathAfterBase && pathAfterBase !== "/") {
          const targetPath = pathAfterBase.startsWith("/")
            ? pathAfterBase
            : `/${pathAfterBase}`;
          const validPaths = ["/login", "/register", "/(app)/main"];

          if (validPaths.includes(targetPath)) {
            setRedirectPath(targetPath);
            return;
          }
        }
      }

      // 리다이렉트 파라미터 처리
      if (redirectParam) {
        const validPaths = ["/login", "/register", "/(app)/main"];
        const targetPath = redirectParam.startsWith("/")
          ? redirectParam
          : `/${redirectParam}`;

        if (validPaths.includes(targetPath)) {
          setRedirectPath(targetPath);
          return;
        }
      }

      // 기본값: 로그인 페이지
      setRedirectPath("/login");
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
          {isProcessingAuth ? "이메일 인증 처리 중..." : "Loading..."}
        </Text>
      </View>
    );
  }

  console.log("Index - Redirecting to:", redirectPath);
  return <Redirect href={redirectPath as any} />;
}
