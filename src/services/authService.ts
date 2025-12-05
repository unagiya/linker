/**
 * 認証サービス
 * Supabase Authを使用した認証機能を提供
 */

import { supabase } from "../lib/supabase";
import type { User, Session } from "../types/auth";

/**
 * アカウント登録
 * @param email メールアドレス
 * @param password パスワード
 * @returns 作成されたユーザー情報
 * @throws 登録に失敗した場合
 */
export async function signUp(email: string, password: string): Promise<User> {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) {
    throw new Error(error.message);
  }

  if (!data.user) {
    throw new Error("ユーザーの作成に失敗しました");
  }

  // Supabaseのユーザー型をアプリケーションのUser型に変換
  return {
    id: data.user.id,
    email: data.user.email || "",
    created_at: data.user.created_at,
  };
}

/**
 * ログイン
 * @param email メールアドレス
 * @param password パスワード
 * @returns ログインしたユーザー情報
 * @throws ログインに失敗した場合
 */
export async function signIn(email: string, password: string): Promise<User> {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    throw new Error(error.message);
  }

  if (!data.user) {
    throw new Error("ログインに失敗しました");
  }

  // Supabaseのユーザー型をアプリケーションのUser型に変換
  return {
    id: data.user.id,
    email: data.user.email || "",
    created_at: data.user.created_at,
  };
}

/**
 * ログアウト
 * @throws ログアウトに失敗した場合
 */
export async function signOut(): Promise<void> {
  const { error } = await supabase.auth.signOut();

  if (error) {
    throw new Error(error.message);
  }
}

/**
 * 現在のセッションを取得
 * @returns 現在のセッション情報、またはnull
 */
export async function getSession(): Promise<Session | null> {
  const { data, error } = await supabase.auth.getSession();

  if (error) {
    throw new Error(error.message);
  }

  if (!data.session) {
    return null;
  }

  // Supabaseのセッション型をアプリケーションのSession型に変換
  return {
    access_token: data.session.access_token,
    refresh_token: data.session.refresh_token,
    expires_in: data.session.expires_in,
    expires_at: data.session.expires_at,
    token_type: data.session.token_type,
    user: {
      id: data.session.user.id,
      email: data.session.user.email || "",
      created_at: data.session.user.created_at,
    },
  };
}

/**
 * 現在のユーザーを取得
 * @returns 現在のユーザー情報、またはnull
 */
export async function getCurrentUser(): Promise<User | null> {
  const { data, error } = await supabase.auth.getUser();

  if (error) {
    throw new Error(error.message);
  }

  if (!data.user) {
    return null;
  }

  // Supabaseのユーザー型をアプリケーションのUser型に変換
  return {
    id: data.user.id,
    email: data.user.email || "",
    created_at: data.user.created_at,
  };
}
