import { firebaseConfig } from "@nextjs-firebase-web-tool/server/firebase/firebase"
import type { App, Credential } from "firebase-admin/app"
import { initializeApp } from "firebase/app"

export async function initializeAdminApp(credential?: Credential): Promise<App | null> {
  const { initializeApp, getApps } = await import("firebase-admin/app")

  if (credential === undefined) {
    return getApps()[0] ?? null
  }

  return (
    getApps()[0] ??
    initializeApp({
      credential,
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    })
  )
}

export async function initializeAuthenticatedAdminApp(uid: string) {
  const random = Math.random().toString(36).split(".")[1]
  const appName = `authenticated-context:${uid}:${random}`

  const app = initializeApp(firebaseConfig, appName)

  return app
}
