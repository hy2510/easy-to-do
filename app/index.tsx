import { Redirect } from "expo-router";
import { useEffect, useState } from "react";
import { Platform, Text, View } from "react-native";
import { supabase } from "./lib/supabase";

export default function Index() {
  const [isClient, setIsClient] = useState(false);
  const [redirectPath, setRedirectPath] = useState<string>("/login");
  const [isProcessingAuth, setIsProcessingAuth] = useState(false);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    console.log("Index - useEffect 시작");
    setIsClient(true);

    if (Platform.OS === "web" && typeof window !== "undefined") {
      console.log("Index - 웹 환경에서 라우팅 처리 시작");
      console.log("Index - 현재 URL:", window.location.href);
      console.log("Index - 현재 pathname:", window.location.pathname);
      console.log("Index - 현재 search:", window.location.search);
      console.log("Index - 현재 hash:", window.location.hash);

      const processRouting = async () => {
        try {
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
            console.log("Index - 이메일 인증 토큰 발견, 처리 시작");
            setIsProcessingAuth(true);

            const { error } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });

            if (error) {
              console.error("Index - 세션 설정 오류:", error);
              setRedirectPath("/login");
            } else {
              console.log("Index - 이메일 인증 성공, 메인으로 이동");
              setRedirectPath("/(app)/main");
            }
            setIsProcessingAuth(false);

            // URL에서 토큰 제거
            if (window.history.replaceState) {
              window.history.replaceState(
                {},
                document.title,
                window.location.pathname
              );
            }
            setIsReady(true);
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
                "Index - 세션에서 리다이렉트 정보 발견:",
                sessionPathQuery,
                sessionHash
              );
            }
          } catch (e) {
            console.warn("Index - SessionStorage 사용 불가:", e);
          }

          if (sessionPathQuery) {
            // sessionPathQuery에서 baseUrl 부분 제거하여 앱 내부 경로로 변환
            let appPath = sessionPathQuery;
            console.log("Index - 원본 세션 경로:", appPath);

            if (appPath.startsWith("/easy-to-do/")) {
              appPath = appPath.substring("/easy-to-do".length);
              console.log("Index - baseUrl 제거 후:", appPath);
            }
            if (!appPath.startsWith("/")) {
              appPath = "/" + appPath;
            }
            if (appPath === "/") {
              appPath = "/login";
            }

            console.log("Index - 최종 앱 경로:", appPath);
            setRedirectPath(appPath + sessionHash);
            setIsReady(true);
            return;
          }

          // 현재 경로 분석
          const currentPath = window.location.pathname;
          console.log("Index - 현재 경로 분석:", currentPath);

          // baseUrl로 시작하는 경우 앱 경로 추출
          if (currentPath.startsWith("/easy-to-do/")) {
            const appPath = currentPath.substring("/easy-to-do".length) || "/";
            console.log("Index - baseUrl 제거된 앱 경로:", appPath);

            if (appPath === "/" || appPath === "") {
              setRedirectPath("/login");
            } else {
              setRedirectPath(appPath);
            }
          } else {
            // baseUrl로 시작하지 않는 경우 기본 로그인
            console.log("Index - baseUrl로 시작하지 않음, 로그인으로 이동");
            setRedirectPath("/login");
          }

          setIsReady(true);
        } catch (error) {
          console.error("Index - 라우팅 처리 중 오류:", error);
          setRedirectPath("/login");
          setIsReady(true);
        }
      };

      processRouting();
    } else {
      // 웹이 아닌 경우 (앱)
      console.log("Index - 앱 환경, 기본 로그인으로 이동");
      setRedirectPath("/login");
      setIsReady(true);
    }
  }, []);

  console.log("Index - 현재 상태:", {
    isClient,
    isProcessingAuth,
    isReady,
    redirectPath,
  });

  // 클라이언트가 준비되지 않았거나 인증 처리 중이거나 준비되지 않았으면 로딩 화면 표시
  if (!isClient || isProcessingAuth || !isReady) {
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
        <Text style={{ fontSize: 12, color: "#999", marginTop: 10 }}>
          디버그: isClient={isClient.toString()}, isProcessingAuth=
          {isProcessingAuth.toString()}, isReady={isReady.toString()}
        </Text>
      </View>
    );
  }

  console.log("Index - 리다이렉트 실행:", redirectPath);
  return <Redirect href={redirectPath as any} />;
}
