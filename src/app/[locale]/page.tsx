import { cookies } from "next/headers";
import { GateLandingPage } from "@/components/gate/GateLandingPage";
import { CubeHomepage } from "@/components/cube/CubeHomepage";
import { WhatsAppButton } from "@/components/conversion/WhatsAppButton";

export default async function Home() {
  const cookieStore = await cookies();
  const gateToken = cookieStore.get("fayai_gate")?.value;
  const authToken = cookieStore.get("fayai_token")?.value;

  // Show gate for unverified, non-logged-in visitors
  const showGate = !gateToken && !authToken;

  if (showGate) {
    return <GateLandingPage />;
  }

  return (
    <>
      <CubeHomepage />
      <WhatsAppButton />
    </>
  );
}
