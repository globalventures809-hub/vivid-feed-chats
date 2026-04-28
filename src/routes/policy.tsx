import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ReturnButton } from "@/components/ReturnButton";

export const Route = createFileRoute("/policy")({
  component: Policy,
});

function Policy() {
  const navigate = useNavigate();
  return (
    <div className="min-h-dvh bg-background px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Privacy Policy</h1>
        <ReturnButton to="/welcome" label="Back" />
      </div>
      <div className="text-sm text-muted-foreground space-y-4 leading-relaxed">
        <p className="text-xs italic">Last updated: April 2026</p>
        <p>
          Verde ("we", "us") operates this app. This Privacy Policy explains
          what personal data we collect, why we collect it, how we use it, who
          we share it with, and the rights you have over it.
        </p>

        <h2 className="text-foreground font-semibold pt-2">1. Data we collect</h2>
        <ul className="list-disc pl-5 space-y-1">
          <li><b>Account data</b> — your email and password (hashed).</li>
          <li><b>Profile</b> — name, unique username, bio, profile photo, cover photo, country and approximate location.</li>
          <li><b>Content</b> — videos, captions, comments, likes, follows, saves and reshares you create.</li>
          <li><b>Signup security data</b> — your IP address, browser/device fingerprint and user agent are recorded once at signup to help detect spam, fraud and duplicate accounts.</li>
          <li><b>Usage data</b> — pages viewed, app errors, and basic interaction events used to keep the service stable.</li>
        </ul>

        <h2 className="text-foreground font-semibold pt-2">2. How we use it</h2>
        <ul className="list-disc pl-5 space-y-1">
          <li>To create and secure your account.</li>
          <li>To personalize your feed and surface relevant creators.</li>
          <li>To prevent abuse, spam, harassment and fraudulent signups.</li>
          <li>To respond to support requests and to communicate important changes.</li>
        </ul>

        <h2 className="text-foreground font-semibold pt-2">3. Legal basis</h2>
        <p>
          We process your data to perform the contract with you (running the
          service), to comply with legal obligations, and where you have given
          consent (for example, location). Security data is processed under
          our legitimate interest in keeping Verde safe.
        </p>

        <h2 className="text-foreground font-semibold pt-2">4. Sharing</h2>
        <p>
          We do not sell personal data. We share data only with service
          providers strictly necessary to run the app (cloud hosting,
          authentication, abuse detection), under written contracts that
          require them to protect your data.
        </p>

        <h2 className="text-foreground font-semibold pt-2">5. Retention</h2>
        <p>
          We keep your account data for as long as your account exists. When
          you delete your account, we delete or anonymize personal data within
          30 days, except where law requires us to keep it longer.
        </p>

        <h2 className="text-foreground font-semibold pt-2">6. Your rights</h2>
        <p>
          You can access, correct, export or delete your data at any time from
          inside the app, or by contacting support. You can also withdraw
          consent for optional processing.
        </p>

        <h2 className="text-foreground font-semibold pt-2">7. Children</h2>
        <p>
          Verde is not intended for children under 13. If you believe a child
          has created an account, please contact us so we can remove it.
        </p>

        <h2 className="text-foreground font-semibold pt-2">8. Changes</h2>
        <p>
          We may update this policy. If changes are material we will notify
          you in-app before they take effect.
        </p>
      </div>
      <div className="mt-10 flex justify-center pb-6">
        <button
          onClick={() => navigate({ to: "/welcome" })}
          className="brand-gradient text-brand-foreground font-semibold py-3 px-8 rounded-2xl shadow-brand"
        >
          I understand
        </button>
      </div>
    </div>
  );
}
