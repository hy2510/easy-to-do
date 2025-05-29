import { useCallback, useEffect, useState } from "react";
import { Platform, Text, View } from "react-native";
import { supabase } from "./lib/supabase";

export default function Index() {
  const [isClient, setIsClient] = useState(false);
  const [isProcessingAuth, setIsProcessingAuth] = useState(false);
  const [appBaseUrl, setAppBaseUrl] = useState<string>("");

  const determineBaseUrl = useCallback(() => {
    if (typeof window !== "undefined") {
      const path = window.location.pathname;
      if (path.includes("/easy-to-do/")) {
        return "/easy-to-do";
      }
    }
    return "";
  }, []);

  useEffect(() => {
    setIsClient(true);
    const currentBaseUrl = determineBaseUrl();
    setAppBaseUrl(currentBaseUrl);

    if (Platform.OS === "web" && typeof window !== "undefined") {
      const processRouting = async () => {
        const hashParams = new URLSearchParams(
          window.location.hash.substring(1)
        );
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
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          if (error) {
            console.error("Index - Session setting error:", error);
            const loginUrl = window.location.origin + currentBaseUrl + "/login";
            console.log("Index - Redirecting to login:", loginUrl);
            window.location.href = loginUrl;
          } else {
            console.log(
              "Index - Email verification successful, redirecting to main"
            );
            const mainUrl =
              window.location.origin + currentBaseUrl + "/(app)/main";
            console.log("Index - Redirecting to main:", mainUrl);
            window.location.href = mainUrl;
          }
          return;
        }

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
          const finalUrl =
            window.location.origin + sessionPathQuery + sessionHash;
          console.log("Index - Redirecting from session to:", finalUrl);
          window.location.href = finalUrl;
          return;
        }

        if (
          window.location.pathname === currentBaseUrl ||
          window.location.pathname === currentBaseUrl + "/"
        ) {
          const defaultUrl = window.location.origin + currentBaseUrl + "/login";
          console.log("Index - Redirecting to default page:", defaultUrl);
          window.location.href = defaultUrl;
          return;
        }

        // 현재 URL이 이미 올바른 형태라면 그대로 유지
        console.log(
          "Index - Current URL is already correct:",
          window.location.href
        );
      };
      processRouting();
    }
  }, [determineBaseUrl]);

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

  // 로딩이 완료되면 현재 페이지를 그대로 유지 (더 이상 Redirect 사용 안 함)
  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#f5f5f5",
      }}
    >
      <Text style={{ fontSize: 16, color: "#666" }}>페이지 로딩 중...</Text>
    </View>
  );
}
