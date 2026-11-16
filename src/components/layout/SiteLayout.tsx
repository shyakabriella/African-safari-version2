import type { ReactNode } from "react";
import MainHeader from "./MainHeader";
import SubHeader from "./SubHeader";

export default function SiteLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <>
      <MainHeader />
      <SubHeader />
      <main id="main-content">{children}</main>
    </>
  );
}
