"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type SocialLinks = { youtube?: string; instagram?: string; twitter?: string; linkedin?: string };

interface Profile {
  bio?: string;
  qualifications?: string;
  subjects?: string[];
  targetExams?: string[];
  expertiseTags?: string[];
  teachingExperienceYears?: number;
  demoVideoLink?: string;
  socialMediaLinks?: SocialLinks;
  verifyStatus?: string;
}

const SUBJECTS = ["Physics", "Chemistry", "Mathematics", "Biology"];
const EXAMS = ["JEE Main", "JEE Advanced", "NEET", "KVPY", "Board Exams"];

const STEPS = [
  { id: 1, label: "Basic info" },
  { id: 2, label: "Qualifications" },
  { id: 3, label: "Demo video" },
  { id: 4, label: "Social links" },
  { id: 5, label: "Review" },
];

function Toggle({ items, selected, onChange }: {
  items: string[];
  selected: string[];
  onChange: (v: string[]) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => {
        const active = selected.includes(item);
        return (
          <button
            key={item}
            type="button"
            onClick={() => onChange(active ? selected.filter((x) => x !== item) : [...selected, item])}
            className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
              active
                ? "bg-orange-600 text-white border-orange-600"
                : "bg-white text-gray-700 border-gray-300 hover:border-orange-400"
            }`}
          >
            {item}
          </button>
        );
      })}
    </div>
  );
}

// Free-text expertise tags — teachers author their own (e.g. "Rotational
// Mechanics"), unlike the fixed-list subject/exam toggles above.
function TagInput({ tags, onChange, max = 5, placeholder }: {
  tags: string[];
  onChange: (v: string[]) => void;
  max?: number;
  placeholder?: string;
}) {
  const [draft, setDraft] = useState("");

  function add() {
    const v = draft.trim();
    setDraft("");
    if (!v || tags.length >= max) return;
    if (tags.some((t) => t.toLowerCase() === v.toLowerCase())) return;
    onChange([...tags, v]);
  }

  return (
    <div>
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {tags.map((t) => (
            <span key={t} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-sm bg-gray-100 text-gray-700 border border-gray-200">
              {t}
              <button type="button" onClick={() => onChange(tags.filter((x) => x !== t))}
                className="text-gray-400 hover:text-gray-600 leading-none" aria-label={`Remove ${t}`}>×</button>
            </span>
          ))}
        </div>
      )}
      {tags.length < max && (
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" || e.key === ",") { e.preventDefault(); add(); } }}
          onBlur={add}
          placeholder={placeholder}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none"
        />
      )}
    </div>
  );
}

export default function TeacherWizardPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [verifyStatus, setVerifyStatus] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState<string | null>(null);
  const [existing, setExisting] = useState(false);

  // Profile fields
  const [bio, setBio] = useState("");
  const [qualifications, setQualifications] = useState("");
  const [subjects, setSubjects] = useState<string[]>([]);
  const [targetExams, setTargetExams] = useState<string[]>([]);
  const [expertiseTags, setExpertiseTags] = useState<string[]>([]);
  const [experienceYears, setExperienceYears] = useState<string>("");
  const [demoVideoLink, setDemoVideoLink] = useState("");
  const [social, setSocial] = useState<SocialLinks>({});

  useEffect(() => {
    fetch("/api/teacher/profile")
      .then((r) => r.json())
      .then((p: Profile) => {
        if (p.subjects?.length || p.bio || p.qualifications || p.verifyStatus) setExisting(true);
        if (p.bio) setBio(p.bio);
        if (p.qualifications) setQualifications(p.qualifications);
        if (p.subjects?.length) setSubjects(p.subjects);
        if (p.targetExams?.length) setTargetExams(p.targetExams);
        if (p.expertiseTags?.length) setExpertiseTags(p.expertiseTags);
        if (p.teachingExperienceYears) setExperienceYears(String(p.teachingExperienceYears));
        if (p.demoVideoLink) setDemoVideoLink(p.demoVideoLink);
        if (p.socialMediaLinks) setSocial(p.socialMediaLinks as SocialLinks);
        if (p.verifyStatus) setVerifyStatus(p.verifyStatus);
        if ((p as Profile & { rejectionReason?: string }).rejectionReason) {
          setRejectionReason((p as Profile & { rejectionReason?: string }).rejectionReason ?? null);
        }
      })
      .catch(() => {});
  }, []);

  async function save(partial: Partial<Profile>) {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/teacher/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(partial),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Save failed");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
      return false;
    } finally {
      setSaving(false);
    }
    return true;
  }

  async function nextStep() {
    let payload: Partial<Profile> = {};

    if (step === 1) {
      if (subjects.length === 0) {
        setError("Select at least one subject");
        return;
      }
      payload = {
        bio,
        subjects,
        targetExams,
        expertiseTags,
        teachingExperienceYears: experienceYears ? Number(experienceYears) : undefined,
      };
    } else if (step === 2) {
      payload = { qualifications };
    } else if (step === 3) {
      payload = { demoVideoLink: demoVideoLink || undefined };
    } else if (step === 4) {
      payload = { socialMediaLinks: social };
    }

    const ok = await save(payload);
    if (ok) setStep((s) => Math.min(s + 1, 5));
  }

  async function submit() {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/teacher/profile/submit", { method: "POST" });
      if (!res.ok) throw new Error((await res.json()).error ?? "Submit failed");
      router.push("/teacher/dashboard");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Submit failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-10">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-2xl font-bold text-gray-900">
            {existing ? "Edit your teacher profile" : "Set up your teacher profile"}
          </h1>
          <Link href="/teacher/dashboard" className="text-sm text-orange-600 hover:underline shrink-0">← Dashboard</Link>
        </div>
        <p className="text-sm text-gray-500 mb-8">
          {existing
            ? "Update your details and resubmit for review. Changes are saved as you go."
            : "Complete your profile so we can verify and list you for students to find."}
        </p>

        {verifyStatus === "REJECTED" && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm font-semibold text-red-800 mb-1">Profile not approved</p>
            {rejectionReason && (
              <p className="text-sm text-red-700">{rejectionReason}</p>
            )}
            <p className="text-xs text-red-500 mt-1">Update your profile and resubmit for review.</p>
          </div>
        )}

        {verifyStatus === "MORE_INFO_REQUESTED" && (
          <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-sm font-semibold text-amber-800 mb-1">More information needed</p>
            {rejectionReason && (
              <p className="text-sm text-amber-700">{rejectionReason}</p>
            )}
            <p className="text-xs text-amber-500 mt-1">Please update and resubmit.</p>
          </div>
        )}

        {verifyStatus === "PENDING" && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-700">Your profile is under review. We&apos;ll notify you once verified.</p>
          </div>
        )}

        {/* Step indicator */}
        <div className="flex items-center gap-1 mb-8">
          {STEPS.map((s, i) => (
            <div key={s.id} className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => step > s.id && setStep(s.id)}
                className={`w-8 h-8 rounded-full text-xs font-semibold flex items-center justify-center transition-colors ${
                  s.id === step
                    ? "bg-orange-600 text-white"
                    : s.id < step
                    ? "bg-orange-100 text-orange-700 cursor-pointer hover:bg-orange-200"
                    : "bg-gray-200 text-gray-500"
                }`}
              >
                {s.id}
              </button>
              {i < STEPS.length - 1 && (
                <div className={`h-0.5 w-8 ${s.id < step ? "bg-orange-300" : "bg-gray-200"}`} />
              )}
            </div>
          ))}
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          {/* Step 1: Basic info */}
          {step === 1 && (
            <div className="space-y-5">
              <h2 className="font-semibold text-gray-900">Basic information</h2>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Subjects <span className="text-red-500">*</span>
                </label>
                <Toggle items={SUBJECTS} selected={subjects} onChange={setSubjects} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Target exams</label>
                <Toggle items={EXAMS} selected={targetExams} onChange={setTargetExams} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Areas of expertise</label>
                <p className="text-xs text-gray-500 mb-2">
                  Add 2-3 specific topics you are strongest in (e.g. Rotational Mechanics, Organic Chemistry).
                  These show as tags on your teacher card.
                </p>
                <TagInput tags={expertiseTags} onChange={setExpertiseTags} max={5} placeholder="Type a topic and press Enter" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Years of teaching experience
                </label>
                <input
                  type="number"
                  min={0}
                  max={60}
                  value={experienceYears}
                  onChange={(e) => setExperienceYears(e.target.value)}
                  className="w-24 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={4}
                  placeholder="Tell students about yourself — your teaching style, achievements, motivation…"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none resize-none"
                />
              </div>
            </div>
          )}

          {/* Step 2: Qualifications */}
          {step === 2 && (
            <div className="space-y-4">
              <h2 className="font-semibold text-gray-900">Qualifications</h2>
              <textarea
                value={qualifications}
                onChange={(e) => setQualifications(e.target.value)}
                rows={6}
                placeholder="e.g. B.Tech (IIT Delhi), 3 years at FIITJEE, JEE Advanced rank 120 (2018)…"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none resize-none"
              />
            </div>
          )}

          {/* Step 3: Demo video */}
          {step === 3 && (
            <div className="space-y-4">
              <h2 className="font-semibold text-gray-900">Demo video</h2>
              <p className="text-sm text-gray-500">
                Paste a YouTube link — students can watch before booking. Optional but recommended.
              </p>
              <input
                type="url"
                value={demoVideoLink}
                onChange={(e) => setDemoVideoLink(e.target.value)}
                placeholder="https://youtu.be/…"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none"
              />
              {demoVideoLink && demoVideoLink.includes("youtu") && (
                <p className="text-xs text-green-600">✓ YouTube link detected</p>
              )}
            </div>
          )}

          {/* Step 4: Social links */}
          {step === 4 && (
            <div className="space-y-4">
              <h2 className="font-semibold text-gray-900">Social links</h2>
              <p className="text-sm text-gray-500">All optional. Help students learn more about you.</p>
              {(["youtube", "instagram", "twitter", "linkedin"] as const).map((platform) => (
                <div key={platform}>
                  <label className="block text-sm font-medium text-gray-700 mb-1 capitalize">
                    {platform}
                  </label>
                  <input
                    type="url"
                    value={social[platform] ?? ""}
                    onChange={(e) => setSocial({ ...social, [platform]: e.target.value || undefined })}
                    placeholder={`https://${platform}.com/…`}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none"
                  />
                </div>
              ))}
            </div>
          )}

          {/* Step 5: Review & submit */}
          {step === 5 && (
            <div className="space-y-4">
              <h2 className="font-semibold text-gray-900">Review & submit</h2>
              <div className="space-y-3 text-sm">
                <div className="flex gap-3">
                  <span className="text-gray-500 w-32 shrink-0">Subjects</span>
                  <span className="text-gray-900">{subjects.join(", ") || "—"}</span>
                </div>
                <div className="flex gap-3">
                  <span className="text-gray-500 w-32 shrink-0">Exams</span>
                  <span className="text-gray-900">{targetExams.join(", ") || "—"}</span>
                </div>
                <div className="flex gap-3">
                  <span className="text-gray-500 w-32 shrink-0">Expertise</span>
                  <span className="text-gray-900">{expertiseTags.join(", ") || "—"}</span>
                </div>
                <div className="flex gap-3">
                  <span className="text-gray-500 w-32 shrink-0">Experience</span>
                  <span className="text-gray-900">{experienceYears ? `${experienceYears} years` : "—"}</span>
                </div>
                <div className="flex gap-3">
                  <span className="text-gray-500 w-32 shrink-0">Bio</span>
                  <span className="text-gray-900 line-clamp-3">{bio || "—"}</span>
                </div>
                <div className="flex gap-3">
                  <span className="text-gray-500 w-32 shrink-0">Qualifications</span>
                  <span className="text-gray-900 line-clamp-3">{qualifications || "—"}</span>
                </div>
                <div className="flex gap-3">
                  <span className="text-gray-500 w-32 shrink-0">Demo video</span>
                  <span className="text-gray-900">{demoVideoLink || "—"}</span>
                </div>
              </div>
              <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-md text-sm text-amber-800">
                Once submitted, your profile will be reviewed by our team. You&apos;ll be notified when verified.
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-between mt-6">
          <button
            type="button"
            onClick={() => setStep((s) => Math.max(s - 1, 1))}
            disabled={step === 1}
            className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
          >
            Back
          </button>

          {step < 5 ? (
            <button
              type="button"
              onClick={nextStep}
              disabled={saving}
              className="px-6 py-2 bg-orange-600 text-white text-sm font-medium rounded-md hover:bg-orange-700 disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save & continue"}
            </button>
          ) : (
            <button
              type="button"
              onClick={submit}
              disabled={submitting}
              className="px-6 py-2 bg-orange-600 text-white text-sm font-medium rounded-md hover:bg-orange-700 disabled:opacity-50"
            >
              {submitting ? "Submitting…" : "Submit for review"}
            </button>
          )}
        </div>
      </div>
    </main>
  );
}
