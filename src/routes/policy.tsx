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
      <div className="prose prose-invert text-sm text-muted-foreground space-y-4">
        <p>Verde collects only what we need to provide the service.</p>
        <h2 className="text-foreground font-semibold">What we collect</h2>
        <p>Email, profile details (name, username, photo, country, location), the IP address and a device fingerprint at signup (to detect abuse), and the content you post.</p>
        <h2 className="text-foreground font-semibold">How we use it</h2>
        <p>To run the app, secure your account, personalize your feed, and reply to support requests.</p>
        <h2 className="text-foreground font-semibold">Sharing</h2>
        <p>We do not sell personal data. We share only with service providers needed to run the app, under strict contracts.</p>
        <h2 className="text-foreground font-semibold">Your rights</h2>
        <p>You can update or delete your profile at any time. Contact us to request a full export or deletion.</p>
      </div>
      <div className="mt-10 flex justify-center">
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
