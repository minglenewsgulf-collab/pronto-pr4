import { createFileRoute } from "@tanstack/react-router";
import { Megaphone } from "lucide-react";
import { Placeholder } from "@/components/Placeholder";

export const Route = createFileRoute("/_app/campaigns")({
  head: () => ({ meta: [{ title: "Campaigns · ProntoPR" }] }),
  component: () => (
    <Placeholder
      icon={Megaphone}
      title="Campaigns"
      body="Aggregate multiple reports under a single campaign view. Coming next."
    />
  ),
});
