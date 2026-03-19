import { GameTable } from "~/components/game-table";

export function meta() {
  return [
    { title: "Blackjack Trainer" },
    { name: "description", content: "Practice blackjack basic strategy" },
  ];
}

export default function Home() {
  return <GameTable />;
}
