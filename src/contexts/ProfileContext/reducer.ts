/**
 * ProfileContextのReducer
 */

import type { ProfileState, ProfileAction } from "./types";

/**
 * 初期状態
 */
export const initialState: ProfileState = {
  profile: null,
  loading: false,
  error: null,
};

/**
 * プロフィール状態のReducer
 */
export function profileReducer(
  state: ProfileState,
  action: ProfileAction
): ProfileState {
  switch (action.type) {
    case "SET_LOADING":
      return {
        ...state,
        loading: action.payload,
      };

    case "SET_PROFILE":
      return {
        ...state,
        profile: action.payload,
        loading: false,
        error: null,
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
