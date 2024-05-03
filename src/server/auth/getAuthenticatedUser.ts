import { auth } from "@nextjs-firebase-web-tool/server/firebase/firebase"
import { type User, connectAuthEmulator, getAuth, signInWithCustomToken } from "firebase/auth"

type Result = Success | Failure

interface Success {
  ok: true
  /** user=nullの場合、未認証 */
  session: Session | null
  nativeUserInstance?: User
}

interface Failure {
  ok: false
  error: Error
}

export interface Session {
  id: string
  name: string
  email: string
}

/**
 * 認証済みのセッション情報を取得する
 */
export async function getAuthenticatedUser(): Promise<Result> {
  if (typeof window !== "undefined") {
    if (auth.currentUser !== null) {
      return browserResponse(auth.currentUser)
    }

    return { ok: true, session: null }
  }

  const { getUserIdFromSession } = await import("@nextjs-firebase-web-tool/server/auth/getUserIdFromSession")
  const userId = await getUserIdFromSession()

  if (userId === null) {
    return { ok: true, session: null }
  }

  const { initializeAuthenticatedAdminApp, initializeAdminApp } = await import("@nextjs-firebase-web-tool/server/firebase/firebaseAdmin")
  const { getAuth: getAdminAuth } = await import("firebase-admin/auth")
  const authApp = await initializeAuthenticatedAdminApp(userId)
  const userAuth = getAuth(authApp)

  if (userAuth.currentUser?.uid !== userId) {
    const adminApp = await initializeAdminApp()

    if (adminApp === null) {
      return { ok: false, error: new Error("Failed to initialize admin app") }
    }

    const adminAuth = getAdminAuth(adminApp)
    const customToken = await adminAuth.createCustomToken(userId).catch((e) => console.error(e.message))

    if (customToken === undefined) {
      return { ok: false, error: new Error("Failed to create custom token") }
    }

    if (process.env.NEXT_PUBLIC_USE_EMULATOR === "true") {
      connectAuthEmulator(userAuth, "http://127.0.0.1:9099")
    }

    await signInWithCustomToken(userAuth, customToken)
  }

  const user = userAuth.currentUser
  return user === null ? { ok: true, session: null } : browserResponse(user)
}

/**
 * ブラウザー用のレスポンス
 * @param user
 * @returns
 */
function browserResponse(user: User): Result {
  return user.displayName === null || user.email === null
    ? { ok: true, session: null }
    : { ok: true, session: { id: user.uid, name: user.displayName, email: user.email }, nativeUserInstance: user }
}
