/**
 * 認証コンテキスト
 * 認証状態の管理を担当するContext
 */

import React, { createContext, useContext, useReducer, useEffect } from "react";
import type { User, Session } from "../../types/auth";
import * as authService from "../../services/authService";
import { supabase } from "../../lib/supabase";

/**
 * 認証状態の型
 */
interface AuthState {
  /** 現在のログインユーザー */
  user: User | null;
  /** 現在のセッション */
  session: Session | null;
  /** ローディング状態 */
  loading: boolean;
  /** エラーメッセージ */
  error: string | null;
}

/**
 * 認証アクションの型
 */
type AuthAction =
  | { type: "SET_USER"; payload: { user: User | null; session: Session | null } }
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_ERROR"; payload: string | null }
  | { type: "CLEAR_ERROR" };

/**
 * 認証コンテキストの値の型
 */
interface AuthContextValue extends AuthState {
  /** アカウント登録 */
  signUp: (email: string, password: string) => Promise<void>;
  /** ログイン */
  signIn: (email: string, password: string) => Promise<void>;
  /** ログアウト */
  signOut: () => Promise<void>;
  /** エラークリア */
  clearError: () => void;
}

/**
 * 認証リデューサー
 */
function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case "SET_USER":
      return {
        ...state,
        user: action.payload.user,
        session: action.payload.session,
        loading: false,
        error: null,
      };
    case "SET_LOADING":
      return {
        ...state,
        loading: action.payload,
      };
    case "SET_ERROR":
      return {
        ...state,
        error: action.payload,
        loading: false,
      };
    case "CLEAR_ERROR":
      return {
        ...state,
        error: null,
      };
    default:
      return state;
  }
}

/**
 * 初期状態
 */
const initialState: AuthState = {
  user: null,
  session: null,
  loading: true,
  error: null,
};

/**
 * 認証コンテキスト
 */
const AuthContext = createContext<AuthContextValue | undefined>(undefined);

/**
 * 認証プロバイダーのプロパティ
 */
interface AuthProviderProps {
  children: React.ReactNode;
}

/**
 * 認証プロバイダー
 */
export function AuthProvider({ children }: AuthProviderProps) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  /**
   * 初期化時に現在のセッションを取得
   */
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const session = await authService.getSession();
        if (session) {
          dispatch({
            type: "SET_USER",
            payload: { user: session.user, session },
          });
        } else {
          dispatch({
            type: "SET_USER",
            payload: { user: null, session: null },
          });
        }
      } catch (error) {
        console.error("認証の初期化に失敗しました:", error);
        dispatch({
          type: "SET_USER",
          payload: { user: null, session: null },
        });
      }
    };

    initializeAuth();

    // 認証状態の変更を監視
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session) {
        dispatch({
          type: "SET_USER",
          payload: {
            user: {
              id: session.user.id,
              email: session.user.email || "",
              created_at: session.user.created_at,
            },
            session: {
              access_token: session.access_token,
              refresh_token: session.refresh_token,
              expires_in: session.expires_in,
              expires_at: session.expires_at,
              token_type: session.token_type,
              user: {
                id: session.user.id,
                email: session.user.email || "",
                created_at: session.user.created_at,
              },
            },
          },
        });
      } else {
        dispatch({
          type: "SET_USER",
          payload: { user: null, session: null },
        });
      }
    });

    // クリーンアップ
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  /**
   * アカウント登録
   */
  const signUp = async (email: string, password: string) => {
    try {
      dispatch({ type: "SET_LOADING", payload: true });
      dispatch({ type: "CLEAR_ERROR" });

      const user = await authService.signUp(email, password);
      const session = await authService.getSession();

      dispatch({
        type: "SET_USER",
        payload: { user, session },
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "アカウント登録に失敗しました";
      dispatch({ type: "SET_ERROR", payload: errorMessage });
      throw error;
    }
  };

  /**
   * ログイン
   */
  const signIn = async (email: string, password: string) => {
    try {
      dispatch({ type: "SET_LOADING", payload: true });
      dispatch({ type: "CLEAR_ERROR" });

      const user = await authService.signIn(email, password);
      const session = await authService.getSession();

      dispatch({
        type: "SET_USER",
        payload: { user, session },
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "ログインに失敗しました";
      dispatch({ type: "SET_ERROR", payload: errorMessage });
      throw error;
    }
  };

  /**
   * ログアウト
   */
  const signOut = async () => {
    try {
      dispatch({ type: "SET_LOADING", payload: true });
      dispatch({ type: "CLEAR_ERROR" });

      await authService.signOut();

      dispatch({
        type: "SET_USER",
        payload: { user: null, session: null },
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "ログアウトに失敗しました";
      dispatch({ type: "SET_ERROR", payload: errorMessage });
      throw error;
    }
  };

  /**
   * エラークリア
   */
  const clearError = () => {
    dispatch({ type: "CLEAR_ERROR" });
  };

  const value: AuthContextValue = {
    ...state,
    signUp,
    signIn,
    signOut,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * 認証コンテキストを使用するカスタムフック
 */
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuthはAuthProvider内で使用する必要があります");
  }
  return context;
}
