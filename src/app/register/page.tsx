import type { Metadata } from "next";
import { Suspense } from "react";
import RegisterForm from "./RegisterForm";

export const metadata: Metadata = {
  title: "Create Account",
  description:
    "Create your African Safaris and Hotel Booking Hub account.",
  robots: {
    index: false,
    follow: false,
  },
};

type RegisterPageProps = {
  searchParams: Promise<{
    role?: string | string[];
  }>;
};

async function RegistrationContent({
  searchParams,
}: RegisterPageProps) {
  const params = await searchParams;

  const initialRole =
    params.role === "vendor" ? "vendor" : "customer";

  return <RegisterForm initialRole={initialRole} />;
}

export default function RegisterPage(
  props: RegisterPageProps
) {
  return (
    <Suspense fallback={<p>Loading registration...</p>}>
      <RegistrationContent {...props} />
    </Suspense>
  );
}
