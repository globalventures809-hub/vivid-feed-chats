import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { COUNTRIES } from "@/lib/countries";
import { toast } from "sonner";
import { Camera, Loader2, MapPin, User as UserIcon } from "lucide-react";
import { z } from "zod";

export const Route = createFileRoute("/setup")({
  component: Setup,
});

const usernameSchema = z
  .string()
  .min(3, "Username must be 3+ characters")
  .max(24, "Username too long")
  .regex(/^[a-z0-9_]+$/i, "Letters, numbers, and underscores only");

function Setup() {
  const { session, loading, profile, refreshProfile } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [country, setCountry] = useState("");
  const [location, setLocation] = useState("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const photoInput = useRef<HTMLInputElement>(null);
  const coverInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!loading && !session) navigate({ to: "/welcome" });
    if (profile) {
      setName(profile.name ?? "");
      setUsername(profile.username ?? "");
      setCountry(profile.country ?? "");
      setLocation(profile.location ?? "");
      setPhotoPreview(profile.photo_url);
      setCoverPreview(profile.cover_url);
    }
  }, [loading, session, profile, navigate]);

  const onPickPhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setPhotoFile(f);
    setPhotoPreview(URL.createObjectURL(f));
  };
  const onPickCover = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setCoverFile(f);
    setCoverPreview(URL.createObjectURL(f));
  };

  // We use base64 data URLs for photos in v1 to keep things simple (no storage bucket).
  const fileToDataUrl = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(r.result as string);
      r.onerror = reject;
      r.readAsDataURL(file);
    });

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.user) return;
    const u = usernameSchema.safeParse(username.trim());
    if (!u.success) return toast.error(u.error.issues[0].message);
    if (!name.trim()) return toast.error("Please enter your name");
    if (!country) return toast.error("Please pick your country");

    setSaving(true);
    try {
      const photo_url = photoFile ? await fileToDataUrl(photoFile) : photoPreview;
      const cover_url = coverFile ? await fileToDataUrl(coverFile) : coverPreview;

      const { error } = await supabase
        .from("profiles")
        .update({
          name: name.trim(),
          username: username.trim().toLowerCase(),
          country,
          location: location.trim() || null,
          photo_url,
          cover_url,
          setup_complete: true,
        })
        .eq("id", session.user.id);
      if (error) {
        if (error.code === "23505") throw new Error("That username is taken — try another.");
        throw error;
      }
      await refreshProfile();
      toast.success("Profile ready!");
      navigate({ to: "/app/feed" });
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-dvh bg-background pb-12">
      <div className="relative h-44">
        {coverPreview ? (
          <img src={coverPreview} alt="cover" className="h-full w-full object-cover" />
        ) : (
          <div className="h-full w-full screen-gradient" />
        )}
        <button
          type="button"
          onClick={() => coverInput.current?.click()}
          className="absolute right-3 top-3 rounded-full bg-black/50 backdrop-blur px-3 py-1.5 text-xs font-medium text-white"
        >
          <Camera className="h-3.5 w-3.5 inline mr-1" /> Cover
        </button>
        <input ref={coverInput} type="file" accept="image/*" hidden onChange={onPickCover} />

        <div className="absolute -bottom-12 left-1/2 -translate-x-1/2">
          <button
            type="button"
            onClick={() => photoInput.current?.click()}
            className="relative h-24 w-24 rounded-full border-4 border-background overflow-hidden brand-gradient flex items-center justify-center"
          >
            {photoPreview ? (
              <img src={photoPreview} alt="profile" className="h-full w-full object-cover" />
            ) : (
              <UserIcon className="h-10 w-10 text-brand-foreground" />
            )}
            <span className="absolute bottom-0 right-0 bg-brand text-brand-foreground rounded-full p-1.5">
              <Camera className="h-3.5 w-3.5" />
            </span>
          </button>
          <input ref={photoInput} type="file" accept="image/*" hidden onChange={onPickPhoto} />
        </div>
      </div>

      <form onSubmit={handleSave} className="mt-16 px-6 space-y-4">
        <h1 className="text-2xl font-bold text-center">Set up your profile</h1>
        <p className="text-center text-sm text-muted-foreground -mt-2">
          You can change this anytime.
        </p>

        <Field label="Display name">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={50}
            required
            className="w-full bg-card border border-border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-brand"
          />
        </Field>

        <Field label="Username">
          <div className="flex items-center bg-card border border-border rounded-xl">
            <span className="pl-4 text-muted-foreground">@</span>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value.toLowerCase())}
              maxLength={24}
              required
              placeholder="yourname"
              className="w-full bg-transparent px-2 py-3 outline-none"
            />
          </div>
        </Field>

        <Field label="Country">
          <select
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            required
            className="w-full bg-card border border-border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-brand"
          >
            <option value="">Select your country…</option>
            {COUNTRIES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.flag} {c.name}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Location (optional)">
          <div className="flex items-center bg-card border border-border rounded-xl">
            <MapPin className="h-4 w-4 text-muted-foreground ml-4" />
            <input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="City"
              maxLength={80}
              className="w-full bg-transparent px-2 py-3 outline-none"
            />
          </div>
        </Field>

        <button
          type="submit"
          disabled={saving}
          className="w-full brand-gradient text-brand-foreground font-bold py-3.5 rounded-2xl shadow-brand disabled:opacity-60 flex items-center justify-center gap-2"
        >
          {saving && <Loader2 className="h-4 w-4 animate-spin" />}
          Save & continue
        </button>
      </form>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}
