import { createFileRoute } from "@tanstack/react-router";
import { FolderKanban } from "lucide-react";
import { Placeholder } from "@/components/Placeholder";

export const Route = createFileRoute("/_app/projects")({
  head: () => ({ meta: [{ title: "Projects · ProntoPR" }] }),
  component: () => (
    <Placeholder
      icon={FolderKanban}
      title="Projects"
      body="Group reports by ongoing PR projects. Coming next."
    />
  ),
});
