"use client";

import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from "react";

type Props = {
  onCreated: () => void;
};

type CreateResponse = {
  success?: boolean;
  message?: string;
  data?: {
    id?: number;
    status?: string;
  };
};

const categories = [
  ["game_drive", "Game Drive"],
  ["gorilla_trekking", "Gorilla Trekking"],
  ["hiking", "Hiking"],
  ["culture", "Cultural Safari"],
  ["boat", "Boat Safari"],
  ["birding", "Bird Watching"],
  ["other", "Other"],
] as const;

const currencies = [
  "USD", "RWF", "EUR", "GBP", "KES", "UGX", "TZS",
] as const;


const steps = [
  "Safari Information",
  "Duration & Location",
  "Pricing & Guests",
  "Package Details",
  "Review & Save",
] as const;

const stepDescriptions = [
  "Tell travelers about the experience.",
  "Set the safari duration and meeting point.",
  "Choose your currency, price and group sizes.",
  "Explain what is included and what travelers need.",
  "Review all details before saving your Draft.",
] as const;

const stepFields = [
  ["name", "category", "description"],
  ["duration_days", "duration_hours", "start_point"],
  ["currency", "base_price", "group_size_min", "group_size_max"],
  ["inclusions", "exclusions", "what_to_bring"],
] as const;

const inputClass =
  "mt-2 w-full rounded-xl border border-[#d5e4dc] bg-white px-4 py-3 text-sm font-normal text-[#173c36] outline-none focus:border-[#186e52] focus:ring-2 focus:ring-[#186e52]/20";

const labelClass =
  "block text-sm font-semibold text-[#173c36]";

function numberOrUndefined(value: FormDataEntryValue | null) {
  const text = String(value ?? "").trim();
  return text === "" ? undefined : Number(text);
}

function lines(value: FormDataEntryValue | null) {
  return String(value ?? "")
    .split(/\r?\n/)
    .map(item => item.trim())
    .filter(Boolean);
}

export default function VendorCreateTourModal({
  onCreated,
}: Props) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [review, setReview] =
    useState<Record<string, string>>({});

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const dialogRef = useRef<HTMLDialogElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const submittingRef = useRef(false);

  useEffect(() => {
    if (!open) return;

    const dialog = dialogRef.current;

    if (!dialog) return;

    if (!dialog.open) {
      dialog.showModal();
    }

    return () => {
      if (dialog.open) dialog.close();
    };
  }, [open]);

  function closeModal() {
    if (submittingRef.current) return;

    setOpen(false);
    setError("");
  }


  function previousStep() {
    if (submittingRef.current) return;
    setError("");
    setStep(current => Math.max(0, current - 1));
  }

  function nextStep() {
    if (submittingRef.current) return;

    const form = formRef.current;
    if (!form || step >= 4) return;

    for (const name of stepFields[step]) {
      const control = form.elements.namedItem(name);

      if (
        control instanceof HTMLInputElement ||
        control instanceof HTMLSelectElement ||
        control instanceof HTMLTextAreaElement
      ) {
        if (!control.checkValidity()) {
          setError("Please complete the required fields correctly.");
          control.reportValidity();
          return;
        }
      }
    }

    const data = new FormData(form);

    if (step === 1) {
      const days = numberOrUndefined(data.get("duration_days"));
      const hours = numberOrUndefined(data.get("duration_hours"));

      if (days === 0 && hours === 0) {
        setError("Safari duration must be greater than zero.");
        return;
      }
    }

    if (step === 2) {
      const minimum = numberOrUndefined(data.get("group_size_min"));
      const maximum = numberOrUndefined(data.get("group_size_max"));

      if (
        maximum !== undefined &&
        maximum < (minimum ?? 1)
      ) {
        setError("Maximum guests cannot be fewer than minimum guests.");
        return;
      }
    }

    if (step === 3) {
      for (const name of [
        "inclusions",
        "exclusions",
        "what_to_bring",
      ]) {
        const items = lines(data.get(name));

        if (
          items.length > 30 ||
          items.some(item => item.length > 300)
        ) {
          setError(
            "Package details allow up to 30 lines and 300 characters per line.",
          );
          return;
        }
      }

      setReview(
        Object.fromEntries(
          Array.from(data.entries()).map(([key, value]) => [
            key,
            String(value).trim(),
          ]),
        ),
      );
    }

    setError("");
    setStep(current => Math.min(4, current + 1));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (step !== 4 || submittingRef.current) return;

    const form = event.currentTarget;
    const data = new FormData(form);

    const name = String(data.get("name") ?? "").trim();
    const description = String(
      data.get("description") ?? "",
    ).trim();
    const price = String(
      data.get("base_price") ?? "",
    ).trim();

    const days = numberOrUndefined(data.get("duration_days"));
    const hours = numberOrUndefined(data.get("duration_hours"));
    const minSize = numberOrUndefined(data.get("group_size_min"));
    const maxSize = numberOrUndefined(data.get("group_size_max"));
    const startPoint = String(
      data.get("start_point") ?? "",
    ).trim();

    const inclusions = lines(data.get("inclusions"));
    const exclusions = lines(data.get("exclusions"));
    const whatToBring = lines(data.get("what_to_bring"));

    const invalidDuration =
      days === undefined ||
      hours === undefined ||
      !Number.isSafeInteger(days) ||
      !Number.isSafeInteger(hours) ||
      days < 0 || days > 3650 ||
      hours < 0 || hours > 24 ||
      (days === 0 && hours === 0);

    const invalidGroup =
      (minSize !== undefined &&
        (!Number.isSafeInteger(minSize) ||
          minSize < 1 || minSize > 1000)) ||
      (maxSize !== undefined &&
        (!Number.isSafeInteger(maxSize) ||
          maxSize < 1 || maxSize > 1000)) ||
      (maxSize !== undefined &&
        maxSize < (minSize ?? 1));

    if (
      !name ||
      name.length > 180 ||
      description.length > 10000 ||
      !/^\d{1,10}(\.\d{1,2})?$/.test(price) ||
      invalidDuration ||
      invalidGroup ||
      startPoint.length > 190
    ) {
      setError(
        "Please check the safari name, price, duration, group size and starting point.",
      );
      return;
    }

    if (
      [inclusions, exclusions, whatToBring].some(
        items =>
          items.length > 30 ||
          items.some(item => item.length > 300),
      )
    ) {
      setError(
        "Additional details allow at most 30 lines and 300 characters per line.",
      );
      return;
    }

    // Never send a company ID or publication status.
    // Laravel determines ownership and forces draft.
    const payload = {
      name,
      description,
      category: String(data.get("category") ?? "other"),
      duration_days: days,
      duration_hours: hours,
      base_price: price,
      currency: String(data.get("currency") ?? "USD"),
      ...(minSize === undefined
        ? {}
        : { group_size_min: minSize }),
      ...(maxSize === undefined
        ? {}
        : { group_size_max: maxSize }),
      ...(startPoint
        ? { start_point: startPoint }
        : {}),
      inclusions,
      exclusions,
      what_to_bring: whatToBring,
    };

    submittingRef.current = true;
    setSaving(true);
    setError("");
    setNotice("");

    try {
      const response = await fetch("/api/vendor/tours", {
        method: "POST",
        credentials: "same-origin",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(payload),
        cache: "no-store",
      });

      const result: CreateResponse = await response.json()
        .catch(() => ({
          success: false,
          message: "The result is uncertain. Refresh your tour list before trying again.",
        }));

      if (!response.ok || result.success !== true) {
        throw new Error(
          result.message || "Could not create Safari Tour.",
        );
      }

      if (
        !result.data ||
        !Number.isSafeInteger(result.data.id) ||
        result.data.status !== "draft"
      ) {
        throw new Error(
          "Tour creation could not be verified. Refresh the tour list before retrying.",
        );
      }

      setOpen(false);
      setNotice(
        `Safari Tour #${result.data.id} saved successfully as a Draft.`,
      );

      onCreated();
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Unable to confirm tour creation.",
      );
    } finally {
      submittingRef.current = false;
      setSaving(false);
    }
  }

  return (
    <>
      <button
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => {
          setError("");
          setNotice("");
          setReview({});
          setStep(0);
          setOpen(true);
        }}
        className="rounded-xl bg-[#186e52] px-5 py-3 text-sm font-bold text-white hover:bg-[#12583f]"
      >
        + List New Safari
      </button>

      {notice && (
        <p
          role="status"
          className="w-full rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800"
        >
          {notice}
        </p>
      )}

      {open && (
        <dialog
          ref={dialogRef}
          aria-labelledby="vendor-tour-title"
          aria-describedby="vendor-tour-description"
          onCancel={event => {
            if (submittingRef.current) {
              event.preventDefault();
            } else {
              closeModal();
            }
          }}
          onClose={closeModal}
          className="fixed inset-0 m-auto max-h-[90dvh] w-[calc(100%-24px)] max-w-3xl overflow-y-auto rounded-2xl border border-[#dce8e0] bg-white p-0 text-[#173c36] shadow-2xl backdrop:bg-[#071913]/65 backdrop:backdrop-blur-sm"
        >
          <div className="flex items-start justify-between gap-4 border-b border-[#e4ede7] p-6 sm:p-8">
            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-widest text-[#186e52]">
                African Safaris Marketplace
              </p>
              <h2
                id="vendor-tour-title"
                className="text-2xl font-bold"
              >
                List New Safari
              </h2>
              <p
                id="vendor-tour-description"
                className="mt-2 text-sm leading-7 text-[#637b70]"
              >
                Create a safari package for your approved
                company. Your tour will be saved as a Draft.
              </p>
            </div>

            <button
              type="button"
              onClick={closeModal}
              disabled={saving}
              aria-label="Close Safari form"
              className="rounded-lg border border-[#d5e4dc] px-3 py-1 text-2xl disabled:opacity-50"
            >
              ×
            </button>
          </div>

          <form
            ref={formRef}
            onSubmit={submit}
            noValidate
            className="space-y-6 p-6 sm:p-8"
          >

            <div className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <strong className="text-sm">
                  {steps[step]}
                </strong>
                <span className="text-xs font-semibold text-[#637b70]">
                  Step {step + 1} of {steps.length}
                </span>
              </div>

              <div
                className="grid grid-cols-5 gap-2"
                aria-label={`Step ${step + 1} of 5`}
              >
                {steps.map((item, index) => (
                  <div
                    key={item}
                    className={`h-2 rounded-full ${
                      index <= step
                        ? "bg-[#186e52]"
                        : "bg-[#e2ece6]"
                    }`}
                  />
                ))}
              </div>

              <p className="text-sm text-[#637b70]">
                {stepDescriptions[step]}
              </p>
            </div>

            <div
              className={step === 0 ? "grid gap-5 sm:grid-cols-2" : "hidden"}
            >
                <label className={`${labelClass} sm:col-span-2`}>
                                Safari Name *
                                <input
                                  name="name"
                                  required
                                  maxLength={180}
                                  disabled={saving}
                                  placeholder="Example: 3 Days Akagera Wildlife Safari"
                                  className={inputClass}
                                />
                              </label>

                <label className={labelClass}>
                                Safari Category *
                                <select
                                  name="category"
                                  defaultValue="game_drive"
                                  disabled={saving}
                                  className={inputClass}
                                >
                                  {categories.map(([value, label]) => (
                                    <option key={value} value={value}>
                                      {label}
                                    </option>
                                  ))}
                                </select>
                              </label>

                <label className={`${labelClass} sm:col-span-2`}>
                                Safari Description
                                <textarea
                                  name="description"
                                  rows={4}
                                  maxLength={10000}
                                  disabled={saving}
                                  placeholder="Describe the safari experience"
                                  className={inputClass}
                                />
                              </label>
            </div>

            <div
              className={step === 1 ? "grid gap-5 sm:grid-cols-2" : "hidden"}
            >
                <label className={labelClass}>
                                Duration (Days) *
                                <input
                                  name="duration_days"
                                  type="number"
                                  min={0}
                                  max={3650}
                                  step={1}
                                  defaultValue={1}
                                  required
                                  disabled={saving}
                                  className={inputClass}
                                />
                              </label>

                <label className={labelClass}>
                                Additional Hours *
                                <input
                                  name="duration_hours"
                                  type="number"
                                  min={0}
                                  max={24}
                                  step={1}
                                  defaultValue={0}
                                  required
                                  disabled={saving}
                                  className={inputClass}
                                />
                              </label>

                <label className={labelClass}>
                                Starting / Meeting Point
                                <input
                                  name="start_point"
                                  maxLength={190}
                                  placeholder="Example: Kigali International Airport"
                                  disabled={saving}
                                  className={inputClass}
                                />
                              </label>
            </div>

            <div
              className={step === 2 ? "grid gap-5 sm:grid-cols-2" : "hidden"}
            >
                <label className={labelClass}>
                                Currency *
                                <select
                                  name="currency"
                                  defaultValue="USD"
                                  disabled={saving}
                                  className={inputClass}
                                >
                                  {currencies.map(value => (
                                    <option key={value} value={value}>
                                      {value}
                                    </option>
                                  ))}
                                </select>
                              </label>

                <label className={labelClass}>
                                Base Price *
                                <input
                                  name="base_price"
                                  type="text"
                                  inputMode="decimal"
                                  pattern="[0-9]{1,10}(\.[0-9]{1,2})?"
                                  placeholder="250.00"
                                  required
                                  disabled={saving}
                                  className={inputClass}
                                />
                              </label>

                <label className={labelClass}>
                                Minimum Group Size
                                <input
                                  name="group_size_min"
                                  type="number"
                                  min={1}
                                  max={1000}
                                  step={1}
                                  defaultValue={1}
                                  disabled={saving}
                                  className={inputClass}
                                />
                              </label>

                <label className={labelClass}>
                                Maximum Group Size
                                <input
                                  name="group_size_max"
                                  type="number"
                                  min={1}
                                  max={1000}
                                  step={1}
                                  placeholder="Example: 12"
                                  disabled={saving}
                                  className={inputClass}
                                />
                              </label>
            </div>

            <div
              className={step === 3 ? "grid gap-5 sm:grid-cols-2" : "hidden"}
            >
                <label className={`${labelClass} sm:col-span-2`}>
                                What Is Included?
                                <textarea
                                  name="inclusions"
                                  rows={3}
                                  disabled={saving}
                                  placeholder={"Park entrance fees\nProfessional guide\nTransportation"}
                                  className={inputClass}
                                />
                                <span className="mt-1 block text-xs font-normal text-[#637b70]">
                                  One item per line.
                                </span>
                              </label>

                <label className={`${labelClass} sm:col-span-2`}>
                                What Is Excluded?
                                <textarea
                                  name="exclusions"
                                  rows={3}
                                  disabled={saving}
                                  placeholder={"International flights\nPersonal expenses"}
                                  className={inputClass}
                                />
                                <span className="mt-1 block text-xs font-normal text-[#637b70]">
                                  One item per line.
                                </span>
                              </label>

                <label className={`${labelClass} sm:col-span-2`}>
                                What Should Travelers Bring?
                                <textarea
                                  name="what_to_bring"
                                  rows={3}
                                  disabled={saving}
                                  placeholder={"Walking shoes\nSunscreen\nCamera"}
                                  className={inputClass}
                                />
                                <span className="mt-1 block text-xs font-normal text-[#637b70]">
                                  One item per line.
                                </span>
                              </label>
            </div>

            {step === 4 && (
              <section className="space-y-5">
                <div className="rounded-xl border border-[#d5e4dc] bg-[#f6f9f7] p-5">
                  <h3 className="text-lg font-bold">
                    Review Your Safari
                  </h3>
                  <p className="mt-2 text-sm text-[#637b70]">
                    Check the details before saving your Draft.
                  </p>
                </div>

                <dl className="grid gap-4 sm:grid-cols-2">
                  {[
                    ["Safari Name", "name"],
                    ["Category", "category"],
                    ["Description", "description"],
                    ["Duration (Days)", "duration_days"],
                    ["Additional Hours", "duration_hours"],
                    ["Starting Point", "start_point"],
                    ["Currency", "currency"],
                    ["Base Price", "base_price"],
                    ["Minimum Guests", "group_size_min"],
                    ["Maximum Guests", "group_size_max"],
                    ["Included", "inclusions"],
                    ["Excluded", "exclusions"],
                    ["What to Bring", "what_to_bring"],
                  ].map(([label, key]) => (
                    <div
                      key={key}
                      className="min-w-0 rounded-xl border border-[#e1eae4] p-4"
                    >
                      <dt className="text-xs font-semibold text-[#637b70]">
                        {label}
                      </dt>
                      <dd className="mt-2 whitespace-pre-wrap break-words text-sm font-semibold">
                        {review[key] || "Not specified"}
                      </dd>
                    </div>
                  ))}
                </dl>
              </section>
            )}

            <p className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-7 text-amber-900">
              This safari will be saved as a Draft.
              It will not be published automatically.
              The platform securely assigns your company.
            </p>

            {error && (
              <p
                role="alert"
                className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"
              >
                {error}
              </p>
            )}


            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#e4ede7] pt-5">
              <button
                type="button"
                onClick={step === 0 ? closeModal : previousStep}
                disabled={saving}
                className="rounded-lg border border-[#d5e4dc] px-5 py-3 text-sm font-bold disabled:opacity-50"
              >
                {step === 0 ? "Cancel" : "Previous"}
              </button>

              {step < 4 ? (
                <button
                  type="button"
                  onClick={nextStep}
                  disabled={saving}
                  className="rounded-lg bg-[#186e52] px-6 py-3 text-sm font-bold text-white hover:bg-[#12583f] disabled:opacity-50"
                >
                  Continue →
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg bg-[#186e52] px-6 py-3 text-sm font-bold text-white hover:bg-[#12583f] disabled:opacity-50"
                >
                  {saving
                    ? "Saving Safari Draft..."
                    : "Save Safari as Draft"}
                </button>
              )}
            </div>
          </form>
        </dialog>
      )}
    </>
  );
}
