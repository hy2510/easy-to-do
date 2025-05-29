import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Calendar from "../components/Calendar";
import { supabase, UserProfile } from "../lib/supabase";

export default function MainScreen() {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const navigateToLogin = () => {
    // 플랫폼별 라우팅 처리
    if (Platform.OS === "web") {
      // 웹에서는 GitHub Pages 서브패스 유지를 위해 전체 URL 사용
      const currentBaseUrl = window.location.pathname.includes("/easy-to-do/")
        ? "/easy-to-do"
        : "";
      const loginUrl = window.location.origin + currentBaseUrl + "/login";
      console.log("Main - Redirecting to login (web):", loginUrl);
      window.location.href = loginUrl;
    } else {
      // 앱에서는 기존 Expo Router 사용
      router.replace("/login");
    }
  };

  const fetchUserProfile = async () => {
    try {
      setLoading(true);

      // Supabase 연결 확인
      console.log("Supabase 연결 시도 중...");

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        navigateToLogin();
        return;
      }

      // 먼저 profiles 테이블에서 사용자 정보 조회
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (error || !data) {
        // profiles 테이블에서 정보를 가져올 수 없으면 메타데이터 사용
        console.log(
          "프로필 테이블에서 정보를 가져올 수 없음, 메타데이터 사용:",
          error?.message
        );
        const userProfile: UserProfile = {
          id: user.id,
          email: user.email || "",
          name: user.user_metadata?.name || "사용자",
          created_at: user.created_at || "",
        };
        setUserProfile(userProfile);
      } else {
        setUserProfile(data);
      }
    } catch (error) {
      console.error("사용자 정보 로드 오류:", error);
      Alert.alert("오류", "사용자 정보를 불러오는 중 문제가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();

      if (error) {
        Alert.alert("오류", "로그아웃하는데 실패했습니다.");
        return;
      }

      navigateToLogin();
    } catch (error) {
      Alert.alert("오류", "로그아웃 중 문제가 발생했습니다.");
    }
  };

  useEffect(() => {
    fetchUserProfile();
  }, []);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>사용자 정보를 불러오는 중...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Calendar
        userName={userProfile?.name || "사용자"}
        onLogout={handleLogout}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#666",
  },
});
