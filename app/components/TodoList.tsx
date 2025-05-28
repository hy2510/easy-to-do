/**
 * TodoList 컴포넌트
 *
 * 주요 기능:
 * 1. 선택된 날짜의 할 일 목록 표시
 * 2. 새로운 할 일 추가
 * 3. 할 일 완료/미완료 상태 토글
 * 4. 할 일 삭제
 * 5. 할 일 목록 스크롤 관리
 * 6. 할 일 입력 폼 관리
 */

import { Ionicons } from "@expo/vector-icons";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  FlatList,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { supabase } from "../lib/supabase";

interface Todo {
  id: string;
  text: string;
  completed: boolean;
  date: string;
  user_id: string;
}

interface TodoListProps {
  selectedDate: Date;
  onTodosChange: () => Promise<void>;
}

export default function TodoList({
  selectedDate,
  onTodosChange,
}: TodoListProps) {
  const [newTodo, setNewTodo] = useState("");
  const [isInputMode, setIsInputMode] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [todos, setTodos] = useState<Todo[]>([]);
  const inputRef = useRef<TextInput>(null);
  const modalInputRef = useRef<TextInput>(null);

  const dateKey = format(selectedDate, "yyyy-MM-dd");
  const isWeb = Platform.OS === "web";

  // 할 일 목록 불러오기
  const fetchTodos = async () => {
    try {
      setLoading(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        Alert.alert("오류", "로그인이 필요합니다.");
        return;
      }

      const { data, error } = await supabase
        .from("todos")
        .select("*")
        .eq("user_id", user.id)
        .eq("date", dateKey)
        .order("created_at", { ascending: true });

      if (error) {
        Alert.alert("오류", "할 일을 불러오는데 실패했습니다.");
        return;
      }

      setTodos(data || []);
      onTodosChange();
    } catch (error) {
      Alert.alert("오류", "할 일을 불러오는 중 문제가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  // 할 일 추가
  const addTodo = async (keepFocus = false) => {
    if (!newTodo.trim() || loading) return;

    try {
      setLoading(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        Alert.alert("오류", "로그인이 필요합니다.");
        return;
      }

      const newTodoItem = {
        text: newTodo.trim(),
        completed: false,
        date: dateKey,
        user_id: user.id,
      };

      const { error } = await supabase.from("todos").insert([newTodoItem]);

      if (error) {
        Alert.alert("오류", "할 일을 추가하는데 실패했습니다.");
        return;
      }

      setNewTodo("");
      await fetchTodos();
      onTodosChange();

      if (isWeb) {
        if (keepFocus) {
          setTimeout(() => {
            inputRef.current?.focus();
          }, 0);
        }
      } else {
        setIsInputMode(false);
      }
    } catch (error) {
      Alert.alert("오류", "할 일을 추가하는 중 문제가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  // 할 일 상태 토글
  const toggleTodo = async (todo: Todo) => {
    if (loading) return;

    try {
      setLoading(true);
      const { error } = await supabase
        .from("todos")
        .update({ completed: !todo.completed })
        .eq("id", todo.id);

      if (error) {
        Alert.alert("오류", "할 일 상태를 변경하는데 실패했습니다.");
        return;
      }

      await fetchTodos();
      onTodosChange();
    } catch (error) {
      Alert.alert("오류", "할 일 상태를 변경하는 중 문제가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  // 할 일 삭제
  const deleteTodo = async (id: string) => {
    if (loading) return;

    try {
      setLoading(true);
      const { error } = await supabase.from("todos").delete().eq("id", id);

      if (error) {
        Alert.alert("오류", "할 일을 삭제하는데 실패했습니다.");
        return;
      }

      await fetchTodos();
      onTodosChange();
    } catch (error) {
      Alert.alert("오류", "할 일을 삭제하는 중 문제가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleInputPress = () => {
    setIsInputMode(true);
  };

  const handleOverlayPress = () => {
    Keyboard.dismiss();
    setIsInputMode(false);
    if (newTodo.trim()) {
      addTodo();
    }
  };

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await fetchTodos();
    setRefreshing(false);
  }, [dateKey]);

  useEffect(() => {
    fetchTodos();
  }, [dateKey]);

  // 안드로이드에서 모달 열릴 때 키보드 강제 표시
  useEffect(() => {
    if (isInputMode && Platform.OS === "android") {
      setTimeout(() => {
        modalInputRef.current?.focus();
        Keyboard.dismiss();
        setTimeout(() => {
          modalInputRef.current?.focus();
        }, 100);
      }, 100);
    }
  }, [isInputMode]);

  const renderInput = () => {
    if (isWeb) {
      return (
        <View style={styles.webInputContainer}>
          <TextInput
            ref={inputRef}
            style={styles.webInput}
            value={newTodo}
            onChangeText={setNewTodo}
            placeholder="할 일을 입력하세요"
            placeholderTextColor="#999"
            onSubmitEditing={() => addTodo(true)}
            autoFocus
            editable={!loading}
          />
          <TouchableOpacity
            style={[styles.webAddButton, loading && styles.disabledButton]}
            onPress={() => addTodo(true)}
            disabled={loading}
          >
            <Text style={styles.webAddButtonText}>추가</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <TouchableOpacity
        style={styles.inputContainer}
        onPress={handleInputPress}
        activeOpacity={0.8}
        disabled={loading}
      >
        <Text style={styles.inputPlaceholder}>
          할 일을 입력하려면 여기를 탭하세요
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.dateHeader}>
        {format(selectedDate, "yyyy년 MM월 dd일 EEEE", { locale: ko })}의 할 일
      </Text>

      {renderInput()}

      <View style={styles.listContainer}>
        <FlatList
          data={todos}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          renderItem={({ item }) => (
            <View style={styles.todoItem}>
              <TouchableOpacity
                style={styles.todoCheckbox}
                onPress={() => toggleTodo(item)}
                disabled={loading}
              >
                {item.completed && <Text style={styles.checkmark}>✓</Text>}
              </TouchableOpacity>

              <Text
                style={[
                  styles.todoText,
                  item.completed && styles.completedTodoText,
                ]}
              >
                {item.text}
              </Text>

              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => deleteTodo(item.id)}
                disabled={loading}
              >
                <Ionicons name="close" size={20} color="#999" />
              </TouchableOpacity>
            </View>
          )}
          ListEmptyComponent={() => (
            <Text style={styles.emptyText}>할 일이 없습니다</Text>
          )}
        />
      </View>

      {!isWeb && (
        <Modal
          visible={isInputMode}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setIsInputMode(false)}
        >
          <TouchableWithoutFeedback onPress={handleOverlayPress}>
            <View style={styles.modalOverlay}>
              <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={styles.keyboardAvoidingView}
              >
                <TouchableWithoutFeedback>
                  <View style={styles.modalContent}>
                    <View style={styles.modalInputContainer}>
                      <TextInput
                        ref={modalInputRef}
                        style={styles.modalInput}
                        value={newTodo}
                        onChangeText={setNewTodo}
                        placeholder="할 일을 입력하세요"
                        placeholderTextColor="#999"
                        autoFocus={true}
                        onSubmitEditing={() => addTodo()}
                        editable={!loading}
                      />
                      <TouchableOpacity
                        style={[
                          styles.modalAddButton,
                          loading && styles.disabledButton,
                        ]}
                        onPress={() => addTodo()}
                        disabled={loading}
                      >
                        <Text style={styles.modalAddButtonText}>추가</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </TouchableWithoutFeedback>
              </KeyboardAvoidingView>
            </View>
          </TouchableWithoutFeedback>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    backgroundColor: "#fff",
    padding: 16,
    marginTop: 16,
    marginBottom: 16,
    borderRadius: 12,
  },
  dateHeader: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 16,
    color: "#333",
  },
  inputContainer: {
    height: 48,
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
    justifyContent: "center",
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  inputPlaceholder: {
    color: "#555",
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  modalContent: {
    backgroundColor: "#fff",
    paddingTop: Platform.OS === "ios" ? 60 : 20,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  modalInputContainer: {
    flexDirection: "row",
    padding: 16,
    backgroundColor: "#fff",
  },
  modalInput: {
    flex: 1,
    height: 48,
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
    marginRight: 8,
    color: "#333",
  },
  modalAddButton: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 20,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  modalAddButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  listContainer: {
    minHeight: 50,
    maxHeight: 400,
  },
  todoItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  todoCheckbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: "#007AFF",
    borderRadius: 12,
    marginRight: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  checkmark: {
    color: "#007AFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  todoText: {
    flex: 1,
    fontSize: 16,
    color: "#333",
  },
  completedTodoText: {
    textDecorationLine: "line-through",
    color: "#999",
  },
  deleteButton: {
    width: 32,
    height: 32,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
  },
  emptyText: {
    textAlign: "center",
    color: "#666",
    marginTop: 20,
    fontSize: 16,
  },
  webInputContainer: {
    flexDirection: "row",
    marginBottom: 16,
    gap: 8,
  },
  webInput: {
    flex: 1,
    height: 48,
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
    color: "#333",
  },
  webAddButton: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 20,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  disabledButton: {
    backgroundColor: "#ccc",
  },
  webAddButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
