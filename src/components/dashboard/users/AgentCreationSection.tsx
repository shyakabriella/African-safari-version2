"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import CreateAgent from "./CreateAgent";
import UsersDirectory from "./UsersDirectory";

export default function AgentCreationSection() {
  const router = useRouter();
  const [revision, setRevision] = useState(0);

  function accountCreated() {
    // Force a new directory request even when
    // current search and pagination are unchanged.
    setRevision(previous => previous + 1);

    // Refresh server-rendered summary statistics.
    router.refresh();
  }

  return (
    <>
      <CreateAgent onCreated={accountCreated} />
      <UsersDirectory key={revision} />
    </>
  );
}
