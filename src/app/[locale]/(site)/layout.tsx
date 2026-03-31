import { BackToCube } from "@/components/cube/BackToCube";

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <BackToCube />
    </>
  );
}
