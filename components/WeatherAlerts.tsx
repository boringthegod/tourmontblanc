import type { Alert } from "@/lib/weather-alerts";

const TONE: Record<Alert["severity"], string> = {
  alerte: "bg-[#FDEBEC] text-[#B3261E]",
  attention: "bg-[#FBF3DB] text-[#8A6D1F]",
};

export function WeatherAlerts({ alerts }: { alerts: Alert[] }) {
  if (alerts.length === 0) return null;
  return (
    <ul className="mt-4 space-y-2">
      {alerts.map((a) => (
        <li
          key={a.rule}
          className={`rounded-md px-4 py-3 text-sm ${TONE[a.severity]}`}
        >
          {a.message}
        </li>
      ))}
    </ul>
  );
}
