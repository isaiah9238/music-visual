import { createFileRoute } from "@tanstack/react-router";
import { SeeMusic } from "@/components/see-music";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  return <SeeMusic />;
}
