"use client";

import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from "react";

type Company = {
  id: number;
  legal_name: string;
  display_name: string;
  type: string;
  status: string;
  tax_id: string | null;
  payout_method: string;
};

type CompanyResponse = {
  success?: boolean;
  message?: string;
  data?: Company | Company[];
};

const fieldClass =
  "mt-2 w-full rounded-lg border border-[#d5e4dc] bg-white p-3 text-sm font-normal text-[#173c36]";

function statusClass(status: string) {
  switch (status) {
    case "approved":
      return "border-emerald-200 bg-emerald-50 text-emerald-800";
    case "pending":
      return "border-amber-200 bg-amber-50 text-amber-800";
    case "rejected":
    case "suspended":
      return "border-red-200 bg-red-50 text-red-800";
    default:
      return "border-slate-200 bg-slate-50 text-slate-700";
  }
}

export default function SafariCompanyPanel() {
  const dialogRef = useRef<HTMLDialogElement>(null);

  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [company, setCompany] = useState<Company | null>(null);
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");
  const [notice, setNotice] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  const [legalName, setLegalName] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [taxId, setTaxId] = useState("");
  const [payoutMethod, setPayoutMethod] =
    useState<"bank" | "mobile_money">("bank");

  // Load company information asynchronously.
  // No synchronous state updates occur in this effect.
  useEffect(() => {
    const controller = new AbortController();

    async function fetchCompany() {
      try {
        const response = await fetch("/api/vendor/company", {
          method: "GET",
          credentials: "same-origin",
          cache: "no-store",
          headers: { Accept: "application/json" },
          signal: controller.signal,
        });

        const result: CompanyResponse = await response.json();

        if (!response.ok || result.success !== true) {
          throw new Error(
            result.message || "Unable to load company profile."
          );
        }

        if (
          !Array.isArray(result.data) ||
          result.data.length > 1
        ) {
          throw new Error("Unexpected company information.");
        }

        if (!controller.signal.aborted) {
          setCompany(result.data[0] ?? null);
          setError("");
        }
      } catch (cause) {
        if (!controller.signal.aborted) {
          setError(
            cause instanceof Error
              ? cause.message
              : "Company service is unavailable."
          );
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    void fetchCompany();

    return () => controller.abort();
  }, [refreshKey]);

  useEffect(() => {
    const dialog = dialogRef.current;

    if (!dialog) return;

    if (open && !dialog.open) {
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }

    return () => {
      if (dialog.open) dialog.close();
    };
  }, [open]);

  function refreshCompany() {
    if (saving) return;
    setLoading(true);
    setError("");
    setRefreshKey(value => value + 1);
  }

  function closeModal() {
    if (saving) return;
    setOpen(false);
    setFormError("");
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (
      saving ||
      loading ||
      company ||
      error ||
      !legalName.trim()
    ) {
      return;
    }

    setSaving(true);
    setFormError("");

    try {
      const response = await fetch("/api/vendor/company", {
        method: "POST",
        credentials: "same-origin",
        cache: "no-store",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          legal_name: legalName.trim(),
          display_name: displayName.trim(),
          tax_id: taxId.trim(),
          payout_method: payoutMethod,
        }),
      });

      const result: CompanyResponse = await response.json()
        .catch(() => ({
          success: false,
          message: "Unexpected server response.",
        }));

      if (response.status === 409) {
        setOpen(false);
        setNotice(
          "A company profile already exists. Checking its status."
        );
        refreshCompanyAfterSave();
        return;
      }

      if (!response.ok || result.success !== true) {
        throw new Error(
          result.message || "Company registration failed."
        );
      }

      const created = result.data;

      if (
        !created ||
        Array.isArray(created) ||
        created.type !== "safari_operator" ||
        created.status !== "pending"
      ) {
        setOpen(false);
        setNotice(
          "Registration needs confirmation. Reloading your company profile."
        );
        refreshCompanyAfterSave();
        return;
      }

      setCompany(created);
      setOpen(false);
      setNotice(
        "Your safari company was submitted successfully. Approval is pending."
      );
    } catch (cause) {
      setFormError(
        cause instanceof Error
          ? cause.message
          : "Unable to register your company."
      );
    } finally {
      setSaving(false);
    }
  }

  function refreshCompanyAfterSave() {
    setLoading(true);
    setError("");
    setRefreshKey(value => value + 1);
  }

  return (
    <section className="rounded-2xl border border-[#e0eae3] bg-white p-6 sm:p-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold">
            My Safari Company
          </h2>
          <p className="mt-2 text-sm leading-7 text-[#637b70]">
            Register your safari business and follow
            its marketplace verification status.
          </p>
        </div>

        {!loading && !error && !company && (
          <button
            type="button"
            onClick={() => {
              setFormError("");
              setOpen(true);
            }}
            aria-haspopup="dialog"
            className="rounded-lg bg-[#186e52] px-5 py-3 text-sm font-bold text-white hover:bg-[#12583f]"
          >
            + Register Safari Company
          </button>
        )}
      </div>

      {notice && (
        <p
          role="status"
          className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900"
        >
          {notice}
        </p>
      )}

      {loading ? (
        <p role="status" className="mt-6 text-sm text-[#637b70]">
          Loading your company profile...
        </p>
      ) : error ? (
        <div
          role="alert"
          className="mt-6 rounded-xl border border-red-200 bg-red-50 p-5"
        >
          <p className="text-sm text-red-800">{error}</p>
          <button
            type="button"
            onClick={refreshCompany}
            className="mt-4 rounded-lg border border-red-300 bg-white px-4 py-2 text-sm font-semibold text-red-800"
          >
            Retry
          </button>
        </div>
      ) : company ? (
        <div className="mt-6 rounded-xl border border-[#dce8e0] p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="text-lg font-bold">
                {company.display_name}
              </h3>
              <p className="mt-1 text-sm text-[#637b70]">
                {company.legal_name}
              </p>
            </div>

            <span
              className={`rounded-full border px-3 py-1 text-xs font-bold capitalize ${statusClass(company.status)}`}
            >
              {company.status}
            </span>
          </div>

          <dl className="mt-5 grid gap-4 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-[#718579]">
                Business category
              </dt>
              <dd className="mt-1 font-semibold capitalize">
                {company.type.replaceAll("_", " ")}
              </dd>
            </div>

            <div>
              <dt className="text-[#718579]">
                Tax Identification Number
              </dt>
              <dd className="mt-1 font-semibold">
                {company.tax_id || "Not provided"}
              </dd>
            </div>

            <div>
              <dt className="text-[#718579]">
                Preferred payout method
              </dt>
              <dd className="mt-1 font-semibold capitalize">
                {company.payout_method.replaceAll("_", " ")}
              </dd>
            </div>
          </dl>

          <p className="mt-5 rounded-lg bg-[#f5f8f5] p-4 text-sm leading-7 text-[#526f62]">
            {company.status === "approved"
              ? "Your company is approved. Operator tour management will be enabled after its API is verified."
              : company.status === "pending"
                ? "Your company is awaiting administrator verification."
                : company.status === "rejected"
                  ? "Your company was not approved. Contact marketplace support."
                  : "Your company is suspended. Safari publishing is unavailable."}
          </p>

          <button
            type="button"
            onClick={refreshCompany}
            className="mt-4 rounded-lg border border-[#d5e4dc] px-4 py-2 text-sm font-semibold"
          >
            Refresh Verification Status
          </button>
        </div>
      ) : (
        <div className="mt-6 rounded-xl border border-dashed border-[#cbded1] bg-[#f8faf8] p-6">
          <h3 className="font-bold">
            No safari company registered yet
          </h3>
          <p className="mt-3 text-sm leading-7 text-[#637b70]">
            Click Register Safari Company to submit
            your company information for review.
          </p>
        </div>
      )}

      <dialog
        ref={dialogRef}
        aria-labelledby="company-registration-title"
        aria-describedby="company-registration-description"
        onCancel={event => {
          if (saving) {
            event.preventDefault();
          } else {
            closeModal();
          }
        }}
        onClose={closeModal}
        className="fixed inset-0 m-auto max-h-[90dvh] w-[calc(100%-24px)] max-w-2xl overflow-y-auto rounded-2xl border border-[#dce8e0] bg-white p-0 text-[#173c36] shadow-2xl backdrop:bg-[#071913]/65 backdrop:backdrop-blur-sm"
      >
        <div className="flex items-start justify-between gap-4 border-b border-[#e4ede7] p-6">
          <div>
            <h2
              id="company-registration-title"
              className="text-xl font-bold"
            >
              Register Safari Company
            </h2>
            <p
              id="company-registration-description"
              className="mt-2 text-sm leading-6 text-[#637b70]"
            >
              Submit your business information for review.
              Registration does not automatically grant approval.
            </p>
          </div>

          <button
            type="button"
            onClick={closeModal}
            disabled={saving}
            aria-label="Close company registration"
            className="rounded-lg border border-[#dce8e0] px-3 py-1 text-2xl"
          >
            ×
          </button>
        </div>

        <form onSubmit={submit} className="space-y-5 p-6">
          <label className="block text-sm font-semibold">
            Legal Company Name *
            <input
              required
              maxLength={255}
              value={legalName}
              onChange={event =>
                setLegalName(event.target.value)
              }
              placeholder="Registered business name"
              disabled={saving}
              className={fieldClass}
            />
          </label>

          <label className="block text-sm font-semibold">
            Trading / Display Name
            <input
              maxLength={255}
              value={displayName}
              onChange={event =>
                setDisplayName(event.target.value)
              }
              placeholder="Name shown to travelers"
              disabled={saving}
              className={fieldClass}
            />
          </label>

          <label className="block text-sm font-semibold">
            Tax Identification Number (Optional)
            <input
              maxLength={255}
              value={taxId}
              onChange={event =>
                setTaxId(event.target.value)
              }
              placeholder="Company Tax ID"
              disabled={saving}
              className={fieldClass}
            />
          </label>

          <label className="block text-sm font-semibold">
            Business Category
            <input
              value="Safari Operator"
              readOnly
              className={`${fieldClass} bg-[#f5f8f5]`}
            />
          </label>

          <label className="block text-sm font-semibold">
            Preferred Payout Method *
            <select
              required
              value={payoutMethod}
              onChange={event =>
                setPayoutMethod(
                  event.target.value === "mobile_money"
                    ? "mobile_money"
                    : "bank"
                )
              }
              disabled={saving}
              className={fieldClass}
            >
              <option value="bank">
                Bank Transfer
              </option>
              <option value="mobile_money">
                Mobile Money
              </option>
            </select>
          </label>

          <p className="text-xs leading-6 text-[#708579]">
            Bank account and mobile money numbers
            are not collected during registration.
          </p>

          {formError && (
            <p
              role="alert"
              className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800"
            >
              {formError}
            </p>
          )}

          <div className="flex flex-wrap justify-end gap-3 border-t border-[#e4ede7] pt-5">
            <button
              type="button"
              onClick={closeModal}
              disabled={saving}
              className="rounded-lg border border-[#d5e4dc] px-5 py-3 text-sm font-bold"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-[#186e52] px-5 py-3 text-sm font-bold text-white disabled:opacity-60"
            >
              {saving
                ? "Submitting..."
                : "Submit for Verification"}
            </button>
          </div>
        </form>
      </dialog>
    </section>
  );
}
