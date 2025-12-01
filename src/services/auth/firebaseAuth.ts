import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
} from "firebase/auth";
import { auth } from "../../config/firebase";

export interface AuthError {
  code: string;
  message: string;
}

// Inferir o tipo User do retorno de createUserWithEmailAndPassword
type UserCredential = Awaited<ReturnType<typeof createUserWithEmailAndPassword>>;
export type FirebaseUser = UserCredential["user"];

export const registerUser = async (
  email: string,
  password: string,
  displayName?: string
): Promise<FirebaseUser> => {
  try {
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );
    const user = userCredential.user;

    if (displayName) {
      await updateProfile(user, { displayName });
    }

    return user;
  } catch (error: any) {
    const authError: AuthError = {
      code: error.code,
      message: getErrorMessage(error.code),
    };
    throw authError;
  }
};

export const loginUser = async (
  email: string,
  password: string
): Promise<FirebaseUser> => {
  try {
    const userCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password
    );
    return userCredential.user;
  } catch (error: any) {
    const authError: AuthError = {
      code: error.code,
      message: getErrorMessage(error.code),
    };
    throw authError;
  }
};

export const logoutUser = async (): Promise<void> => {
  try {
    await signOut(auth);
  } catch (error: any) {
    const authError: AuthError = {
      code: error.code,
      message: getErrorMessage(error.code),
    };
    throw authError;
  }
};

export const getCurrentUser = (): FirebaseUser | null => {
  return auth.currentUser;
};

export const onAuthChange = (callback: (user: FirebaseUser | null) => void) => {
  return onAuthStateChanged(auth, callback);
};

const getErrorMessage = (code: string): string => {
  switch (code) {
    case "auth/email-already-in-use":
      return "Este email já está em uso.";
    case "auth/invalid-email":
      return "Email inválido.";
    case "auth/operation-not-allowed":
      return "Operação não permitida.";
    case "auth/weak-password":
      return "Senha muito fraca. Use pelo menos 6 caracteres.";
    case "auth/user-disabled":
      return "Esta conta foi desabilitada.";
    case "auth/user-not-found":
      return "Usuário não encontrado.";
    case "auth/wrong-password":
      return "Senha incorreta.";
    case "auth/too-many-requests":
      return "Muitas tentativas. Tente novamente mais tarde.";
    case "auth/network-request-failed":
      return "Erro de conexão. Verifique sua internet.";
    default:
      return "Ocorreu um erro. Tente novamente.";
  }
};

