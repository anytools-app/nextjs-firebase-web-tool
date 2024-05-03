export async function getUserIdFromSession() {
  const { cookies } = await import("next/headers")
  const { getAuth } = await import("firebase-admin/auth")
  const { initializeAdminApp } = await import("@nextjs-firebase-web-tool/server/firebase/firebaseAdmin")

  const adminApp = await initializeAdminApp()
  if (adminApp === null) {
    return null
  }

  const adminAuth = getAuth(adminApp)
  const sessionToken = cookies().get("__session")?.value ?? null

  if (sessionToken === null) {
    return null
  }

  const isRevoked = !(await adminAuth.verifySessionCookie(sessionToken, true).catch((e) => console.error(e.message)))
  if (isRevoked) {
    return null
  }

  const decodedIdToken = await adminAuth.verifySessionCookie(sessionToken)
  return decodedIdToken.uid
}
