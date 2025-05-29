import { router } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { supabase } from "./lib/supabase";

// 웹과 모바일에서 모두 작동하는 Alert 함수
const showAlert = (title: string, message: string, onPress?: () => void) => {
  if (Platform.OS === "web") {
    // 웹에서는 클라이언트 사이드에서만 window.alert 사용
    if (typeof window !== "undefined") {
      window.alert(`${title}\n\n${message}`);
    }
    if (onPress) onPress();
  } else {
    // 모바일에서는 React Native Alert 사용
    if (onPress) {
      Alert.alert(title, message, [{ text: "확인", onPress }]);
    } else {
      Alert.alert(title, message);
    }
  }
};

export default function RegisterScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleRegister = async () => {
    if (loading) return;

    try {
      setLoading(true);
      setErrorMessage(""); // 이전 오류 메시지 초기화

      if (!email || !password || !name) {
        setErrorMessage("모든 필드를 입력해주세요.");
        showAlert("오류", "모든 필드를 입력해주세요.");
        return;
      }

      if (password !== confirmPassword) {
        setErrorMessage("비밀번호가 일치하지 않습니다.");
        showAlert("오류", "비밀번호가 일치하지 않습니다.");
        return;
      }

      // 회원가입 시도 (Supabase가 자동으로 중복 체크)
      console.log("회원가입 시도 중...", email);
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: name,
          },
          emailRedirectTo: undefined, // 이메일 리다이렉트 비활성화
        },
      });

      console.log("회원가입 응답:", { authData, authError });

      if (authError) {
        console.log("회원가입 오류:", authError);

        // 이메일 중복 오류 처리 (다양한 패턴 포함)
        const errorMessage = authError.message.toLowerCase();
        if (
          errorMessage.includes("already registered") ||
          errorMessage.includes("already been registered") ||
          errorMessage.includes("user already registered") ||
          errorMessage.includes("email already exists") ||
          errorMessage.includes("duplicate") ||
          errorMessage.includes("email address not authorized") ||
          authError.status === 422
        ) {
          const message =
            "이미 가입된 이메일 주소입니다. 다른 이메일을 사용해주세요.";
          setErrorMessage(message);
          showAlert("회원가입 실패", message);
          return;
        }

        // 기타 오류 처리
        setErrorMessage(authError.message);
        showAlert("회원가입 실패", authError.message);
        return;
      }

      // 회원가입 성공했지만 사용자가 없는 경우 (드물지만 오류 상황)
      if (!authData?.user) {
        const message =
          "회원가입 처리 중 오류가 발생했습니다. 다시 시도해주세요.";
        setErrorMessage(message);
        showAlert("회원가입 실패", message);
        return;
      }

      // 사용자는 생성되었지만 세션이 없는 경우 (이메일 인증 필요)
      if (authData.user && !authData.session) {
        console.log("이메일 인증이 필요한 새 사용자 생성됨");

        // 이메일 인증이 필요한 경우
        const message = `${email}로 인증 이메일을 발송했습니다. 이메일을 확인하고 인증을 완료해주세요.`;
        setErrorMessage("");
        showAlert("인증 이메일 발송", message, () => {
          // 플랫폼별 라우팅 처리
          if (Platform.OS === "web") {
            // 웹에서는 GitHub Pages 서브패스 유지를 위해 전체 URL 사용
            const currentBaseUrl = window.location.pathname.includes(
              "/easy-to-do/"
            )
              ? "/easy-to-do"
              : "";
            const loginUrl = window.location.origin + currentBaseUrl + "/login";
            console.log("Register - Redirecting to login (web):", loginUrl);
            window.location.href = loginUrl;
          } else {
            // 앱에서는 기존 Expo Router 사용
            router.replace("/login");
          }
        });
        return;
      }

      if (authData?.user && authData?.session) {
        console.log("새 사용자 생성 및 자동 로그인 성공");

        // 사용자 프로필 정보 저장
        try {
          const { error: profileError } = await supabase
            .from("profiles")
            .insert([
              {
                id: authData.user.id,
                email: email,
                name: name,
              },
            ]);

          if (profileError) {
            console.log(
              "프로필 생성 실패, 메타데이터 사용:",
              profileError.message
            );
          }
        } catch (profileError) {
          console.log("프로필 생성 중 오류, 메타데이터 사용:", profileError);
        }

        // 바로 메인 화면으로 이동
        showAlert(
          "회원가입 완료",
          "회원가입이 성공적으로 완료되었습니다!",
          () => {
            // 플랫폼별 라우팅 처리
            if (Platform.OS === "web") {
              // 웹에서는 GitHub Pages 서브패스 유지를 위해 전체 URL 사용
              const currentBaseUrl = window.location.pathname.includes(
                "/easy-to-do/"
              )
                ? "/easy-to-do"
                : "";
              const mainUrl =
                window.location.origin + currentBaseUrl + "/(app)/main";
              console.log("Register - Redirecting to main (web):", mainUrl);
              window.location.href = mainUrl;
            } else {
              // 앱에서는 기존 Expo Router 사용
              router.replace("/(app)/main");
            }
          }
        );
      }
    } catch (error) {
      console.error("회원가입 오류:", error);
      const message = "회원가입 중 문제가 발생했습니다.";
      setErrorMessage(message);
      showAlert("오류", message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.formContainer}>
          <Text style={styles.title}>회원가입</Text>

          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="이름"
              value={name}
              onChangeText={setName}
              placeholderTextColor="#999"
              editable={!loading}
            />
            <TextInput
              style={styles.input}
              placeholder="이메일"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              placeholderTextColor="#999"
              editable={!loading}
            />
            <TextInput
              style={styles.input}
              placeholder="비밀번호"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              placeholderTextColor="#999"
              editable={!loading}
            />
            <TextInput
              style={styles.input}
              placeholder="비밀번호 확인"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              placeholderTextColor="#999"
              editable={!loading}
            />
            {errorMessage ? (
              <Text style={styles.errorText}>{errorMessage}</Text>
            ) : null}
          </View>

          <TouchableOpacity
            style={[styles.registerButton, loading && styles.disabledButton]}
            onPress={handleRegister}
            disabled={loading}
          >
            <Text style={styles.registerButtonText}>
              {loading ? "회원가입 중..." : "회원가입"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.loginButton}
            onPress={() => {
              // 플랫폼별 라우팅 처리
              if (Platform.OS === "web") {
                // 웹에서는 GitHub Pages 서브패스 유지를 위해 전체 URL 사용
                const currentBaseUrl = window.location.pathname.includes(
                  "/easy-to-do/"
                )
                  ? "/easy-to-do"
                  : "";
                const loginUrl =
                  window.location.origin + currentBaseUrl + "/login";
                console.log("Register - Redirecting to login (web):", loginUrl);
                window.location.href = loginUrl;
              } else {
                // 앱에서는 기존 Expo Router 사용
                router.push("/login");
              }
            }}
            disabled={loading}
          >
            <Text style={styles.loginButtonText}>
              이미 계정이 있으신가요? 로그인
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  scrollContainer: {
    flexGrow: 1,
  },
  formContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    marginBottom: 40,
    color: "#333",
  },
  inputContainer: {
    width: "100%",
    maxWidth: 400,
    marginBottom: 20,
  },
  input: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#ddd",
    fontSize: 16,
  },
  registerButton: {
    backgroundColor: "#007AFF",
    padding: 15,
    borderRadius: 10,
    width: "100%",
    maxWidth: 400,
    alignItems: "center",
  },
  disabledButton: {
    backgroundColor: "#ccc",
  },
  registerButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
  loginButton: {
    marginTop: 20,
    padding: 10,
  },
  loginButtonText: {
    color: "#007AFF",
    fontSize: 16,
  },
  errorText: {
    color: "red",
    marginTop: 10,
  },
});
